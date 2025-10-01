module.exports = function (firstName, lastName, email, phoneNumber) {
    return {
        subject: `Anfrage von ${firstName} ${lastName} Email - ${email} Telefon - ${phoneNumber}`,
    }
}