const logoutSwagger = {
    summary: 'logout',
    description: 'Logout a user',
    tags: ['Users'],
    security: [{ bearerAuth: [] }],
    parameters: [
        {
            in: 'path',
            name: 'id',
            required: true,
            description: 'The ID of the user',
            type: 'integer',
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
            description: 'The user was successfully logged out',
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
        '401': {
            description: 'Unauthorized! Invalid access token',
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
                                example: 'Authorization token not present',
                            },
                        },
                    },
                },
            },
        },
        '403': {
            description: 'Unauthorized! Invalid refresh token',
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
                                example: 'Refresh Token not sent',
                            },
                        },
                    },
                },
            },
        },
        '404': {
            description: 'Refresh token not found',
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
                                example: 'User with id 1 does not exist',
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

module.exports = logoutSwagger;