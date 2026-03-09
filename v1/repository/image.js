const imageDeleteMultiple = require("../utils/imageDeleteMultiple");
const database = require("../../services/database");

// const getUserImages = async (userId) => {
//     let imageList = await axios.get(
//         "https://" + process.env.BUCKET_NAME + "." + process.env.BUCKET_HOST,
//     );
//     imageList = JSON.parse(
//         parser.xml2json(imageList.data, { compact: true, spaces: 4 }),
//     );
//     return imageList.ListBucketResult.Contents.filter((obj) =>
//         obj.Key._text.includes("user_" + userId),
//     );
// };
const getUserImages = async (userId) => {
    const query = `
        SELECT logo
        FROM listing_images
        WHERE logo LIKE ?
    `;

    const prefix = `user_${userId}/%`;

    const {rows: images} = await database.callQuery(query, [prefix]);

    return images.map((img) => ({
        Key: img.logo
    }));
};

const deleteImage = async (userImageList, onSuccess, onFail) => {
    await imageDeleteMultiple(
        userImageList.map((image) => ({ Key: image.Key._text })),
        onSuccess,
        onFail,
    );
};

module.exports = {
    getUserImages,
    deleteImage,
};
