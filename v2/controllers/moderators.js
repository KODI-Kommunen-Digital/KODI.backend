const moderatorsService = require("../services/moderators");

const createModerators = async function (req, res, next) {
    try {
        const data = await moderatorsService.createModerators(req.userId, req.roleId, req.body);
        res.status(200).json({ status: "success", data });
    } catch (err) {
        return next(err);
    }
};

const updateModerator = async function (req, res, next) {
    try {
        const data = await moderatorsService.updateModerator(req.userId, req.roleId, req.body);
        res.status(200).json({ status: "success", data });
    } catch (err) {
        return next(err);
    }
};

const deleteModerators = async function (req, res, next) {
    try {
        const data = await moderatorsService.deleteModerators(req.userId, req.roleId, req.body);
        res.status(200).json({ status: "success", data });
    } catch (err) {
        return next(err);
    }
};

const listModeratorsForRequester = async function (req, res, next) {
    try {
        const data = await moderatorsService.listModeratorsForRequester(req.userId, req.roleId);
        res.status(200).json({ status: "success", data });
    } catch (err) {
        return next(err);
    }
};

const getModeratorProfile = async function (req, res, next) {
    try {
        const data = await moderatorsService.getModeratorProfile(req.userId, req.roleId, req.params.userId);
        res.status(200).json({ status: "success", data });
    } catch (err) {
        return next(err);
    }
};

module.exports = {
    createModerators,
    updateModerator,
    deleteModerators,
    listModeratorsForRequester,
    getModeratorProfile,
};


