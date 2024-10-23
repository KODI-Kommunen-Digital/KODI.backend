const createDefectReport ={
    summary: "Submit a defect report",
    description: "Allows users to submit a defect report, including an image and relevant details like title and description.",
    tags: ["Defect Reports"],
    requestBody: {
        required: true,
        content: {
            "multipart/form-data": {
                schema: {
                    type: "object",
                    properties: {
                        title: {
                            type: "string",
                            example: "Broken street light",
                            description: "The title of the defect report.",
                        },
                        description: {
                            type: "string",
                            example: "The street light at corner X is broken and doesn't work at night.",
                            description: "A detailed description of the defect.",
                        },
                        image: {
                            type: "string",
                            format: "binary",
                            description: "An image of the defect (JPEG format).",
                        },
                        language: {
                            type: "string",
                            example: "de",
                            description: "Language of the email template (default is 'de').",
                        },
                    },
                    required: ["title", "description", "image"],
                },
            },
        },
    },
    responses: {
        200: {
            description: "Defect report submitted successfully",
            content: {
                "application/json": {
                    schema: {
                        type: "object",
                        properties: {
                            message: {
                                type: "string",
                                example: "Defect report submitted successfully",
                            },
                            reportId: {
                                type: "integer",
                                example: 12345,
                            },
                        },
                    },
                },
            },
        },
        400: {
            description: "Missing required fields (title, description, or image)",
            content: {
                "application/json": {
                    schema: {
                        type: "object",
                        properties: {
                            message: {
                                type: "string",
                                example: "All fields are mandatory",
                            },
                        },
                    },
                },
            },
        },
        500: {
            description: "Error occurred while submitting the defect report",
            content: {
                "application/json": {
                    schema: {
                        type: "object",
                        properties: {
                            message: {
                                type: "string",
                                example: "Error submitting defect report: Internal server error",
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

module.exports = createDefectReport;