const mysql_pool = require('./mysql-pool');

const checkConfig = conf => {
    if (typeof conf === 'object') {
        if ('password' in conf && 'user' in conf && 'host' in conf) {
            return conf;
        } else {
            throw new Error("mysql config 需要包含 host user password")
        }
    } else {
        try {
            conf = JSON.parse(conf);
            return checkConfig(conf);
        } catch (e) {
            throw new Error("mysql config 转换失败\n" + e.message);
        }
    }
};

// 数据库只需要建立一个单例
class mySqlDB {
    constructor(config) {
        this.config = checkConfig(config);
        this.pool = null;
        this.database = config.database || '';
        this.init();
    }

    init() {
        this.pool = new mysql_pool(this.config);
    }

    setDatabase(database) {
        this.database = database;
    }

    /**
     * 由于只能传递一个 table ，所以这里需要将 table 里面的 库名 和 表名 分割出来
     * @param table
     *  db_1#table_1
     */
    get_db_table(table) {
        if (table.indexOf('#') + 1) {
            let dt = table.split('#');
            return {
                tableName: dt[1],
                databaseName: dt[0]
            }
        }
        else {
            return {
                tableName: table,
                databaseName: this.database
            }
        }
    }

    /**
     * obj  -> table 数据库名#表名 或者 表名
     *      -> data 对应于数据库的字段，建议在 module 中进行定义，然后使用 new module 进行传递
     * */
    save(obj,cb) {
        this.pool.insert(Object.assign(
            this.get_db_table(obj.table),
            {
                obj: obj.data,
                callback:cb
            }
        ));
    }

    /**
     * obj  -> table 数据库名#表名 或者 表名
     *      -> data {
     *                  conditionStr: "id>1 and id<5"
     *              }
     * */
    delete(obj,cb) {
        this.pool.delete(Object.assign(
            this.get_db_table(obj.table),
            {
                obj: obj.data,
                callback:cb
            }
        ));
    }

    /**
     * obj  -> table 数据库名#表名 或者 表名
     *      -> data {
     *                  conditionStr: "id>1 and id<5",
     *                  setStr : "name='lala'",
     *              }
     * */
    update(obj,cb) {
        this.pool.update(Object.assign(
            this.get_db_table(obj.table),
            {
                obj: obj.data,
                callback:cb
            }
        ));
    }

    /**
     * obj  -> table 数据库名#表名 或者 表名
     * */
    getAll(obj,cb) {
        this.pool.getAll(Object.assign(
            this.get_db_table(obj.table),
            {
                callback: cb
            }
        ));
    }

    /**
     * obj  -> table 数据库名#表名 或者 表名
     *      -> data {
     *                  conditionStr: "id>1 and id<5",
     *              }
     * */
    select(obj,cb) {
        this.pool.select(Object.assign(
            this.get_db_table(obj.table),
            {
                obj: obj.data,
                callback: cb
            }
        ));
    }

    /**
     * obj  -> table 数据库名#表名 或者 表名
     *      -> sql 符合 mysql 语法的语句
     * */
    query(obj,cb) {
        this.pool.query(Object.assign(
            {
                sql: obj.sql,
                callback: cb
            }
        ));
    }
}

module.exports = mySqlDB;