module.exports = function (firstName, lastName, email) {
    return {
        subject: `Anfrage von ${firstName} ${lastName}`,
    }
}