const { response } = require('express');
const database = require('../services/database');
const AppError = require("../utils/appError");
const tables = require('../constants/tableNames');


const radiusSearch= (latitude,longitude, radius)=> {
  const R = 6371; // Radius of the earth in km
  const points = [];
  database.getAll(tables.LISTINGS_TABLE).then((response)=>{
    const data = response.rows
    for (let i = 0; i < data.length; i++) {
        const dLat = toRad(data[i].lattitude - latitude);
        const dLon = toRad(data[i].longitude - longitude);
        //console.log(dLat)
        const a =
          Math.sin(dLat / 2) * Math.sin(dLat / 2) +
          Math.cos(toRad(latitude)) *
            Math.cos(toRad(data[i].latitude)) *
            Math.sin(dLon / 2) *
            Math.sin(dLon / 2);
    
        const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
        const distance = R * c;
    
        if (distance <= radius) {
          points.push(data[i])
        }
      }
  })
   console.log(points)
  return points;
}
function toRad(value) {
  return (value * Math.PI) / 180;
}

module.exports = radiusSearch;