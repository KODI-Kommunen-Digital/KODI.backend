const express = require("express");
const router = express.Router();
const database = require("../utils/database");
const tables = require("../constants/tableNames");
const AppError = require("../utils/appError");
const crypto = require("crypto");
const authentication = require("../middlewares/authentication");
const sendCustomMail = require("../utils/sendCustomMail");

router.post("/", authentication, async (req, res, next) => {
    const payload = req.body;
    const language = payload.language || "de";
    const userId = req.userId;

    try {
        const { title, description } = payload;

        if (!title || !description || !req.files || !req.files.image) {
            return next(new AppError("All fields are mandatory", 400));
        }

        const imageFile = req.files.image;

        const imageHash = crypto
            .createHash("md5")
            .update(imageFile.data) // note: `data` instead of `buffer`
            .digest("hex");

        const defectReport = {
            userId,
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
        },recipients, subject, null, body, [
            {
                filename: `defect_image_${userId}.jpg`,
                content: imageFile.data, // Buffer
                contentType: imageFile.mimetype || "image/jpeg",
            },
        ]);

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
