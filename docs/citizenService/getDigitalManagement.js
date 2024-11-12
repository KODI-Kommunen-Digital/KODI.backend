const { DigitalManagement } = require("../models/CitizenService");

const getDigitalManagementSwagger = {
    summary: "Get Digital management",
    description: "Retrieve Digital management from the database",
    tags: ["Citizen Services"],
    parameters: [
        {
            in: "query",
            name: "cityId",
            schema: {
                type: "integer",
                minimum: 1,
            },
            description: "The city ID for which the listing count is to be fetched",
        },
    ],
    responses: {
        200: {
            description: "Successfully fetched Digital management from the database",
            content: {
                "application/json": {
                    schema: {
                        type: "object",
                        properties: {
                            status: {
                                type: "string",
                                example: "success",
                            },
                            data: {
                                type: "array",
                                items: DigitalManagement
                            },
                        },
                    },
                },
            }
        },
        404: {
            description: "Invalid cityId given",
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
                                example: "Invalid City '1' given",
                            },
                        },
                    },
                },
            },
        },
        500: {
            description: "Internal Server Error",
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

module.exports = getDigitalManagementSwagger;
