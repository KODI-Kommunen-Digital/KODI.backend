const uncaughtException = require(`../emailTemplates/uncaughtException`);
const sendMail = require('../services/sendMail');
const database = require('../services/database');
const tables = require('../constants/tableNames');
const axios = require("axios");

module.exports = (err, req, res, next) => {
    err.statusCode = err.statusCode || 500;
    err.status = err.status || "error";
    if (err.statusCode == 500) {
        var occuredAt = new Date()
        database.create(tables.EXCEPTIONS_TABLE, { message:err.message, stackTrace:err.stack, occuredAt: occuredAt.toISOString().slice(0, 19).replace('T', ' ') })
        if (process.env.ENVIRONMENT == 'production') {
            var content = uncaughtException(err.message, err.stack, occuredAt.toUTCString())
			axios.post(process.env.WEBHOOK, content)
        }
    }
    res.status(err.statusCode).json({
        status: err.status,
        message: err.message,
    });
};