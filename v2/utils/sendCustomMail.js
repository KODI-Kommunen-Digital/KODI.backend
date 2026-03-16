const nodemailer = require("nodemailer");

const transporterMap = {};


async function sendCustomMail(config, to, subject, text, html, attachments = []) {
    const mailOptions = {
        from: config.email || process.env.EMAIL_ID,
        to,
        subject,
    };
    if (text) {
        mailOptions.text = text;
    }
    if (html) {
        mailOptions.html = html;
    }
    if (attachments.length > 0) {
        mailOptions.attachments = attachments;
    }
    const transporter = transporterMap[config.email] || nodemailer.createTransport({
        host: config.host || process.env.EMAIL_HOST,
        path: config.path || process.env.EMAIL_PATH,
        auth: {
            user: config.email || process.env.EMAIL_ID,
            pass: config.pass || process.env.EMAIL_PASSWORD,
        },
    });
    transporterMap[config.email] = transporter;
    const res = await transporter.sendMail(mailOptions);
    return res;
}


module.exports = sendCustomMail;