async function extractCityIdFromURL(url) {
    const regex = /\/cities\/(\d+)\/villages/;
    const match = regex.exec(url);
    if (match && match[1]) {
        return match[1];
    } else {
        return null;
    }
}

module.exports =extractCityIdFromURL;