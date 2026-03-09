const database = require("../../services/database");

async function fetchUserImages(userId, cityId, listingId) {
    const {rows: images} = await fetchImageList(userId, cityId, listingId);
    return filterUserImages(images);
}

async function fetchImageList(userId, cityId, listingId) {
    const query = `
        SELECT logo
        FROM listing_images
        WHERE logo LIKE ?
    `;

    const prefix = `user_${userId}/city_${cityId}_listing_${listingId}`;

    return database.callQuery(query, [prefix]);
}

function filterUserImages(imageList) {
    return imageList.map((img) => ({
        Key: img.logo
    }));
}

module.exports = {
    fetchUserImages,
};
