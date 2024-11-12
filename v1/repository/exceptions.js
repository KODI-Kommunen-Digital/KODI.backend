const database = require("../utils/database");
const tables = require("../constants/tableNames");

const addException = async (message, stackTrace, occuredAt) => {
    await database.create(tables.EXCEPTIONS_TABLE, {
        message,
        stackTrace,
        occuredAt,
    });
};

module.exports = {
    addException,
};
