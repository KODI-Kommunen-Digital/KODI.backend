const sendMail = require("../utils/sendMail");
const AppError = require("../utils/appError");
const { getUserById } = require("../repository/users");

const contactUs = async function (id, language, body) {

    if (!body) {
        throw new AppError(`Message not present`, 400);
    }

    try {
        const user = await getUserById(id);
        if (!user) {
            throw new AppError(`UserID ${id} does not exist`, 404);
        }
        const contactUsEmail = require(`../emailTemplates/${language}/contactUsEmail`);
        const { subject } = contactUsEmail(
            user.firstname,
            user.lastname,
            user.email
        );
        await sendMail('info@heidi-app.de', subject, body, null);
    } catch (err) {
        if (err instanceof AppError) throw err;
        throw new AppError(err);
    }
}

module.exports = {
    contactUs,
}