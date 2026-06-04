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
                Thank you,<br>
                Gera Team</p>
                </div>`,
    };
};
