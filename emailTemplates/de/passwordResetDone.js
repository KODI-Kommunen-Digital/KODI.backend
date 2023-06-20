module.exports = function (firstName, lastName) {
  return {
    subject: "Ihr Passwort wurde zurückgesetzt",
    body: `<h1>Ihr Passwort wurde zurückgesetzt</h1>
                <p>Liebes ${firstName} ${lastName},<br>
                Sie haben Ihr Passwort für Ihr Konto erfolgreich zurückgesetzt.<br>
                <br>
                Mit freundlichen Gruessen,<br>
                Heidi Team</p>`
  }
}