module.exports = function (title, description, address, reporterEmail, phoneNumber) {
    return {
        subject: `Neuer Mängelmelder: ${title}`,
        body: `<h1>Mängelmelder</h1>
                <p><strong>Titel:</strong> ${title},<br>
                <strong>Beschreibung:</strong> ${description} <br>
                ${address ? `<strong>Adresse:</strong> ${address} <br>` : ""}
                ${reporterEmail ? `<strong>E-Mail des Melders:</strong> ${reporterEmail} <br>` : ""}
                ${phoneNumber ? `<strong>Telefonnummer:</strong> ${phoneNumber} <br>` : ""}
                Weitere Einzelheiten finden Sie im beigefügten Bild.<br>
                <br>
                Liebe Grüße,<br>
                Das Gera-Team</p>`,
    };
};
