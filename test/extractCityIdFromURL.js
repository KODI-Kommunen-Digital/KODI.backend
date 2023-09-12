async function extractCityIdFromURL(url) {
    // Define a regular expression to match the cityId
    const regex = /\/cities\/(\d+)\/villages/;
    const match = regex.exec(url);
    if (match && match[1]) {
        return match[1];
    } else {
        return null;
    }
}

module.exports =extractCityIdFromURL;