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
        OR logo LIKE ?
    `;

    const prefix1 = `user_${userId}/city_${cityId}_listing_${listingId}/%`;
    const prefix2 = `user_${userId}/listing_${listingId}/%`;

    return database.callQuery(query, [prefix1, prefix2]);
}

function filterUserImages(imageList) {
    return imageList.map((img) => ({
        Key: img.logo
    }));
}

module.exports = {
    fetchUserImages,
};
