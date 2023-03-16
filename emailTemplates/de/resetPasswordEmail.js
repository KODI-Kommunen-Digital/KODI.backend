module.exports = function (firstName, lastName, token, userId) {
    return {
        subject: "Ihr Passwort zurücksetzen",
        body: `<h1>Ihr Passwort zurücksetzen</h1>
                <p>Liebes ${firstName} ${lastName},
                Sie haben beantragt, Ihr Passwort zurückzusetzen. Bitte klicken Sie auf den Link, um Ihr Konto zurückzusetzen<br>
                <a>Link Passwort vergessen</a href="${process.env.WEBSITE_DOMAIN}/PasswordForgot?token=${token}&userId=${userId}">
                <br>
                Mit freundlichen Gruessen,<br>
                Heidi-Team</p>`
    }
}