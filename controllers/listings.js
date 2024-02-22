const listingService = require("../services/listings");

const getAllListings = async function (req, res, next) {
    const params = req.query;
    const pageNo = params.pageNo || 1;
    const pageSize = params.pageSize || 9;
    const reqSortByStartDate = params.sortByStartDate;
    const reqStatusId = params.statusId;
    const reqSubcategoryId = params.subcategoryId;
    const reqCategoryId = params.categoryId;
    const reqCityId = params.cityId;
    const reqTranslate = params.translate;
    try {
        const listings = await listingService.getAllListings(
            pageNo,
            pageSize,
            reqSortByStartDate,
            reqStatusId,
            reqSubcategoryId,
            reqCategoryId,
            reqCityId,
            reqTranslate
        );
        return res.status(200).json({
            status: "success",
            data: listings,
        });
    } catch (err) {
        return next(err);
    }
};

module.exports = {
    getAllListings,
};