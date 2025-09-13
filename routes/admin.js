const express = require("express");
const router = express.Router();
const database = require("../services/database");
const tables = require("../constants/tableNames");
const AppError = require("../utils/appError");
const authentication = require("../middlewares/authentication");
const roles = require("../constants/roles");
const errorCodes = require("../constants/errorCodes");
const cityAdminEmailDe = require("../emailTemplates/de/cityAdmin");
const cityAdminEmailEn = require("../emailTemplates/en/cityAdmin");
const sendMail = require("../services/sendMail");


router.get("/userlistings", authentication, async function (req, res, next) {
    try {
        if (req.roleId !== roles.Admin) {
            throw new AppError(`Not authorized`, 401);
        }

        const adminUsers = await userListings();
        
        res.status(200).json({
            status: "success",
            data: adminUsers,
        });
    } catch (error) {
        next(error);
    }
});

async function userListings() {
    let adminUsers = [];
    try {
        const { rows } = await database.get(
            tables.USER_ONBOARDING_TABLE,
            {},
            "email, roleId, createdAt, updatedAt, onBoarded",
            null,
            null,
            null,
            ["createdAt"],
            true
        );
        adminUsers = rows;
    } catch (err) {
        if (err instanceof AppError) throw err;
        throw new AppError(err);
    }
    return adminUsers;
}

router.post("/register", authentication, async function (req, res, next) {
    try {
        if (req.roleId !== roles.Admin) {
            throw new AppError(`Not authorized`, 401);
        }

        const payload = req.body;
        const {
            language = "de",
            email,
            citiesIds = [],
        } = payload;

        const insertionData = {
            roleId: roles["City Admin"],
        };

        if (!payload || (typeof payload === "object" && Object.keys(payload).length === 0)) {
            throw new AppError(`Empty payload sent`, 400);
        }
        if (!email || typeof email !== "string" || email.trim() === "") {
            throw new AppError(`Email not present`, 400);
        }
        if (!citiesIds) {
            throw new AppError(`Cities IDs not present`, 400);
        }
        if (!Array.isArray(citiesIds)) {
            throw new AppError(`Cities IDs should be an array`, 400);
        }
        if (citiesIds.length === 0) {
            throw new AppError(`Cities IDs should not be empty`, 400);
        }

        const Cities = await database.get(
            tables.CITIES_TABLE,
            {
                id: citiesIds
            },
            ["id", "name"]
        );

        const userExist = await database.get(
            tables.USER_TABLE,
            { email },
            ["id"]
        );

        if (userExist?.rows?.length > 0) {
            throw new AppError(`User already registered`, 400, errorCodes.USER_ALREADY_EXISTS);
        }

        const userOnboardingExist = await database.get(
            tables.USER_ONBOARDING_TABLE,
            { email },
            ["id"]
        );

        if (userOnboardingExist?.rows?.length > 0) {
            throw new AppError(`User already Onboarded`, 400, errorCodes.USER_ALREADY_EXISTS);
        }
        
        if (!Cities || !Cities.rows || Cities.rows.length === 0) {
            throw new AppError(`Cities not found`, 400, errorCodes.INVALID_CITY_IDS);
        }
        else if (Cities?.rows.length !== citiesIds.length) {
            const notFoundCityIds = citiesIds.filter(cityId => !Cities.rows.some(city => city.id === cityId));
            throw new AppError(`Following cities id's not found: ${notFoundCityIds?.join(",")}`, 400, errorCodes.INVALID_CITY_IDS);
        }
        else if (Cities?.rows.length > 0) {
            insertionData.cities = JSON.stringify(Cities.rows.map(city => city.id));
        }

        if (language !== "en" && language !== "de") {
            throw new AppError(`Incorrect language given`, 400, errorCodes.INVALID_LANGUAGE);
        }
        try {
            insertionData.email = email;
            await database.create(tables.USER_ONBOARDING_TABLE, insertionData);
            
            // Send registration email
            const registrationLink = `${process.env.WEBSITE_DOMAIN}/Register`;
            const cityNames = Cities.rows.map(city => city.name).join(', ');
            
            const emailContent = language === "en" 
                ? cityAdminEmailEn(registrationLink, cityNames) 
                : cityAdminEmailDe(registrationLink, cityNames);

            await sendMail(email, emailContent.subject, undefined, emailContent.body);
            
            return res.status(201).json({ 
                status: "success",
                data: {
                    email,
                    message: 'Registration successful. Please check your email to complete the registration process.'
                }
            });
            
        } catch (err) {
            database.delete(tables.USER_ONBOARDING_TABLE, { email });
            if (err instanceof AppError) throw err;
            throw new AppError(err);
        }
    } catch (error) {
        next(error);
    }
});

router.get("/:UserId/cityAdmin", async function (req, res, next) {
    const filter = {};
    const userId = req.params.UserId;

    const user = await database.get(tables.USER_TABLE, {
        id: userId,
    });
    if (user.rows.length === 0) {
        throw new AppError(`User not found`, 404);
    }
    if (user.rows[0].roleId !== roles.Admin) {
        const cityUserRoles = await database.get(tables.CITY_USER_ROLES_TABLE, {
            userId,
        });
        const cities = cityUserRoles.rows.map((cityUserRole) => cityUserRole.cityId);
        filter.id = cities;
    }

    database
        .get(tables.CITIES_TABLE, filter, "id,name,image, hasForum", null, null, null, [
            "name",
        ])
        .then((response) => {
            const data = response.rows;
            res.status(200).json({
                status: "success",
                data,
            });
        })
        .catch((err) => {
            return next(new AppError(err));
        });
});

module.exports = router;