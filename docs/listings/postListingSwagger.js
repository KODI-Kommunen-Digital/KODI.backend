const createListingSwagger = {
    summary: "Create listings",
    description: "Create one or more listings based on the provided payload and associated city IDs.",
    tags: ["Listings"],
    requestBody: {
        required: true,
        content: {
            "application/json": {
                schema: {
                    type: "object",
                    properties: {
                        cityIds: {
                            type: "array",
                            items: {
                                type: "string",
                            },
                            description: "An array of city IDs where the listings will be created.",
                        },
                        title: {
                            type: "string",
                            description: "Title of the listing (max length: 255 characters).",
                        },
                        description: {
                            type: "string",
                            description: "Description of the listing (max length: 65535 characters).",
                        },
                        categoryId: {
                            type: "string",
                            description: "The ID of the category for the listing.",
                        },
                        subcategoryId: {
                            type: "string",
                            description: "The ID of the subcategory for the listing (optional).",
                        },
                        logo: {
                            type: "string",
                            description: "URL of the logo image for the listing.",
                        },
                        media: {
                            type: "array",
                            items: {
                                type: "string",
                            },
                            description: "Array of media URLs associated with the listing.",
                        },
                        price: {
                            type: "number",
                            description: "Listing price.",
                        },
                        discountPrice: {
                            type: "number",
                            description: "Discounted price of the listing.",
                        },
                        email: {
                            type: "string",
                            description: "Contact email associated with the listing.",
                        },
                        phone: {
                            type: "string",
                            description: "Contact phone number associated with the listing.",
                        },
                        address: {
                            type: "string",
                            description: "Address related to the listing.",
                        },
                        website: {
                            type: "string",
                            description: "Website URL associated with the listing.",
                        },
                        longitude: {
                            type: "number",
                            description: "Longitude coordinate of the listing location.",
                        },
                        latitude: {
                            type: "number",
                            description: "Latitude coordinate of the listing location.",
                        },
                        zipcode: {
                            type: "string",
                            description: "Zip code of the listing location.",
                        },
                        villageId: {
                            type: "string",
                            description: "Village ID associated with the listing (optional, applicable for single cities).",
                        },
                        statusId: {
                            type: "string",
                            description: "The status ID for the listing.",
                        },
                        startDate: {
                            type: "string",
                            format: "date-time",
                            description: "Start date for event listings.",
                        },
                        endDate: {
                            type: "string",
                            format: "date-time",
                            description: "End date for event listings.",
                        },
                        timeless: {
                            type: "boolean",
                            description: "Indicates if the listing is timeless (only applicable for News category).",
                        },
                        pollOptions: {
                            type: "array",
                            items: {
                                type: "object",
                                properties: {
                                    title: {
                                        type: "string",
                                        description: "Title of the poll option (max length: 255 characters).",
                                    },
                                },
                            },
                            description: "Array of poll options if the listing is a poll (max 10 options).",
                        },
                    },
                    required: ["cityIds", "title", "description", "categoryId"],
                },
            },
        },
    },
    responses: {
        200: {
            description: "Successfully created the listings",
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
                                items: {
                                    type: "object",
                                    properties: {
                                        cityId: {
                                            type: "integer",
                                            description: "The ID of the city where the listing was created.",
                                            example: 1,
                                        },
                                        listingId: {
                                            type: "integer",
                                            description: "The ID of the newly created listing.",
                                            example: 101,
                                        },
                                    },
                                },
                            },
                        },
                    },
                },
            },
        },
        400: {
            description: "Invalid input data provided",
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
        404: {
            description: "City or User not found",
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
                                example: "City is not present",
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
                                example: "An error occurred while creating the listings: Internal server error",
                            },
                        },
                    },
                },
            },
        },
    },
    security: [
        {
            bearerAuth: [],
        },
    ],
};

module.exports = createListingSwagger;