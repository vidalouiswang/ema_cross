var sqlite3 = require('sqlite3');
var Tools = require("./tools");
class Sqlite3Tools{
    constructor({filename}){
        this.db = new sqlite3.Database(filename);
    }
    exe(sql){
        let er;
        this.db.run(sql,function(err){
            er = err;
        });
        return er;
    }
    getResult({sql,callback}){
        this.db.each(sql,callback);
    }
    newLog(log){
        Tools.GetTimeStampFromTaobao(function(time){
            this.db.run("insert into log(id,time,value,extra) values(null," + time + "," + log + ",''");
        });
    }
    getLatestLogs({count=10,returnString=false}){
        let res, sql;

        if(returnString) res = "";
        else res = [];

        if(!count) sql = "select * from log order by time desc";
        else sql = "select * from log order by time desc limit " + count.toString();
       
        this.db.each(sql, function(err,row){
            if(err) return undefined;
            if(!returnString){
                let json = {};
                json.fmtTime = Tools.Millis2Time(row.time);
                json.log = row.value;
                json.extra = row.extra;
                res.push(json);

            }else{
                res += "Time: " + Tools.Millis2Time(row.time) + ", Log: " + row.log + (row.extra.length == 0 ? "" : (", Extra Info: " + row.extra)) + "\r\n";
            } 
        });
        return res;
    }
    close(){
        this.db.close();
    }
}

module.exports = Sqlite3Tools;