module.exports = function (firstName, lastName, email, phoneNumber) {
    return {
        subject: `Enquiry from ${firstName} ${lastName} Email - ${email} Phone - ${phoneNumber}`,
    }
}