const router = require('koa-router')(),
    User = require('../controllers/user.js'),
    koaBody = require('koa-body');

// 手机号获取验证码（手机号登录）
router.post('/login', User.login);

// 检查验证码
router.post('/loginVerification', User.loginVerification);

// 填写资料
router.post('/loginReginfo', User.loginReginfo);

// 选取头像
router.post('/loginReginfo/head',koaBody({
    multipart: true,
    formidable: {
        maxFieldsSize: 12000*1024*1024    // 设置上传文件大小最大限制，默认12M
    }
}), User.uploadHead);

router.get('/info', User.userinfo);

module.exports = router;