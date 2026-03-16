const voteOnListingSwagger = {
    summary: "Vote on a listing",
    description: `
      Submit a vote for a specific poll option in a listing. This endpoint requires a city ID and a valid listing ID. The vote can either increase or decrease the vote count for the specified option.
    `,
    tags: ["Polls"],
    parameters: [
        {
            in: "path",
            name: "id",
            schema: {
                type: "integer",
                example: 123,
            },
            required: true,
            description: "The ID of the listing for which the vote is being cast.",
        },
    ],
    requestBody: {
        required: true,
        content: {
            "application/json": {
                schema: {
                    type: "object",
                    properties: {
                        optionId: {
                            type: "integer",
                            example: 1,
                            description: "The ID of the option being voted on.",
                        },
                        vote: {
                            type: "integer",
                            example: 1,
                            description: "The vote value. 1 for upvote, -1 for downvote.",
                        },
                    },
                },
            },
        }
    },
    responses: {
        200: {
            description: "Successfully cast the vote",
            content: {
                "application/json": {
                    schema: {
                        type: "object",
                        properties: {
                            status: {
                                type: "string",
                                example: "success",
                            },
                            votes: {
                                type: "integer",
                                example: 10,
                                description: "The updated vote count for the selected option.",
                            },
                        },
                    },
                },
            },
        },
        400: {
            description: "Invalid input or request",
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
                                example: "Invalid ListingsId 123 given",
                            },
                        },
                    },
                },
            },
        },
        404: {
            description: "City, listing, or option not found",
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
                                example: "City '1' not found",
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

module.exports = voteOnListingSwagger;
