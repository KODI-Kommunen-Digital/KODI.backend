const express = require('express');
const router = express.Router();
const database = require('../services/database');
const tables = require('../constants/tableNames');
const storedProcedures = require('../constants/storedProcedures');
const config = require('../config');
const AppError = require("../utils/appError");
const fs = require('fs');
const axios = require('axios');
const querystring = require('querystring');
const authentication = require('../middlewares/authentication');

router.post('/login', async function(req, res, next) {
    const keycloak = config.keycloak;
    var payload = req.body
    requestObject = {};
    
    if (payload.username) {
        requestObject.username = payload.username
    }

    if (payload.password) {
        requestObject.password = payload.password
    }
    requestObject.grant_type = "password"
    requestObject.client_id = keycloak.client_id
    requestObject.client_secret = keycloak.client_secret

    var requestObject = querystring.stringify(requestObject);
    try {
        const keycloakResponse = await axios({
            method: 'POST',
            url:`${keycloak.domain}/realms/${keycloak.realm}/protocol/openid-connect/token`,
            data: requestObject,
            headers: config.headers});
        const users = await database.get(tables.USER_TABLE, {username: payload.username});
        const userData = users.rows[0];
        const userMappings = await database.get(tables.USER_CITYUSER_MAPPING_TABLE, {userId: userData.id}, "cityId, cityUserId");
        res.status(200).json({
            status: "success",
            cityUsers: userMappings.rows,
            userData,
            accessToken: keycloakResponse.data.access_token,
            refreshToken: keycloakResponse.data.refresh_token
        });
    } catch (err) {
        return next(new AppError(err));
    };
});

router.post('/register', async function(req, res, next) {
    var payload = req.body
    var insertionData = {}
    if (!payload) {
        return next(new AppError(`Empty payload sent`, 400));
    }

    if (!payload.username) {
        return next(new AppError(`Username is not present`, 400));
    } else {
        try {
            var response = await database.get(tables.USER_TABLE, {username: payload.username})
            let data = response.rows;
            if (data && data.length > 0) {
                return next(new AppError(`User with username '${payload.username}' already exists`, 400));
            }
        } catch (err) {
            return next(new AppError(err));
        }
        insertionData.username = payload.username
    }

    if (!payload.email) {
        return next(new AppError(`Email is not present`, 400));
    } else {
        try {
            var response = await database.get(tables.USER_TABLE, {email: payload.email})
            let data = response.rows;
            if (data && data.length > 0) {
                return next(new AppError(`User with email '${payload.email}' is already registered`, 400));
            }
        } catch (err) {
            return next(new AppError(err));
        }
        insertionData.email = payload.email
    }

    if (!payload.role) {
        return next(new AppError(`Role is not present`, 400));
    } else {
        try {
            var response = await database.get(ROLES_TABLE, {id: payload.role})
            let data = response.rows;
            if (data && data.length > 0) {
                return next(new AppError(`Invalid role '${payload.role}' given`, 400));
            }
        } catch (err) {
            return next(new AppError(err));
        }
        insertionData.role = payload.role
    }

    if (!payload.firstname) {
        return next(new AppError(`Firstname is not present`, 400));
    } else {
        insertionData.firstname = payload.firstname
    }

    if (!payload.lasttname) {
        return next(new AppError(`Lastname is not present`, 400));
    } else {
        insertionData.lasttname = payload.lasttname
    }

    if (payload.email) {
        insertionData.email = payload.email
    }

    if (payload.phoneNumber) {
        insertionData.website = payload.website
    }

    if (payload.image) {
        insertionData.website = payload.website
    }

    if (payload.description) {
        insertionData.description = payload.description
    }

    if (payload.website) {
        insertionData.website = payload.website
    }

    database.create(tables.USER_TABLE, insertionData).then((response) => {
        res.status(200).json({
            status: "success",
            id: response.id,
        });
    }).catch((err) => {
        return next(new AppError(err));
    });
});

router.get('/:id', authentication, async function(req, res, next) {
    const id = req.params.id;
    if(isNaN(Number(id)) || Number(id) <= 0) {
        next(new AppError(`Invalid UserId ${id}`, 404));
        return;
    }

    database.get(tables.USER_TABLE, {id}).then((response) => {
        let data = response.rows;
        if (!data || data.length == 0) {
            return next(new AppError(`User with id ${id} does not exist`, 404));
        }
        res.status(200).json({
            status: "success",
            data: data[0],
        });
    }).catch((err) => {
        return next(new AppError(err));
    });
});

router.patch('/:id', authentication, async function(req, res, next) {
    var id = req.params.id;
    var payload = req.body
    var updationData = {}

    if(isNaN(Number(id)) || Number(id) <= 0) {
        next(new AppError(`Invalid UserId ${id}`, 404));
        return;
    }
    id = Number(id);
    var response = await database.get(tables.USER_TABLE, {id})
    if (!response.rows || response.rows.length == 0) {
        return next(new AppError(`User with id ${id} does not exist`, 404));
    }
    let currentUserData = response.rows[0];

    if (payload.username != currentUserData.username) {
        return next(new AppError(`Username cannot be edited`, 400));
    }

    if (payload.email && payload.email != currentUserData.email) {
        let re = /^(([^<>()\[\]\\.,;:\s@"]+(\.[^<>()\[\]\\.,;:\s@"]+)*)|(".+"))@((\[[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}])|(([a-zA-Z\-0-9]+\.)+[a-zA-Z]{2,}))$/;
        if (!re.test(payload.email)) {
            return next(new AppError(`Invalid email given`, 400));
        }
        updationData.email = payload.email
    }

    if (payload.firstname) {
        updationData.firstname = payload.firstname
    }

    if (payload.lastname) {
        updationData.lastname = payload.lastname
    }

    if (payload.email) {
        updationData.email = payload.email
    }

    if (payload.phoneNumber) {
        updationData.phoneNumber = payload.phoneNumber
    }

    if (payload.image) {
        updationData.website = payload.website
    }

    if (payload.description) {
        updationData.description = payload.description
    }

    if (payload.website) {
        updationData.website = payload.website
    }

    database.update(tables.USER_TABLE, updationData, {id}).then((response) => {
        res.status(200).json({
            status: "success"
        });
    }).catch((err) => {
        return next(new AppError(err));
    });
});

router.delete('/:id', authentication, async function(req, res, next) {
    const id = req.params.id;

    if(isNaN(Number(id)) || Number(id) <= 0) {
        next(new AppError(`Invalid UserId ${id}`, 404));
        return;
    }

    try {
        var response = await database.get(tables.USER_TABLE, { id })
        let data = response.rows;
        if (data && data.length == 0) {
            return next(new AppError(`User with id ${id} does not exist`, 404));
        }

        var filePath = `./${config.imagePath}/user_${id}`
        fs.rmSync(filePath, { recursive: true, force: true });

        var response = await database.callStoredProcedure(storedProcedures.DELETE_USER, [ id ])  

        res.status(200).json({
            status: "success"
        });
    } catch (err) {
        return next(new AppError(err));
    };
});

router.post('/:id/imageUpload', authentication, async function(req, res, next) {
    const id = req.params.id;

    if(isNaN(Number(id)) || Number(id) <= 0) {
        next(new AppError(`Invalid UserId ${id}`, 404));
        return;
    }

    const { image } = req.files;
    
    if (!image) {
        next(new AppError(`Image not uploaded`, 400));
        return;
    }
    
    if (!/^image/.test(image.mimetype)) {
        next(new AppError(`Please upload an image only`, 400));
        return;
    }

    try {
        var response = await database.get(tables.USER_TABLE, { id })
        let data = response.rows;
        if (data && data.length == 0) {
            return next(new AppError(`User with id ${id} does not exist`, 404));
        }

        var filePath = `./${config.imagePath}/user_${id}`
        var fileName = `user_${id}_${Date.now()}.jpg`

        if (!fs.existsSync(filePath)){
            fs.mkdirSync(filePath, { recursive: true });
        }

        await image.mv(`${filePath}/${fileName}`)    
        res.status(200).json({
            status: "success",
            fileName: `./user_${id}/${fileName}`,
        });
    } catch (err) {
        return next(new AppError(err));
    };
});

router.get('/:id/listings', authentication, async function(req, res, next) {
    const id = req.params.id;
    if(isNaN(Number(id)) || Number(id) <= 0) {
        next(new AppError(`Invalid UserId ${id}`, 404));
        return;
    }


    try {
        var cityUsers = await database.get(tables.USER_CITYUSER_MAPPING_TABLE, { userId: id })
        let data = cityUsers.rows;
        let allListings = [];
        for (var element of data) {
            var cityListings = await database.get(tables.LISTINGS_TABLE, { userId: element.cityUserId }, null, element.cityId)
            allListings.push(cityListings.rows)
        }        
        
        res.status(200).json({
            status: "success",
            data: allListings
        });
    } catch (err) {
        return next(new AppError(err));
    };
});

module.exports = router;