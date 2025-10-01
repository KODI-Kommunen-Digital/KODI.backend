module.exports = function (firstName, lastName, email, phoneNumber) {
    const phoneText = phoneNumber ? ` Phone - ${phoneNumber}` : '';
    return {
        subject: `Enquiry from ${firstName} ${lastName} Email - ${email}${phoneText}`,
    }
}