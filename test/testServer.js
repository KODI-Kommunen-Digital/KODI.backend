require("dotenv").config();
const express = require("express");
const bodyParser = require("body-parser");
const cors = require("cors");
const helmet = require("helmet");
const morgan = require("morgan");
const AppError = require("./../utils/appError");
const errorHandler = require("./../utils/errorHandler");
const cityListingsRouter = require("./../routes/cityListings");
const listingsRouter = require("./../routes/listings");
const usersRouter = require("./../routes/users");
const favoriteRouter = require("./../routes/favorites");
const citiesRouter = require("./../routes/cities");
const villageRouter = require("./../routes/village");
const categoriesRouter = require("./../routes/categories");
const statusRouter = require("./../routes/status");
const citizenServicesRouter = require("./../routes/citizenServices");
const contactUsRouter = require("./../routes/contactUs");
const fileUpload = require("express-fileupload");
const port = process.env.TEST_PORT || 3005;

// defining an array to work as the database (temporary solution)
const message = {
    message: "Hello world! Welcome to HEIDI Testcases!",
};
class Server{
    server;

    init(){
        const app = express();

        app.use(helmet());

        app.use(bodyParser.json());

        app.use(cors());

        app.use(morgan("combined"));

        app.use(
            fileUpload({
                limits: {
                    fileSize: 10000000,
                },
                abortOnLimit: true,
            })
        );

        app.get("/", (req, res) => {
            res.send(message);
        });

        app.use("/users", usersRouter);
        app.use("/cities", citiesRouter);
        app.use("/listings", listingsRouter);
        app.use("/categories", categoriesRouter);
        app.use("/status", statusRouter);
        app.use("/citizenServices", citizenServicesRouter);
        app.use("/contactUs", contactUsRouter);
        app.use(
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
        app.use(
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
        app.use(
            "/cities/:cityId/listings",
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
            cityListingsRouter
        );
        app.all("*", (req, res, next) => {
            next(new AppError(`The URL ${req.originalUrl} does not exists`, 404));
        });
        app.use(errorHandler);

        // starting the server
        this.server = app.listen(port, () => {
            console.log(`listening on test port ${port}`);
        });

        process.on("uncaughtException", function (err) {
            console.error(
                `${new Date().toUTCString()}: UncaughtException: ${err.message}\n${
                    err.stack
                }`
            );
            process.exit(1);
        });

        return app;
    }

    async close(){
        this.server.close();
    }
}
module.exports= {Server}
