const cityService = require("../services/cities");

const getCities = async function (req, res, next) {
    let hasForum = false;
    if (req.query.hasForum) {
        hasForum = true;
    }
    try {
        const data = await cityService.getCities(hasForum);
        res.status(200).json({
            status: "success",
            data,
        });
    } catch (err) {
        return next(err);
    }
};

module.exports = {
    getCities,
};
