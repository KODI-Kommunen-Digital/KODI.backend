const jwtmod = require('jsonwebtoken');
const config = require('../config');
const AppError = require("../utils/appError");
const tokenUtil = require('../utils/token');

var authentication = async function (req, res, next) {
    const bearerToken = req.headers['authorization'];
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
        const decodedToken = tokenUtil.verify(token, config.authorization.access_public);
        req.userId = decodedToken.userId;
        req.roleId = decodedToken.roleId;
    }
    catch (error) {
        if (error.name == 'TokenExpiredError') {
            return next(new AppError(`Unauthorized! Token was expired!`, 401));
        }
        return next(new AppError(error.message, 401));
    }

    next();
};

module.exports = authentication;