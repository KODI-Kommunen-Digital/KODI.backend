const getAllCategoriesSwagger = require("./categories/getAllCategories");
const getCategoriesListingCountSwagger = require("./categories/getCategoriesListingCount");
const getSubCategoriesSwagger = require("./categories/getSubCategories");
const getAllCitiesSwagger = require("./cities/getAllCities");
const getAllCitizenServicesSwagger = require("./citizenService/getCitizenServices");
const getDigitalManagementSwagger = require("./citizenService/getDigitalManagement");
const createCityListingSwagger = require("./cityListings/createCityListing");
const deleteCityListingSchemaSwagger = require("./cityListings/deleteCityListing");
const deleteImageSchemaSwagger = require("./cityListings/deleteImage");
const deletePDFSchemaSwagger = require("./cityListings/deletePDF");
const getAllCityListingsSwagger = require("./cityListings/getAllCityListings");
const getCityListingByIdSwagger = require("./cityListings/getCityListingById");
const updateCityListingSwagger = require("./cityListings/updateCityListing");
const uploadImageSchemaSwagger = require("./cityListings/uploadImage");
const uploadPDFSwagger = require("./cityListings/uploadPDF");
const contactUsSwagger = require("./contactUs/contactUs");
const createFavoriteListingSwagger = require("./favorites/addNewFavoritesForUser");
const deleteFavoriteListingSwagger = require("./favorites/deleteFavoriteListingsForUser");
const getFavoriteListingsSwagger = require("./favorites/getAllFavoriteListingsForUser");
const getFavoritesSwagger = require("./favorites/getAllFavoritesForUser");
const getAllListingsSwagger = require("./listings/getAllListings");
const getMoreInfoSwagger = require("./moreInfo/getMoreInfo");
const getAllStatusesSwagger = require("./status/getAllStatuses");
const deleteLoggedInDevicesSwagger = require("./users/deleteLoggedInDevices");
const deleteUserByIdSwagger = require("./users/deleteUserById");
const forgotPasswordSwagger = require("./users/forgotPassword");
const getLoginDevicesSwagger = require("./users/getAllLoginDevices");
const getAllUsersSwagger = require("./users/getAllUsers");
const getUserByIdDoc = require("./users/getUserById");
const getUserListings = require("./users/getUserListings");
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
const getVillegesSwagger = require("./villages/getVillages");
const getAds = require("./ads/getAds");
const getSearchListingsSwagger = require("./listings/getSearchListingsSwagger");
const createListingSwagger = require("./listings/postListingSwagger");
const getStreetsSwagger = require("./wasteCalender/getStreetsSwagger");
const getWasteTypesSwagger = require('./wasteCalender/getWasteTypesSwagger');
const getPickupDatesSwagger = require('./wasteCalender/getPickupDatesSwagger');
const createDefectReport = require('./defectReport/createDefectReport');
const voteOnListingSwagger = require('./cityListings/voteOnListingSwagger')

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
            url: process.env.BASE_URL,
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
        {
            name: 'Ads',
        },
    ],
    paths: {
        '/users': {
            'get': getAllUsersSwagger
        },
        '/users/{id}': {
            'get': getUserByIdDoc,
            'patch': updateUserSwagger,
            'delete': deleteUserByIdSwagger,
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
        '/users/{id}/listings': {
            'get': getUserListings,
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
            'delete': deleteCityListingSchemaSwagger,
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
        '/cities/{cityId}/listings/:id/vote': {
            'post': voteOnListingSwagger,
        },
        '/listings': {
            'get': getAllListingsSwagger,
        },
        '/listings/search': {
            'get': getSearchListingsSwagger,
        },
        '/listings/': {
            'post': createListingSwagger
        },
        '/categories': {
            'get': getAllCategoriesSwagger,
        },
        '/categories/{id}/subcategories': {
            'get': getSubCategoriesSwagger,
        },
        '/categories/listingsCount': {
            'get': getCategoriesListingCountSwagger,
        },
        '/status': {
            'get': getAllStatusesSwagger,
        },
        '/citizenServices': {
            'get': getAllCitizenServicesSwagger,
        },
        '/citizenServices/digitalManagement': {
            'get': getDigitalManagementSwagger,
        },
        '/contactUs': {
            'post': contactUsSwagger,
        },
        '/moreinfo': {
            'get': getMoreInfoSwagger,
        },
        '/users/{userId}/favorites': {
            'get': getFavoritesSwagger,
            'post': createFavoriteListingSwagger,
        },
        '/users/{userId}/favorites/listings': {
            'get': getFavoriteListingsSwagger,
        },
        '/users/{userId}/favorites/{id}': {
            'delete': deleteFavoriteListingSwagger,
        },
        '/cities/{cityId}/villages': {
            'get': getVillegesSwagger,
        },
        '/ads/' :{
            'get': getAds,
        },
        ...(process.env.ENABLE_WASTE_CALENDER === 'True' && {
            '/cities/:cityId/wasteCalender/streets': { 'get': getStreetsSwagger },
            '/cities/:cityId/wasteCalender/wasteTypes': { 'get': getWasteTypesSwagger },
            '/cities/:cityId/wasteCalender/streets/:streetId/pickupDates': { 'get': getPickupDatesSwagger },
        }),
        ...(process.env.ENABLE_DEFECT_REPORT === 'True' && {
            '/reportDefect': { 'post': createDefectReport },
        }),
    }
};

module.exports = apiDocumentation;