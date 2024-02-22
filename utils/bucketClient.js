const axios = require('axios');
const parser = require("xml-js");

async function fetchUserImages(userId, cityId, id) {
    const apiUrl = constructApiUrl();
    const imageList = await fetchImageList(apiUrl);
    const userImageList = filterUserImages(imageList, userId, cityId, id);
    return userImageList;
}

function constructApiUrl() {
    return `https://${process.env.BUCKET_NAME}.${process.env.BUCKET_HOST}`;
}

async function fetchImageList(apiUrl) {
    const response = await axios.get(apiUrl);
    const jsonResult = parser.xml2json(response.data, { compact: true, spaces: 4 });
    return JSON.parse(jsonResult).ListBucketResult.Contents;
}

function filterUserImages(imageList, userId, cityId, id) {
    const filterCondition = `user_${userId}/city_${cityId}_listing_${id}`;
    return imageList.filter(obj => obj.Key._text.includes(filterCondition));
}

module.exports = {
    fetchUserImages,
};
