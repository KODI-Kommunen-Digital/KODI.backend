module.exports = function (firstName, lastName, token, userId) {
    return {
        subject: "Reset your password",
        body: `<h1>Reset your password</h1>
                <p>Dear ${firstName} ${lastName},<br>
                You have requested to reset your password. Please click on the link to reset your account<br>
                <a href="${process.env.WEBSITE_DOMAIN}/PasswordForgot?token=${token}&userId=${userId}" target="_blank" rel="noopener noreferrer">Forgot password link</a>
                <br>
                Thank you,<br>
                Heidi Team</p>`,
    };
};
