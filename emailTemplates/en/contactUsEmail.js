module.exports = function (firstName, lastName, email) {
    return {
        subject: `Enquiry from ${firstName} ${lastName} Email - ${email}`,
    }
}