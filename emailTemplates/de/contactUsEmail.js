module.exports = function (firstName, lastName, email, phoneNumber) {
    const phoneText = phoneNumber ? ` Telefon - ${phoneNumber}` : '';
    return {
        subject: `Anfrage von ${firstName} ${lastName} Email - ${email}${phoneText}`,
    }
}