const verifyEmailSwagger = {
    summary: 'Verify email',
    description: 'Verify the email of the user',
    tags: ['Users'],
    requestBody: {
        required: true,
        content: {
            'application/json': {
                schema: {
                    type: 'object',
                    properties: {
                        userId: {
                            type: 'integer',
                            required: true,
                            description: 'The id of the user',
                            example: 1,
                        },
                        token: {
                            type: 'string',
                            required: true,
                            description: "The token sent to the user's email",
                            example: '1234sd234',
                        },
                        language: {
                            type: 'string',
                            required: true,
                            description: 'The language of the email',
                            example: 'en',
                            enum: ['en', 'de'],
                            default: 'de',
                        },
                    },
                },
            },
        },
    },
    responses: {
        '200': {
            description: 'The email was successfully verified',
            content: {
                'application/json': {
                    schema: {
                        type: 'object',
                        properties: {
                            status: {
                                type: 'string',
                                example: 'success',
                            },
                        },
                    },
                },
            },
        },
        '400': {
            description: 'Invalid input given',
            content: {
                'application/json': {
                    schema: {
                        type: 'object',
                        properties: {
                            status: {
                                type: 'string',
                                example: 'error',
                            },
                            message: {
                                type: 'string',
                                example: 'Token Expired, send verification mail again',
                            },
                        },
                    },
                },
            },
        },
        '500': {
            description: 'Server error',
            content: {
                'application/json': {
                    schema: {
                        type: 'object',
                        properties: {
                            status: {
                                type: 'string',
                                example: 'error',
                            },
                            message: {
                                type: 'string',
                                example: 'error name',
                            },
                        },
                    },
                },
            },
        },
    },
};

module.exports = verifyEmailSwagger;