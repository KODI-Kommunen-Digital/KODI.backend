module.exports = function (registrationLink, cityNames) {
    return {
        subject: "Complete Your Registration",
        body: `<div>
                    <h2>Welcome!</h2>
                    <p>Thank you for registering as a City Administrator for: ${cityNames}</p>
                    <p>Please complete your registration by clicking the link below:</p>
                    <p><a href="${registrationLink}">Complete Registration</a></p>
                    <p><strong>Important:</strong> Please make sure to use this email address when completing your registration.</p>
                    <p>If you did not request this registration, please ignore this email.</p>
                </div>`,
    };
};