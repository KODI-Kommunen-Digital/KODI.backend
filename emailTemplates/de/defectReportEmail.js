module.exports = function (title, description) {
    return {
        subject: `Neuer Mängelmelder: ${title}`,
        body: `<h1>Mängelmelder</h1>
                <p><strong>Titel:</strong> ${title},<br>
                <strong>Beschreibung:</strong> ${description} <br>
                Weitere Einzelheiten finden Sie im beigefügten Bild.<br>
                <br>
                Liebe Grüße,<br>
                Das Heidi-Team</p>`
    }
}