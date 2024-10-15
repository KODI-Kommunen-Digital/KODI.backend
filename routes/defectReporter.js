const express = require("express");
const router = express.Router();
const database = require("../services/database");
const tables = require("../constants/tableNames");
const AppError = require("../utils/appError");
const sendMail = require("../services/sendMail");
const multer = require('multer');
const crypto = require('crypto');
const authentication = require("../middlewares/authentication");

const upload = multer({ 
    storage: multer.memoryStorage(),
    limits: { fileSize: 20 * 1024 * 1024, fields: 3 }, // Limit image size to 20MB
});

let defectReport = {};

router.post('/', authentication, upload.single('image'), async function(req, res, next) {
    const payload = req.body;
    const userId = req.userId;
    try {
        const {title, description } = payload;
        if (!title || !description || !req.file){
            return next(new AppError("All fields are mandatory" , 400));
        }

        const imageHash = crypto.createHash('md5').update(req.file.buffer).digest('hex');

        defectReport = {
            userId,
            title,
            description,
            hashOfImage: imageHash,
        };
        const recipients = JSON.parse(process.env.DEFECT_REPORTING_EMAILS);
        const subject = `Neuer Fehlerbericht: ${title}`;
        const htmlContent = `
            <h3>Fehlerbericht</h3>
            <p><strong>Titel:</strong> ${title}</p>
            <p><strong>Beschreibung:</strong> ${description}</p>
            <p>Weitere Einzelheiten finden Sie im beigefügten Bild.</p>
        `;
        await sendMail(
            recipients.join(','), 
            subject,
            null, 
            htmlContent,
            [
                {
                    filename: `defect_image_${userId}.jpg`,
                    content: req.file.buffer, 
                    contentType: 'image/jpeg', 
                }
            ]
        );
        const response = await database.create(tables.DEFECT_REPORTS, defectReport);

        res.status(200).json({
            message: 'Defect report submitted successfully',
            reportId: response.id 
        });
    } catch (err) {
        return next(new AppError("Error submitting defect report:" + err , 500));
    }
});

module.exports = router;