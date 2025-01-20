const sendMail = require("../utils/sendMail");
const AppError = require("../utils/appError");
// const { getUserById } = require("../repository/users");
const usersRepository = require("../repository/userRepo");

const contactUs = async function (id, language, body) {
    try {
        // const user = await getUserById(id);
        const user = await usersRepository.getOne({
            filters: [
                {
                    key: 'id',
                    sign: '=',
                    value: id
                }
            ]
        })
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
        if(JSON.parse(process.env.CONTACT_EMAIL) && JSON.parse(process.env.CONTACT_EMAIL).length && JSON.parse(process.env.CONTACT_EMAIL).length > 0) {
            JSON.parse(process.env.CONTACT_EMAIL).map(async (email) => await sendMail(email, subject, body, null))
        } else {
            const contactEmail = process.env.CONTACT_EMAIL || "info@heidi-app.de";
            await sendMail(contactEmail, subject, body, null);
        }
    } catch (err) {
        if (err instanceof AppError) throw err;
        throw new AppError(err);
    }
};

module.exports = {
    contactUs,
};
