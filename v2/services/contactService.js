const sendMail = require("../utils/sendMail");
const AppError = require("../utils/appError");

const contactService = async function (username, useremail, description, language) {
    try {
        const contactServiceEmail = require(`../emailTemplates/${language}/contactServiceEmail`);
        const { subject, body } = contactServiceEmail(username, useremail, description);

        const recipientEmail = process.env.OFFICIAL_EMAIL || "narendra.kumar@fiftyfivetech.io";

        await sendMail(recipientEmail, subject, null, body);
    } catch (err) {
        if (err instanceof AppError) throw err;
        throw new AppError(err);
    }
};

module.exports = {
    contactService,
};
