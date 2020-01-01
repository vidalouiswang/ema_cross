class MailgunSender {
    constructor(apiKey) {
        let Mailgun = require("mailgun").Mailgun;
        this.mg = new Mailgun(apiKey);
        this.error = undefined;
    }

    Send({ from, toArr, subject = 'subject', content }) {
        if (!(from && toArr && content)) {
            this.error = true;
            throw new Error("Arguments missing. in Send() of Class MaingunSender");
        }
        if (typeof (from) != "string") {
            this.error = true;
            throw new Error("Arguments [from] has to be a string. in Send() of Class MaingunSender");
        }
        if (typeof (subject) != "string") {
            this.error = true;
            throw new Error("Arguments [subject] has to be a string. in Send() of Class MaingunSender");
        }
        if (typeof (content) != "string") {
            this.error = true;
            throw new Error("Arguments [content] has to be a string. in Send() of Class MaingunSender");
        }
        if (typeof (toArr) != typeof ([''])) {
            this.error = true;
            throw new Error("Arguments [toArr] has to be an array. in Send() of Class MaingunSender");
        }

        try {
            this.mg.sendText(from, this.turnArr2String(toArr),
            subject,
            content);
        } catch (err) {
            throw err;
        }
    }
    turnArr2String(arr) {
        let str = "";
        for (let i of arr) {
            str += i + ", ";
        }
        return str.substr(0, str.length - 2);
    }
}




module.exports = MailgunSender;