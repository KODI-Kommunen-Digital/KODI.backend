const forgotPasswordSwagger = {
    summary: 'Forgot password',
    description: 'Send forgot password email to the user',
    tags: ['Users'],
    requestBody: {
        required: true,
        content: {
            'application/json': {
                schema: {
                    type: 'object',
                    properties: {
                        username: {
                            type: 'string',
                            required: true,
                            description: 'The username or email of the user',
                            example: 'johndoe',
                        },
                        language: {
                            type: 'string',
                            required: true,
                            description: 'The language of the email',
                            example: 'en',
                            enum: ['en', 'de'],
                        },
                    },
                },
            },
        },
    },
    responses: {
        '200': {
            description: 'The forgot password email was successfully sent',
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
                                example: 'Username _ does not exist',
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

module.exports = forgotPasswordSwagger;