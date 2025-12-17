module.exports = (usersCount) => {
    //
    return {
        subject: "Benutzerbericht",
        body: `<h1> Benutzerbericht</h1>
                <p>Hallo,<br>
                hier ist der aktuelle Bericht über die Benutzeranzahl in deinem System.<br>
                <strong>Gesamtanzahl der Benutzer: ${usersCount}</strong><br>
                <br>
                Liebe Grüße!<br>
                Das ${process.env.REGION}-Team</p>`,
    };
};
