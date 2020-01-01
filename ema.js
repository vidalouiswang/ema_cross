let Tools = require("./tools");
class EMA {
    constructor(json,fun) {
        this.baseURL = "https://www.btmx.com/api/r/v1/barhist?symbol=$coin$&interval=$interval$&from=$from$&to=$to$";
        //process.env.NODE_TLS_REJECT_UNAUTHORIZED = "0";
        this.error = undefined;
        this.count = parseInt(json.count);
        this.alpha = 2 / (json.n + 1);
        this.N = parseInt(json.n);
        this.interval = json.interval;
        this.coin = json.coin;
        this.coin = this.coin.toUpperCase();
        this.emaTmp = 0.0;
        this.factor = 10000;
        this.srcCode = "";
        this.fun = fun;
        this.millis = 0;
        this.srcArr = [];
        this.emaArr = [];
        this.options = {
            method: 'GET',
            url: '',
            rejectUnauthorized: false,
            headers: {
                'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/62.0.3202.89 Safari/537.36'
            }
        };
        this.fillURL();
    }
    getSrc() {
        let https = require('https');
        let t = this;
        https.get(this.baseURL, this.options, function (res) {
            var html = '';
            res.on('data', function (data) {
                html += data;
            });

            res.on('end', function () {
                t.srcCode = html;
                t.parseData();
            });

            res.on('error', function(){
                this.error = true;
                return undefined;
            });
        }).on('error', function () {
            this.error = true;
            return undefined;
        });
    }

    fillURL() {
        let timeStamp = "";
        let me = this;
        Tools.getSrc("http://api.m.taobao.com/rest/api3.do?api=mtop.common.getTimestamp",this.options,function(src){
            timeStamp = JSON.parse(src)['data']['t']; 

            let from = parseInt(timeStamp);
            let to = from;
            me.millis = to;
            let t = 0;

            //特殊interval转分钟
            if (me.interval == "1d") {t = 1440;} 
            else if (me.interval == "1w") {t = 12390;} 
            else if (me.interval == "1m") {t = 371700;} 
            else {t = me.interval;}

            t *= 60; //分钟转秒
            t *= 1000; //秒转毫秒
            t *= me.count; //毫秒 * 数量

            from = to - t; //得到开始时间

            //做链接
            me.baseURL = me.baseURL.replace(/\$interval\$/, me.interval);
            me.baseURL = me.baseURL.replace(/\$from\$/, from);
            me.baseURL = me.baseURL.replace(/\$to\$/, to);
            me.baseURL = me.baseURL.replace(/\$coin\$/, me.coin);
            me.options.url = me.baseURL;
            //let aaaaa = "https://www.btmx.com/api/r/v1/barhist?symbol=BTC-USDT&interval=1&from=1577575906000&to=1577598466000";
            //me.baseURL = aaaaa;
            //me.options.url = aaaaa;
            me.getSrc();
        });
    }
    calcEMA() {
        for (let item of this.srcArr) {
            let json = {};
            if (this.emaArr.length == 0) {
                json.ema = item.close;
            } else {
                json.ema = this.cema(item);
            }
            json.time = item.time;
            json.fmtTime = Tools.Millis2Time(item.time);
            this.emaArr.push(json);
        }

        if(this.fun){
            this.fun(this);
        }        
    }

    cema(item){
        //return Math.round((this.alpha * item.close + (1 - this.alpha) * (this.emaArr[this.emaArr.length - 1]).ema) * this.factor) / this.factor; 
        // this.emaTmp = this.alpha * item.close + (1 - this.alpha) * (this.emaArr[this.emaArr.length - 1]).ema;
        let alpha = 2 / (this.N + 1 );
        let beta = (this.N - 1) / (this.N + 1);
        this.emaTmp = alpha * item.close  + beta * (this.emaArr[this.emaArr.length - 1]).ema;
        return Math.round(this.emaTmp * this.factor) / this.factor; 
    }
    parseData() {
        if(this.srcCode){
            let obj = JSON.parse(this.srcCode);
            for (let item of obj.data) {
                let json = {};
                json.time = item['t'];
                json.close = parseFloat(item['c']);
                this.srcArr.push(json);
            }
            this.calcEMA();
        }else{
            this.error = true;
        }
    }
}
module.exports = EMA;


