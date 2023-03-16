module.exports = function (message, stack, time) {
    return {
        subject: "There was an uncaught exception in your NodeAPI",
        body: `<h1>There was an uncaught exception in your NodeAPI</h1>
                <h2>Message</h2><br>
                ${message}
                <h2>Time</h2><br>
                ${time}
                <h2>Stack</h2><br>
                ${stack}<br><br>
                Thank you,<br>
                Heidi Team</p>`
    }
}