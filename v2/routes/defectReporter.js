const express = require("express");
const router = express.Router();
const database = require("../utils/database");
const tables = require("../constants/tableNames");
const AppError = require("../utils/appError");
const crypto = require("crypto");
const sendCustomMail = require("../utils/sendCustomMail");

router.post("/", async (req, res, next) => {
    const payload = req.body;
    const language = payload.language || "de";

    try {
        const { title, description, email } = payload;

        // check if all mandatory fields are present, currently email and image are not included as mandatory
        if (!title || !description) {
            return next(new AppError("All fields are mandatory", 400));
        }

        let tag = email;
        if (!tag) {
            // if tag is null/undefined then assign current date time in YYYY-MM-DDTHH:MM:SS format.
            tag = new Date().toISOString().slice(0,-5);
        }

        const imageFile = req.files?.image;
        let imageHash = null;
        const attachments = [];

        if (imageFile) {
            imageHash = crypto
                .createHash("md5")
                .update(imageFile.data) // note: `data` instead of `buffer`
                .digest("hex");

            attachments.push({
                filename: `defect_image_${tag}.jpg`,
                content: imageFile.data, // Buffer
                contentType: imageFile.mimetype || "image/jpeg",
            });
        }

        const defectReport = {
            email,
            title,
            description,
            hashOfImage: imageHash,
        };

        let recipients = JSON.parse(process.env.DEFECT_REPORTING_EMAILS);
        const defectReportEmail = require(`../emailTemplates/${language}/defectReportEmail`);
        const { subject, body } = defectReportEmail(title, description);
        recipients = recipients.join(",");

        await sendCustomMail({
            email: process.env.DEFECT_REPORTER_SENDER_EMAIL,
            pass: process.env.DEFECT_REPORTER_SENDER_PASSWORD,
        }, recipients, subject, null, body, attachments);

        const response = await database.create(tables.DEFECT_REPORTS, defectReport);

        res.status(200).json({
            message: "Defect report submitted successfully",
            reportId: response.id,
        });
    } catch (err) {
        return next(new AppError("Error submitting defect report: " + err, 500));
    }
});


module.exports = router;
