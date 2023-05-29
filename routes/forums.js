const express = require("express");
const router = express.Router();
const database = require("../services/database");
const tables = require("../constants/tableNames");
const AppError = require("../utils/appError");
const authentication = require("../middlewares/authentication");

// Return all forums in a city
router.get("/", authentication, async function (req, res, next) {
    const cityId = req.cityId;
	database
        .get(tables.FORUMS,null,null,cityId)
		.then((response) => {
			res.status(200).json({
				status: "success",
				data: response.rows,
			});
		})
		.catch((err) => {
			return next(new AppError(err));
		});
});
//  Get a particular forum
router.get("/:id", authentication, async function (req, res, next) {
    const forumsId = req.params.id;
    const cityId = req.cityId
    console.log(req.params)
    if (isNaN(Number(forumsId)) || Number(forumsId) <= 0) {
		next(new AppError(`Invalid forumId ${forumsId}`, 400));
		return;
    }
 

	database
		.get(tables.FORUMS, { id: forumsId },null,cityId)
        .then((response) => {
            let data = response.rows;
			if (!data || data.length == 0) {
				return next(new AppError(`Forums with id ${id} does not exist`, 404));
			}
			res.status(200).json({
				status: "success",
				data: data[0],
			});
		})
		.catch((err) => {
			return next(new AppError(err));
		});
});

// works fine needs modification
router.post("/:id/members", authentication, async function (req, res, next) {
    var payload = req.body
    const forumId = req.params.id
    const cityId = req.cityId;
    console.log("payload".payload)
    if (isNaN(Number(cityId)) || Number(cityId) <= 0) {
        return next(new AppError(`Invalid cityId`, 400));
    } else {
        try {
            var response = await database.get(tables.CITIES_TABLE, { id: cityId });
            if (response.rows && response.rows.length == 0) {
                return next(new AppError(`Invalid City '${cityId}' given`, 400));
            }
        } catch (err) {
            return next(new AppError(err));
        }
		
    }
    try {
        var response = await database.create(tables.FORUM_MEMBERS, {forumId:forumId},cityId);
        res.status(200).json({
            status: "success",
            data: {
                userId: payload.userId,
                isAdmin: payload.isAdmin
            },
        });
    } catch (err) {
            return next(new AppError(err));
        }
	
});
// Works
router.get("/users/:id", authentication, async function (req, res, next) {
    const userId = req.params.id;
    const cityId = req.cityId;
    if (isNaN(Number(userId)) || Number(userId) <= 0) {
        next(new AppError(`Invalid UserId ${userId}`, 404));
        return;
    }
    if (userId) {
        if (!cityId) {
            return next(new AppError(`City id not given`, 400));
        }
        try {
            var { rows } = await database.get(tables.CITIES_TABLE, { id: cityId });
            if (!rows || rows.length == 0) {
                return next(new AppError(`City with id ${cityId} does not exist`, 400));
            }
        } catch (err) {
            return next(new AppError(err));
        }
        
            database
                .get(tables.FORUM_MEMBERS, { userId: userId },null,cityId)
                .then((response) => {
                    res.status(200).json({
                        status: "success",
                        data: response.rows,
                    });
                })
                .catch((err) => {
                    return next(new AppError(err));
                });
        
    }
});
// To insert or add  a post into forums table  works fine but doesn't get updated in db
router.post("/:id", authentication, async function (req, res, next) {
    var payload = req.body
    const forumId = req.params.id
    const cityId = req.cityId;
    console.log("payload".req)

    if (isNaN(Number(cityId)) || Number(cityId) <= 0) {
        return next(new AppError(`Invalid cityId`, 400));
    } else {
        try {
            var response = await database.get(tables.CITIES_TABLE, { id: cityId });
            if (response.rows && response.rows.length == 0) {
                return next(new AppError(`Invalid City '${cityId}' given`, 400));
            }
        } catch (err) {
            return next(new AppError(err));
        }
		
    }
    try {
        database
            .create(tables.FORUMS_POST, null,cityId);
        res.status(200).json({
            status: "success",
            data: {
                title: payload.title,
                image: payload.image,
                description: payload.description,
                userId: payload.userId,
            },
        });
    } catch (err) {
            return next(new AppError(err));
        }
	
});
//  Description Update a forum. (Only admins can do this)
router.patch("/:id", authentication, async function (req, res, next) {
    const id = req.params.id;
    var cityId = req.cityId;
    var payload = req.body;
    var updationData = {};

    if (isNaN(Number(id)) || Number(id) <= 0) {
        next(new AppError(`Invalid forumId ${id}`, 404));
        return;
    }

    var response = await database.get(
        tables.FORUMS_POST,
        { forumId:id,userId:payload.userId },null,cityId);

    var userDetails = await database.get(tables.FORUM_MEMBERS, {forumId: id,userId:payload.userId},null,cityId);
    if (!userDetails.isAdmin) {
        return next(
            new AppError(`You are not allowed to access this resource`, 403)
        );
    }
    if (!response.rows || response.rows.length == 0) {
        return next(
            new AppError(`You are not allowed to access this resource`, 403)
        );
    }
    response = await database.get(tables.FORUMS_POST, { forumId:id, cityId:cityId,userId:payload.userId },null,cityId);
    if (!response.rows || response.rows.length == 0) {
        return next(new AppError(`ForumId ${id} does not exist`, 404));
    }

    if (payload.title) {
        if (payload.title.length > 255) {
            return next(
                new AppError(`Length of Title cannot exceed 255 characters`, 400)
            );
        }
        updationData.title = payload.title;
    }

    if (payload.description) {
        if (payload.description.length > 10000) {
            return next(
                new AppError(
                    `Length of Description cannot exceed 10000 characters`,
                    400
                )
            );
        }
        updationData.description = payload.description;
    }
   
    if (payload.image && payload.removeImage) {
        return next(
            new AppError(
                `Invalid Input, image and removeImage both fields present`,
                400
            )
        );
    }
    if (payload.image) {
        updationData.image = payload.image;
    }
    if (payload.removeImage) {
        updationData.image = null;
    }
    var status = await database.get(tables.FORUM_REQUEST_STATUS, { forumId:id },null,cityId);
    if (!response.rows || response.rows.length == 0) {
        return next(new AppError(`ForumId ${id} does not exist`, 404));
    }
        if (status.rows[0].status == "false") {
            return next(
                new AppError("You dont have access to change this option", 403)
            );
        }
        
    database
        .update(tables.FORUMS_POST, updationData, { forumId:id }, cityId)
        .then((response) => {
            res.status(200).json({
                status: "success",
            });
        })
        .catch((err) => {
            return next(new AppError(err));
        });
});
// To delete  a forum listing from forums table shows 500 bad request
router.delete("/:id", authentication, async function (req, res, next) { 
	const id = req.params.id;
    const cityId = req.cityId
    // const userId = req.params.id
	if (isNaN(Number(id)) || Number(id) <= 0) {
		next(new AppError(`Invalid ForumId ${id}`, 400));
		return;
	}
    if (isNaN(Number(cityId)) || Number(cityId) <= 0) {
            next(new AppError(`Invalid cityId ${cityId}`, 400));
            return;
    }
    // var currentUserData = await database.get(tables.FORUM_MEMBERS, { forumId: id }, null, cityId)
	// if (userId != currentUserData.userId) {
	// 	return next(
	// 		new AppError(`You are not allowed to access this resource`, 403)
	// 	);
	// }

    try {
        var response = await database.get(tables.FORUMS, { id: id }, null, cityId);
        let data = response.rows;
        if (data && data.length == 0) {
            return next(new AppError(`Forums with id ${id} does not exist`, 404));
        }
        await database
            .deleteData(tables.FORUMS, { id: id },cityId)
            
        res.status(200).json({
            status: "success",
        });
    }catch(err){
        return next(new AppError(err));
    }      
});
module.exports = router;