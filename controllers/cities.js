const cityService = require("../services/cities");

const getCities = async function (req, res, next) {
    const filter = {};
    if (req.query.hasForum) {
        filter.hasForum = true;
    }
    try {
        const data = await cityService.getCities(filter);
        res.status(200).json({
            status: "success",
            data,
        });
    } catch (err) {
        return next(err);
    }
}

module.exports = {
    getCities,
}