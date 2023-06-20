const express = require("express");
const router = express.Router();
const database = require("../services/database");
const tables = require("../constants/tableNames");
const AppError = require("../utils/appError");
const authentication = require("../middlewares/authentication");

router.get("/members", async function (req, res, next) {
  const cityId = req.cityId;
  const forumId = req.forumId;
  try {
    if (isNaN(Number(cityId)) || Number(cityId) <= 0) {
      next(new AppError(`Invalid forumId ${cityId}`, 400));
      return;
    }
    let response = await database.get(tables.CITIES_TABLE, { cityId });
    if (response && response.length > 0) {
      next(new AppError(`CityId ${cityId} not present`, 404));
    }

    if (!response.rows[0].hasForums) {
      next(new AppError(`CityId ${cityId} can not create forum related endpoints`, 400));
    }
        
    response = await database.get(tables.FORUMS, { id: forumId }, null, cityId);
  }
  catch(err) {
    return next(new AppError(err));
  }
});


//  Get a particular forum
router.get("/:id", async function (req, res, next) {
  const forumsId = req.params.id;
  const cityId = req.cityId
  // console.log(req.params)
  if (isNaN(Number(forumsId)) || Number(forumsId) <= 0) {
    next(new AppError(`Invalid forumId ${forumsId}`, 400));
    return;
  }
 

  database
    .get(tables.FORUMS, { id: forumsId },null,cityId)
    .then((response) => {
      const data = response.rows;
      if (!data || data.length === 0) {
        return next(new AppError(`Forums with id ${forumsId} does not exist`, 404));
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

router.get("/:id/members", authentication, async function (req, res, next) {
  const forumId = req.params.id
  const cityId = req.cityId;
  if (isNaN(Number(cityId)) || Number(cityId) <= 0) {
    return next(new AppError(`Invalid cityId`, 400));
  } else {
    try {
      const response = await database.get(tables.CITIES_TABLE, { id: cityId });
      if (response.rows && response.rows.length === 0) {
        return next(new AppError(`Invalid City '${cityId}' given`, 400));
      }
    } catch (err) {
      return next(new AppError(err));
    }
		
  }
  if (isNaN(Number(forumId)) || Number(forumId) <= 0) {
    return next(new AppError(`Invalid forumId`, 400));
  }
  try {
    const response = await database.get(tables.FORUM_MEMBERS, { forumId }, null, cityId);
    const memberCityUserIds = await database.get(tables.USER_CITYUSER_MAPPING_TABLE, {
      cityUserId: response.rows.map(x => {
        return x.userId
      })
    }, null)
    const memberUserIds = await database.get(tables.USER_TABLE, {
      id: memberCityUserIds.rows.map(x => {
        return x.userId
      })
    }, {columns: [
      "id",
      "username",
      "firstname",
      "lastname",
      "email",
      "phoneNumber"
    ]})
        
    res.status(200).json({
      status: "success",
      data: memberUserIds.rows,
    });
  } catch (err) {
    return next(new AppError(err));
  }
	
});
// To insert or add  a post into forums table  works fine but doesn't get updated in db
router.post("/:id", authentication, async function (req, res, next) {
  const payload = req.body
  const forumId = req.params.id
  const cityId = req.cityId;
  if (isNaN(Number(cityId)) || Number(cityId) <= 0) {
    return next(new AppError(`Invalid cityId`, 400));
  }
  if (isNaN(Number(forumId)) || Number(forumId) <= 0) {
    return next(new AppError(`Invalid forumId`, 400));
  }
  await database.get(tables.USER_CITYUSER_MAPPING_TABLE, {
    userId: req.userId, cityId: req.cityId
  }, null)
  try {
    database
      .create(tables.FORUMS, {
        forumName: payload.title,
        image: payload.image,
        description: payload.description,
      }, cityId);
  } catch (err) {
    return next(new AppError(err));
  }
	  res.status(200).json({
    status: "success",
  });
});
//  Description Update a forum. (Only admins can do this)
router.patch("/:id", authentication, async function (req, res, next) {
  const id = req.params.id;
  const cityId = req.cityId;
  const payload = req.body;
  const updationData = {};

  if (isNaN(Number(id)) || Number(id) <= 0) {
    next(new AppError(`Invalid forumId ${id}`, 404));
    return;
  }
  let response = await database.get(
    tables.FORUMS,
    { id },null,cityId);
  const memberCityUserId = await database.get(tables.USER_CITYUSER_MAPPING_TABLE, {
    userId: req.userId, cityId
  }, null)
  const userDetails = await database.get(tables.FORUM_MEMBERS, { forumId: id, userId: memberCityUserId.rows[0].cityUserId }, null, cityId);
  if (!userDetails.rows || userDetails.rows.length>0 || !userDetails.rows[0].isAdmin) {
    return next(
      new AppError(`You are not allowed to access this resource`, 403)
    );
  }
  if (!response.rows || response.rows.length === 0) {
    return next(
      new AppError(`You are not allowed to access this resource`, 403)
    );
  }
  response = await database.get(tables.FORUMS, { id},null,cityId);
  if (!response.rows || response.rows.length === 0) {
    return next(new AppError(`ForumId ${id} does not exist`, 404));
  }

  if (payload.title) {
    if (payload.title.length > 255) {
      return next(
        new AppError(`Length of forum name cannot exceed 255 characters`, 400)
      );
    }
    updationData.forumName = payload.title;
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

        
  database
    .update(tables.FORUMS, updationData, { id }, cityId)
    .then((response) => {
      res.status(200).json({
        status: "success",
        data: id
      });
    })
    .catch((err) => {
      return next(new AppError(err));
    });
});
// To delete  a forum listing from forums table shows 500 bad request
router.delete("/:id", authentication, async function (req, res, next) { 
  // We need to delete all forum related data first. 
  // Delete posts, members, comments, then the forum.
  // Let this logic be be in a Stored procedure


});
module.exports = router;