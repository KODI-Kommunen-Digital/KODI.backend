const deleteLoggedInDevicesSwagger = {
    summary: 'API to delete login devices',
    description: 'Delete login devices of a user. If the query param \'id\' is not given, all the login devices of the user will be deleted.',
    tags: ['Users'],
    security: [
        {
            bearerAuth: []
        }
    ],
    parameters: [
        {
            in: 'path',
            name: 'id',
            required: true,
            description: 'The ID of the user',
            type: 'integer',
            example: 1
        },
        {
            in: 'query',
            name: 'id',
            schema: {
                type: 'integer',
                example: 1,
                description: 'The id of the login device. If not given, all the login devices of the user will be deleted',
                required: false
            }
        }
    ],
    responses: {
        '200': {
            description: 'The login devices were successfully deleted',
            content: {
                'application/json': {
                    schema: {
                        type: 'object',
                        properties: {
                            status: {
                                type: 'string',
                                example: 'success'
                            }
                        }
                    }
                }
            }
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
                                example: 'error'
                            },
                            message: {
                                type: 'string',
                                example: 'Authorization token not present'
                            }
                        }
                    }
                }
            }
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
                                example: 'error'
                            },
                            message: {
                                type: 'string',
                                example: 'JsonWebTokenError invalid signature'
                            }
                        }
                    }
                }
            }
        }
    }
};

module.exports = deleteLoggedInDevicesSwagger;