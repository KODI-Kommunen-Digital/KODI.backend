let mysql = require('mysql2/promise');
const config = require('../config');
const tables = require('../constants/tableNames');

// In all these functions, if cityId is given, we connect to that city's database. Else, we connect to the core database
async function get(table, params, columns, cityId) {
  const connection = await getConnection(cityId); 
  connection.connect();
  let query = `SELECT ${columns ? columns : "*"} FROM ${table} `;
  let queryParams = [];
  if (params) {
    query += "WHERE "
    for (var key in params) {
      query += `${key} = ? AND `
      queryParams.push(params[key])
    }
    query = query.slice(0, -4);
  }
  let [rows, fields] = await connection.execute(query, queryParams);
  connection.end();
  return {rows, fields};
}

async function create(table, data, cityId) {
  const connection = await getConnection(cityId); 
  connection.connect();
  let query = `INSERT INTO ${table} SET ?`;
  let response = await connection.query(query, data);
  connection.end();
  return { id: response[0].insertId };
}

async function update(table, data, conditions, cityId) {
  const connection = await getConnection(cityId); 
  connection.connect();
  let query = `UPDATE ${table} SET ? WHERE ?`;
  let response = await connection.query(query, [data, conditions]);
  connection.end();
}

async function deleteData(table, params, cityId) {
  const connection = await getConnection(cityId);  
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

async function getConnection(cityId) {
  const coreConnection = await mysql.createConnection(config.db); 
  if (!cityId)
    return coreConnection;
  var response = await get(tables.CITIES_TABLE, {id: cityId});
  var cityConnectionString = response.rows[0].connectionString;
  var cityConnectionConfig = {};
  cityConnectionString.split(";").forEach(element => {
    var elementList = element.split("=")
    cityConnectionConfig[elementList[0]] = elementList[1]
  });
  cityConnectionConfig["host"] = cityConnectionConfig["server"]
  delete cityConnectionConfig.server
  coreConnection.end();
  const cityConnection = await mysql.createConnection(cityConnectionConfig); 
  return cityConnection;
}


module.exports = {get, create, update,deleteData, callStoredProcedure};