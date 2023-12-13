
const database = require("../services/database");
const tables = require("../constants/tableNames");

const getStatuses = async function (){
    const response = await database.get(tables.STATUS_TABLE)
    if(!response|| !response.rows || response.rows.length === 0){
        return [];
    }
    return response.rows;
}

module.exports = {
    getStatuses,
};