module.exports = function (listingLink) {
    return {
        subject: "Eintrag wartet auf Genehmigung",
        body: `
            <div style="font-family: Arial, sans-serif; color: #333;">
                <p>Ein neuer Eintrag wurde erstellt und muss genehmigt werden.</p>
                <p>
                    <a href="${listingLink}" style="display: inline-block; padding: 10px 15px; background-color: #007BFF; color: white; text-decoration: none; border-radius: 5px;">
                    Jetzt prüfen
                    </a>
                </p>
            </div>`
    }
}