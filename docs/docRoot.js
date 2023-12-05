const { getUserByIdDoc } = require("./users/getUserById");

const apiDocumentation = {
    openapi: '3.0.1',
    info: {
        version: '1.3.0',
        title: 'KODI REST API - Documentation',
        description: `KODI - Kommunen Digital is a REST API that will be used to fetch data to and from the frontend. It provides digital citizen services and participation opportunities for cities, counties, and municipalities.`,
    },
    servers: [
        {
            url: 'http://localhost:3001',
            description: 'Local Server',
        }
    ],
    tags: [
        {
            name: 'Users',
        },
    ],
    paths: {
        '/users/{id}': {
            'get': getUserByIdDoc
        },
    }
};

module.exports = apiDocumentation;