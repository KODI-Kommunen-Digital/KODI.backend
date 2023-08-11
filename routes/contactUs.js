const express = require("express");
const router = express.Router();
const sendMail = require("../services/sendMail");
const database = require("../services/database");
const AppError = require("../utils/appError");
const tables = require("../constants/tableNames");
const authentication = require("../middlewares/authentication");

router.post("/",authentication, async function (req, res, next) {
    const username = req.body.username;
    const id = req.userId;
    const language = req.body.language || "de";
    const token = req.body.token;    
    const email = req.body.email;

    if (!token) {
        return next(new AppError(`Token not present`, 400));
    }

    if (!email) {
        return next(new AppError(`Message not present`, 400));
    }

    if (language !== "en" && language !== "de") {
        return next(new AppError(`Incorrect language given`, 400));
    }

    try {
        const response = await database.get(tables.USER_TABLE, { id });
        const data = response.rows;
        if (data && data.length === 0) {
            return next(
                new AppError(`Username ${username} does not exist`, 404)
            );
        }
        const user = data[0];
        const contactUsEmail = require(`../emailTemplates/${language}/contactUsEmail`);
        const { subject } = contactUsEmail(
            user.firstname,
            user.lastname,
            user.email
        );
        await sendMail('info@heidi-app.de', subject, email, null);
        return res.status(200).json({
            status: "success",
        });
    } catch (err) {
        return next(new AppError(err));
    }
}

)
module.exports = router;
