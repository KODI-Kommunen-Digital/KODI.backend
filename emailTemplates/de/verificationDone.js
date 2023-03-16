module.exports = function (firstName, lastName) {
    return {
        subject: "Ihre E-Mail wurde überprüft",
        body: `<h1>Ihre E-Mail wurde überprüft</h1>
                <p>Liebes ${firstName} ${lastName},<br>
                Sie haben Ihr Konto zurückgesetzt und erfolgreich verifiziert. Sie können sich jetzt in Ihr Konto einloggen<br>
                <br>
                Mit freundlichen Gruessen,<br>
                Heidi-Team</p>`
    }
}