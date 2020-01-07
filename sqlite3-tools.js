var sqlite3 = require('sqlite3');
var Tools = require("./tools");
var sha3 = require("js-sha3");
class Sqlite3Tools {
    constructor(filename) {
        this.db = new sqlite3.Database(filename);
    }
    exe(sql) {
        let er;
        this.db.run(sql, function (err) {
            er = err;
        });
        return er;
    }
    clearLogs() {
        this.db.run("delete from log where 1=1");
    }
    getResult({ sql, callback }) {
        this.db.each(sql, callback);
    }
    newLog(log) {
        let me = this;

        Tools.GetTimeStampFromTaobao(function (time) {
            me.db.get("select * from log where value ='" + log + "'", function (err, row) {
                if (row) {
                    me.db.run("update log set times = (select times from log where id =  " + row.id + ") + 1 where id = " + row.id + "");
                    me.db.run("update log set last_update = " + time + " where id = " + row.id + " ")
                } else {
                    me.db.run("insert into log(id,time,value,last_update,times) values(null,'" + time + "','" + log + "','" + time + "',0)");
                }
            });
        });
    }
    getLatestLogs(count, returnString, callback) {
        let res, sql;

        if (returnString) res = "";
        else res = [];

        if (!count) sql = "select * from log order by time desc";
        else{
            if(parseInt(count) == 0){
                sql = "select * from log order by time desc";
            }else{
                sql = "select * from log order by time desc limit " + count.toString();
            }
        } 
        this.db.each(sql, function (err, row) {
            if (err) return undefined;
            if (!returnString) {
                let json = {};
                json.fmtTime = Tools.Millis2Time(row.time);
                json.log = row.value;
                json.extra = row.extra;
                res.push(json);
            } else {
                res += "id: " + row.id + "\r\n" +
                    "time: " + Tools.Millis2Time(row.time) + "(" + row.time + ")" + "\r\n" +
                    "log: " + row.value + "\r\n" +
                    "last_update: " + Tools.Millis2Time(row.last_update) + "(" + row.last_update + ")" + "\r\n" +
                    "times: " + row.times + "\r\n\r\n";
            }
        }, function (err, count) {
            callback(res);
        });
    }
    addListener(coin, interval, n1, n2, count, callback) {
        if (!(coin && interval && n1 && n2 && count)) {
            //console.log(coin);
            //console.log(interval);
            //console.log(n1);
            //console.log(n2);
            //console.log(count);
            this.newLog("argumens missing in addListener");
            return undefined;
        }
        let me = this;
        let hash = sha3.sha3_256(coin + interval + n1.toString() + n2.toString() + count.toString());
        //console.log("6.1");
        //console.log(sql);
        this.db.get("select * from listeners where hash='" + hash + "'", function (err, row) {
            //console.log("6.2");
            if (err) {
                me.newLog("Error in this.db.get select * from listeners where hash = xxx, " + err.message);
                return undefined;
            }
            //console.log("6.3");
            if (!row) {
                //console.log(sl);
                me.db.run("insert into listeners(id,coin,interval,n1,n2,x_count,status,hash) values(null,'" + coin + "','" + interval + "'," + n1 + "," + n2 + "," + count + ",0,'" + hash + "')");
                callback(0);
            } else {
                callback(row.id);
            }
        });
    }

    deleteListener(id, callback) {
        this.db.run("delete from listeners where id = " + id, function (err) {
            callback();
        });
    }

    fetchListeners(callback) {
        let arr = [];
        this.db.each("select * from listeners", function (err, row) {
            let json = {};
            json.id = row.id;
            json.coin = row.coin;
            json.interval = row.interval;
            json.n1 = parseInt(row.n1);
            json.n2 = parseInt(row.n2);
            json.count = parseInt(row.x_count);
            arr.push(json);
        }, function (err, count) {
            callback(arr);
        });
    }

    add2Notified(json) {
        let hash = sha3.sha3_256(json.toString());
        this.db.run("insert into notified(id, time, hash) values(null, '" + json.time + "','" + hash + "')");
    }
    findNotified(json, callback) {
        let hash = sha3.sha3_256(json.toString());
        this.db.get("select * from notified where hash='" + hash + "'", function (err, row) {
            if (row) callback(row);
            else callback(undefined);
        });
    }
    close() {
        this.db.close();
    }
}

module.exports = Sqlite3Tools;