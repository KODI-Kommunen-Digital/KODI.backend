module.exports = function (username, useremail, description) {
    return {
        subject: `Contact Service Request from ${username}`,
        body: `
            <h2>Contact Service Request</h2>
            <p><strong>Username:</strong> ${username}</p>
            <p><strong>Email:</strong> ${useremail}</p>
            <p><strong>Description:</strong></p>
            <p>${description}</p>
            <hr>
        `
    };
};
