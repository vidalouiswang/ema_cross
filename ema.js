let Tools = require("./tools");
let BitMax = require("./data-interface");
class EMA {
    constructor(json, callback) {
        this.error = undefined;
        this.count = parseInt(json.count);
        this.alpha = 2 / (json.n + 1);
        this.N = parseInt(json.n);
        this.interval = json.interval;
        this.coin = json.coin;

        this.emaTmp = 0.0;
        this.factor = 10000;

        this.callback = callback;
        this.emaArr = [];

        this.calcEMA();
    }

    calcEMA() {
        let me = this;
        BitMax.getData(this.coin, this.interval, this.count, function (err, jsonOuter) {
            if (err) throw (err);

            for (let item of jsonOuter.data) {
                let json = {};
                if (me.emaArr.length == 0) {
                    json.ema = item.close;
                } else {
                    json.ema = me.cema(item);
                }
                json.time = item.time;
                json.fmtTime = Tools.Millis2Time(item.time);
                me.emaArr.push(json);
            }

            if (me.callback) {
                me.callback(me);
            }
        });
    }

    cema(item) {
        this.emaTmp = this.alpha * item.close + (1 - this.alpha) * (this.emaArr[this.emaArr.length - 1]).ema;
        return Math.round(this.emaTmp * this.factor) / this.factor;
    }

}
module.exports = EMA;


