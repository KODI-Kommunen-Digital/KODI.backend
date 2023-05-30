module.exports = function (message, stack, time) {
    return {
        "content": `There was an uncaught exception in your NodeAPI at ${time}`,
        "embeds": [
          {
            "title": message,
            "description": stack,
            "color": 16515072
          }
        ]
      }
}