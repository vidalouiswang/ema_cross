var EMA = require("./ema");
var http = require('http');
var url = require("url");
var Cross = require('./cross');
var lastEmaA = 0, lastEmaB = 0;

// function getEMA(Coin, Interval, N, Count, res) {
//     if (Coin && Interval && N && Count && res) {
//         new EMA({ coin: Coin, count: Count, n: N, interval: Interval.toString() }, function (emas) {
//             let s = "";
//             for (let i of emas) {
//                 s = s + "<p>" + i.fmtTime.toString() + " = " + i.ema.toString() + "</p>";
//             }
//             res.end(s);
//         });
//     } else {
//         res.end("参数有误");
//     }

// };
function getCross(Coin, Interval, N1, N2, Count, res) {
        new EMA({ coin: Coin, count: Count, n: N1, interval: Interval }, function (ema1) {
            new EMA({ coin: Coin, count: Count, n: N2, interval: Interval }, function (ema2) {
            new Cross(ema1, ema2, 5, function (cro) {
                let out = "",k = 1;
                for (let i of cro.crossArr) {
                    out += "<p>" + "交点" + (k++).toString() + ": " + ", EMA" + ema1.N.toString() + ": " + i.emaA.toString() + ", EMA" + ema2.N.toString() +
                     ": " + i.emaB.toString() + ", 时间: " + i.fmtTime + "</p>";
                }
                res.end(out);
            });
        });
    });
};

// function getCross(Coin, Interval, N1, N2, Count) {
//     new EMA({ coin: Coin, count: Count, n: N1, interval: Interval }, function (ema1) {
//         new EMA({ coin: Coin, count: Count, n: N2, interval: Interval }, function (ema2) {
//             new Cross(ema1, ema2, 0, function (cro) {
//                 let lastOne = cro[cro.legth - 1];
//                 if (lastEmaA != lastOne.emaA || lastEmaB != lastOne.emaB) {
//                     lastEmaA = lastone.emaA;
//                     lastEmaB = lastone.emaB;
//                     notify();
//                 }
//             });
//         });
//     });
// };



let server = http.createServer(function (req, res) {
    res.writeHead(200, { "Content-type": "text/html;charset=UTF-8" });
    let query = url.parse(req.url, true).query;
    if (req.url.indexOf("ema") >= 0) {
        getEMA(query.coin, query.interval, query.n, query.count, res);
    } else if (req.url.indexOf("cross") >= 0) {
        getCross(query.coin, query.interval, query.n1, query.n2, query.count, res);
    }
});

server.listen(10000, "127.0.0.1");