const express = require("express");
const router = express.Router();
const sendMail = require("../services/sendMail");
const database = require("../services/database");
const AppError = require("../utils/appError");
const tables = require("../constants/tableNames");
const authentication = require("../middlewares/authentication");

router.post("/",authentication, async function (req, res, next) {
    const id = req.userId;
    const language = req.body.language || "de";
    const body = req.body.email;

    if (!body) {
        return next(new AppError(`Message not present`, 400));
    }

    try {
        const response = await database.get(tables.USER_TABLE, { id });
        const data = response.rows;
        if (data && data.length === 0) {
            return next(
                new AppError(`UserID ${id} does not exist`, 404)
            );
        }
        const user = data[0];
        const contactUsEmail = require(`../emailTemplates/${language}/contactUsEmail`);
        const { subject } = contactUsEmail(
            user.firstname,
            user.lastname,
            user.email
        );
        const contactEmail = process.env.CONTACT_EMAIL || 'info@heidi-app.de';
        await sendMail('welcome', contactEmail, subject, body, null);
        return res.status(200).json({
            status: "success",
        });
    } catch (err) {
        return next(new AppError(err));
    }
}

)
module.exports = router;
