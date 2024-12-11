const sendMail = require("../services/contactUs");
const AppError = require("../utils/appError");

const contactUs = async function (req, res, next) {
    const id = req.userId;
    const language = req.body.language || "de";
    const body = req.body.email;

    try {
        if (!body) {
            throw new AppError(`Message not present`, 400);
        }
        await sendMail.contactUs(id, language, body);
        return res.status(200).json({
            status: "success",
        });
    } catch (err) {
        return next(err);
    }
};

module.exports = {
    contactUs,
};
