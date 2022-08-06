const crypto = require('crypto'),
    jwt = require('jsonwebtoken'),
    config = require('../config/config.js'),
    { createRandom, getDistance } = require('../utils/kits.js'),

    fs = require('fs'),
    path = require('path'),
    https = require('https'),
    qs = require('querystring');

class MyController {

    // 获取用户信息
    static async userinfo(ctx) {
        let currentUserID = ctx.state.user.id; // 登录用户
        // 1.0 获取当前登录用户和目标用户信息
        try {
            let currentUser = await ctx.executeSql(`select * from dt_users where id = ${currentUserID}`);
            let resultData = currentUser[0]
            return ctx.send(resultData);
        } catch (err) {
            return ctx.sendError(config.resCodes.serverError, err.message);
        }
    }

    // 保存个人信息
    static async submitUserInfo(ctx) {
        const data = ctx.request.body;
        try {
            let sql = 'update dt_users set ';
            if (data.header) {
                sql = sql + ` header = '${data.header}' ,`;
            }
            if (data.nickname ) {
                sql = sql + ` nick_name = '${data.nickname}' ,`;
            }
            if ( data.birthday) {
                sql = sql + ` birthday = '${data.birthday}' ,`;
            }
            if ( data.age) {
                sql = sql + ` age = '${data.age}' ,`;
            }
            if ( data.gender) {
                sql = sql + ` gender = '${data.gender}' ,`;
            }
            if ( data.city) {
                sql = sql + ` city = '${data.city}' ,`;
            }
            if ( data.address) {
                sql = sql + ` address = '${data.address}' ,`;
            }
            if ( data.xueli) {
                sql = sql + ` xueli = '${data.xueli}' ,`;
            }
            if ( data.marry) {
                sql = sql + ` marry = '${data.marry}' ,`;
            }
            if ( data.mobile) {
                sql = sql + ` mobile = '${data.mobile}' ,`;
            }
            if(sql[sql.length-1]===','){
                sql=sql.substr(0,sql.length-1);
            }
            sql = sql +   ` where mobile = '${ctx.state.user.name}'`;
            console.log(sql);
            
            let resultData = await ctx.executeSql(sql);

            return ctx.send(resultData);

        } catch (err) {
            return ctx.sendError(config.resCodes.serverError, err.message);
        }
    }


    // 我的动态
    static async trends(ctx) {
        let currentUserID = ctx.state.user.id; // 登录用户
        try {
            let query = ctx.request.query;
            let currentUserID = ctx.state.user.id; // 登录用户
            // 1.0 获取当前登录用户信息
            let currentUser = await ctx.executeSql(`select age,Distance from dt_users where id = ${currentUserID}`);
            if (!currentUser) {
                return ctx.sendError(config.resCodes.customerError, '用户信息获取失败,参数错误');
            }
            let currentUserDistance = currentUser[0].Distance;

            // 2.0 获取符合条件的数据总条数
            let queryCount = `
            select count(1) as count  from  dt_trends t where ( ${currentUserID}=t.uid and t.status =0)
        `;

            let counts = await ctx.executeSql(queryCount);
            counts = counts[0].count;
            let page = query.page || 1;
            let pagesize = query.pagesize || 10;
            let pages = Math.ceil(counts / pagesize);
            let startIndex = (page - 1) * pagesize;

            // 3.0 分页获取数据
            let sql = `
            select * from  dt_trends t where  ( ${currentUserID}=t.uid and t.status =0)
            order by t.create_time DESC
            limit ${startIndex},${pagesize}
        `;
            let trends = await ctx.executeSql(sql);
            if (!trends || trends.length <= 0) {
                return ctx.sendError(config.resCodes.customerError, '无数据');
            }

            // 4.0 补上每一条动态的相册图片
            let tids = trends.map(item => item.tid).join(',');
            // console.log(tids);
            let albums = await ctx.executeSql(`select tid,  thum_img_path, org_img_path from dt_album where tid in (${tids})`);

            let newtrends = trends.map(item => {
                return {
                    ...item,
                    // agediff: item.age - currentUser[0].age,
                    images: albums.filter(a => a.tid == item.tid)
                }
            })

            // 5.0 响应
            return ctx.send(newtrends, undefined, { counts, pagesize, pages, page });
        } catch (err) {
            return ctx.sendError(config.resCodes.serverError, err.message);
        }
    }

    /* 粉丝，喜欢，互相关注sql：
    -- 喜欢我的
        SELECT 'fanCount' AS type,COUNT(1) AS cout FROM dt_like WHERE type='like' AND uid = 13
        UNION ALL
        -- 我喜欢的
        SELECT 'loveCount' AS type,COUNT(1) AS fanCount FROM dt_like WHERE type='like' AND like_uid = 13
        UNION ALL
        -- 互相喜欢的
        SELECT 'eachLoveCount' AS type, COUNT(fanuser.uid) AS cout FROM (
        SELECT like_uid as uid FROM dt_like WHERE  type='like' AND uid = 13
        ) AS  fanuser,
        (
        SELECT uid  FROM dt_like WHERE type='like' AND like_uid = 13
        ) AS loveuser
        WHERE fanuser.uid = loveuser.uid
    */ 
    static async counts(ctx) {
        let currentUserID = ctx.state.user.id; // 登录用户
        // 1.0 获取当前登录用户和目标用户信息
        try {
            let sql = `           
            SELECT 'fanCount' AS type,COUNT(DISTINCT uid) AS cout FROM dt_like WHERE type='like'  AND like_uid = ${currentUserID}
            UNION ALL           
            SELECT 'loveCount' AS type,COUNT(DISTINCT like_uid) AS cout FROM dt_like WHERE type='like'  AND uid = ${currentUserID}
            UNION ALL           
            SELECT 'eachLoveCount' AS type, COUNT(DISTINCT fanuser.uid) AS cout FROM (
            SELECT like_uid as uid FROM dt_like WHERE  type='like'   AND uid = ${currentUserID}
              ) AS  fanuser,
              (
            SELECT uid  FROM dt_like WHERE type='like'   AND like_uid = ${currentUserID}
              ) AS loveuser
            WHERE fanuser.uid = loveuser.uid `

            let list = await ctx.executeSql(sql);           
            return ctx.send(list);
        } catch (err) {
            return ctx.sendError(config.resCodes.serverError, err.message);
        }
    }


    // 粉丝，喜欢，互相关注  列表返回 sql：
    /*
        -- 我喜欢的
        SELECT *  FROM( (SELECT DISTINCT  dt_like.like_uid from dt_like  WHERE type='like' AND uid =7 ) as dtl
            inner join dt_users t on (dtl.like_uid=t.id and t.status =0)) 
        -- 喜欢我的
       SELECT *  FROM( (SELECT DISTINCT  dt_like.uid from dt_like  WHERE type='like' AND like_uid =8 ) as dtl
            inner join dt_users t on (dtl.uid=t.id and t.status =0)) 
        UNION ALL
        -- 互相喜欢的
   select * from  ( select * from ( SELECT DISTINCT like_uid  FROM dt_like WHERE  type='like' AND uid = 8 ) AS  fanuser,
( SELECT DISTINCT uid  FROM dt_like WHERE type='like' AND like_uid = 8 ) 
AS loveuser WHERE fanuser.like_uid = loveuser.uid )  as u inner join dt_users t on ( u.uid=t.id and t.status=0)  
    
    */

    static async likelist(ctx) {
        let currentUserID = ctx.state.user.id; // 登录用户
        try {

            let  ilikesql = `SELECT  *  FROM( (SELECT DISTINCT  dt_like.like_uid  as uid from dt_like  WHERE type='like'  AND uid=  ${currentUserID} ) as dtl
            inner join dt_users t on (dtl.uid=t.id and t.status =0)) `;
            
            let likemesql = `SELECT *  FROM( (SELECT DISTINCT  dt_like.uid from dt_like  WHERE type='like'   AND  like_uid = ${currentUserID}  ) as dtl
            inner join dt_users t on (dtl.uid=t.id and t.status =0)) `;

            let eachlikesql = `select * from  ( select uid from ( SELECT DISTINCT like_uid  FROM dt_like WHERE  type='like'  AND uid = ${currentUserID} ) AS  fanuser,
            ( SELECT DISTINCT uid  FROM dt_like WHERE type='like'  AND like_uid = ${currentUserID} ) 
            AS loveuser WHERE fanuser.like_uid = loveuser.uid )  as u inner join dt_users t on ( u.uid=t.id and t.status=0 ) `;

            let ilikelist = await ctx.executeSql(ilikesql);           
            let likemelist = await ctx.executeSql(likemesql);           
            let likeeachlist = await ctx.executeSql(eachlikesql);           
            return ctx.send({ilikelist, likemelist, likeeachlist});
        } catch (err) {
            return ctx.sendError(config.resCodes.serverError, err.message);
        }
    }

}


module.exports = MyController;