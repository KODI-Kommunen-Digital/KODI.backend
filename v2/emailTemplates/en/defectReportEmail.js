module.exports = function (title, description, address, reporterEmail, phoneNumber) {
    return {
        subject: `New Defect Report: ${title}`,
        body: `<div style="margin: 10px;">
                <h1>Defect Report</h1>
                <p><strong>Title:</strong> ${title},<br>
                <strong>Description:</strong> ${description} <br>
                ${address ? `<strong>Address:</strong> ${address} <br>` : ""}
                ${reporterEmail ? `<strong>Reporter Email:</strong> ${reporterEmail} <br>` : ""}
                ${phoneNumber ? `<strong>Phone Number:</strong> ${phoneNumber} <br>` : ""}
                See the attached image for more details.<br>
                <br>
                Thank you,<br>
                Gera Team</p>
                </div>`,
    };
};
