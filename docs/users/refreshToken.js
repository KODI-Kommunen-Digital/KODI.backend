const refreshTokenSchema = {
    summary: 'API to Refresh the access token',
    description: 'Refresh the access token',
    tags: ['Users'],
    parameters: [
        {
            in: 'path',
            name: 'id',
            required: true,
            description: 'The ID of the user',
            type: 'integer',
            example: 1,
        },
    ],
    requestBody: {
        required: true,
        content: {
            'application/json': {
                schema: {
                    type: 'object',
                    properties: {
                        refreshToken: {
                            type: 'string',
                            required: true,
                            description: 'The refresh token of the user',
                        },
                    },
                },
            },
        },
    },
    responses: {
        '200': {
            description: 'The access token was successfully refreshed',
            content: {
                'application/json': {
                    schema: {
                        type: 'object',
                        properties: {
                            status: {
                                type: 'string',
                                example: 'success',
                            },
                            data: {
                                type: 'object',
                                properties: {
                                    accessToken: {
                                        type: 'string',
                                        description: 'The new access token of the user',
                                    },
                                    refreshToken: {
                                        type: 'string',
                                        description: 'The new refresh token of the user',
                                    },
                                },
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
                                example: 'Refresh token not present',
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
                                example: 'JsonWebTokenError invalid signature',
                            },
                        },
                    },
                },
            },
        },
    },
};

module.exports = refreshTokenSchema;