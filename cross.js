let EMA = require("./ema");
let Tools = require("./tools");
var sha3 = require("js-sha3");
class Cross {
    constructor({ database, coin, interval, n1, n2, count, running=true, valve, uc = "金叉", dc = "死叉", timeGap = 0, refreshInterval = 5000, callback }) {
        if(!(database && coin && interval && n1 && n2 && count && valve)){
            return undefined;
        }
        this.crossArr = [];
        this.coin = coin.toUpperCase();
        this.interval = interval;
        this.n1 = n1;
        this.uc = uc;
        this.dc = dc;
        this.n2 = n2;
        this.count = count;
        this.timeGap = timeGap;
        this.valve = valve;
        this.callback = callback;
        this.refreshInterval = refreshInterval;
        this.db = database;
        this.readyA = false;
        this.readyB = false;
        this.ema1 = undefined;
        this.ema2 = undefined;
        this.resultJson = undefined;
        let me = this;
        this.running = true;
        this.finding = false;
        this.destroyed = false;
        this.hash = sha3.sha3_256(coin + interval + n1 + n2 + count);

        this.readyCallback = function () {
            if (me.ema1 && me.ema2) {
                me.finding = true;
                Tools.GetTimeStampFromTaobao(function (time) {
                    if (me.ema1 && me.ema2) {
                        let json = {};
                        if (me.ema1.emaArr.length >= 2) {
                            let lastEMA1 = me.ema1.emaArr[me.ema1.emaArr.length - 1].ema;
                            let lastEMA2 = me.ema2.emaArr[me.ema2.emaArr.length - 1].ema;

                            if (Math.abs(lastEMA1 - lastEMA2) <= me.valve) {
                                let last2EMA1 = me.ema1.emaArr[me.ema1.emaArr.length - 2].ema;
                                let last2EMA2 = me.ema2.emaArr[me.ema2.emaArr.length - 2].ema;

                                if (last2EMA1 >= last2EMA2) {
                                    json.direction = true;
                                } else {
                                    json.direction = false;
                                }
                                json.coin = me.ema1.coin;
                                json.interval = me.ema1.interval;
                                json.emaA = lastEMA1;
                                json.emaB = lastEMA2;
                                json.dc = me.dc;
                                json.uc = me.uc;
                                json.currentTime = time;
                                json.fmtCurrentTime = Tools.Millis2Time(json.currentTime);
                                json.time = me.ema1.emaArr[me.ema1.emaArr.length - 1].time;
                                json.fmtTime = me.ema1.emaArr[me.ema1.emaArr.length - 1].fmtTime;
                                json.count = me.ema1.count;
                                json.n1 = me.ema1.N;
                                json.n2 = me.ema2.N;
                                json.valve = me.valve;
                                json.crossType = me.jsonCrossType;
                                json.toString = me.jsonToString;
                                json.toSubject = me.jsonToSubject;
                                json.toEmail = me.jsonToEamil;

                                if (me.timeGap != 0) {
                                    if (time - json.time <= me.timeGap) {
                                        if (me.resultJson) {
                                            if (json.emaA != me.resultJson.emaA || json.emaB != me.resultJson.emaB) {
                                                me.notify(json);
                                            }
                                        } else {
                                            me.notify(json);
                                        }
                                    } else {
                                        me.db.newLog("beyond time gap. " + json.toString());
                                    }
                                } else {
                                    if (me.resultJson) {
                                        if (json.emaA != me.resultJson.emaA || json.emaB != me.resultJson.emaB) {
                                            me.notify(json);
                                        }
                                    } else {
                                        me.notify(json);
                                    }
                                }
                            }
                        }
                        me.ema1 = undefined;
                        me.ema2 = undefined;
                        me.finding = false;
                    }
                });
            }
        };
        this.start();
    }
    toString(){
        return "coin: " + this.coin +
        ", interval: " + this.interval +
        ", time: " + this.fmtTime + "(" + this.time +
        "), N1: " + this.n1 +
        ", N2: " + this.n2 +
        ", count: " + this.count;
    }
    jsonToString() {
        return "current time: " + this.fmtCurrentTime + "(" + this.currentTime + ")" +
            ", coin: " + this.coin +
            ", interval: " + this.interval +
            ", time: " + this.fmtTime + "(" + this.time +
            "), EMA(" + this.n1 + "): " + this.emaA +
            ", EMA(" + this.n2 + "): " + this.emaB +
            ", count: " + this.count +
            ", type: " + this.crossType();
    }
    jsonToSubject() {
        return this.coin + "-预警-" + (this.direction ? this.dc : this.uc);
    }
    jsonToEamil() {
        return '币种: ' + this.coin +
            "\n图表时间: " + this.fmtTime +
            '\n币种: ' + this.coin +
            '\n图表类型(分钟): ' + this.interval +
            '\nEMA(' + this.n1 + '): ' + this.emaA +
            '\nEMA(' + this.n2 + '): ' + this.emaB +
            '\n预警通知时间: ' + this.fmtCurrentTime +
            '\n预警阈值: ' + this.valve;
    }
    jsonCrossType() {
        return this.direction ? "EMA(" + this.n1 + ") cross EMA(" + this.n2 + ") downward" : "EMA(" + this.n1 + ") cross EMA(" + this.n2 + ") upward";
    }

    notify(json) {
        let me = this;
        if (this.db.findNotified(json, function (row) {
            if (!row) {
                me.db.newLog("notified. " + json.toString());
                me.db.add2Notified(json);
                me.resultJson = json;
                me.callback(json);
            } else {
                me.db.newLog("existed. " + json.toString());
                me.resultJson = json;
            }
        }));
    }
    changeValve(valve) {
        this.valve = valve;
    }

    checkReadyA(ema) {
        if (!this.finding) {
            this.ema1 = ema;
            this.readyCallback();
        }
    }
    checkReadyB(ema) {
        if (!this.finding) {
            this.ema2 = ema;
            this.readyCallback();
        }
    }
    changeSpeed(refreshInterval) {
        this.refreshInterval = refreshInterval;
        this.start();
    }
    stop() {
        try {
            clearInterval(this.timer);
        } catch (error) { }
        this.running = false;
        this.db.changeStatus(this);
    }
    start() {
        let me = this;
        try {
            clearInterval(this.timer);
        } catch (error) { }
        this.timer = setInterval(function(){
            if (!this.finding) {
                new EMA({ coin: me.coin, count: me.count, n: me.n1, interval: me.interval }, function (ema) {
                    me.checkReadyA(ema);
                });
                new EMA({ coin: me.coin, count: me.count, n: me.n2, interval: me.interval }, function (ema) {
                    me.checkReadyB(ema);
                });
            }
        }, this.refreshInterval);
        this.running = false;
        this.db.changeStatus(this);
    }
    destroy(callback){
        this.stop();
        this.destroyed = true;
        this.db.deleteListener(this);
        if(callback) callback();
    }
}
module.exports = Cross;

// const tg = 3600000;
// //unit-test
// new Cross({
//     database: undefined, coin: "btc-usdt", interval: "15", n1: 7, n2: 30, count: 384, valve: 200, refreshInterval: 1000, timeGap: tg, callback: function (json) {
//         if (!json) throw (new Error("cross 1"));
//         if (json.coin != "BTC-USDT") throw (new Error("cross 2"));
//         if (json.currentTime - json.time >= tg) throw (new Error("cross beyond time gap"));
//         //console.log(json.toString());
//         //console.log(json.crossType());
//     }
// });