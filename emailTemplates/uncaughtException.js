module.exports = function (app, message, stack, time, sentryUrl) {
    return {
        "content": `There was an uncaught exception in your ${app} NodeAPI at ${time}`,
        "embeds": [
            {
                "title": message,
                "description": stack,
                "color": 16515072,
                "url": sentryUrl
            }
        ]
    }
}