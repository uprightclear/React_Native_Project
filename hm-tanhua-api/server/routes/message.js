const router = require('koa-router')(),
Message = require('../controllers/message.js'),
koaBody = require('koa-body');

// 获取点赞信息列表
router.get('/starlist', Message.starlist);



module.exports = router;