const sendMail = require("../services/contactService");
const AppError = require("../utils/appError");

const contactService = async function (req, res, next) {
    const { username, useremail, description, language = "de" } = req.body;

    try {
        // Validate required fields
        if (!username || !useremail || !description) {
            throw new AppError(
                "Missing required fields: username, useremail, and description are required",
                400
            );
        }

        // Basic email validation
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!emailRegex.test(useremail)) {
            throw new AppError("Invalid email format", 400);
        }

        // Send email
        await sendMail.contactService(username, useremail, description, language);

        return res.status(200).json({
            status: "success",
            message: "Contact service request sent successfully",
        });
    } catch (err) {
        return next(err);
    }
};

module.exports = {
    contactService,
};
