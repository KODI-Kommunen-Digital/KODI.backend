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
        subject: `New Defect Report: ${title}`,
        body: `<div style="margin: 10px;">
                <h1>Defect Report</h1>
                <p><strong>Title:</strong> ${title},<br>
                <strong>Description:</strong> ${description} <br>
                ${address ? `<strong>Address:</strong> ${address} <br>` : ""}
                ${mapsUrl ? `<strong>Location:</strong> <a href="${mapsUrl}">Open in Google Maps</a> <br>` : ""}
                ${name ? `<strong>Name:</strong> ${name} <br>` : ""}
                ${reporterEmail ? `<strong>Reporter Email:</strong> ${reporterEmail} <br>` : ""}
                ${phoneNumber ? `<strong>Phone Number:</strong> ${phoneNumber} <br>` : ""}
                See the attached image for more details.<br>
                <br>
                Kind regards<br>
                On behalf of<br>
                <br>
                City Administration Gera<br>
                Kornmarkt 12<br>
                07545 Gera<br>
                Phone: 0365 838 0<br>
                Email: <a href="mailto:stadt@gera.de">stadt@gera.de</a></p>
                </div>`,
    };
};
