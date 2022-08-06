const router = require('koa-router')(),
    My = require('../controllers/my.js'),
    koaBody = require('koa-body');


// 个人信息
router.get('/userinfo', My.userinfo);

// 保存个人信息
router.post('/submitUserInfo', My.submitUserInfo);

// 我的动态
router.get('/trends', My.trends);

// 粉丝，喜欢，互相关注 
router.get('/counts', My.counts);

// 粉丝，喜欢，互相关注 列表数据
router.get('/likelist', My.likelist);


module.exports = router;