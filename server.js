var EMA = require("./ema");
var Cross = require('./cross');
var http = require('http');
var Tools = require("./tools");
var url = require("url");
var sha3 = require("js-sha3");
var MailgunSender = require('./mailgun-sender');
var Sqlite3Tools = require('./sqlite3-tools');

var db = new Sqlite3Tools("log.db");

var refreshTimeSpan = 5000, domainName = "", port = 0, version = "", pendingMissions = [], lastEmaA = 0, lastEmaB = 0, listeners = [], VALVE = 200, log = "";
var fromAddress = "", arrOwners = [];
var ms, dc, uc;
var notifyTimeGap = 60 * 60 * 1000;

//get info from file
let fs = require("fs");
fs.readFile("./info.txt", { encoding: "utf-8" }, function (err, data) {
    if (err) Tools.GetTimeStampFromTaobao(function (time) {
        db.newLog("err in new mailgun sender init");
        db.close();
        process.exit(1);
    });
    let json;
    try {
        json = JSON.parse(data);
    } catch (error) {
        db.newLog("err in new mailgun sender init JSON.parse");
        db.close();
        process.exit(1);
    }

    ms = new MailgunSender(json.apikey);
    console.log("apikey loaded: " + json.apikey);
    domainName = json.domain_name;
    console.log("domain name loaded: " + json.domain_name);
    port = parseInt(json.port);
    console.log("port loaded: " + json.port);
    fromAddress = json.from_address;
    console.log("from address loaded: " + json.from_address);
    version = json.version;
    console.log("version loaded: " + json.version);
    arrOwners = eval(json.arr_owners);
    console.log("arr owners loaded: " + json.arr_owners);
    dc = json.dc;
    uc = json.uc;
    init();
});

function notify(json) {
    let Subject = json.toSubject();
    let Content = json.toEmail();
    sendEmail2Owner(Subject, Content);
    console.log(json);
};

function sendEmail2Owner(s, c) {
    if (!c) c = "Nothing to show";
    ms.Send({
        from: fromAddress, toArr: arrOwners,
        subject: s, content: c
    });
};

function addListener(json) {
    let crossObj = new Cross({
        database: db,
        coin: json.coin,
        interval: json.interval,
        n1: json.n1,
        n2: json.n2,
        count: json.count,
        valve: json.valve,
        timeGap: notifyTimeGap,
        dc: dc,
        uc: uc,
        callback: function (json) {
            notify(json);
        }
    });
    json.crossObj = crossObj;
    db.addListener(crossObj, function (success) {
        if (success) {
            db.newLog("new listener was added. " + json.crossObj.toString());
            listeners.push(json);
        } else {
            db.newLog("tried to add listener but the listener was exist. " + json.crossObj.toString());
        }
    });
};

function findListener(id) {
    for (let i of listeners) {
        if (i.id == id) return i;
    }
    return undefined;
};

function removeListenerFromArr(id) {
    for (let i = 0; i < listeners.length; i++) {
        if (listeners[i].id == id) {
            listeners.splice(i, 1);
            break;
        }
    }
};

function deleteListener(id) {
    let item = findListener(id);
    if (!item) {
        db.newLog("couldn't find timer with id");
        cmdShowListeners();
        return undefined;
    }
    item.crossObj.destroy();
    removeListenerFromArr(id);
}


function startListener(id) {
    for (let i of listeners) {
        if (i.id == id) {
            i.crossObj.start();
            break;
        }
    }
}

function stopListener(id) {
    for (let i of listeners) {
        if (i.id == id) {
            i.crossObj.stop();
            break;
        }
    }
}
function stopAllListeners() {
    for (let i of listeners) i.crossObj.stop();
}
function startAllListeners() {
    for (let i of listeners) i.crossObj.start();
}

function cmdAddListener(i) {
    addListener({ coin: i.coin, interval: i.interval, n1: i.n1, n2: i.n2, count: i.count, valve: i.valve }, function (id) {
        if (id != -1) sendEmail2Owner("添加成功", "监听器已成功添加, 新添加的监听器id为：" + id);
        else sendEmail2Owner("添加失败", "监听器已存在");
    });
}
function cmdShowListeners() {
    let res = "";
    for (let i of listeners) {
        res += i.crossObj.toString() + "\r\n";
    }
    sendEmail2Owner("监听器列表", res);
}
function cmdDeleteListeners(i) {
    deleteListener(i.id);
}
function cmdModifyRefreshTimeSpan(i) {
    let j = refreshTimeSpan;
    refreshTimeSpan = i.timespan;
    stopAllListeners();
    startAllListeners();

    sendEmail2Owner("修改刷新时间间隔成功", "刷新时间间隔由" + j + "更改为" + i.timespan);
}
function cmdModifyValve(i) {
    let j = VALVE;
    for (let item of listeners) {
        item.changeValve(i.valve);
    }
    sendEmail2Owner("修改阈值成功", "阈值由" + j + "更改为" + i.valve);
}
function cmdShowLogs(i) {
    if (!i) {
        i = {};
    }
    db.getLatestLogs(i.count, true, function (res) {
        sendEmail2Owner("日志", res);
    });
}
function cmdStopListener(i) {
    stopListener(i.id);
    sendEmail2Owner("监听器已停止", "ID为" + i.id + "的监听器已停止运作");
}
function cmdStartListener(i) {
    startListener(i.id);
    sendEmail2Owner("监听器已启动", "ID为" + i.id + "的监听器已开始运作");
}
function removeFromPending(hash) {
    for (let j = 0; j < pendingMissions.length; j++) {
        if (pendingMissions[j].hash == hash) {
            pendingMissions.splice(j, 1);
            break;
        }
    }
}
function cmdClearLogs() {
    db.clearLogs();
    cmdShowLogs();
}

function init() {
    db.fetchListeners(function (arr) {
        for (let i of arr) {
            listeners.push(new Cross({
                database: db,
                coin: i.coin,
                interval: i.interval,
                n1: i.n1,
                n2: i.n2,
                count: i.count,
                valve: i.valve,
                running: i.status ? true : false,
                timeGap: notifyTimeGap,
                dc: dc,
                uc: uc,
                callback: function (json) {
                    notify(json);
                }
            }));
        }
    });

    http.createServer(function (req, res) {
        res.writeHead(200, { "Content-type": "text/html;charset=UTF-8" });
        let query = url.parse(req.url, true).query;
        if (req.url.indexOf("command") >= 0) {
            let json = {};
            json.hash = sha3.sha3_512(new Date().getTime().toString() + query.command);
            json.query = query;
            json.timer = setTimeout(function () {
                removeFromPending(json.hash);
            }, 600000);
            pendingMissions.push(json);

            sendEmail2Owner("未执行的操作", "点击以下链接已继续执行指令：\nhttp://" + domainName + ":" + port + "/pending?hash=" + json.hash);
            console.log("未执行的操作", "点击以下链接已继续执行指令：\nhttp://" + domainName + ":" + port + "/pending?hash=" + json.hash);
            db.newLog("new command arived: " + query.command);
            console.log("new request arived");
            res.end("success");
        } else if (req.url.indexOf("pending") >= 0) {
            let i = undefined;
            for (let j of pendingMissions) {
                if (j.hash == query.hash) {
                    i = j.query;
                    clearTimeout(j.timer);
                    removeFromPending(j.hash);
                    break;
                }
            }

            if (i) {
                if (i.command == "add_listener") {
                    cmdAddListener(i);
                } else if (i.command == "show_listeners") {
                    cmdShowListeners();
                } else if (i.command == "delete_listener") {
                    cmdDeleteListeners(i);
                } else if (i.command == "modify_refresh_timespan") {
                    cmdModifyRefreshTimeSpan(i);
                } else if (i.command == "modify_valve") {
                    cmdModifyValve(i);
                } else if (i.command == "show_logs") {
                    cmdShowLogs(i);
                } else if (i.command == "stop_listener") {
                    cmdStopListener(i);
                } else if (i.command == "start_listener") {
                    cmdStartListener(i);
                } else if (i.command == "clear_logs") {
                    cmdClearLogs();
                }
                res.end("success");
            } else {
                res.end("unknown error");
            }
        }
    }).listen(port, domainName);

    console.log("server started");

    Tools.GetTimeStampFromTaobao(function (st) {
        sendEmail2Owner("服务已启动", "时间: " + Tools.Millis2Time(st) + "(" + st + ")");
        db.newLog("server started at: " + Tools.Millis2Time(st) + "(" + st + ")" + ", version: " + version)
    });
}