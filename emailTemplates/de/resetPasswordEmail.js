module.exports = function (firstName, lastName, token, userId) {
    return {
        subject: "Dein Passwort zurücksetzen",
        body: `<h1>Dein Passwort zurücksetzen</h1>
                <p>Hey ${firstName} ${lastName},
                du hast die Zurücksetzung deines Passwortes beantragt. Bitte klick auf den Link, um dein Passwort zurückzusetzen.<br>
                <a href="${process.env.WEBSITE_DOMAIN}/PasswordForgot?token=${token}&userId=${userId}">Passwort vergessen</a>
                <br>
                Vielen Dank,<br>
                Das Heidi-Team</p>`
    }
}