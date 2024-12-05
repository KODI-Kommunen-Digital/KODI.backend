const getAds = {
    summary: "Get a random advertisement for a city",
    description: `
      Retrieves a random advertisement for the given \`cityId\` that meets certain criteria. 
      This API first checks if a listing exists for the city that was created in the last 12 hours, has a long enough description, and belongs to specific categories.
      If such a listing is found and matches the \`listingId\`, it returns a random enabled advertisement for that city (or a global ad if no city-specific ad is available). 
    `,
    tags: ["Ads"],
    parameters: [
        {
            in: "query",
            name: "cityId",
            required: true,
            schema: {
                type: "integer",
                example: 1,
            },
            description: "The ID of the city for which the advertisement is being requested.",
        },
        {
            in: "query",
            name: "listingId",
            required: true,
            schema: {
                type: "integer",
                example: 123,
            },
            description: "The ID of the listing for which the advertisement is being checked.",
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
  
module.exports = getAds;
  