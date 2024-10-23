const imageUpoadSwagger = {
    summary: 'Image upload',
    description: 'Uploads a user profile image.',
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
                example: 1
            }
        }
    ],
    requestBody: {
        required: true,
        content: {
            'multipart/form-data': {
                schema: {
                    type: 'object',
                    properties: {
                        image: {
                            description: 'The image to be uploaded',
                            type: 'string',
                            format: 'binary'
                        }
                    },
                    required: ['image']
                }
            }
        }
    },
    responses: {
        '200': {
            description: 'Image uploaded successfully',
            content: {
                'application/json': {
                    example: {
                        status: 'success',
                        data: {
                            image: 'user_1/profilePic'
                        }
                    }
                }
            }
        },
        '400': {
            description: 'Bad request, image not uploaded',
            content: {
                'application/json': {
                    example: {
                        status: 'error',
                        message: 'Image not uploaded'
                    }
                }
            }
        },
        '401': {
            description: 'Unauthorized, invalid access token',
            content: {
                'application/json': {
                    example: {
                        status: 'error',
                        message: 'Authorization token not present'
                    }
                }
            }
        },
        '403': {
            description: 'Forbidden, user not allowed to access resource',
            content: {
                'application/json': {
                    example: {
                        status: 'error',
                        message: 'You are not allowed to access this resource'
                    }
                }
            }
        },
        '500': {
            description: 'Internal Server Error',
            content: {
                'application/json': {
                    example: {
                        status: 'error',
                        message: 'Failed!! Please try again'
                    }
                }
            }
        }
    }
};

module.exports = imageUpoadSwagger;