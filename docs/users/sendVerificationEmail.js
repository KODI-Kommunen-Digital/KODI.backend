const sendVerificaltionEmailSwagger = {
    summary: 'API to send verification email',
    description: 'Send verification email to the user',
    tags: ['Users'],
    requestBody: {
        required: true,
        content: {
            'application/json': {
                schema: {
                    type: 'object',
                    properties: {
                        email: {
                            type: 'string',
                            required: true,
                            description: 'The token will be sent to this email',
                            example: 'email@example.com'
                        },
                        language: {
                            type: 'string',
                            required: true,
                            description: 'The language of the email',
                            example: 'en',
                            enum: ['en', 'de'],
                            default: 'de'
                        }
                    }
                }
            }
        }
    },
    responses: {
        '200': {
            description: 'The verification email was successfully sent',
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
        '400': {
            description: 'Invalid input given',
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
                                example: 'Email not present'
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
                                example: 'error name'
                            }
                        }
                    }
                }
            }
        }
    }
};

module.exports = sendVerificaltionEmailSwagger;