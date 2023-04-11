const express = require("express");
const router = express.Router();
const database = require("../services/database");
const sendMail = require("../services/sendMail");
const tables = require("../constants/tableNames");
const storedProcedures = require("../constants/storedProcedures");
const AppError = require("../utils/appError");
const tokenUtil = require("../utils/token");
const fs = require("fs");
const authentication = require("../middlewares/authentication");
const bcrypt = require("bcrypt");
const crypto = require("crypto");
const axios = require("axios");

router.post("/login", async function (req, res, next) {
	var payload = req.body;
	var sourceAddress =
		req.headers["x-forwarded-for"]?.split(",").shift() ||
		req.socket?.remoteAddress;
	requestObject = {};

	if (!payload) {
		return next(new AppError(`Empty payload sent`, 400));
	}

	if (!payload.username) {
		return next(new AppError(`Username is not present`, 400));
	}

	if (!payload.password) {
		return next(new AppError(`Password is not present`, 400));
	}

	try {
		const users = await database.get(tables.USER_TABLE, {
			username: payload.username,
		});
		if (!users || !users.rows || users.rows.length == 0) {
			return next(new AppError(`Invalid username`, 401));
		}

		const userData = users.rows[0];
		if (!userData.emailVerified) {
			return next(
				new AppError(
					`Verification email sent to you email. Please verify first before trying to login.`,
					401
				)
			);
		}

		const correctPassword = await bcrypt.compare(
			payload.password,
			userData.password
		);
		if (!correctPassword) {
			return next(new AppError(`Invalid password`, 401));
		}

		const userMappings = await database.get(
			tables.USER_CITYUSER_MAPPING_TABLE,
			{ userId: userData.id },
			"cityId, cityUserId"
		);
		var tokens = tokenUtil.generator({
			userId: userData.id,
			roleId: userData.roleId,
			rememberMe: payload.rememberMe,
		});
		var insertionData = {
			userId: userData.id,
			sourceAddress,
			refreshToken: tokens.refreshToken,
		};

		await database.create(tables.REFRESH_TOKENS_TABLE, insertionData);
		res.status(200).json({
			status: "success",
			data: {
				cityUsers: userMappings.rows,
				userId: userData.id,
				accessToken: tokens.accessToken,
				refreshToken: tokens.refreshToken,
			},
		});
	} catch (err) {
		return next(new AppError(err));
	}
});

router.post("/register", async function (req, res, next) {
	var payload = req.body;
	var insertionData = {};
	if (!payload) {
		return next(new AppError(`Empty payload sent`, 400));
	}
	var language = payload.language || "de";
	if (language != "en" && language != "de") {
		return next(new AppError(`Incorrect language given`, 400));
	}
	if (!payload.username) {
		return next(new AppError(`Username is not present`, 400));
	} else {
		try {
			var response = await database.get(tables.USER_TABLE, {
				username: payload.username,
			});
			let data = response.rows;
			console.log(data);
			if (data && data.length > 0) {
				return next(
					new AppError(
						`User with username '${payload.username}' already exists`,
						400
					)
				);
			}
		} catch (err) {
			return next(new AppError(err));
		}
		insertionData.username = payload.username;
	}

	if (!payload.email) {
		return next(new AppError(`Email is not present`, 400));
	} else {
		try {
			var response = await database.get(tables.USER_TABLE, {
				email: payload.email,
			});
			let data = response.rows;
			if (data && data.length > 0) {
				return next(
					new AppError(
						`User with email '${payload.email}' is already registered`,
						400
					)
				);
			}
		} catch (err) {
			return next(new AppError(err));
		}
		insertionData.email = payload.email;
	}

	if (!payload.role) {
		return next(new AppError(`Role is not present`, 400));
	} else {
		try {
			var response = await database.get(tables.ROLES_TABLE, {
				id: payload.role,
			});
			let data = response.rows;
			if (data && data.length <= 0) {
				return next(new AppError(`Invalid role '${payload.role}' given`, 400));
			}
		} catch (err) {
			return next(new AppError(err));
		}
		insertionData.roleId = payload.role;
	}

	if (!payload.firstname) {
		return next(new AppError(`Firstname is not present`, 400));
	} else {
		insertionData.firstname = payload.firstname;
	}

	if (!payload.lastname) {
		return next(new AppError(`Lastname is not present`, 400));
	} else {
		insertionData.lastname = payload.lastname;
	}

	if (!payload.password) {
		return next(new AppError(`Password is not present`, 400));
	} else {
		insertionData.password = await bcrypt.hash(
			payload.password,
			Number(process.env.SALT)
		);
	}

	if (payload.email) {
		insertionData.email = payload.email;
	}

	if (payload.phoneNumber) {
		insertionData.website = payload.website;
	}

	if (payload.image) {
		insertionData.website = payload.website;
	}

	if (payload.description) {
		insertionData.description = payload.description;
	}

	if (payload.website) {
		insertionData.website = payload.website;
	}

	try {
		var response = await database.create(tables.USER_TABLE, insertionData);
		var userId = response.id;
		var now = new Date();
		now.setHours(now.getHours() + 24);
		var token = crypto.randomBytes(32).toString("hex");
		var tokenData = {
			userId,
			token,
			expiresAt: now.toISOString().slice(0, 19).replace("T", " "),
		};
		await database.create(tables.VERIFICATION_TOKENS_TABLE, tokenData);
		const verifyEmail = require(`../emailTemplates/${language}/verifyEmail`);
		var { subject, body } = verifyEmail(
			insertionData.firstname,
			insertionData.lastname,
			token,
			userId
		);
		await sendMail(insertionData.email, subject, null, body);

		res.status(200).json({
			status: "success",
			id: userId,
		});
	} catch (err) {
		return next(new AppError(err));
	}
});

router.get("/:id", authentication, async function (req, res, next) {
	const id = req.params.id;
	if (isNaN(Number(id)) || Number(id) <= 0) {
		next(new AppError(`Invalid UserId ${id}`, 404));
		return;
	}

	database
		.get(tables.USER_TABLE, { id })
		.then((response) => {
			let data = response.rows;
			if (!data || data.length == 0) {
				return next(new AppError(`User with id ${id} does not exist`, 404));
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

router.patch("/:id", authentication, async function (req, res, next) {
	var id = req.params.id;
	var payload = req.body;
	var updationData = {};

	if (isNaN(Number(id)) || Number(id) <= 0) {
		next(new AppError(`Invalid UserId ${id}`, 404));
		return;
	}
	id = Number(id);

	if (id != req.userId) {
		return next(
			new AppError(`You are not allowed to access this resource`, 403)
		);
	}

	var response = await database.get(tables.USER_TABLE, { id });
	if (!response.rows || response.rows.length == 0) {
		return next(new AppError(`User with id ${id} does not exist`, 404));
	}

	let currentUserData = response.rows[0];

	if (payload.username != currentUserData.username) {
		return next(new AppError(`Username cannot be edited`, 400));
	}

	if (payload.email && payload.email != currentUserData.email) {
		let re =
			/^(([^<>()\[\]\\.,;:\s@"]+(\.[^<>()\[\]\\.,;:\s@"]+)*)|(".+"))@((\[[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}])|(([a-zA-Z\-0-9]+\.)+[a-zA-Z]{2,}))$/;
		if (!re.test(payload.email)) {
			return next(new AppError(`Invalid email given`, 400));
		}
		updationData.email = payload.email;
	}

	if (payload.firstname) {
		updationData.firstname = payload.firstname;
	}

	if (payload.newPassword) {
		if (!payload.currentPassword) {
			return next(
				new AppError(`Current password not given to update password`, 400)
			);
		}
		if (!bcrypt.compare(payload.currentPassword, currentUserData.password)) {
			return next(new AppError(`Incorrect current password given`, 401));
		}
		updationData.password = await bcrypt.hash(
			payload.newPassword,
			Number(process.env.SALT)
		);
	}

	if (payload.lastname) {
		updationData.lastname = payload.lastname;
	}

	if (payload.email) {
		updationData.email = payload.email;
	}

	if (payload.phoneNumber) {
		updationData.phoneNumber = payload.phoneNumber;
	}

	if (payload.image) {
		updationData.website = payload.website;
	}

	if (payload.description) {
		updationData.description = payload.description;
	}

	if (payload.website) {
		updationData.website = payload.website;
	}

	database
		.update(tables.USER_TABLE, updationData, { id })
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

	if (isNaN(Number(id)) || Number(id) <= 0) {
		next(new AppError(`Invalid UserId ${id}`, 404));
		return;
	}

	if (id != req.userId) {
		return next(
			new AppError(`You are not allowed to access this resource`, 403)
		);
	}

	try {
		var response = await database.get(tables.USER_TABLE, { id });
		let data = response.rows;
		if (data && data.length == 0) {
			return next(new AppError(`User with id ${id} does not exist`, 404));
		}

		var filePath = `./${process.env.imagePath}/user_${id}`;
		fs.rmSync(filePath, { recursive: true, force: true });

		var response = await database.callStoredProcedure(
			storedProcedures.DELETE_USER,
			[id]
		);

		res.status(200).json({
			status: "success",
		});
	} catch (err) {
		return next(new AppError(err));
	}
});

router.post(
	"/:id/imageUpload",
	authentication,
	async function (req, res, next) {
		const id = req.params.id;

		if (isNaN(Number(id)) || Number(id) <= 0) {
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
			if (id != req.userId) {
				return next(
					new AppError(`You are not allowed to access this resource`, 403)
				);
			}

			var filePath = `user_${id}/${Date.now()}.` + image.name.split(".")[1];
			const formData = new FormData();
			formData.append(
				"image",
				new Blob([new Uint8Array(image.data)], { type: image.mimetype }),
				{
					filename: image.name,
					contentType: image.mimetype,
					knownLength: image.size,
				}
			);
			var utcDate = new Date().toUTCString();

			var stringToSign = `PUT\n\nmultipart/form-data\n${utcDate}\n/${process.env.BUCKET_NAME}/${filePath}`;
			stringToSign = stringToSign.toString("utf8");

			var secretKey = crypto
				.createHmac("sha1", process.env.BUCKET_SECRET_KEY)
				.update(stringToSign);
			secretKey = secretKey.digest("base64");

			var headers = {
				Authorization: `OBS ${process.env.BUCKET_ACCESS_KEY}:${secretKey}`,
				contentType: "multipart/form-data",
				Date: utcDate,
			};

			await axios.put(
				`${process.env.BUCKET_HOST}/${filePath}`,
				formData,
				headers
			);

			res.status(200).json({
				status: "success",
				path: filePath,
			});
		} catch (err) {
			return next(new AppError(err));
		}
	}
);

router.get("/:id/listings", authentication, async function (req, res, next) {
	const id = req.params.id;
	if (isNaN(Number(id)) || Number(id) <= 0) {
		next(new AppError(`Invalid UserId ${id}`, 404));
		return;
	}

	if (id != req.userId) {
		return next(
			new AppError(`You are not allowed to access this resource`, 403)
		);
	}

	try {
		var response = await database.get(tables.USER_TABLE, { id });
		var data = response.rows;
		if (data && data.length == 0) {
			return next(new AppError(`User with id ${id} does not exist`, 404));
		}

		var cityUsers = await database.get(tables.USER_CITYUSER_MAPPING_TABLE, {
			userId: id,
		});
		data = cityUsers.rows;
		let allListings = [];
		for (var element of data) {
			var cityListings = await database.get(
				tables.LISTINGS_TABLE,
				{ userId: element.cityUserId },
				null,
				element.cityId
			);
			allListings.push(
				...cityListings.rows.map((listings) => ({
					...listings,
					cityId: element.cityId,
				}))
			);
		}

		res.status(200).json({
			status: "success",
			data: allListings,
		});
	} catch (err) {
		return next(new AppError(err));
	}
});

router.post("/:id/refresh", async function (req, res, next) {
	const userId = req.params.id;
	var sourceAddress =
		req.headers["x-forwarded-for"]?.split(",").shift() ||
		req.socket?.remoteAddress;

	if (isNaN(Number(userId)) || Number(userId) <= 0) {
		next(new AppError(`Invalid UserId ${userId}`, 404));
		return;
	}

	try {
		var refreshToken = req.body.refreshToken;
		if (!refreshToken) {
			return next(new AppError(`Refresh token not present`, 400));
		}

		const decodedToken = tokenUtil.verify(
			refreshToken,
			process.env.REFRESH_PUBLIC,
			next
		);
		if (decodedToken.userId != userId) {
			return next(new AppError(`Invalid refresh token`, 403));
		}

		var response = await database.get(tables.REFRESH_TOKENS_TABLE, {
			refreshToken,
		});
		var data = response.rows;
		if (data && data.length == 0) {
			return next(new AppError(`Invalid refresh token`, 400));
		}

		if (data[0].userId != userId) {
			return next(new AppError(`Invalid refresh token`, 400));
		}
		const newTokens = tokenUtil.generator({
			userId: decodedToken.userId,
			roleId: decodedToken.roleId,
		});
		var insertionData = {
			userId,
			sourceAddress,
			refreshToken: newTokens.refreshToken,
		};
		await database.deleteData(tables.REFRESH_TOKENS_TABLE, { id: data[0].id });
		await database.create(tables.REFRESH_TOKENS_TABLE, insertionData);

		res.status(200).json({
			status: "success",
			data: {
				accessToken: newTokens.accessToken,
				refreshToken: newTokens.refreshToken,
			},
		});
	} catch (error) {
		if (error.name == "TokenExpiredError") {
			await database.deleteData(tables.REFRESH_TOKENS_TABLE, {
				token: refreshToken,
			});
			return next(new AppError(`Unauthorized! Token was expired!`, 401));
		}
		return next(new AppError(error));
	}
});

router.post("/forgotPassword", async function (req, res, next) {
	const username = req.body.username;
	const language = req.body.language || "de";

	if (!username) {
		return next(new AppError(`Username not present`, 400));
	}

	if (language != "en" && language != "de") {
		return next(new AppError(`Incorrect language given`, 400));
	}

	try {
		var response = await database.get(tables.USER_TABLE, { username });
		var data = response.rows;
		if (data && data.length == 0) {
			return next(new AppError(`Username ${username} does not exist`, 404));
		}
		var user = data[0];

		var response = await database.deleteData(
			tables.FORGOT_PASSWORD_TOKENS_TABLE,
			{ userId: user.id }
		);

		var now = new Date();
		now.setMinutes(now.getMinutes() + 30);
		var token = crypto.randomBytes(32).toString("hex");
		var tokenData = {
			userId: user.id,
			token,
			expiresAt: now.toISOString().slice(0, 19).replace("T", " "),
		};
		var response = await database.create(
			tables.FORGOT_PASSWORD_TOKENS_TABLE,
			tokenData
		);

		const resetPasswordEmail = require(`../emailTemplates/${language}/resetPasswordEmail`);
		var { subject, body } = resetPasswordEmail(
			user.firstname,
			user.lastname,
			token,
			user.id
		);
		await sendMail(user.email, subject, null, body);
		res.status(200).json({
			status: "success",
		});
	} catch (err) {
		return next(new AppError(err));
	}
});

router.post("/resetPassword", async function (req, res, next) {
	const userId = req.body.userId;
	const language = req.body.language || "de";
	const token = req.body.token;
	const password = req.body.password;

	if (!userId) {
		return next(new AppError(`Username not present`, 400));
	}

	if (!token) {
		return next(new AppError(`Token not present`, 400));
	}

	if (!password) {
		return next(new AppError(`Password not present`, 400));
	}

	if (language != "en" && language != "de") {
		return next(new AppError(`Incorrect language given`, 400));
	}

	try {
		var response = await database.get(tables.USER_TABLE, { id: userId });
		var data = response.rows;
		if (data && data.length == 0) {
			return next(new AppError(`UserId ${userId} does not exist`, 400));
		}
		var user = data[0];

		response = await database.get(tables.FORGOT_PASSWORD_TOKENS_TABLE, {
			userId,
			token,
		});
		data = response.rows;
		if (data && data.length == 0) {
			return next(new AppError(`Invalid data sent`, 400));
		}
		var tokenData = data[0];
		await database.deleteData(tables.FORGOT_PASSWORD_TOKENS_TABLE, {
			userId,
			token,
		});
		if (tokenData.expiresAt < new Date().toISOString()) {
			return next(new AppError(`Token Expired`, 400));
		}

		var hashedPassword = await bcrypt.hash(password, Number(process.env.SALT));
		await database.update(
			tables.USER_TABLE,
			{ password: hashedPassword },
			{ id: userId }
		);

		const passwordResetDone = require(`../emailTemplates/${language}/passwordResetDone`);
		var { subject, body } = passwordResetDone(user.firstname, user.lastname);
		await sendMail(user.email, subject, null, body);
		res.status(200).json({
			status: "success",
		});
	} catch (err) {
		return next(new AppError(err));
	}
});

router.post("/sendVerificationEmail", async function (req, res, next) {
	const email = req.body.email;
	const language = req.body.language || "de";

	if (!email) {
		return next(new AppError(`Email not present`, 400));
	}

	if (language != "en" && language != "de") {
		return next(new AppError(`Incorrect language given`, 400));
	}

	try {
		var response = await database.get(tables.USER_TABLE, { email });
		var data = response.rows;
		if (data && data.length == 0) {
			return next(new AppError(`Email ${email} does not exist`, 400));
		}
		var user = data[0];
		if (user.emailVerified) {
			return next(new AppError(`Email already verified`, 400));
		}

		await database.deleteData(tables.VERIFICATION_TOKENS_TABLE, {
			userId: user.id,
		});

		var now = new Date();
		now.setHours(now.getHours() + 24);
		var token = crypto.randomBytes(32).toString("hex");
		var tokenData = {
			userId: user.id,
			token,
			expiresAt: now.toISOString().slice(0, 19).replace("T", " "),
		};
		await database.create(tables.VERIFICATION_TOKENS_TABLE, tokenData);
		const verifyEmail = require(`../emailTemplates/${language}/verifyEmail`);
		var { subject, body } = verifyEmail(
			user.firstname,
			user.lastname,
			token,
			user.id,
			language
		);
		await sendMail(user.email, subject, null, body);
		res.status(200).json({
			status: "success",
		});
	} catch (err) {
		return next(new AppError(err));
	}
});

router.post("/verifyEmail", async function (req, res, next) {
	const userId = req.body.userId;
	const language = req.body.language || "de";
	const token = req.body.token;

	if (!userId) {
		return next(new AppError(`Username not present`, 400));
	}

	if (!token) {
		return next(new AppError(`Token not present`, 400));
	}

	if (language != "en" && language != "de") {
		return next(new AppError(`Incorrect language given`, 400));
	}

	try {
		var response = await database.get(tables.USER_TABLE, { id: userId });
		var data = response.rows;
		if (data && data.length == 0) {
			return next(new AppError(`UserId ${userId} does not exist`, 400));
		}
		var user = data[0];
		if (user.emailVerified) {
			return next(new AppError(`Email already verified`, 400));
		}

		response = await database.get(tables.VERIFICATION_TOKENS_TABLE, {
			userId,
			token,
		});
		data = response.rows;
		if (data && data.length == 0) {
			return next(new AppError(`Invalid data sent`, 400));
		}
		var tokenData = data[0];
		await database.deleteData(tables.VERIFICATION_TOKENS_TABLE, {
			userId,
			token,
		});
		if (tokenData.expiresAt < new Date().toISOString()) {
			return next(
				new AppError(`Token Expired, send verification mail again`, 400)
			);
		}

		await database.update(
			tables.USER_TABLE,
			{ emailVerified: true },
			{ id: userId }
		);

		const verificationDone = require(`../emailTemplates/${language}/verificationDone`);
		var { subject, body } = verificationDone(user.firstname, user.lastname);
		await sendMail(user.email, subject, null, body);
		res.status(200).json({
			status: "success",
		});
	} catch (err) {
		return next(new AppError(err));
	}
});

router.post("/:id/logout", authentication, async function (req, res, next) {
	userId = req.params.id;

	if (userId != req.userId) {
		return next(
			new AppError(`You are not allowed to access this resource`, 403)
		);
	}
	if (!req.body.refreshToken) {
		new AppError(`Refresh Token not sent`, 403);
	}
	database
		.get(tables.REFRESH_TOKENS_TABLE, { refreshToken: req.body.refreshToken })
		.then(async (response) => {
			let data = response.rows;
			if (!data || data.length == 0) {
				return next(
					new AppError(
						`User with id ${req.body.refreshToken} does not exist`,
						404
					)
				);
			}
			await database.deleteData(tables.REFRESH_TOKENS_TABLE, {
				userId,
				refreshToken: req.body.refreshToken,
			});
			res.status(200).json({
				status: "success",
			});
		})
		.catch((err) => {
			return next(new AppError(err));
		});
});

module.exports = router;
