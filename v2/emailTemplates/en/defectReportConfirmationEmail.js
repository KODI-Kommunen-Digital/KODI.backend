module.exports = function (title) {
    return {
        subject: `Defect Report Received: ${title}`,
        body: `<div style="margin: 10px;">
                <h1>Thank you for your report</h1>
                <p>Your defect report has been successfully submitted.<br>
                <br>
                <strong>Title:</strong> ${title}<br>
                <br>
                Our team will review your report and take the necessary action.<br>
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
