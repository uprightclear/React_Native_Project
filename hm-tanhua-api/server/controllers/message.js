const crypto = require('crypto'),
    jwt = require('jsonwebtoken'),
    config = require('../config/config.js'),
    fs = require('fs'),
    path = require('path'),
    https = require('https'),
    qs = require('querystring');


class MessageController {

    // 分页获取点赞列表
    /* sql语句：
    SELECT MAX(ds.sid) AS id,
        CONCAT('${global.domain}',du.header) as avatar,
        du.nick_name,
        du.mobile,
        MAX(ds.create_time) AS updateDate,
        CONCAT(COUNT(1),'次点赞了你的朋友圈') AS content,
        ds.star_uid,
        0 AS unReadMsgCount
        FROM dt_star ds 
        inner join dt_users du on (ds.star_uid = du.id)
        WHERE ds.uid=7 -- 登录的用户id
        GROUP by ds.star_uid
        ORDER by updateDate desc    
    */
    static async starlist(ctx) {
        try {
            let currentUserID = ctx.state.user.id; // 登录用户
            let query = ctx.request.query;

            // 分页数据
            let queryCount = `
            SELECT COUNT(1) as count FROM (
                SELECT MAX(ds.sid) AS id,
                        CONCAT('${global.domain}',du.header) as avatar,
                        du.nick_name,
                        du.mobile,
                        MAX(ds.create_time) AS updateDate,
                        CONCAT(COUNT(1),'次点赞了你的朋友圈') AS content,
                        ds.star_uid,
                        0 AS unReadMsgCount
                        FROM dt_star ds 
                        inner join dt_users du on (ds.star_uid = du.id)
                        WHERE ds.uid=7 -- 登录的用户id
                        GROUP by ds.star_uid
                  ) AS t
                 `;

            //  获取总条数
            let counts = await ctx.executeSql(queryCount);
            counts = counts[0].count;
            let page = query.page;
            let pagesize = query.pagesize;
            let pages = Math.ceil(counts / pagesize);
            let startIndex = (page - 1) * pagesize;


            let starList = await ctx.executeSql(`SELECT MAX(ds.sid) AS id,
            CONCAT('${global.domain}',du.header) as avatar,
            du.nick_name,
            du.mobile,
            MAX(ds.create_time) AS updateDate,
            CAST(CONCAT(COUNT(1),'次点赞了你的朋友圈') AS CHAR) AS content,
            ds.star_uid,
            0 AS unReadMsgCount
            FROM dt_star ds 
            inner join dt_users du on (ds.star_uid = du.id)
            WHERE ds.uid= ${currentUserID}
            GROUP by ds.star_uid
            ORDER by updateDate desc `);

            // 5.0 响应
            return ctx.send(starList, undefined, { counts, pagesize, pages, page });

        } catch (err) {
            return ctx.sendError(config.resCodes.serverError, err.message);
        }
    }
}

module.exports = MessageController;