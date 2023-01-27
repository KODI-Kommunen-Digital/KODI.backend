let mysql = require('mysql');
const config = require('../config');
const connection = mysql.createConnection(config.db); 
connection.connect();
module.exports = connection;