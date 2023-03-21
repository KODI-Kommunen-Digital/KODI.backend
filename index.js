require('dotenv').config()
const express = require('express');
const bodyParser = require('body-parser');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');
const AppError = require("./utils/appError");
const errorHandler = require("./utils/errorHandler");
const cityListingsRouter = require('./routes/cityListings');
const listingsRouter = require('./routes/listings');
const usersRouter = require('./routes/users');
const citiesRouter = require('./routes/cities');
const villageRouter = require('./routes/village');
const fileUpload = require('express-fileupload');

// defining the Express app
const app = express();

// defining an array to work as the database (temporary solution)
const message = {
        message: 'Hello world! Welcome to HEIDI!'
    };

// adding Helmet to enhance your Rest API's security
app.use(helmet());

// using bodyParser to parse JSON bodies into JS objects
app.use(bodyParser.json());

// enabling CORS for all requests
app.use(cors());

// adding morgan to log HTTP requests
app.use(morgan('combined'));

app.use(
    fileUpload({
        limits: {
            fileSize: 10000000,
        },
        abortOnLimit: true,
    })
);

app.get('/', (req, res) => {
    res.send(message);
});

app.use('/users', usersRouter);
app.use('/cities', citiesRouter);
app.use('/listings', listingsRouter);
app.use('/cities/:cityId/villages', function (req, res, next) {

    if (isNaN(Number(req.params.cityId)) || Number(req.params.cityId) <= 0) {
        return next(new AppError(`Invalid city id given`, 400));
    }
    req.cityId = req.params.cityId;
    next();
}, villageRouter);
app.use('/cities/:cityId/listings', function (req, res, next) {

    if (isNaN(Number(req.params.cityId)) || Number(req.params.cityId) <= 0) {
        return next(new AppError(`Invalid city id given`, 400));
    }
    req.cityId = req.params.cityId;
    next();
}, cityListingsRouter);

app.all("*", (req, res, next) => {
next(new AppError(`The URL ${req.originalUrl} does not exists`, 404));
});
app.use(errorHandler);

// starting the server
app.listen(process.env.PORT, () => {
    console.log(`listening on port ${process.env.PORT}`);
});

process.on('uncaughtException', function (err) {
    console.error(`${(new Date).toUTCString()}: UncaughtException: ${err.message}\n${err.stack}`);
    process.exit(1)
  })