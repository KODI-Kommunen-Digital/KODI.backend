require('dotenv').config()
const AppError = require("../utils/appError");
const tokenUtil = require('../utils/token');

const optionalAuthentication = async function (req, res, next) {
    const bearerToken = req.headers.authorization;
    if (!bearerToken) {
        return next(new AppError(`Authorization token not present`, 401));
    }

    if (!bearerToken.startsWith('Bearer ')) {
        return next(new AppError(`Invalid authorization token`, 401));
    }

    const token = bearerToken.split(' ')[1]
    if (!token) {
        return next(new AppError(`Invalid authorization token`, 401));
    }
    
    try {
        const decodedToken = tokenUtil.verify(token, process.env.ACCESS_PUBLIC);
        req.userId = decodedToken.userId;
        req.roleId = decodedToken.roleId;
    }
    catch (error) {
        req.userId = null;
        req.roleId = null;
    }

    next();
};

module.exports = optionalAuthentication;