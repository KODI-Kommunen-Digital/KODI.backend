module.exports = (usersCount) => {
    // now for english template
    return {
        subject: "User Report",
        body: `<h1> User Report</h1>
                <p>Hello,<br>
                here is the current report on the user count in your system.<br>
                <strong>Total number of users: ${usersCount}</strong><br>
                <br>
                Best regards!<br>
                The ${process.env.REGION} Team</p>`,
    };
};
