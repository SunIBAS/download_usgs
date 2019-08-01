let mysql = require('mysql');
let async = require("async");

/**
 * getAll insert query select delete update
 * 六个方法的 callback 格式如下
 * callback = function(err,ret) {
 *      err 错误信息，如果没有错误应该是 null
 *      ret 处理结果，对应每一个操作结果不同
 *          getAll、select 应格是一个 数组
 *          insert、delete、update
 *          query 看查询内容而定
 * }
 */
class mysql_pool {
    constructor(connectionParam) {
        this.connectionParam = connectionParam;
        this.pool = null;
        // 放到最后
        this.init();
    }

    init() {
        this.pool = mysql.createPool(this.connectionParam);
        return this;
    }

    /**
     * 获取一个数据库链接
     * @param tableName 表名
     * @param databaseName 库名
     * @param cb 回调
     * cb = function(err,connection) {
     *      err 是一个错误信息，如果存在表示获取链接失败
     *      connection 一个链接
     * }
     */
    getConnection(cb,tableName,databaseName) {
        this.pool.getConnection(function(err,connection){
            if (err) {
                throw err;
                return {};
            } else {
                connection.query("use " + databaseName);
                cb(connection,tableName);
            }
            connection.release();
        });
    }

    // 暂时不定义
    executeTransaction() {}

    /**
     * 获取表的所有内容
     * @param callback 回调方法
     * @param tableName 表名
     * @param databaseName 数据库名
     */
    getAll({callback,tableName,databaseName}) {
        this.getConnection(function(connection,tableName){
            connection.query("select * from " + tableName,callback);
        },tableName,databaseName);
    }

    /**
     * 插入
     * @param obj 插入数据库内容
     * @param callback 回调方法
     * @param tableName 表名
     * @param databaseName 数据库名
     */
    insert({obj,callback,tableName,databaseName}) {
        this.getConnection(function(connection,tableName){
            connection.query("insert into " + tableName + " set ?",obj,callback);
        },tableName,databaseName);
    }

    /**
     * 执行 sql 语句
     * @param sql 要执行的 sql 语句
     * @param callback 回调方法
     * @param tableName 表名
     * @param databaseName 数据库名
     */
    query({sql,callback,tableName,databaseName}) {
        this.getConnection(function(connection,tableName){
            connection.query(sql,callback);
        },tableName,databaseName);
    }

    /**
     * 查找
     * @param obj 一个查找对象（稍微复杂）
     * @param callback 回调方法
     * @param tableName 表名
     * @param databaseName 数据库名
     */
    select({obj,callback,tableName,databaseName}) {
        this.getConnection(function(connection,tableName) {
            let sqle = "";
            if (obj.conditionStr) {
                sqle = "where " + obj.conditionStr;
            }
            else if (obj.condition) {
                let isF = true;
                sqle = "where";
                for (let i in obj.condition) {
                    if (isF) {} else {
                        sqle += " and";
                    }
                    sqle += " " + i + obj.condition[i]["sig"] + mysql.escape(obj.condition[i]["value"]);
                }
            }
            if (obj.cols) {
                connection.query("select ?? from ?? " + sqle,[obj.cols,tableName],callback);
            } else {
                connection.query("select * from ?? " + sqle,[tableName],callback);
            }
        },tableName,databaseName);
    }

    /**
     * 删除
     * @param obj 一个删除对象（稍微复杂）
     * @param callback 回调方法
     * @param tableName 表名
     * @param databaseName 数据库名
     */
    delete({obj,callback,tableName,databaseName}) {
        this.getConnection(function(connection,tableName) {
            let sqle = "";
            if (obj.conditionStr) {
                sqle = " where " + obj.conditionStr;
            }
            else if (obj.condition) {
                let isF = true;
                sqle = " where";
                for (let i in obj.condition) {
                    if (isF) {} else {
                        sqle += " and";
                    }
                    sqle += " " + i + obj.condition[i]["sig"] + obj.condition["value"];
                }
            } else {
                throw new Error("condition is required .");
            }
            connection.query("delete from " + tableName + sqle,callback);
        },tableName,databaseName);
    }

    /**
     * 更新
     * @param obj 一个更新对象（稍微复杂）
     * @param callback 回调方法
     * @param tableName 表名
     * @param databaseName 数据库名
     */
    update({obj,callback,tableName,databaseName}) {
        this.getConnection(function(connection,tableName) {
            let sqle = "";
            let set_ = "";
            if (obj.conditionStr) {
                sqle = " where " + obj.conditionStr;
            }
            else if (obj.condition) {
                let isF = true;
                sqle = " where";
                for (let i in obj.condition) {
                    if (isF) {isF = false;} else {
                        sqle += " and";
                    }
                    sqle += " " + i + obj.condition[i]["sig"] + obj.condition["value"];
                }
            } else {
                throw new Error("condition is required .");
            }
            if (obj.setStr) {
                set_ = " " + obj.setStr + " ";
            }
            else if (obj.set) {
                let isF = true;
                for (let i in obj.set) {
                    if (isF) {isF = false;} else {
                        sqle += " , ";
                    }
                    set_ += i + " ='" + obj.set[i] + "' ";
                }
            } else {
                throw new Error("set is required .");
            }
            connection.query("update " + tableName + " set " + set_ + sqle,callback);
        },tableName,databaseName);
    }
}

module.exports = mysql_pool;

// 一下文档供参考
/**
 * getAll                      默认的查询函数，将放回一个表中的所有内容
 *     参数名称            说明
 *     callback        回调函数，由用户编写
 *         其中 callback 的格式为 function(results) { dear with result }
 *         results 为执行 query 操作后的结果
 *     tableName       数据表名称[/]
 *     databaseName    数据库名称[/]
 * insert                      默认的插入函数，需要提供全部表的字段
 *     参数名称            说明
 *     obj             将插入表的数据对象，必须是全部参数
 *                     例如表中的字段有 (name,age,sex) ，则插入的对象类似
 *                     { name : 'ibas' , age : 1 , sex : 'male' }
 *     callback        回调函数，由用户编写
 *         其中 callback 的格式为 function(results) { dear with result }
 *         results 为执行 query 操作后的结果
 *     tableName       数据表名称[/]
 *     databaseName    数据库名称[/]
 * select                      默认的选择函数
 *     参数名称
 *     obj             查询的内容，结构如下（假设表中字段有(name,age,sex)）
 *         {
 *             conditionStr :  "age=1 and sex=male",   [/]
 *             condition   :   {   // 该情况等同于上面的表达式(这里多个情况都用and连接)  [/]
 *                                 age : {         //比对的字段 age
 *                                     sig : "="，  //比对的方法 =
 *                                     value : "1" //比对的值 1
 *                                 },
 *                                 sex : {
 *                                     sig : "=",
 *                                     value : "male"
 *                                 }
 *                             },
 *             cols        :   ['name']  //这里表示将查询的字段
 *         } => select name from tableName where age=1 and sex=male
 *     callback        回调函数，由用户编写
 *         其中 callback 的格式为 function(results) { dear with result }
 *         results 为执行 query 操作后的结果(是一个数组)
 *     tableName       数据表名称[/]
 *     databaseName    数据库名称[/]
 * update                      默认的更新函数
 *     参数名称
 *     obj             查询的内容，结构如下（假设表中字段有(name,age,sex)）
 *         {
 *             conditionStr :  "age=1 and sex=male",
 *             condition   :   {   // 该情况等同于上面的表达式(这里多个情况都用and连接)
 *                                 age : {         //比对的字段 age
 *                                     sig : "=“，  //比对的方法 =
 *                                     value : "1" //比对的值 1
 *                                 },
 *                                 sex : {
 *                                     sig : "=",
 *                                     value : "male"
 *                                 }
 *                             },
 *              setStr : "name='lala'",
 *              set : {
 *                         "name" : "lala"
 *                     }
 *         } => update tableName set name=lala where age=1 and sex=male
 *     callback        回调函数，由用户编写
 *         其中 callback 的格式为 function(results) { dear with result }
 *         results 为执行 query 操作后的结果
 *     tableName       数据表名称[/]
 *     databaseName    数据库名称[/]
 * delete                      默认的删除函数
 *     参数名称
 *     obj             查询的内容，结构如下（假设表中字段有(name,age,sex)）
 *         {
 *             conditionStr :  "age=1 and sex=male",
 *             condition   :   {   // 该情况等同于上面的表达式(这里多个情况都用and连接)
 *                                 age : {         //比对的字段 age
 *                                     sig : "="，  //比对的方法 =
 *                                     value : "1" //比对的值 1
 *                                 },
 *                                 sex : {
 *                                     sig : "=",
 *                                     value : "male"
 *                                 }
 *                             }
 *         } => delete from tableName where age=1 and sex=male
 *     callback        回调函数，由用户编写
 *         其中 callback 的格式为 function(results) { dear with result }
 *         results 为执行 query 操作后的结果
 *     tableName       数据表名称[/]
 *     databaseName    数据库名称[/]
 * */


/*
-----------update have not------------
    null
OkPacket {
    fieldCount: 0,
        affectedRows: 0,
        insertId: 0,
        serverStatus: 2,
        warningCount: 0,
        message: '(Rows matched: 0  Changed: 0  Warnings: 0',
        protocol41: true,
        changedRows: 0 }
-----------getAll------------
    null
        [ RowDataPacket {
    id: '15165165165',
        name: 'ibas',
        location: 'location_1',
        type: 'type_1' },
RowDataPacket {
    id: '1552408908366',
        name: 'name_447',
        location: 'location_875',
        type: 'type_26' },
RowDataPacket {
    id: '561265165',
        name: 'name_2',
        location: 'location_2',
        type: 'type_2' } ]
-----------update have------------
    null
OkPacket {
    fieldCount: 0,
        affectedRows: 1,
        insertId: 0,
        serverStatus: 2,
        warningCount: 0,
        message: '(Rows matched: 1  Changed: 0  Warnings: 0',
        protocol41: true,
        changedRows: 0 }
-----------delete have not------------
    null
OkPacket {
    fieldCount: 0,
        affectedRows: 0,
        insertId: 0,
        serverStatus: 2,
        warningCount: 0,
        message: '',
        protocol41: true,
        changedRows: 0 }
-----------delete have------------
    null
OkPacket {
    fieldCount: 0,
        affectedRows: 1,
        insertId: 0,
        serverStatus: 2,
        warningCount: 0,
        message: '',
        protocol41: true,
        changedRows: 0 }
-----------insert------------
    null
OkPacket {
    fieldCount: 0,
        affectedRows: 1,
        insertId: 0,
        serverStatus: 2,
        warningCount: 0,
        message: '',
        protocol41: true,
        changedRows: 0 }
*/