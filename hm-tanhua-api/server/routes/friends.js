const router = require('koa-router')(),
Friends = require('../controllers/friends.js'),
koaBody = require('koa-body');

// 最近来访
router.get('/visitors', Friends.visitors);

// 今日佳人
router.get('/todayBest', Friends.todayBest);

// 推荐朋友
router.get('/recommendation', Friends.recommendation);

// 朋友信息
router.get('/personalInfo/:id', Friends.personalInfo);

// 朋友信息 guid
router.get('/personalInfoByGuid/:id', Friends.personalInfoByGuid);

// 搜附近
router.get('/search', Friends.search);

// 探花左滑右滑卡片分页数据
router.get('/cards', Friends.cards);

// 探花喜欢
router.get('/like/:id/:type', Friends.like);

// 测灵魂卷列表
router.get('/questions', Friends.questions);

// 测灵魂题卷题目
router.get('/questionSection/:id', Friends.questionSection);

// 提交测试结果获得鉴定单信息
router.post('/questionsAns/:id', Friends.questionsAns);


module.exports = router;