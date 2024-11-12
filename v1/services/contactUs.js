const sendMail = require("../utils/sendMail");
const AppError = require("../utils/appError");
const { getUserById } = require("../repository/users");

const contactUs = async function (id, language, body) {
    try {
        const user = await getUserById(id);
        if (!user) {
            throw new AppError(`UserID ${id} does not exist`, 404);
        }
        const contactUsEmail = require(
            `../emailTemplates/${language}/contactUsEmail`,
        );
        const { subject } = contactUsEmail(
            user.firstname,
            user.lastname,
            user.email,
        );
        const contactEmail = process.env.CONTACT_EMAIL || "info@heidi-app.de";
        await sendMail(contactEmail, subject, body, null);
    } catch (err) {
        if (err instanceof AppError) throw err;
        throw new AppError(err);
    }
};

module.exports = {
    contactUs,
};
