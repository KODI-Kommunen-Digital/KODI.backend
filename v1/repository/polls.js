const database = require("../utils/database");
const tables = require("../constants/tableNames");

const getPollOptions = async function (listingId, cityId) {
    const response = await database.get(
        tables.POLL_OPTIONS_TABLE,
        { listingId },
        null,
        cityId,
    );
    if (!response || !response.rows || response.rows.length === 0) {
        return null;
    }
    return response.rows;
};

const updatePollOptionVotes = async function (pollOptionId, votes, cityId) {
    await database.update(
        tables.POLL_OPTIONS_TABLE,
        { votes },
        { id: pollOptionId },
        cityId,
    );
};

module.exports = {
    getPollOptions,
    updatePollOptionVotes,
};
