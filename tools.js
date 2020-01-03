let ut = require('./unit-test');

(function unitTest() {
    ut.isEqual("Millis2Time", "2020/01/01 17:08:18", Millis2Time(new Date(1577869698070).getTime()));

})();


function GetTimeStampFromTaobao(callback) {
    getSrc("http://api.m.taobao.com/rest/api3.do?api=mtop.common.getTimestamp", this.options, function (src) {
        timeStamp = JSON.parse(src)['data']['t'];
        callback(timeStamp);
    });
}


function Millis2Time(millis) {
    let obj = new Date(millis);

    let year = obj.getFullYear();
    let month = (obj.getMonth() + 1).toString();
    let day = obj.getDate().toString();
    let hour = obj.getHours().toString();
    let min = obj.getMinutes().toString();
    let sec = obj.getSeconds().toString();

    month = month.length == 1 ? "0" + month : month;
    day = day.length == 1 ? "0" + day : day;
    hour = hour.length == 1 ? "0" + hour : hour;
    min = min.length == 1 ? "0" + min : min;
    sec = sec.length == 1 ? "0" + sec : sec;

    return (year + "/" + month + "/" + day + " " + hour + ":" + min + ":" + sec).toString();
};

function getSrc(url, options, fun) {
    let obj;
    options.url = url;
    if (url.indexOf("https") == 0) {
        obj = require('https');
    } else {
        obj = require('http');
    }

    obj.get(url, options, function (res) {
        var html = '';
        res.on('data', function (data) {
            html += data;
        });

        res.on('end', function () {
            fun(html);
        });

        res.on('error', function () {
            fun(undefined);
        });
    }).on('error', function () {
        fun(undefined);
    });
};

module.exports = {
    Millis2Time,
    getSrc,
    GetTimeStampFromTaobao
}