const moderatorsService = require("../services/moderators");

const createModerators = async function (req, res, next) {
    try {
        const data = await moderatorsService.createModerators(
            req.userId,
            req.roleId,
            req.body
        );
        res.status(200).json({ status: "success", data });
    } catch (err) {
        return next(err);
    }
};

const updateModerator = async function (req, res, next) {
    try {
        const data = await moderatorsService.updateModerator(
            req.userId,
            req.roleId,
            req.body
        );
        res.status(200).json({ status: "success", data });
    } catch (err) {
        return next(err);
    }
};

const deleteModerators = async function (req, res, next) {
    try {
        const data = await moderatorsService.deleteModerators(
            req.userId,
            req.roleId,
            req.body
        );
        res.status(200).json({ status: "success", data });
    } catch (err) {
        return next(err);
    }
};

const listModeratorsForRequester = async function (req, res, next) {
    try {
        const pageNo = Number(req.query.pageNo ?? 1);
        const pageSize = Number(req.query.pageSize ?? 10);
        const searchQuery = req.query.searchQuery ?? "";

        const result = await moderatorsService.listModeratorsForRequester(
            req.userId,
            req.roleId,
            pageNo,
            pageSize,
            searchQuery
        );

        // result: { data: [...], count }
        res.status(200).json({
            status: "success",
            data: result.data,
            count: result.count,
        });
    } catch (err) {
        return next(err);
    }
};

const getModeratorProfile = async function (req, res, next) {
    try {
        const data = await moderatorsService.getModeratorProfile(
            req.userId,
            req.roleId,
            req.params.userId
        );
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
