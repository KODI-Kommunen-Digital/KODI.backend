const AppError = require("../utils/appError");
// const crypto = require("crypto");
const errorCodes = require("../constants/errorCodes");
const roles = require("../constants/roles");
// const usersRepository = require("../repository/userRepo");
const adminRepository = require("../repository/adminRepo");
const sendMail = require("../utils/sendMail");
const db = require("../utils/database")
const tableNames = require("../constants/tableNames");
const cityAdminEmailEn = require("../emailTemplates/en/cityAdmin");
const cityAdminEmailDe = require("../emailTemplates/de/cityAdmin");

const userListingsById = async function (userId) {
    try {
        let data = [];
        if (userId) {
            data = await db.callQuery(`
                SELECT u.id as userId, u.username as username, uo.*
                FROM users u
                right JOIN users_onboarded uo ON u.email = uo.email where u.id = ${userId};`)
        }
        return data;
    } catch (err) {
        if (err instanceof AppError) throw err;
        throw new AppError(err);
    }
};

const register = async function (payload, translateLang) {
    const {
        language = "de",
        email,
        citiesIds = [],
    } = payload;

    const insertionData = {
        roleId: roles["City Admin"],
    };

    if (!payload || (typeof payload === "object" && Object.keys(payload).length === 0)) {
        throw new AppError(`Empty payload sent`, 400, errorCodes.EMPTY_PAYLOAD);
    }
    if (!email || typeof email !== "string" || email.trim() === "") {
        throw new AppError(`Email not present`, 400, errorCodes.MISSING_EMAIL);
    }
    if (!citiesIds) {
        throw new AppError(`Cities IDs not present`, 400, errorCodes.MISSING_CITY_IDS);
    }
    if (!Array.isArray(citiesIds)) {
        throw new AppError(`Cities IDs should be an array`, 400, errorCodes.INVALID_CITY_IDS);
    }
    if (citiesIds.length === 0) {
        throw new AppError(`Cities IDs should not be empty`, 400, errorCodes.INVALID_CITY_IDS);
    }

    const Cities = await db.get(
        tableNames.CITIES_TABLE,
        [
            {
                key: "id",
                sign: "in",
                value: citiesIds
            }
        ],
        ["id", "name"]);
    
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
        throw new AppError(
            `Incorrect language given`,
            400,
            errorCodes.INVALID_LANGUAGE,
        );
    }

    const connection = await adminRepository.createTransaction();
    try {
        insertionData.email = email;
        await adminRepository.createWithTransaction({
            data: insertionData
        }, connection);
        
        // Send registration email
        const registrationLink = `${process.env.WEBSITE_DOMAIN}/Register`;
        const cityNames = Cities.rows.map(city => city.name).join(', ');
        
        const emailContent = language === "en" ? cityAdminEmailEn(registrationLink, cityNames) : cityAdminEmailDe(registrationLink, cityNames);

        await sendMail(email,emailContent.subject, undefined, emailContent.body);

        await adminRepository.commitTransaction(connection);
        return { 
            email,
            message: 'Registration successful. Please check your email to complete the registration process.'
        };
    } catch (err) {
        await adminRepository.rollbackTransaction(connection);
        if (err instanceof AppError) throw err;
        throw new AppError(err);
    }
};

const userListings = async function (pageNo, pageSize) {
    let adminUsers = [];
    try {
        const Data = await adminRepository.getAll({
            columns: "email, roleId, createdAt, updatedAt, onBoarded",
            orderBy: ["createdAt"],
            isDescending: true,
            pageNo,
            pageSize
        });
        adminUsers = Data.rows;
    } catch (err) {
        if (err instanceof AppError) throw err;
        throw new AppError(err);
    }
    return adminUsers;
};

module.exports = {
    register,
    userListings,
    userListingsById
};
