var EMA = require("./ema");
var Cross = require('./cross');
var http = require('http');
var Tools = require("./tools");
var url = require("url");
var MailgunSender = require('./mailgun-sender');
var Sqlite3Tools = require('./sqlite3-tools');
var dbLog = new Sqlite3Tools("log.db");
var ms;
let fs = require("fs");
fs.readFile("./apikey.txt",{encoding:"utf-8"},function(err,data){
    if(err) throw err;
    ms = new MailgunSender(data);
});

var lastEmaA = 0, lastEmaB = 0;
var timer;
var VALVE = 0.5;
var notified = [];
var log = "";

function checkCross(Coin, Interval, N1, N2, Count, Valve) {
    //console.log("开始执行任务");
    Tools.GetTimeStampFromTaobao(function(startTime){
        new EMA({ coin: Coin, count: Count, n: N1, interval: Interval }, function (ema1) {
            new EMA({ coin: Coin, count: Count, n: N2, interval: Interval }, function (ema2) {
                new Cross(ema1, ema2, Valve, function (cro) {
                    let lastOne = cro[cro.length - 1];
                    let f = true;
                    for (let i of notified) {
                        if (i == lastOne.time) {
                            f = false;
                            break;
                        }
                    }
                    if (f) {
                        if (lastEmaA != lastOne.emaA || lastEmaB != lastOne.emaB) {
                            lastEmaA = lastOne.emaA;
                            lastEmaB = lastOne.emaB;
                            //console.log("需要通知");
                            dbLog.newLog("t: " + startTime + ", ea: " + lastOne.emaA + ", eb: " + lastOne.emaB + ", s: y");
                            notify(Coin, N1, N2, Interval, lastOne);
                            notified.push(lastOne.time);
                        }else{
                            dbLog.newLog("t: " + startTime + ", ea: " + lastOne.emaA + ", eb: " + lastOne.emaB + ", s: n");
                        }
                    }
                });
            });
        });
    });

    
};

function notify(coin, n1, n2, interval, obj) {
    let Subject = coin + "预警-" + obj.fmtTime;
    let Content = "时间：" + obj.fmtTime +
        '\n币种：' + coin +
        '\nInterval: ' + interval.toString() +
        '\nEMA(' + n1.toString() + ')：' + obj.emaA.toString() +
        '\nEMA(' + n2.toString() + ')：' + obj.emaB.toString() +
        '\n预警阈值(美元)：' + VALVE.toString();

    ms.Send({ from: "test@sandbox62269d57285c40e0956479f8d08e4ae2.mailgun.org", toArr: ['872889318@qq.com'], subject: Subject, content: Content });
};

timer = setInterval(function () {
    checkCross("btc-usdt", 15, 7, 30, 383, VALVE);
}, 5000);


let server = http.createServer(function (req, res) {
    res.writeHead(200, { "Content-type": "text/html;charset=UTF-8" });
    let query = url.parse(req.url, true).query;
    if (req.url.indexOf("cross") >= 0) {
        ms.Send({ from: "test@sandbox62269d57285c40e0956479f8d08e4ae2.mailgun.org", toArr: ['872889318@qq.com'], 
        subject: "更改阈值通知", content: "阈值由" + VALVE.toString() + "更改为" + query.valve });
        VALVE = parseFloat(query.valve);
        res.end("success");
    }else if(req.url.indexOf("showlog")){

    }
});

server.listen(2424, "139.180.141.189");