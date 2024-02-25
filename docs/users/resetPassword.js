const resetPasswordSwagger = {
    summary: 'Reset password',
    description: 'Reset the password of the user',
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
                        password: {
                            type: 'string',
                            required: true,
                            description: 'The new password of the user. It cannot be the same as the old password',
                            example: 'MyNewPassword124',
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
            description: 'The password was successfully resetted',
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
                                example: 'New password should not be same as the old password',
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
    }
};

module.exports = resetPasswordSwagger;