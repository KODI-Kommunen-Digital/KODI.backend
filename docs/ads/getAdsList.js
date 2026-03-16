const getAdsList = {
    summary: "Get a list of advertisements",
    description: `
       
    `,
    tags: ["Ads"],
    parameters: [
        {
            in: "query",
            name: "cityId",
            required: false,
            schema: {
                type: "integer",
                example: 1,
            },
            description: "The ID of the city for which the advertisement is being requested.",
        },
        {
            in: "query",
            name: "skipAdIds",
            required: false,
            schema: {
                type: "string",
                example: "1,2,3",
            },
            description: "The IDs of the advertisements that should be skipped.(Skipping is recommended to avoid showing the same advertisement to the same user)",
        },
        {
            in: "query",
            name: "count",
            required: true,
            schema: {
                type: "integer",
                example: 5
            },
            description: "The number of advertisements to be returned.",
        },
        {
            in: "query",
            name: "sort",
            required: false,
            schema: {
                type: "string",
                example: "lastShown",
                enum: ["lastShown", "id", "cityId", "image", "link", "createdAt"],
            },
            description: "The sorting field for the advertisements.",
        },
    ],
    responses: {
        200: {
            description: "Successfully fetched a random advertisement",
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
                                type: "object",
                                properties: {
                                    id: {
                                        type: "integer",
                                        example: 1,
                                    },
                                    cityId: {
                                        type: "integer",
                                        example: 1,
                                    },
                                    image: {
                                        type: "string",
                                        example: "https://example.com/images/ad.jpg",
                                    },
                                    link: {
                                        type: "string",
                                        example: "https://example.com/ad",
                                    },
                                    createdAt: {
                                        type: "string",
                                        format: "date-time",
                                        example: "2024-10-14T12:34:56.789Z",
                                    },
                                },
                                example: {
                                    id: 5,
                                    cityId: 1,
                                    image: "https://example.com/images/ad.jpg",
                                    link: "https://example.com/ad",
                                    createdAt: "2024-10-14T12:34:56.789Z",
                                },
                            },
                        },
                    },
                },
            },
        },
        400: {
            description: "Bad Request - Invalid cityId or listingId",
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
                                example: "Invalid CityID or CityID is not given",
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
  
module.exports = getAdsList;
  