const express = require('express');
const router = express.Router();
const database = require('../services/database');
const tables = require('../constants/tableNames');
const AppError = require("../utils/appError");


router.get('/:id', async function(req, res, next) {
    const id = req.params.id;
    if(isNaN(Number(id)) || Number(id) <= 0) {
        next(new AppError(`Invalid UserId ${id}`, 404));
        return;
    }

    database.get(tables.LISTINGS_TABLE, {id}).then((response) => {
        let data = response.rows;
        if (!data || data.length == 0) {
            return next(new AppError(`Listings with id ${id} does not exist`, 404));
        }
        res.status(200).json({
            status: "success",
            data: data[0],
        });
    }).catch((err) => {
        return next(new AppError(err));
    });
});

router.patch('/:id', async function(req, res, next){
    const id = req.params.id;
    var payload = req.body
    var updationData = {}

    if(isNaN(Number(id)) || Number(id) <= 0) {
        next(new AppError(`Invalid UserId ${id}`, 404));
        return;
    }

    var response = await database.get(tables.LISTINGS_TABLE, {id})
    if (!response.rows || response.rows.length == 0) {
        return next(new AppError(`User with id ${id} does not exist`, 404));
    }
    let currentUserData = response.rows[0];

    if (payload.title) {
        updationData.title = payload.title
    }
    if (payload.place) {
        updationData.place = payload.place
    }
    if (payload.description) {
        updationData.description = payload.description
    }
    if (payload.socialMedia) {
        updationData.socialMedia = payload.socialMedia
    }
    if (payload.media) {
        updationData.media = payload.media
    }
    if (payload.categoryId){
        try {
            var response = await database.get(ROLES_TABLE, {id: payload.categoryId})
            let data = response.rows;
            if (data && data.length > 0) {
                return next(new AppError(`Invalid Category '${payload.categoryId}' given`, 400));
            }
        } catch (err) {
            return next(new AppError(err));
        }
        updationData.categoryId = payload.categoryId
    }
    if (payload.address) {
        updationData.address = payload.address
    }
    if (payload.email && payload.email != currentUserData.email) {
        let re = /^(([^<>()\[\]\\.,;:\s@"]+(\.[^<>()\[\]\\.,;:\s@"]+)*)|(".+"))@((\[[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}])|(([a-zA-Z\-0-9]+\.)+[a-zA-Z]{2,}))$/;
        if (!re.test(payload.email)) {
            return next(new AppError(`Invalid email given`, 400));
        }
        updationData.email = payload.email
    }

    if (payload.phone && payload.phone !=currentUserData.phone) {
        let re = /^[+][(]{0,1}[0-9]{1,3}[)]{0,1}[-\s./0-9]$/g
        if (!re.test(payload.phone)) {
            return next(new AppError(`Invalid Phone number given`, 400));
        }
        updationData.phone = payload.phone
    }

    if (payload.website) {
        updationData.website = payload.website
    }
    if (payload.price) {
        updationData.price = payload.price
    }
    if (payload.discountPrice) {
        updationData.discountPrice = payload.discountPrice
    }
    if (payload.logo) {
        updationData.logo = payload.logo
    }
    if (payload.statusId) {
        updationData.statusId = payload.statusId
    }
    if (payload.longitude) {
        updationData.longitude = payload.longitude
    }
    if (payload.lattitude) {
        updationData.lattitude = payload.lattitude
    }
    if (payload.startDate) {
        updationData.startDate = payload.startDate
    }
    if (payload.endDate) {
        updationData.endDate = payload.endDate
    }

    database.update(tables.LISTINGS_TABLE, updationData, {id}).then((response) => {
        res.status(200).json({
            status: "success"
        });
    }).catch((err) => {
        return next(new AppError(err));
    });
})

router.post('/', async function(req, res, next){
    var payload = req.body
    var insertionData = {}
    if (!payload) {
        return next(new AppError(`Empty payload sent`, 400));
    }

    if (!payload.userId) {
        return next(new AppError(`userId is not present`, 400));
    } else {
        insertionData.userId = payload.userId
    }

    if (!payload.title) {
        return next(new AppError(`Title is not present`, 400));
    } else {
        insertionData.title = payload.title
    }
    if (!payload.place) {
        return next(new AppError(`Place is not present`, 400));
    } else {
        insertionData.place = payload.place
    }
    if (payload.description) {
        insertionData.description = payload.description
    }
    if (payload.socialMedia) {
        insertionData.socialMedia = payload.socialMedia
    }
    if (payload.media) {
        insertionData.media = payload.media
    }
    if (!payload.categoryId) {
        return next(new AppError(`Category is not present`, 400));
    } else {
        try {
            var response = await database.get(ROLES_TABLE, {id: payload.categoryId})
            let data = response.rows;
            if (data && data.length > 0) {
                return next(new AppError(`Invalid Category '${payload.categoryId}' given`, 400));
            }
        } catch (err) {
            return next(new AppError(err));
        }
        insertionData.categoryId = payload.categoryId
    }
    if (payload.address) {
        insertionData.address = payload.address
    }
    if (payload.email) {
        insertionData.email = payload.email
    }
    if (payload.phone) {
        let re = /^[+][(]{0,1}[0-9]{1,3}[)]{0,1}[-\s./0-9]$/g
        if (!re.test(payload.phone)) {
            return next(new AppError(`Invalid Phone number given`, 400));
        }
        insertionData.phone = payload.phone
    }
    if (payload.website) {
        insertionData.website = payload.website
    }
    if (payload.price) {
        insertionData.price = payload.price
    }
    if (payload.discountPrice) {
        insertionData.discountPrice = payload.discountPrice
    }
    if (!payload.logo) {
        return next(new AppError(`Logo is not present`, 400));
    } else {
        insertionData.logo = payload.logo
    }
    if (!payload.statusId) {
        return next(new AppError(`Status is not present`, 400));
    } else {
        try {
            var response = await database.get(STAUSES_TABLE, {id: payload.statusId})
            let data = response.rows;
            if (data && data.length > 0) {
                return next(new AppError(`Invalid Status '${payload.statusId}' given`, 400));
            }
        } catch (err) {
            return next(new AppError(err));
        }
        insertionData.statusId = payload.statusId
    }
    if (payload.longitude) {
        insertionData.longitude = payload.longitude
    }
    if (payload.lattitude) {
        insertionData.lattitude = payload.lattitude
    }
    if (!payload.cityId) {
        return next(new AppError(`Status is not present`, 400));
    } else {
        try {
            var response = await database.get(CITIES_TABLE, {id: payload.cityId})
            let data = response.rows;
            if (data && data.length > 0) {
                return next(new AppError(`Invalid Status '${payload.cityId}' given`, 400));
            }
        } catch (err) {
            return next(new AppError(err));
        }
        insertionData.cityId = payload.cityId
    }
    //To Input DATES
    //TO DO: Need to implement dates as per category input from user.

})

module.exports = router;