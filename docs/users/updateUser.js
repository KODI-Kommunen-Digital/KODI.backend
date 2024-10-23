const { UpdateUserSchema } = require("../models/userModels");

const updateUserSwagger = {
    summary: "Edit a particular user's details",
    description: 'Update a user\'s password, email, firstname, lastname, phoneNumber, descritption, website and socialmedia. It won\'t update the username',
    tags: ["Users"],
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
            type: 'integer'
        }
    ],
    requestBody: {
        required: true,
        content: {
            'application/json': {
                schema: UpdateUserSchema
            }
        }
    },
    responses: {
        '200': {
            description: 'The user was successfully updated',
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
            description: 'Unauthorized! Token was expired! or invalid passwords given',
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
                                example: 'Incorrect current password given'
                            }
                        }
                    }
                }
            }
        }
    }
};

module.exports = updateUserSwagger;