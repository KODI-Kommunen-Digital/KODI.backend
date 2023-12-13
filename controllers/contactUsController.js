const sendMail = require("../services/sendMail");
const AppError = require("../utils/appError");
const { getUserById } = require("../services/users");

const contactUs = async function (req, res, next) {
    const id = req.userId;
    const language = req.body.language || "de";
    const body = req.body.email;

    if (!body) {
        return next(new AppError(`Message not present`, 400));
    }

    try {
        const user = await getUserById(id);
        if (!user) {
            return next(new AppError(`UserID ${id} does not exist`, 404));
        }
        const contactUsEmail = require(`../emailTemplates/${language}/contactUsEmail`);
        const { subject } = contactUsEmail(
            user.firstname,
            user.lastname,
            user.email
        );

        await sendMail('info@heidi-app.de', subject, body, null);
        return res.status(200).json({
            status: "success"
        });
    } catch (err) {
        return next(new AppError(err));
    }
}

module.exports = {
    contactUs,
}