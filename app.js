const puppeteer = require('puppeteer');
const axios = require('axios');

var token = process.env.CODETOKEN;
var index = 0;

var message = '';

const codes = {
    1000: '识别成功',
    10001: '参数错误',
    10002: '余额不足',
    10003: '无此访问权限',
    10004: '无此验证类型',
    10005: '网络拥塞',
    10006: '数据包过载',
    10007: '服务繁忙',
    10008: '网络错误，请稍后重试',
    10009: '结果准备中，请稍后再试',
    10010: '请求结束',
};

const type = '50106';
(async () => {
    const browser = await puppeteer.launch({ headless: "new", args: ["--no-sandbox", "--disabled-setupid-sandbox"], defaultViewport: null, executablePath: process.env.GOOGLE_CHROME_PATH });
    const page = await browser.newPage();
    page.on('response',
        function (response) {
            if (response.url().indexOf("captchaImage") != -1 && index == 0) {
                index++;
                response.text().then(async (body) => {
                    console.log("正在登录")
                    message += '<div>正在登录</div>';
                    let { img = "" } = JSON.parse(body);
                    img = 'data:image/png;base64,' + img;
                    let { data = {} } = await axios.post('http://api.jfbym.com/api/YmServer/customApi', { image: img, token, type });
                    let { data: value = null, code = 0 } = data.data;
                    if (value == null) {
                        let codestr = codes[code] ?? "不晓得是啥问题，去平台看看吧"
                        console.log(`验证码获取失败，平台的返回结果是：${code}-${codestr}`);
                        message += `<div>验证码获取失败，平台的返回结果是：${code}-${codestr}</div>`;
                        console.log("任务结束，正在退出")
                        await page.close();
                        await browser.disconnect();
                        process.exit(0)
                    }
                    await page.click(".el-input__inner");
                    await page.type(".el-input__inner", process.env.USERNAME);
                    await page.type(".el-form-item:nth-child(3) .el-input__inner", process.env.PASSWORD);
                    console.log(`验证码获取成功，值为${value}`)
                    message += `<div>验证码获取成功，值为${value}</div>`;
                    await page.type(".el-form-item:nth-child(4) .el-input__inner", `${value}`);
                    await page.click(".el-form-item__content .login_submit");
                })
            }

            if (response.url().indexOf("/register/login") != -1) {
                response.text().then(async (body) => {
                    let { data = {} } = JSON.parse(body);
                    let { token = "" } = data;
                    token = 'Bearer ' + token;
                    console.log(`登录成功，获取token成功`);
                    message += `<div>登录成功，获取token成功</div>`;
                    console.log("开始调用签到接口");
                    message += `<div>开始调用签到接口</div>`;
                    let url = "https://www.delbug.cn/prod-api/delbug/integral/addSignIn/0";
                    const headers = {
                        'Content-Type': 'application/json',
                        'Authorization': token,
                        "User-Agent": 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/114.0.0.0 Safari/537.36'
                    };
                    await axios.get(url, { headers: headers });
                })
            }


            if (response.url().indexOf("userWhetherCheckIn") != -1) {
                response.text().then(async (body) => {
                    let { code = '200', msg = '' } = JSON.parse(body);
                    if (code == 200) {
                        console.log('签到成功了！')
                        message += `<div>签到成功了！</div>`;
                    } else {
                        console.log(`签到失败！状态码：${code}-${msg}`);
                        message += `<div>签到失败！状态码：${code}-${msg}</div>`;
                    }
                    let url = `http://www.pushplus.plus/send?token=${process.env.PUSHTOKEN}&title=debug签到&content=${message}&template=html`;
                    await axios.get(url);
                    console.log("任务结束，正在退出")
                    await page.close();
                    await browser.disconnect();
                    process.exit(0)
                })
            }

        });




    console.log("打开登录页面...");
    message += `<div>打开登录页面...</div>`;
    await page.goto('https://www.delbug.cn/login?redirect=%2Fuser%2FPersonal');
})();


