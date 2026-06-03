module.exports = function (title) {
    return {
        subject: `Mängelmelder erhalten: ${title}`,
        body: `<h1>Vielen Dank für Ihre Meldung</h1>
                <p>Ihre Meldung wurde erfolgreich übermittelt.<br>
                <br>
                <strong>Titel:</strong> ${title}<br>
                <br>
                Unser Team wird Ihre Meldung prüfen und die erforderlichen Maßnahmen ergreifen.<br>
                <br>
                Liebe Grüße,<br>
                Das Gera-Team</p>`,
    };
};
