const deleteUserProfilePicSwagger = {
    summary: 'Delete user profile image',
    description: 'Deletes a user profile image from db and storage.',
    tags: ['Users'],
    security: [{ bearerAuth: [] }],
    parameters: [
        {
            in: 'path',
            name: 'id',
            required: true,
            description: 'The ID of the user',
            schema: {
                type: 'integer',
                example: 1,
            },
        },
    ],
    responses: {
        '200': {
            description: 'Image deleted successfully',
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
            description: 'Unauthorized, invalid access token',
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
            description: 'Forbidden, user not allowed to access resource',
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
                                example: 'You are not allowed to access this resource',
                            },
                        },
                    },
                },
            },
        },
        '500': {
            description: 'Internal Server Error',
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
                                example: 'Failed!! Please try again',
                            },
                        },
                    },
                },
            },
        },
    },
};

module.exports = deleteUserProfilePicSwagger;