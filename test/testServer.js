const app = require('../index.js');
const server = app.listen(process.env.TEST_PORT, () => {
    const port = process.env.TEST_PORT;
    console.log(`Test server listening on port ${port}`);
});

module.exports = server;
