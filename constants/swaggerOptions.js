module.exports = {
    definition: {
        openapi: '3.0.0',
        info: {
            title: 'Smart Region M Backend API',
            version: '1.0.0',
            description: 'API documentation for Smart Region M Backend',
        },
        servers: [
            {
                url: `${process.env.BASE_URL}`,
                description: 'Development server',
            },
        ],
        components: {
            securitySchemes: {
                bearerAuth: {
                    type: 'http',
                    scheme: 'bearer',
                    bearerFormat: 'JWT',
                },
            },
        },
        security: [
            {
                bearerAuth: [],
            },
        ],
    },
    apis: ['./routes/*.js', './models/*.js', './services/*.js'],
};
