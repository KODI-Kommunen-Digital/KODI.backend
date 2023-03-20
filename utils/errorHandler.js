const uncaughtException = require(`../emailTemplates/uncaughtException`);
const sendMail = require('../services/sendMail');
const database = require('../services/database');
const tables = require('../constants/tableNames');

module.exports = (err, req, res, next) => {
    err.statusCode = err.statusCode || 500;
    err.status = err.status || "error";
    if (err.statusCode == 500) {
        var occuredAt = new Date()
        database.create(tables.EXCEPTIONS_TABLE, { message:err.message, stackTrace:err.stack, occuredAt: occuredAt.toISOString().slice(0, 19).replace('T', ' ') })
        if (process.env.ENVIRONMENT == 'production') {
            var {subject, body} = uncaughtException(err.message, err.stack, occuredAt.toUTCString())
            sendMail(process.env.EMAIL_ID, subject, null, body)
        }
    }
    res.status(err.statusCode).json({
        status: err.status,
        message: err.message,
    });
};