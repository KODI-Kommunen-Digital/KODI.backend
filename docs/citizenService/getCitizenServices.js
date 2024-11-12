const { CitizenService } = require("../models/CitizenService");

const getAllCitizenServicesSwagger = {
    summary: "Get all Citizen services",
    description: "Retrieve all Citizen Services from the database",
    tags: ["Citizen Services"],
    responses: {
        200: {
            description: "Successfully fetched Citizen Services",
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
                                items: CitizenService
                            },
                        },
                    },
                },
            }
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

module.exports = getAllCitizenServicesSwagger;
