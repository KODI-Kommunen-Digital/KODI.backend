const roles = require("../constants/roles");
const listingService = require("../services/listings");
const { AppError } = require("../utils/appError");

const getAllListings = async (req, res, next) => {
    const params = req.query;
    const {
        pageNo = 1,
        pageSize = 9,
        sortByStartDate,
        statusId,
        subcategoryId,
        categoryId,
        cityId,
        translate,
        showExternalListings,
        startAfterDate,
        endBeforeDate,
        dateFilter,
        eventType,  // singleDay, multiDay, recurring (only for events category)
    } = params;
    const isAdmin = req.roleId === roles.Admin;
    try {
        const listings = await listingService.getAllListings({
            pageNo,
            pageSize,
            sortByStartDate,
            statusId,
            subcategoryId,
            categoryId,
            cityId,
            translate,
            showExternalListings,
            isAdmin,
            startAfterDate,
            endBeforeDate,
            dateFilter,
            eventType,
        });
        res.status(200).json({
            status: "success",
            data: listings,
        });
    } catch (err) {
        next(err);
    }
};

const searchListings = async (req, res, next) => {
    const params = req.query;
    const {
        pageNo = 1,
        pageSize = 9,
        sortByStartDate,
        statusId,
        cityId,
        searchQuery,
        categoryId,
        subcategoryId,
        eventType,  // singleDay, multiDay, recurring (only for events category)
        startAfterDate,
        endBeforeDate,
        dateFilter,
    } = params;
    const isAdmin = req.roleId === roles.Admin;

    try {
        const listings = await listingService.searchListings({
            pageNo,
            pageSize,
            sortByStartDate,
            statusId,
            cityId,
            searchQuery,
            categoryId,
            subcategoryId,
            eventType,
            startAfterDate,
            endBeforeDate,
            dateFilter,
            isAdmin,
        });

        res.status(200).json({
            status: "success",
            data: listings,
        });
    } catch (err) {
        next(err);
    }
};

const createListing = async (req, res, next) => {
    const { cityIds, ...listingData } = req.body;
    const { userId, roleId } = req;

    try {
        const newListing = await listingService.createListing({
            cityIds,
            listingData,
            userId,
            roleId,
        });
        if (req.version === "v0") {
            res.status(200).json({
                status: "success",
                id: newListing[0].listingId,
            });
        } else {
            res.status(200).json({
                status: "success",
                data: newListing,
            });
        }
    } catch (err) {
        next(err);
    }
};

const updateListing = async (req, res, next) => {
    const listingId = req.params.listingId;
    const { cityIds, ...listingData } = req.body;
    const { userId, roleId } = req;

    try {
        const updatedListing = await listingService.updateListing({
            listingId,
            cityIds,
            listingData,
            userId,
            roleId,
        });

        res.status(200).json({
            status: "success",
            data:
                req.version && req.version === "v0"
                    ? listingId
                    : updatedListing,
            id: Number(listingId),
        });
    } catch (err) {
        next(err);
    }
};

const getListingWithId = async function (req, res, next) {
    const id = req.params.id;
    const repeatedRequest = req.repeatedRequest;

    try {
        const data = await listingService.getListingWithId(id, repeatedRequest);
        if (req.version === "v0") {
            if (data && data.otherlogos) {
                data.otherLogos = data.otherlogos;
            } else if (data && data.otherLogos) {
                data.otherlogos = data.otherLogos;
            }
        }
        return res.status(200).json({
            status: "success",
            data,
        });
    } catch (err) {
        return next(err);
    }
};

const deleteListing = async function (req, res, next) {
    const id = req.params.id;
    const userId = req.userId;
    const roleId = req.roleId;
    try {
        await listingService.deleteListing(id, userId, roleId);
        return res.status(200).json({
            status: "success",
        });
    } catch (err) {
        return next(err);
    }
};

const updateListingStatus = async (req, res, next) => {
    const listingId = req.params.listingId;
    const { status } = req.body;
    const roleId = req.roleId;

    try {
        await listingService.updateListingStatus({
            id: listingId,
            roleId,
            newStatus: status,
        });
        return res.status(200).json({
            status: "success",
            id: Number(listingId),
        });
    } catch (err) {
        return next(err);
    }
};
const getListingChat = async (req, res, next) => {
    const listingId = req.params.listingId;
    const userId = req.userId; // interanal
    const roleId = req.roleId; // internal
    const params = req.query;
    const lastMessageId = params.lastMessageId; // optional
    const pageNo = params.pageNo || 1;
    const pageSize = params.pageSize || 10;
    const isReversed =
        params.isReversed && params.isReversed === "false" ? false : true;
    // check if the listing has a feeback status and then return chat
    try {
        const response = await listingService.getListingChat({
            userId,
            roleId,
            listingId,
            isReversed,
            lastMessageId,
            pageNo,
            pageSize,
        });
        return res.status(200).json({
            status: "success",
            data: response,
        });
    } catch (err) {
        return next(err);
    }
};
const postChatReaction = async (req, res, next) => {
    const listingId = req.params.listingId;
    const userId = req.userId;
    const roleId = req.roleId;
    const chatId = req.params.chatId;
    const { reaction } = req.body;
    try {
        const result = await listingService.postChatReaction({
            userId,
            chatId,
            roleId,
            reaction,
            listingId,
        });
        return res.status(200).json({
            status: "success",
            data: result,
        });
    } catch (err) {
        return next(err);
    }
};

const deleteChatReaction = async (req, res, next) => {
    const listingId = req.params.listingId;
    const userId = req.userId;
    const roleId = req.roleId;
    const chatId = req.params.chatId;
    try {
        const result = await listingService.deleteChatReaction({
            userId,
            chatId,
            roleId,
            listingId,
        });
        return res.status(200).json({
            status: "success",
            data: result,
        });
    } catch (err) {
        return next(err);
    }
};
const createListingChatNew = async (req, res, next) => {
    const listingId = req.params.listingId;
    const userId = req.userId;
    const roleId = req.roleId;
    const { message, parentId } = req.body;
    const file = req?.files?.file;

    try {
        const result = await listingService.handleUnifiedChat({
            userId,
            roleId,
            message,
            parentId,
            listingId,
            file,
        });
        return res.status(200).json({
            status: "success",
            data: result,
        });
    } catch (err) {
        console.log({ err });
        return next(err);
    }
};

const createListingChat = async (req, res, next) => {
    const listingId = req.params.listingId;
    const userId = req.userId;
    const roleId = req.roleId;
    const { message, parentId } = req.body;
    console.log({ message, parentId });

    try {
        const result = await listingService.createListingChat({
            userId,
            roleId,
            message,
            parentId,
            listingId,
        });
        return res.status(200).json({
            status: "success",
            data: result,
        });
    } catch (err) {
        return next(err);
    }
};

const chatUploadImage = async function (req, res, next) {
    const listingId = req.params.listingId;
    const userId = req.userId;
    const roleId = req.roleId;
    const { image } = req?.files;
    console.log({ listingId, userId, roleId, image });
    try {
        const result = await listingService.chatUploadImage(
            listingId,
            userId,
            roleId,
            image
        );
        res.status(200).json({
            status: "success",
            data: result,
        });
    } catch (err) {
        return next(err);
    }
};
const uploadImage = async function (req, res, next) {
    const listingId = req.params.id;
    const userId = req.userId;
    const roleId = req.roleId;
    const imageFiles = req?.files?.image;
    const imageList = req?.body?.image;
    try {
        await listingService.uploadImage(
            listingId,
            userId,
            roleId,
            imageFiles,
            imageList
        );
        res.status(200).json({
            status: "success",
        });
    } catch (err) {
        return next(err);
    }
};

const chatUploadPdf = async function (req, res, next) {
    const listingId = req.params.listingId;
    const userId = req.userId;
    const roleId = req.roleId;
    const { pdf } = req.files;

    try {
        const result = await listingService.chatUploadPdf(
            listingId,
            userId,
            roleId,
            pdf
        );
        return res.status(200).json({
            status: "success",
            data: result,
        });
    } catch (err) {
        return next(err);
    }
};
const uploadPDF = async function (req, res, next) {
    const listingId = req.params.id;
    const userId = req.userId;
    const roleId = req.roleId;
    const { pdf } = req.files;

    try {
        await listingService.uploadPDF(listingId, userId, roleId, pdf);
        return res.status(200).json({
            status: "success",
        });
    } catch (err) {
        return next(err);
    }
};

const deleteImage = async function (req, res, next) {
    const id = req.params.id;
    const userId = req.userId;
    const roleId = req.roleId;

    try {
        await listingService.deleteImage(id, userId, roleId);
        return res.status(200).json({
            status: "success",
        });
    } catch (err) {
        return next(err);
    }
};

const deletePDF = async function (req, res, next) {
    const id = req.params.id;
    const userId = req.userId;
    const roleId = req.roleId;

    try {
        await listingService.deletePDF(id, userId, roleId);
        return res.status(200).json({
            status: "success",
        });
    } catch (err) {
        return next(err);
    }
};

const vote = async function (req, res, next) {
    const listingId = req.params.id;
    const optionId = req.body.optionId;
    const vote = req.body.vote;

    try {
        const voteCount = await listingService.vote(listingId, optionId, vote);
        return res.status(200).json({
            status: "success",
            votes: voteCount,
        });
    } catch (err) {
        return next(err);
    }
};

const getPendingListingsCount = async (req, res, next) => {
    try {
        if (req.roleId !== roles.Admin) {
            return next(new AppError("Only admin users can access this endpoint", 403));
        }

        const count = await listingService.getPendingListingsCount();
        res.status(200).json({
            status: "success",
            data: {
                count
            }
        });
    } catch (err) {
        next(err);
    }
};

module.exports = {
    getAllListings,
    searchListings,
    createListing,
    updateListing,
    getListingWithId,
    deleteListing,
    updateListingStatus,
    createListingChat,
    createListingChatNew,
    getListingChat,
    postChatReaction,
    deleteChatReaction,
    chatUploadImage,
    uploadImage,
    chatUploadPdf,
    uploadPDF,
    deleteImage,
    deletePDF,
    vote,
    getPendingListingsCount,
};
