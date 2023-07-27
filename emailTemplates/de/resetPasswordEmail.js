module.exports = function (firstName, lastName, token, userId) {
    return {
        subject: "Ihr Passwort wurde zurückgesetzt",
        body: `<h1>Ihr Passwort wurde zurückgesetzt</h1>
                <p>Liebes  ${firstName} ${lastName},
                für dein Konto wurde eine Passwortänderung beantragt. Wenn dies auf dich zutrifft, verwende bitte den unten stehen den Link, um dein Passwort zurückzusetzen.<br>
                <a href="${process.env.WEBSITE_DOMAIN}/PasswordForgot?token=${token}&userId=${userId}">Passwort vergessen</a>
                <br>
                Mit freundlichen Gruessen,<br>
                Heidi-Team</p>`
    }
}