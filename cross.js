let EMA = require("./ema");
class Cross {
    constructor(ema1, ema2, valve, fun) {
        this.crossArr = [];
        this.valve = valve;
        this.fun = fun;
        this.findCross(ema1, ema2);
    }

    findEqual(ema1, ema2) {
        let direction = ema1.emaArr[1].ema > ema2.emaArr[1].ema ? true : false;

        for (let i = 0; i < ema1.emaArr.length; i++) {
            let json = {};
            if (i > 1) {
                if (Math.abs(ema1.emaArr[i].ema - ema2.emaArr[i].ema) <= this.valve) {
                    if (direction) {
                        json.direction = '1dc2';
                        direction = !direction;
                    } else {
                        json.direction = '1uc2';
                        direction = !direction;
                    }
                    json.time = ema1.emaArr[i].time;
                    json.fmtTime = ema1.emaArr[i].fmtTime;
                    json.emaA = ema1.emaArr[i].ema;
                    json.emaB = ema2.emaArr[i].ema;
                    this.crossArr.push(json);
                }
            }
        }
        this.fun(this.crossArr);
    }
    findCross(ema1, ema2) {
        let itv1 = ema1.interval;
        let itv2 = ema2.interval;

        itv1 = this.convertInterval(itv1) * 60 * 1000;
        itv2 = this.convertInterval(itv2) * 60 * 1000;

        if (itv1 == itv2) {
            this.findEqual(ema1, ema2);
        } else {
            this.findNEqual(ema1, ema2);
        }

    }

    convertInterval(interval) {
        if (interval == "1d") { interval = 1440; }
        else if (interval == "1w") { interval = 12390; }
        else if (interval == "1m") { interval = 371700; }
        return interval;
    }
}

module.exports = Cross;

// new EMA({ coin: "btc-usdt", count: 383, n: 9, interval: "1d" }, function (ema1) {
//     new EMA({ coin: "btc-usdt", count: 383, n: 26, interval: "1d" }, function (ema2) {
//         let b = new Cross(ema1, ema2);
//     });
// });


// new EMA({coin:"btc-usdt", count: 383, n: 9, interval: "1d" },function(ema1){
//     let c= "";
//     for(let i of ema1.emaArr){
//         c += i.ema.toString() + "\r\n";
//     }
//     let fs = require("fs");
//     fs.writeFile("./1.txt",c,function(){});

// });
// new EMA({coin:"btc-usdt", count: 383, n: 26, interval: "1d" },function(ema2){
//     let a= "";
//     for(let j of ema2.emaArr){
//         a += j.ema.toString() + "\r\n";
//     }
//     let fs1 = require("fs");
//     fs1.writeFile("./2.txt",a,function(){});
// });