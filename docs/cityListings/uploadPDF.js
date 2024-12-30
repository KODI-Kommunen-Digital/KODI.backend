const uploadPDFSwagger = {
    summary: "Upload pdf",
    tags: ['City Listings'],
    description: "Upload pdf for a city listing",
    security: [
        {
            bearerAuth: [],
        },
    ],
    parameters: [
        {
            in: "path",
            name: "cityId",
            required: true,
            description: "The ID of the city ",
            schema: {
                type: "integer",
            },
        },
        {
            in: "path",
            name: "id",
            required: true,
            description: "The ID of the city listing",
            schema: {
                type: "integer",
            },
        },
    ],
    requestBody: {
        required: true,
        content: {
            "multipart/form-data": {
                schema: {
                    type: "object",
                    properties: {
                        pdf: {
                            type: "string",
                            format: "binary",
                        },
                    },
                },
            },
        },
    },
    responses: {
        200: {
            description: "Image uploaded successfully",
            content: {
                "application/json": {
                    schema: {
                        type: "object",
                        properties: {
                            status: {
                                type: "string",
                                example: "success",
                            },
                        },
                    },
                },
            },
        },
        400: {
            description: "Invalid request or missing image",
            content: {
                "application/json": {
                    schema: {
                        type: "object",
                        properties: {
                            status: {
                                type: "string",
                                example: "error",
                            },
                            message: {
                                type: "string",
                                example: "Invalid ListingsId abc given",
                            },
                        },
                    },
                },
            },
        },
        401: {
            description: "Invalid token or token expired",
            content: {
                "application/json": {
                    schema: {
                        type: "object",
                        properties: {
                            status: {
                                type: "string",
                                example: "error",
                            },
                            message: {
                                type: "string",
                                example: "Authorization token not present",
                            },
                        },
                    },
                },
            },
        },
        403: {
            description: "Forbidden access or invalid image type",
            content: {
                "application/json": {
                    schema: {
                        type: "object",
                        properties: {
                            status: {
                                type: "string",
                                example: "error",
                            },
                            message: {
                                type: "string",
                                example: "You are not allowed to access this resource",
                            },
                        },
                    },
                },
            },
        },
        404: {
            description: "City or listing not found",
            content: {
                "application/json": {
                    schema: {
                        type: "object",
                        properties: {
                            status: {
                                type: "string",
                                example: "error",
                            },
                            message: {
                                type: "string",
                                example: "Listing with id 100 does not exist",
                            },
                        },
                    },
                },
            },
        },
        500: {
            description: "Internal server error",
            content: {
                "application/json": {
                    schema: {
                        type: "object",
                        properties: {
                            status: {
                                type: "string",
                                example: "error",
                            },
                            message: {
                                type: "string",
                                example: "Internal server error",
                            },
                        },
                    },
                },
            },
        },
    },
};

module.exports = uploadPDFSwagger;