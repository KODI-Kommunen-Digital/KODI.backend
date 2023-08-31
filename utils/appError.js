class AppError extends Error {
    constructor(errorData, statusCode) {
        super(errorData.message);

        this.statusCode = statusCode || 500;
        this.errorCode = errorData.errorCode;
        this.error = `${statusCode}`.startsWith('4') ? 'fail' : 'error';
        this.isOperational = true;

        Error.captureStackTrace(this, this.constructor);
    }
}
module.exports = AppError;