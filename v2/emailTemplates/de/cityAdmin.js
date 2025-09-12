module.exports = function (registrationLink, cityNames) {
    return {
        subject: "Vervollständigen Sie Ihre Registrierung",
        body: `<div>
                    <h2>Willkommen!</h2>
                    <p>Vielen Dank für Ihre Registrierung als Stadtadministrator für: ${cityNames}</p>
                    <p>Bitte vervollständigen Sie Ihre Registrierung, indem Sie auf den folgenden Link klicken:</p>
                    <p><a href="${registrationLink}">Registrierung abschließen</a></p>
                    <p><strong>Wichtig:</strong> Bitte verwenden Sie bei der Registrierung ausschließlich diese E-Mail-Adresse.</p>
                    <p>Falls Sie diese Registrierung nicht angefordert haben, ignorieren Sie bitte diese E-Mail.</p>
                </div>`,
    };
};
