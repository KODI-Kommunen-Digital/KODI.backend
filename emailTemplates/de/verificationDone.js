module.exports = function (firstName, lastName) {
  return {
    subject: "Dein Passwort wurde zurückgesetzt",
    body: `<h1>Dein Passwort wurde zurückgesetzt</h1>
                <p>Hey  ${firstName} ${lastName},<br>
                das Passwort für dein Konto wurde erfolgreich zurückgesetzt.<br>
                <br>
                Liebe Grüße!,<br>
                Heidi-Team</p>`
  }
}