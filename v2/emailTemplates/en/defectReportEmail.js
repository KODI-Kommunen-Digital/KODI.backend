module.exports = function (title, description, address) {
    return {
        subject: `New Defect Report: ${title}`,
        body: `<h1>Defect Report</h1>
                <p><strong>Title:</strong> ${title},<br>
                <strong>Description:</strong> ${description} <br>
                ${address ? `<strong>Address:</strong> ${address} <br>` : ""}
                See the attached image for more details.<br>
                <br>
                Thank you,<br>
                Heidi Team</p>`,
    };
};
