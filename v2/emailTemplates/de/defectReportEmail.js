module.exports = function (
    title,
    description,
    address,
    reporterEmail,
    phoneNumber,
    name,
    lat,
    long,
) {
    const mapsUrl =
        lat != null && long != null
            ? `https://www.google.com/maps/search/?api=1&query=${lat},${long}`
            : null;

    return {
        subject: `Neuer Mängelmelder: ${title}`,
        body: `<div style="margin: 10px;">
                <h1>Mängelmelder</h1>
                <p><strong>Titel:</strong> ${title},<br>
                <strong>Beschreibung:</strong> ${description} <br>
                ${address ? `<strong>Adresse:</strong> ${address} <br>` : ""}
                ${mapsUrl ? `<strong>Standort:</strong> <a href="${mapsUrl}">In Google Maps öffnen</a> <br>` : ""}
                ${name ? `<strong>Name:</strong> ${name} <br>` : ""}
                ${reporterEmail ? `<strong>E-Mail des Melders:</strong> ${reporterEmail} <br>` : ""}
                ${phoneNumber ? `<strong>Telefonnummer:</strong> ${phoneNumber} <br>` : ""}
                Weitere Einzelheiten finden Sie im beigefügten Bild.<br>
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
