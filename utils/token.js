const config = require('../config.js');
const jwt = require('jsonwebtoken');
const AppError = require("../utils/appError");


generator = function (payload) {
  const accessSecretKey = `-----BEGIN RSA PRIVATE KEY-----\n${config.authorization.access_private}\n-----END RSA PRIVATE KEY-----`;
  const refreshSecretKey = `-----BEGIN RSA PRIVATE KEY-----\n${config.authorization.refresh_private}\n-----END RSA PRIVATE KEY-----`;
  
  const accessToken = jwt.sign(payload, accessSecretKey, {
      expiresIn: config.authorization.authExpiration,
      algorithm:  "RS256"
    });

  const refreshToken = jwt.sign(payload, refreshSecretKey, {
    expiresIn: config.authorization.refreshExpiration,
    algorithm:  "RS256"
  });

  return { accessToken, refreshToken }
}

verify = function (token, publicKey) {
  var rsaPublickKey = `-----BEGIN PUBLIC KEY-----\n${publicKey}\n-----END PUBLIC KEY-----`;

  const decodedToken = jwt.verify(token, rsaPublickKey, {
      algorithms: ["RS256"]
  });
  
  return decodedToken
}

module.exports = { generator, verify };