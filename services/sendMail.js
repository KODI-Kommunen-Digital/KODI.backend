const nodemailer = require('nodemailer');

function createTransporter(context) {
    let emailId, emailPassword;
    
    switch (context) {
    case 'welcome':
        emailId = process.env.WILKOMMEN_EMAIL_ID;
        emailPassword = process.env.WILKOMMEN_EMAIL_PASSWORD;
        console.log("its in wilkomen")
        break;
    case 'defect-report':
        emailId = process.env.DEFECTREPORT_EMAIL_ID;
        emailPassword = process.env.DEFECTREPORT_EMAIL_PASSWORD;
        console.log("its in defect")
        break;
    // Add more cases
    default:
        throw new Error('Invalid email context provided.');
    }

    return nodemailer.createTransport({
        host: process.env.EMAIL_HOST, 
        port: process.env.EMAIL_PORT ,
        auth: {
            user: emailId,
            pass: emailPassword
        }
    });
}

async function sendMail(context = 'welcome', to, subject, text, html, attachments = []) {
    const transporter = createTransporter(context);

    const mailOptions = {
        from: transporter.options.auth.user,
        to,
        subject
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
    return transporter.sendMail(mailOptions);
}

module.exports = sendMail