
const mysql = require('mysql');

const dbHandle = () => {

    // 创建mysql线程池
    let pool = mysql.createPool({
        user: 'root',
        password: '123456',
        database: 'tanhua',
        host: '127.0.0.1',
        port: '3306'
    });

    // 创建方法 ,sql:sql语句，values：字段对应的值
    // 例如： insert into users(name) values (?) 中的 ? 就是从values中取得
    const execute = () => {
        return async (sql, values) => {
            return new Promise((resolve, reject) => {
                pool.getConnection(function (err, connection) {
    
                    if (err) {
                        reject(err)
                    } else {
                        connection.query(sql, values, (err, fields) => {
                            if (err) reject(err)
                            else resolve(fields)
                            connection.release();
                        })
                    }
                })
            })
        }
    }

    return async (ctx, next) => {
        ctx.executeSql = execute();
        await next();
    }
}

module.exports = dbHandle;
