module.exports = function (title) {
    return {
        subject: `Mängelmelder erhalten: ${title}`,
        body: `<div style="margin: 10px;">
                <h1>Vielen Dank für Ihre Meldung</h1>
                <p>Ihre Meldung wurde erfolgreich übermittelt.<br>
                <br>
                <strong>Titel:</strong> ${title}<br>
                <br>
                Unser Team wird Ihre Meldung prüfen und die erforderlichen Maßnahmen ergreifen.<br>
                <br>
                Mit freundlichen Grüßen<br>
                <br>
                im Auftrag<br>
                <br>
                <br>
                Stadtverwaltung Gera<br>
                Kornmarkt 12<br>
                07545 Gera<br>
                Fon: 0365 838 0<br>
                E-Mail: <a href="mailto:stadt@gera.de">stadt@gera.de</a></p>
                </div>`,
    };
};
