const getAllCitiesSwagger = require("./cities/getAllCities");
const createCityListingSwagger = require("./cityListings/createCityListing");
const deleteImageSchemaSwagger = require("./cityListings/deleteImage");
const deletePDFSchemaSwagger = require("./cityListings/deletePDF");
const getAllCityListingsSwagger = require("./cityListings/getAllCityListings");
const getCityListingByIdSwagger = require("./cityListings/getCityListingById");
const updateCityListingSwagger = require("./cityListings/updateCityListing");
const uploadImageSchemaSwagger = require("./cityListings/uploadImage");
const uploadPDFSwagger = require("./cityListings/uploadPDF");
const deleteLoggedInDevicesSwagger = require("./users/deleteLoggedInDevices");
const forgotPasswordSwagger = require("./users/forgotPassword");
const getLoginDevicesSwagger = require("./users/getAllLoginDevices");
const getAllUsersSwagger = require("./users/getAllUsers");
const getUserByIdDoc = require("./users/getUserById");
const deleteUserProfilePicSwagger = require("./users/imageDelete");
const imageUpoadSwagger = require("./users/imageUpload");
const loginUser = require("./users/loginUser");
const logoutSwagger = require("./users/logout");
const refreshTokenSchema = require("./users/refreshToken");
const registerUserSwagger = require("./users/registerUser");
const resetPasswordSwagger = require("./users/resetPassword");
const sendVerificaltionEmailSwagger = require("./users/sendVerificationEmail");
const updateUserSwagger = require("./users/updateUser");
const verifyEmailSwagger = require("./users/verifyEmail");

const apiDocumentation = {
    openapi: '3.0.1',
    info: {
        version: '1.3.0',
        title: 'KODI REST API - Documentation',
        description: `KODI - Kommunen Digital is a REST API that will be used to fetch data to and from the frontend. It provides digital citizen services and participation opportunities for cities, counties, and municipalities.`,
    },
    components: {
        securitySchemes: {
            bearerAuth: {
                type: 'http',
                scheme: 'bearer',
                bearerFormat: 'JWT',
            },
        },
    },
    servers: [
        {
            url: 'http://localhost:3001',
            description: 'Local Server',
        }
    ],
    tags: [
        {
            name: 'Users',
        },
        {
            name: 'Cities',
        },
        {
            name: 'City Listings',
        },
    ],
    paths: {
        '/users': {
            'get': getAllUsersSwagger
        },
        '/users/{id}': {
            'get': getUserByIdDoc,
            'patch': updateUserSwagger,
        },
        '/users/login': {
            'post': loginUser
        },
        '/users/register': {
            'post': registerUserSwagger,
        },
        '/users/{id}/refresh': {
            'post': refreshTokenSchema,
        },
        '/users/forgotPassword': {
            'post': forgotPasswordSwagger,
        },
        '/users/resetPassword': {
            'post': resetPasswordSwagger,
        },
        '/users/sendVerificationEmail': {
            'post': sendVerificaltionEmailSwagger,
        },
        '/users/verifyEmail': {
            'post': verifyEmailSwagger,
        },
        '/users/{id}/loginDevices': {
            'post': getLoginDevicesSwagger,
            'delete': deleteLoggedInDevicesSwagger,
        },
        '/users/{id}/imageUpload': {
            'post': imageUpoadSwagger,
        },
        '/users/{id}/imageDelete': {
            'delete': deleteUserProfilePicSwagger,
        },
        '/users/{id}/logout': {
            'post': logoutSwagger,
        },
        '/cities': {
            'get': getAllCitiesSwagger,
        },
        '/cities/{cityId}/listings': {
            'post': createCityListingSwagger,
            'get': getAllCityListingsSwagger,
        },
        '/cities/{cityId}/listings/{id}': {
            'get': getCityListingByIdSwagger,
            'patch': updateCityListingSwagger,
        },
        '/cities/{cityId}/listings/{id}/imageUpload': {
            'post': uploadImageSchemaSwagger,
        },
        '/cities/{cityId}/listings/{id}/imageDelete': {
            'delete': deleteImageSchemaSwagger,
        },
        '/cities/{cityId}/listings/{id}/pdfUpload': {
            'post': uploadPDFSwagger,
        },
        '/cities/{cityId}/listings/{id}/pdfDelete': {
            'delete': deletePDFSchemaSwagger,
        },
    }
};

module.exports = apiDocumentation;