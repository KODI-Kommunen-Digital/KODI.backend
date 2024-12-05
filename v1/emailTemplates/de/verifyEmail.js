module.exports = function (firstName, lastName, token, userId, lang) {
    return {
        subject: "Überprüfe deine E-Mail",
        body: `<h1>Überprüfe deine E-Mail</h1>
                <p>Hey ${firstName} ${lastName},<br>
                Vielen Dank für die Registrierung. Um fortzufahren, musst du deine E-Mail verifizieren. Bitte klicke auf den Link, um mit der Verifizierung fortzufahren<br>
                <a href="${process.env.WEBSITE_DOMAIN}/VerifyEmail?token=${token}&userId=${userId}&lang=${lang}" target="_blank" rel="noopener noreferrer">E-Mail-Link verifizieren</a>
                <br>
                Viel Spaß! ,<br>
                Das ${process.env.REGION}-Team</p>`,
    };
};
