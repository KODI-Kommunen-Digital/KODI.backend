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

const createCity = async (req, res, next) => {
    try {
        const data = await cityService.createCity( req.roleId, req.body);
        res.status(201).json({
            status: "success",
            data,
        });
    } catch (err) {
        return next(err);
    }
};

const updateCity = async (req, res, next) => {
    try {
        const data = await cityService.updateCity(req.roleId, req.params.id, req.body);
        res.status(200).json({
            status: "success",
            data,
        });
    } catch (err) {
        return next(err);
    }
};

const deleteCity = async (req, res, next) => {
    try {
        const response = await cityService.deleteCity(req.roleId, req.params.id);
        console.log(response);
        res.status(204).json({
            status: "success",
            response,
        });
    } catch (err) {
        return next(err);
    }
};

const uploadImage = async function (req, res, next) {
    const cityId = req.params.id;
    const roleId = req.roleId;
    const imageFiles = req?.files?.image;
    try {
        await cityService.uploadImage(
            cityId,
            roleId,
            imageFiles,
        );
        res.status(200).json({
            status: "success",
        });
    } catch (err) {
        return next(err);
    }
};

const deleteImage = async function (req, res, next) {
    const cityId = req.params.id;
    const roleId = req.roleId;

    try {
        await cityService.deleteImage(
            cityId,
            roleId,
        );
        return res.status(200).json({
            status: "success",
        });
    } catch (err) {
        return next(err);
    }
};


module.exports = {
    getCities,
    createCity,
    updateCity,
    deleteCity,
    uploadImage,
    deleteImage
};
