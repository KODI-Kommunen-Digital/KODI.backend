module.exports = function (firstName, lastName, token, userId) {
    return {
        subject: "Setze dein Passwort zurück",
        body: `<h1> Setze dein Passwort zurück</h1>
                <p>Hey ${firstName} ${lastName},<br>
                für dein Konto wurde eine Passwortänderung beantragt. Wenn dies auf dich zutrifft, verwende bitte den unten stehenden Link, um dein Passwort zurückzusetzen.<br>
                <a href="${process.env.WEBSITE_DOMAIN}/PasswordForgot?token=${token}&userId=${userId}" target="_blank" rel="noopener noreferrer">Passwort vergessen</a>
                <br>
                Liebe Grüße!<br>
                Das ${process.env.REGION}-Team</p>`,
    };
};
