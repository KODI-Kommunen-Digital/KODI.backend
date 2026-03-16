require("dotenv").config();
const express = require("express");

const router = express.Router();
const AppError = require("../utils/appError");
const listingsRouter = require("./listings");
const usersRouter = require("./users");
const favoriteRouter = require("./favorites");
const citiesRouter = require("./cities");
const villageRouter = require("./village");
const categoriesRouter = require("./categories");
const statusRouter = require("./status");
const citizenServicesRouter = require("./citizenServices");
const contactUsRouter = require("./contactUs");
const moreInfoRouter = require("./moreInfo");
const advertisement = require("./ads");
const wasteCalender = require("./wasteCalender");
const defectReportRouter = require("./defectReporter");

router.get("/", (req, res) => {
    res.json({ message: "Hello world!! Welcome to HEIDI!!" });
});

router.use("/users", usersRouter);
router.use("/cities", citiesRouter);
router.use("/listings", listingsRouter);
router.use("/categories", categoriesRouter);
router.use("/status", statusRouter);
router.use("/citizenServices", citizenServicesRouter);
router.use("/contactUs", contactUsRouter);
router.use("/moreInfo", moreInfoRouter);
router.use(
    "/users/:userId/favorites",
    function (req, res, next) {
        if (
            isNaN(Number(req.params.userId)) ||
            Number(req.params.userId) <= 0
        ) {
            return next(new AppError(`Invalid user id given`, 400));
        }
        req.paramUserId = req.params.userId;
        next();
    },
    favoriteRouter
);
router.use(
    "/cities/:cityId/villages",
    function (req, res, next) {
        if (
            isNaN(Number(req.params.cityId)) ||
            Number(req.params.cityId) <= 0
        ) {
            return next(new AppError(`Invalid city id given`, 400));
        }
        req.cityId = req.params.cityId;
        next();
    },
    villageRouter
);
if (process.env.WASTE_CALENDER_ENABLED === 'True') {
    router.use(
        "/cities/:cityId/wasteCalender",
        function (req, res, next) {
            if (
                isNaN(Number(req.params.cityId)) ||
                Number(req.params.cityId) <= 0
            ) {
                return next(new AppError(`Invalid city id given`, 400));
            }
            req.cityId = req.params.cityId;
            next();
        },
        wasteCalender
    );
}
router.use("/ads", advertisement)
router.use("/reportDefect", defectReportRouter); // TODO: convert to service-repository pattern
module.exports = router;
