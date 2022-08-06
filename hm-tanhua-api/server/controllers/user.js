const crypto = require('crypto'),
    jwt = require('jsonwebtoken'),
    config = require('../config/config.js'),
    { createRandom, getDistance } = require('../utils/kits.js'),

    fs = require('fs'),
    path = require('path'),
    https = require('https'),
    qs = require('querystring');


const http = require('http');

// 调用外部api 接口方法
function fetchData(url) {
    return new Promise(function (resolve, reject) {
        http.get(url, (res) => {
            res.setEncoding('utf8');
            let rawData = '';
            res.on('data', (chunk) => rawData += chunk);
            res.on('end', () => {
                try {
                    resolve(rawData);
                } catch (e) {
                    // console.error(e.message);
                    reject(e.message);
                }
            });
        });
    });
}


class UserController {

    // 手机号获取验证码，如果手机号码第一次输入则先注册
    static async login(ctx) {
        const data = ctx.request.body;
        try {
            let vcode = 888888;//createRandom(6);            
            let resultData = await ctx.executeSql(`select status from dt_users where mobile =${data.phone} `);
            if (resultData && resultData.length > 0) {
                // 更新验证码
                await ctx.executeSql(` update dt_users set vcode = ${vcode},login_time=NOW() where mobile =${data.phone} `);
            } else {
                // db中没有该手机号，插入一条新的status为2的新记录
                await ctx.executeSql(` insert into dt_users (mobile,vcode,status,login_time,guid) values (${data.phone},${vcode},2,NOW(),${data.phone + '' + Date.now()}) `);
            }

            // 发送验证码
            // let smsurl = `http://v.juhe.cn/sms/send?mobile=${data.phone}&tpl_id=208649&tpl_value=%23code%23%3D${vcode}&key=53cd364bc4ab2124bea90cba2bc04cbb`;
            // let res = await fetchData(smsurl);
            // console.log('####调用短信验证码接口', res);

            return ctx.send('短信验证码默认为：888888');

        } catch (err) {
            console.log(err.message);
            return ctx.sendError(config.resCodes.serverError, err.message);
        }
    }

    // 检验验证码正确性
    static async loginVerification(ctx) {
        const data = ctx.request.body;
        const phone = data.phone;
        const vcode = data.vcode;
        let isNew = false;

        try {
            // 获取手机号码的验证码
            let resultData = await ctx.executeSql(`select id,guid,vcode,status from dt_users where mobile =${phone}`);

            // 比对验证码
            if (vcode === resultData[0].vcode) {
                // 验证码正确，生成token
                const token = jwt.sign({
                    id: resultData[0].id,
                    name: data.phone
                }, config.jwtkey,
                    { expiresIn: 60 * 60 * 24 * 300 }  // 有效期300天
                );

                // 判断用户是新用户，则将isNew设为true
                if (resultData[0].status === 2) {
                    isNew = true;
                }

                return ctx.send({
                    token, isNew, id: resultData[0].guid
                });
            } else {
                return ctx.sendError(config.resCodes.customerError, '验证码错误');
            }

        } catch (err) {
            return ctx.sendError(config.resCodes.serverError, err.message);
        }
    }

    // 新用户---填写资料
    static async loginReginfo(ctx) {
        const data = ctx.request.body;

        try {

            let Distance = getDistance(data.lng, data.lat, 113.42782, 23.12933);

            let sql = `update dt_users set nick_name = '${data.nickname}',
            gender='${data.gender}',
            birthday = '${data.birthday}',
            city='${data.city}', 
            header = '${data.header}',
            status = 0,   /*将用户的状态修改为正常状态0， 2：新注册用户未填写个人信息*/ 
            lng=${data.lng},
            lat=${data.lat},
            Distance=${Distance},
            address='${data.address}'
            where mobile = '${ctx.state.user.name}'
            `
            let resultData = await ctx.executeSql(sql);
            return ctx.send(resultData);
        } catch (err) {
            return ctx.sendError(config.resCodes.serverError, err.message);
        }
    }

    // 新用户---2选取头像(头像验证，如果不是头像则审核失败)
    // 上传代码参考：https://www.jianshu.com/p/34d0e1a5ac70
    // 人脸识别使用的是百度AI：https://ai.baidu.com/docs#/Face-Detect-V3/top
    static async uploadHead(ctx) {
        console.log("upload header image")
        // 提醒：
        // 新版本的koa-body通过ctx.request.files获取上传的文件
        // 旧版本的koa-body通过ctx.request.body.files获取上传的文件
        // 此项目中上面两个都不对，要使用ctx.request.files['']获取上传的文件
        try {
            let mobile = ctx.state.user.name;
            const file = ctx.request.files['headPhoto']; // 获取上传文件
            // 创建可读流
            const reader = fs.createReadStream(file.path);
            const extname = path.extname(file.name);
            let filePath = path.join(__dirname, '../../public/upload/') + `/${Date.now() +""+ mobile + extname}`;
            // 创建可写流
            const upStream = fs.createWriteStream(filePath);  
            // 可读流通过管道写入可写流
            reader.pipe(upStream);
            let isPass = true;
            // 响应
            return ctx.send({
                headImgShortPath: '/upload/' + `${Date.now()  +""+ mobile + extname}`,
                headImgPath: '/upload/' + `${Date.now()  +""+ mobile + extname}`,
                isPass
            }, '上传成功');
        } catch (err) {
            return ctx.sendError(config.resCodes.serverError, err.message);
        }
    }

    // 获取用户信息
    static async userinfo(ctx) {
        console.log(ctx.state.user)
        try {
            let resultData = await ctx.executeSql('select * from dt_users');
            return ctx.send(resultData);
        } catch (err) {
            return ctx.sendError(config.resCodes.serverError, err.message);
        }
    }
}

// 获取百度ai 的access_token
async function getBaiDuAiAccessToken() {
    // console.log(base64img);
    const param = qs.stringify({
        'grant_type': 'client_credentials',
        'client_id': '7qTvj7o33RaoQsa4dw5UBZh7',
        'client_secret': 'DtyDUoRgvyACaBDWjnw9bK83ypUmDwVi'
    });

    return new Promise((resolve, reject) => {
        // 获得token
        https.get(
            {
                hostname: 'aip.baidubce.com',
                path: '/oauth/2.0/token?' + param,
                agent: false
            },
            function (res) {
                // console.log(typeof chunk);
                // 在标准输出中查看运行结果
                // res.pipe(process.stdout);
                res.on('data', (chunk) => {
                    try {
                        let resobj = JSON.parse(chunk.toString('utf-8'));
                        resolve(resobj.access_token);
                    } catch (e) {
                        reject(e);
                    }
                })
            }
        );
    });
}

// 识别图片是否是人脸
// access_token: 百度ai接口的access_token   
async function checkImage(access_token, base64Image, imageType) {
    const postData = qs.stringify({
        'image': base64Image,
        'image_type': imageType
    });

    return new Promise((resolve, reject) => {
        let req = https.request(
            {
                host: 'aip.baidubce.com',
                path: '/rest/2.0/face/v3/detect?access_token=' + access_token,
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Content-Length': Buffer.byteLength(postData)
                }
            },
            function (res) {
                // console.log(typeof chunk);
                // 在标准输出中查看运行结果
                // res.pipe(process.stdout);
                res.on('data', (chunk) => {
                    try {
                        let resobj = JSON.parse(chunk.toString('utf-8'));
                        // console.log(resobj)
                        // 如果不是人脸，则返回：参考：https://ai.baidu.com/docs#/Face-Detect-V3/b7203cd6
                        /**
                         * 失败：
                         *  "error_code": 222202,
                            "error_msg": "pic not has face",
                            "log_id": 744193232085663500,
                            "timestamp": 1573208566,
                            "cached": 0,
                            "result": null

                            成功：
                             "error_code": 0,
                            "error_msg": "SUCCESS",
                         */
                        if (resobj && resobj.error_code == 222202) {
                            resolve(false); //不是人脸
                        }
                        else if (resobj && resobj.error_code == 0) {
                            resolve(true);  // 是人脸
                        } else {
                            resolve('人脸识别异常');
                        }

                    } catch (e) {
                        reject(e.message);
                    }
                })
            }
        );

        req.write(postData);
        req.end();

    });
}

module.exports = UserController;