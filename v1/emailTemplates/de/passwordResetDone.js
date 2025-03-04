module.exports = function (firstName, lastName) {
    return {
        subject: "Dein Passwort wurde zurückgesetzt",
        body: `<h1>Dein Passwort wurde zurückgesetzt</h1>
                <p>Hey ${firstName} ${lastName},<br>
                Dein Passwort wurde erfolgreich zurückgesetzt.<br>
                <br>
                Liebe Grüße,<br>
                Das ${process.env.REGION}-Team</p>`,
    };
};
