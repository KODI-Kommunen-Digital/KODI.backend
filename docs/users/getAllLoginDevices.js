const getLoginDevicesSwagger = {
    summary: 'API to get login devices',
    description: 'Get all the login devices of a user',
    tags: ['Users'],
    security: [{ bearerAuth: [] }],
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
            description: 'The login devices were successfully fetched',
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
                                type: 'array',
                                items: {
                                    type: 'object',
                                    properties: {
                                        id: {
                                            type: 'integer',
                                            example: 1,
                                        },
                                        userId: {
                                            type: 'integer',
                                            example: 1,
                                        },
                                        sourceAddress: {
                                            type: 'string',
                                            example: '127.0.0.1',
                                        },
                                        browser: {
                                            type: 'string',
                                            example: 'browser_name',
                                        },
                                        device: {
                                            type: 'string',
                                            example: null,
                                        },
                                    },
                                },
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

module.exports = getLoginDevicesSwagger;