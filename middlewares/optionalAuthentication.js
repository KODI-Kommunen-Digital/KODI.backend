require('dotenv').config()
const tokenUtil = require('../utils/token');

const optionalAuthentication = async function (req, res, next) {
    const bearerToken = req.headers.authorization;
    if (!bearerToken) {
        next();
    }

    if (!bearerToken.startsWith('Bearer ')) {
        next();
    }

    const token = bearerToken.split(' ')[1]
    if (!token) {
        next();
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