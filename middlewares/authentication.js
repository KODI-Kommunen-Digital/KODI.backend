const jwtmod = require('jsonwebtoken');
const config = require('../config');
const AppError = require("../utils/appError");

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
    var publicKey = `-----BEGIN PUBLIC KEY-----\n${config.keycloak.rsaPublicKey}\n-----END PUBLIC KEY-----`
    
    try{
        const decodedToken = jwtmod.verify(token, publicKey, {
            algorithms: ["RS256"]
        })
    
        req.userId = decodedToken.userId;
    }
    catch (error) {
        return next(new AppError(`Invalid authorization token: ${error.message}`, 401));
    }

    next();
};

module.exports = authentication;