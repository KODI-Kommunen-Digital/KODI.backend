const express = require("express");
const router = express.Router();
const database = require("../services/database");
const tables = require("../constants/tableNames");
const categories = require("../constants/categories");
const roles = require("../constants/roles");
const supportedLanguages = require("../constants/supportedLanguages");
const AppError = require("../utils/appError");
const authentication = require("../middlewares/authentication");
const deepl = require("deepl-node");
//const radiusSearch = require('../services/handler')

router.get("/", async function (req, res, next) {
	const params = req.query;
	const cityId = req.cityId;
	const filters = {};
	const translator = new deepl.Translator(process.env.DEEPL_AUTH_KEY);
	var listings = [];
	if (isNaN(Number(cityId)) || Number(cityId) <= 0) {
		return next(new AppError(`City is not present`, 404));
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

	var pageNo = params.pageNo || 1;
	var pageSize = params.pageSize || 10;
	if (isNaN(Number(pageNo)) || Number(pageNo) <= 0) {
		return next(
			new AppError(`Please enter a positive integer for pageNo`, 400)
		);
	}

	if (
		isNaN(Number(pageSize)) ||
		Number(pageSize) <= 0 ||
		Number(pageSize) > 20
	) {
		return next(
			new AppError(
				`Please enter a positive integer less than or equal to 20 for pageSize`,
				400
			)
		);
	}

	if (params.statusId) {
		try {
			var response = await database.get(
				tables.STATUS_TABLE,
				{ id: params.statusId },
				null,
				cityId
			);
			let data = response.rows;
			if (data && data.length == 0) {
				return next(
					new AppError(`Invalid Status '${params.statusId}' given`, 400)
				);
			}
		} catch (err) {
			return next(new AppError(err));
		}
		filters.statusId = payload.statusId;
	}

	if (params.categoryId) {
		try {
			var response = await database.get(
				tables.CATEGORIES_TABLE,
				{ id: params.categoryId },
				null,
				cityId
			);
			let data = response.rows;
			if (data && data.length == 0) {
				return next(
					new AppError(`Invalid Category '${params.categoryId}' given`, 400)
				);
			}
		} catch (err) {
			return next(new AppError(err));
		}
		filters.categoryId = params.categoryId;
	}

	if (params.userId) {
		try {
			var response = await database.get(
				tables.USER_CITYUSER_MAPPING_TABLE,
				{ userId: params.userId, cityId },
				null
			);
			let data = response.rows;
			if (data) {
				filters.userId = data[0].cityUserId;
			}
		} catch (err) {
			return next(new AppError(err));
		}
	}

	try {
		var response = await database.get(
			tables.LISTINGS_TABLE,
			filters,
			null,
			cityId,
			pageNo,
			pageSize
		);
		listings = response.rows;
	} catch (err) {
		return next(new AppError(err));
	}

	var noOfListings = listings.length;
	if (
		noOfListings > 0 &&
		params.translate &&
		supportedLanguages.includes(params.translate)
	) {
		try {
			var textToTranslate = [];
			listings.forEach((listing) => {
				textToTranslate.push(listing.title);
				textToTranslate.push(listing.description);
			});
			const translations = await translator.translateText(
				textToTranslate,
				null,
				params.translate
			);
			for (var i = 0; i < noOfListings; i++) {
				if (
					translations[2 * i].detectedSourceLang != params.translate.slice(0, 2)
				) {
					listings[i].titleLanguage = translations[2 * i].detectedSourceLang;
					listings[i].titleTranslation = translations[2 * i].text;
				}
				if (
					translations[2 * i + 1].detectedSourceLang !=
					params.translate.slice(0, 2)
				) {
					listings[i].descriptionLanguage =
						translations[2 * i + 1].detectedSourceLang;
					listings[i].descriptionTranslation = translations[2 * i + 1].text;
				}
			}
		} catch (err) {
			return next(new AppError(err));
		}
	}

	res.status(200).json({
		status: "success",
		data: listings,
	});
});

router.get("/:id", async function (req, res, next) {
	const id = req.params.id;
	const cityId = req.cityId;
	if (isNaN(Number(id)) || Number(id) <= 0) {
		next(new AppError(`Invalid ListingsId ${id}`, 404));
		return;
	}

	if (isNaN(Number(id)) || Number(cityId) <= 0) {
		return next(new AppError(`City is not present`, 404));
	} else {
		try {
			var response = await database.get(tables.CITIES_TABLE, { id: cityId });
			if (response.rows && response.rows.length == 0) {
				return next(new AppError(`Invalid City '${cityId}' given`, 404));
			}
		} catch (err) {
			return next(new AppError(err));
		}
	}

	database
		.get(tables.LISTINGS_TABLE, { id }, null, cityId)
		.then((response) => {
			let data = response.rows;
			if (!data || data.length == 0) {
				return next(new AppError(`Listings with id ${id} does not exist`, 404));
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

router.post("/", authentication, async function (req, res, next) {
	var payload = req.body;
	var cityId = req.cityId;
	var insertionData = {};
	var user = {};
	var city = {};
	var userId = req.userId;

	if (!payload) {
		return next(new AppError(`Empty payload sent`, 400));
	}

	if (!cityId) {
		return next(new AppError(`City is not present`, 404));
	} else {
		try {
			var response = await database.get(tables.CITIES_TABLE, { id: cityId });
			if (response.rows && response.rows.length == 0) {
				return next(new AppError(`Invalid City '${cityId}' given`, 400));
			}
			city = response.rows[0];
		} catch (err) {
			return next(new AppError(err));
		}
	}

	try {
		var response = await database.get(tables.USER_TABLE, { id: userId });
		let data = response.rows;
		if (data && data.length == 0) {
			return next(new AppError(`Invalid User '${userId}' given`, 400));
		}
		user = data[0];
	} catch (err) {
		return next(new AppError(err));
	}

	if (typeof parseInt(payload.villageId) === "number") {
		try {
			var response = await database.get(
				tables.VILLAGE_TABLE,
				{ id: payload.villageId },
				null,
				cityId
			);
			let data = response.rows;
			if (data && data.length == 0) {
				return next(
					new AppError(`Invalid Village id '${payload.villageId}' given`, 400)
				);
			} else {
				insertionData.villageId = payload.villageId;
			}
		} catch (err) {
			return next(new AppError(err));
		}
	} else {
		insertionData.villageId = null;
	}

	if (!payload.title) {
		return next(new AppError(`Title is not present`, 400));
	} else if (payload.title.length > 255) {
		return next(
			new AppError(`Length of Title cannot exceed 255 characters`, 400)
		);
	} else {
		insertionData.title = payload.title;
	}
	if (!payload.place) {
		return next(new AppError(`Place is not present`, 400));
	} else {
		insertionData.place = payload.place;
	}

	if (!payload.description) {
		return next(new AppError(`Description is not present`, 400));
	} else if (payload.description.length > 10000) {
		return next(
			new AppError(`Length of Description cannot exceed 10000 characters`, 400)
		);
	} else {
		insertionData.description = payload.description;
	}
	if (payload.media) {
		insertionData.media = payload.media;
	}
	if (!payload.categoryId) {
		return next(new AppError(`Category is not present`, 400));
	} else {
		try {
			var response = await database.get(
				tables.CATEGORIES_TABLE,
				{ id: payload.categoryId },
				null,
				cityId
			);
			let data = response.rows;
			if (data && data.length == 0) {
				return next(
					new AppError(`Invalid Category '${payload.categoryId}' given`, 400)
				);
			}
		} catch (err) {
			return next(new AppError(err));
		}
		insertionData.categoryId = payload.categoryId;
	}

	if (payload.subCategoryId) {
		try {
			var response = await database.get(
				tables.SUBCATEGORIES_TABLE,
				{ id: payload.subCategoryId },
				null,
				cityId
			);
			let data = response.rows;
			if (data && data.length == 0) {
				return next(
					new AppError(
						`Invalid Sub Category '${payload.subCategoryId}' given`,
						400
					)
				);
			}
		} catch (err) {
			return next(new AppError(err));
		}
		insertionData.subCategoryId = payload.subCategoryId;
	}

	if (!payload.statusId) {
		return next(new AppError(`Status is not present`, 400));
	} else {
		try {
			var response = await database.get(
				tables.STATUS_TABLE,
				{ id: payload.statusId },
				null,
				cityId
			);
			let data = response.rows;
			if (data && data.length == 0) {
				return next(
					new AppError(`Invalid Status '${payload.statusId}' given`, 400)
				);
			}
		} catch (err) {
			return next(new AppError(err));
		}
		insertionData.statusId = payload.statusId;
	}

	if (!payload.sourceId) {
		return next(new AppError(`Source is not present`, 400));
	} else {
		try {
			var response = await database.get(
				tables.SOURCE_TABLE,
				{ id: payload.sourceId },
				null,
				cityId
			);
			let data = response.rows;
			if (data && data.length == 0) {
				return next(
					new AppError(`Invalid Source '${payload.sourceId}' given`, 400)
				);
			}
		} catch (err) {
			return next(new AppError(err));
		}
		insertionData.sourceId = payload.sourceId;
	}

	if (payload.address) {
		insertionData.address = payload.address;
	}
	if (!payload.email) {
		if (
			payload.categoryId == categories.Associations ||
			payload.categoryId == categories.OfferOrSearch ||
			payload.categoryId == categories.DefectReport ||
			payload.categoryId == categories.LostPropertyOffice ||
			payload.categoryId == categories.CompanyPortraits
		) {
			return next(new AppError(`Email is not present`, 400));
		}
	} else {
		insertionData.email = payload.email;
	}

	if (payload.phone) {
		let re = /^[+]*[(]{0,1}[0-9]{1,3}[)]{0,1}[-\s\./0-9]*$/g;
		if (!re.test(payload.phone)) {
			return next(new AppError(`Invalid Phone number given`, 400));
		}
		insertionData.phone = payload.phone;
	}

	if (payload.website) {
		insertionData.website = payload.website;
	}

	if (payload.price) {
		insertionData.price = payload.price;
	}

	if (payload.discountPrice) {
		insertionData.discountPrice = payload.discountPrice;
	}
	if (!payload.logo) {
		if (payload.categoryId == 4 || payload.categoryId == 11) {
			return next(new AppError(`Logo is not present`, 400));
		}
	} else {
		insertionData.logo = payload.logo;
	}

	if (payload.longitude) {
		insertionData.longitude = payload.longitude;
	}

	if (payload.latitude) {
		insertionData.latitude = payload.latitude;
	}

	if (!payload.startDate) {
		if (payload.categoryId == categories.EventsOrNews) {
			return next(new AppError(`Start date or Time is not present`, 400));
		}
	} else {
		insertionData.startDate = new Date(payload.startDate)
			.toISOString()
			.slice(0, 19)
			.replace("T", " ");
	}

	if (payload.endDate) {
		insertionData.endDate = new Date(payload.endDate)
			.toISOString()
			.slice(0, 19)
			.replace("T", " ");
	}

	insertionData.createdAt = new Date()
		.toISOString()
		.slice(0, 19)
		.replace("T", " ");

	try {
		var response = {};
		var userId = user.id;
		if (city.isAdminListings) {
			// If the city is admin listings, we need directly set the user id of the listing as 1 (i.e. admin's id)
			insertionData.userId = 1;
		} else {
			response = await database.get(tables.USER_CITYUSER_MAPPING_TABLE, {
				cityId,
				userId,
			});
			if (!response.rows || response.rows.length == 0) {
				delete user.id;
				delete user.password;
				delete user.socialMedia;
				delete user.emailVerified;
				delete user.socialMedia;
				response = await database.create(tables.USER_TABLE, user, cityId);
				var cityUserId = response.id;
				await database.create(tables.USER_CITYUSER_MAPPING_TABLE, {
					cityId,
					userId,
					cityUserId,
				});
				insertionData.userId = cityUserId;
			} else {
				insertionData.userId = response.rows[0].cityUserId;
			}
		}

		response = await database.create(
			tables.LISTINGS_TABLE,
			insertionData,
			cityId
		);
		listingId = response.id;
		await database.create(tables.USER_LISTING_MAPPING_TABLE, {
			cityId,
			userId,
			listingId,
		});
		res.status(200).json({
			status: "success",
			id: listingId,
		});
	} catch (err) {
		return next(new AppError(err));
	}
});

router.patch("/:id", authentication, async function (req, res, next) {
	const id = req.params.id;
	var cityId = req.cityId;
	var payload = req.body;
	var updationData = {};

	if (isNaN(Number(id)) || Number(id) <= 0) {
		next(new AppError(`Invalid ListingsId ${id}`, 404));
		return;
	}

	var response = await database.get(
		tables.USER_CITYUSER_MAPPING_TABLE,
		{ userId: req.userId, cityId },
		"cityUserId"
	);

	var currentUser = await database.get(tables.USER_TABLE, { id: req.userId });
	if (!response.rows || response.rows.length == 0) {
		return next(
			new AppError(`You are not allowed to access this resource`, 403)
		);
	}
	var cityUserId = response.rows[0].cityUserId;

	response = await database.get(tables.LISTINGS_TABLE, { id }, null, cityId);
	if (!response.rows || response.rows.length == 0) {
		return next(new AppError(`Listing with id ${id} does not exist`, 404));
	}
	let currentListingData = response.rows[0];

	if (currentListingData.userId != cityUserId && req.roleId !== roles.Admin) {
		return next(
			new AppError(`You are not allowed to access this resource`, 403)
		);
	}
	if (payload.title) {
		if (payload.title.length > 255) {
			return next(
				new AppError(`Length of Title cannot exceed 255 characters`, 400)
			);
		}
		updationData.title = payload.title;
	}
	if (payload.place) {
		updationData.place = payload.place;
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

	if (payload.media) {
		updationData.media = payload.media;
	}
	if (payload.address) {
		updationData.address = payload.address;
	}
	if (payload.email && payload.email != currentListingData.email) {
		let re =
			/^(([^<>()\[\]\\.,;:\s@"]+(\.[^<>()\[\]\\.,;:\s@"]+)*)|(".+"))@((\[[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}])|(([a-zA-Z\-0-9]+\.)+[a-zA-Z]{2,}))$/;
		if (!re.test(payload.email)) {
			return next(new AppError(`Invalid email given`, 400));
		}
		updationData.email = payload.email;
	}

	if (payload.phone && payload.phone != currentListingData.phone) {
		let re = /^[+][(]{0,1}[0-9]{1,3}[)]{0,1}[-\s./0-9]$/g;
		if (!re.test(payload.phone)) {
			return next(new AppError(`Invalid Phone number given`, 400));
		}
		updationData.phone = payload.phone;
	}

	if (payload.website) {
		updationData.website = payload.website;
	}
	if (payload.price) {
		updationData.price = payload.price;
	}
	if (payload.discountPrice) {
		updationData.discountPrice = payload.discountPrice;
	}
	if (payload.logo && payload.removeImage) {
		return next(
			new AppError(
				`Invalid Input, logo and removeImage both fields present`,
				400
			)
		);
	}
	if (payload.logo) {
		updationData.logo = payload.logo;
	}
	if (payload.removeImage) {
		updationData.logo = null;
	}
	if (payload.statusId) {
		if (req.roleId != roles.Admin)
			return next(
				new AppError("You dont have access to change this option", 403)
			);
		try {
			var response = await database.get(
				tables.STATUS_TABLE,
				{ id: payload.statusId },
				null,
				cityId
			);
			let data = response.rows;
			if (data && data.length == 0) {
				return next(
					new AppError(`Invalid Status '${payload.statusId}' given`, 400)
				);
			}
			updationData.statusId = payload.statusId;
		} catch (err) {
			return next(new AppError(err));
		}
		if (req.roleId == roles.Admin) updationData.statusId = payload.statusId;
		else
			return next(
				new AppError("You dont have access to change this option", 403)
			);
	}
	if (payload.longitude) {
		updationData.longitude = payload.longitude;
	}
	if (payload.latitude) {
		updationData.latitude = payload.latitude;
	}
	if (payload.startDate) {
		updationData.startDate = new Date(payload.startDate)
			.toISOString()
			.slice(0, 19)
			.replace("T", " ");
	}
	if (payload.endDate) {
		updationData.endDate = new Date(payload.endDate)
			.toISOString()
			.slice(0, 19)
			.replace("T", " ");
	}

	database
		.update(tables.LISTINGS_TABLE, updationData, { id }, cityId)
		.then((response) => {
			res.status(200).json({
				status: "success",
			});
		})
		.catch((err) => {
			return next(new AppError(err));
		});
});

router.delete("/:id", authentication, async function (req, res, next) {
	const id = req.params.id;
	const cityId = req.cityId;

	if (isNaN(Number(id)) || Number(id) <= 0) {
		next(new AppError(`Invalid entry ${id}`, 404));
		return;
	}

	var response = await database.get(
		tables.USER_CITYUSER_MAPPING_TABLE,
		{ userId: req.userId, cityId },
		"cityUserId"
	);
	var currentUser = await database.get(tables.USER_TABLE, { id: req.userId });
	if (!response.rows || response.rows.length == 0) {
		return next(
			new AppError(`You are not allowed to access this resource`, 403)
		);
	}
	var cityUserId = response.rows[0].cityUserId;

	response = await database.get(tables.LISTINGS_TABLE, { id }, null, cityId);
	if (!response.rows || response.rows.length == 0) {
		return next(new AppError(`Listing with id ${id} does not exist`, 404));
	}
	let currentListingData = response.rows[0];

	if (
		currentListingData.userId != cityUserId &&
		currentUser.rows[0].roleId !== roles.Admin
	) {
		return next(
			new AppError(`You are not allowed to access this resource`, 403)
		);
	}

	database
		.deleteData(tables.LISTINGS_TABLE, { id }, cityId)
		.then((response) => {
			res.status(200).json({
				status: "success",
			});
		})
		.catch((err) => {
			return next(new AppError(err));
		});
});

module.exports = router;
