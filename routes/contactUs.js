const express = require("express");
const router = express.Router();
const sendMail = require("../services/sendMail");
const AppError = require("../utils/appError");
const optionalAuthentication = require("../middlewares/optionalAuthentication");
const tables = require("../constants/tableNames");
const database = require("../services/database");

router.post("/", optionalAuthentication, async function (req, res, next) {
    const language = req.body.language || "de";
    const body = req.body.enquiery;
    const id = 2;

    const { firstname, lastname, email, phoneNumber, key = 'feedback' } = req.body;

    // Validate mandatory fields for contactUS
    if (key === 'contactUs') {
        if (!firstname || firstname.trim() === "") {
            return next(new AppError(`First name is required`, 400));
        }

        if (!lastname || lastname.trim() === "") {
            return next(new AppError(`Last name is required`, 400));
        }

        if (!email || email.trim() === "") {
            return next(new AppError(`Email is required`, 400));
        }

        // Basic email format validation
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!emailRegex.test(email)) {
            return next(new AppError(`Please provide a valid email address`, 400));
        }

        if (!phoneNumber || phoneNumber.trim() === "") {
            return next(new AppError(`Phone number is required`, 400));
        } else {
            const re = /^\(?([0-9]{3})\)?[-. ]?([0-9]{3})[-. ]?([0-9]{4})$/;
            if (!re.test(phoneNumber)) {
                return next(new AppError("Phone number is not valid", 400));
            }
        }
    }

    if (!body) {
        return next(new AppError(`Message not present`, 400));
    }

    try {
        let userFirstname, userLastname, userEmail, userPhoneNumber;

        if (key === 'contactUs') {
            // Use data from payload
            userFirstname = firstname;
            userLastname = lastname;
            userEmail = email;
            userPhoneNumber = phoneNumber;
        } else {
            // Get data from database
            if (!id) {
                return next(new AppError(`User ID is required when key is not contactUs`, 400));
            }
            
            const response = await database.get(tables.USER_TABLE, { id });
            const data = response.rows;
            if (data && data.length === 0) {
                return next(new AppError(`UserID ${id} does not exist`, 404));
            }
            
            const user = data[0];
            userFirstname = user.firstname;
            userLastname = user.lastname;
            userEmail = user.email;
            userPhoneNumber = null; // Don't include phone number when not contactUS
        }

        const contactUsEmail = require(`../emailTemplates/${language}/contactUsEmail`);
        const { subject } = contactUsEmail(
            userFirstname,
            userLastname,
            userEmail,
            userPhoneNumber
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
