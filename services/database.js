let mysql = require('mysql2/promise');
const config = require('../config');


async function get(table, params) {
  const connection = await mysql.createConnection(config.db); 
  connection.connect();
  let query = `SELECT * FROM ${table} `;
  let queryParams = [];
  if (params) 
  {
    query += "WHERE "
    for (var key in params) {
      query += `${key} = ?,`
      queryParams.push(params[key])
    }
    query = query.slice(0, -1);
  }
  let [rows, fields] = await connection.execute(query, queryParams);
  connection.end();
  return {rows, fields};
}


async function create(table, data) {
  const connection = mysql.createConnection(config.db); 
  connection.connect();
  let query = `SELECT * FROM ${table} `;
}


module.exports = {get, create};