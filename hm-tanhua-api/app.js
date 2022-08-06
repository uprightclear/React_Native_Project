const koa = require('koa'),
	app = new koa(),
	router = require('koa-router')(),
	json = require('koa-json'),
	koajwt = require('koa-jwt'),
	serve = require('koa-static'),
	bodyparser = require('koa-bodyparser'),
	koaBody = require('koa-body');


const
	errorHandle = require('./server/middlewares/errorHandle.js'),
	sendHandle = require('./server/middlewares/sendHandle.js'),
	config = require('./server/config/config.js'),
	dbHandle = require('./server/middlewares/dbHandle.js');

const user = require('./server/routes/user.js'),
	  friends = require('./server/routes/friends.js'),
	  message = require('./server/routes/message.js'),
	  qz = require('./server/routes/qz.js'),
	  my =  require('./server/routes/my.js');

var domains = {
	local: 'http://localhost:3000',
	loc127: 'http://127.0.0.1',
	dist: "http://157.122.54.189:9090",
	dist1: "http://192.168.50.2:9091",
	dist2: "http://172.16.2.23:9091",
	dist3: "http://103.44.145.245"
};

// 截获所有请求处理跨域
app.use(async (ctx, next) => {

	let req = ctx.request;
	let res = ctx.response;
	

	var currentdomain = "http://localhost";
	for (let key in domains) {
		if (!req.header.host) {
			break;
		}
		if (domains[key].indexOf(req.header.host) > -1) {
			currentdomain = domains[key];
			global.domain = domains[key];
			console.log(currentdomain);
			break;
		}
	}

	res.set("Access-Control-Allow-Origin", currentdomain);//设置管理后台服务器路径http://127.0.0.1:5008
	res.set("Access-Control-Allow-Headers", "X-Requested-With, accept,OPTIONS, content-type");
	// res.header("Access-Control-Allow-Headers", "X-Requested-With");
	res.set("Access-Control-Allow-Methods", "*");
	// 需要让ajax请求携带cookie ,此处设置为true，那么Access-Control-Allow-Origin 
	// 不能设置为*，所以设置为请求者所在的域名
	res.set("Access-Control-Allow-Credentials", "true");

	//  如果当前请求时OPTIONS 则不进去真正的业务逻辑方法，防止执行多次而产生 
	if (req.method != "OPTIONS") {
		res.set('Content-Type', 'application/json;charset=utf-8');
		await next();
	} else {
		res.end('');
	}
})

app.use(serve('./public', {
	setHeaders: (res, path, stats) => {
		let extname = require('path').extname(path);
		// 根据扩展名设置不同的响应头，如果这里不设置，会在sendHandle中统一设置成json格式，那么静态资源也会以json格式返回，浏览器不能正常展示
		switch (extname) {
			case '.html':
				res.setHeader('Content-Type', 'text/html;charset=utf-8');
				break;
			case '.png':
			case '.jpg':
			case '.gif':
			case '.bmp':
				res.setHeader('Content-Type', 'image/png;charset=utf-8');
				break;			
		}
	}
}));  //静态服务器中间件
app.use(json());  // json中间件
app.use(bodyparser());  // body参数解析中间价
app.use(sendHandle());  // 响应中间件
app.use(dbHandle());// 数据库处理中间件
app.use(errorHandle); // 异常中间件
// koaBody放在这儿影响非上传文件的post请求方法，请求会一直挂起不响应，可以将koaBody放到具体的文件上传路由方法中
// app.use(koaBody({
// 	multipart: true,
//     formidable: {
//         maxFieldsSize: 400*1024*1024    // 设置上传文件大小最大限制，默认4M
//     }
// }));


// token验证接口
app.use(koajwt({
	secret: config.jwtkey
}).unless({
	// 排除需要token验证的接口
	path: ['/user/login','/user/loginVerification', '/swagger.html']
}));

router.use('/user', user.routes());
router.use('/friends', friends.routes());
router.use('/qz', qz.routes());
router.use('/message',message.routes());
router.use('/my',my.routes());
app.use(router.routes());

app.listen('9089', () => {
	console.log('koa is listening in 9089');
})