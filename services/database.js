let mysql = require('mysql2/promise');
const config = require('../config');

async function get(table, params) {
  const connection = await mysql.createConnection(config.config.db); 
  connection.connect();
  let query = `SELECT * FROM ${table} `;
  let queryParams = [];
  if (params) {
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

async function getAll(table) {
  const connection = await mysql.createConnection(config.config.db); 
  connection.connect();
  let query = `SELECT * FROM ${table} `;
  //let queryParams = [];
  let [rows, fields] = await connection.query(query);
  connection.end();
  return {rows, fields};
}


async function create(table, data) {
  const connection = await mysql.createConnection(config.db); 
  connection.connect();
  let query = `INSERT INTO ${table} SET ?`;
  let response = await connection.query(query, data);
  connection.end();
  return { id: response[0].insertId };
}

async function update(table, data, conditions) {
  const connection = await mysql.createConnection(config.db); 
  connection.connect();
  let query = `UPDATE ${table} SET ? WHERE ?`;
  let response = await connection.query(query, [data, conditions]);
  connection.end();
}

async function deleteData(table, params) {
  const connection = await mysql.createConnection(config.db); 
  connection.connect();
  let query = `DELETE FROM ${table} `;
  let queryParams = [];
  if (params) {
    query += "WHERE "
    for (var key in params) {
      query += `${key} = ?,`
      queryParams.push(params[key])
    }
    query = query.slice(0, -1);
  }
  await connection.execute(query, queryParams);
  connection.end();
}

async function callStoredProcedure(spName, parameters) {
  let query = `CALL ${spName}`;
  if (parameters && parameters.length > 0) {
    query += `(${Array(parameters.length).fill('?')})`
  }
  const connection = await mysql.createConnection(config.db); 
  connection.connect();
  await connection.query(query, parameters);
  connection.end();
}


module.exports = {get, getAll, create, update,deleteData, callStoredProcedure};