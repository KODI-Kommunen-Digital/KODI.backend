const { response } = require('express');
const database = require('../services/database');
const AppError = require("../utils/appError");
const tables = require('../constants/tableNames');


async function radiusSearch(lat0, lon0, D, cityId) {
  const connection = await getConnection(cityId);
  connection.connect();
  const query = `SELECT * FROM Data WHERE 6371 * 2 * ASIN(SQRT(POWER(SIN((? - abs(latitude)) * pi()/180 / 2), 2) + COS(?) * COS(abs(latitude) * pi()/180) * POWER(SIN((? - longitude) * pi()/180 / 2), 2))) <= ?`;
  const queryParams = [lat0, lat0 * Math.PI/180, lon0, D];
  const [rows, fields] = await connection.execute(query, queryParams);
  connection.end();
  return {rows, fields};
}

module.exports = radiusSearch;



// SELECT *
// FROM Data
// WHERE 6371 * 2 * ASIN(SQRT(POWER(SIN((lat0 - abs(latitude)) * pi()/180 / 2), 2) + COS(lat0 * pi()/180) * COS(abs(latitude) * pi()/180) * POWER(SIN((lon0 - longitude) * pi()/180 / 2), 2))) <= D;


//This is to test the github migration