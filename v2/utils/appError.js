class AppError extends Error {
    constructor(msg, statusCode, errorCode, data) {
        super(msg);
        this.statusCode = statusCode || 500;
        this.errorCode = errorCode;
        this.error = `${statusCode}`.startsWith("4") ? "fail" : "error";
        this.isOperational = true;
        this.data = data

        Error.captureStackTrace(this, this.constructor);
    }
}
module.exports = AppError;
