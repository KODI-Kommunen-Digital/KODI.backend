module.exports = function (firstName, lastName, token, userId) {
    return {
        subject: "Ihr Passwort wurde zurückgesetzt",
        body: `<h1>Ihr Passwort wurde zurückgesetzt</h1>
                <p>Liebes  ${firstName} ${lastName},
                das Passwort für dein Konto wurde erfolgreich zurückgesetzt.<br>
                <a href="${process.env.WEBSITE_DOMAIN}/PasswordForgot?token=${token}&userId=${userId}">Passwort vergessen</a>
                <br>
                Mit freundlichen Gruessen,<br>
                Heidi-Team</p>`
    }
}