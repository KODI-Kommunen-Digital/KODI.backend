module.exports = function (firstName, lastName, token, userId) {
    return {
        subject: "Überprüfen Sie Ihre E-Mail",
        body: `<h1>Überprüfen Sie Ihre E-Mail</h1>
                <p>Liebes ${firstName} ${lastName},<br>
                Danke, dass Sie sich bei uns registriert haben. Um fortzufahren, müssen Sie Ihre E-Mail verifizieren. Bitte klicken Sie auf den Link, um mit der Verifizierung fortzufahren<br>
                <a href="${process.env.WEBSITE_DOMAIN}/VerifyEmail?token=${token}&userId=${userId}">E-Mail-Link verifizieren</a>
                <br>
                Mit freundlichen Gruessen,<br>
                Heidi-Team</p>`
    }
}