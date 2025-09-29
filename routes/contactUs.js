const express = require("express");
const router = express.Router();
const sendMail = require("../services/sendMail");
const AppError = require("../utils/appError");


router.post("/", async function (req, res, next) {
    const language = req.body.language || "de";
    const body = req.body.enquiery;
    const {firstname, lastname, email} = req.body;

    // Validate mandatory fields
    if (!firstname || firstname.trim() === "") {
        return next(new AppError(`First name is required`, 400));
    }
    
    // if (!lastname || lastname.trim() === "") {
    //     return next(new AppError(`Last name is required`, 400));
    // }
    
    if (!email || email.trim() === "") {
        return next(new AppError(`Email is required`, 400));
    }
    
    // Basic email format validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
        return next(new AppError(`Please provide a valid email address`, 400));
    }

    if (!body) {
        return next(new AppError(`Message not present`, 400));
    }

    try {
       
        const contactUsEmail = require(`../emailTemplates/${language}/contactUsEmail`);
        const { subject } = contactUsEmail(
            firstname ,
            lastname ,
            email
        );
        const contactEmail = process.env.CONTACT_EMAIL || 'info@heidi-app.de';
        await sendMail(contactEmail, subject, body, null);
        return res.status(200).json({
            status: "success",
        });
    } catch (err) {
        return next(new AppError(err));
    }
});

module.exports = router;
