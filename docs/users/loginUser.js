const loginUser = {
    summary: "Log in",
    description: "Login a user",
    tags: ["Users"],
    requestBody: {
        required: true,
        content: {
            "application/json": {
                schema: {
                    type: "object",
                    required: true,
                    properties: {
                        username: {
                            type: "string",
                            example: "johndoe",
                            description: "The username of the user",
                        },
                        password: {
                            type: "string",
                            example: "MyPassword123",
                            description: "The password of the user",
                        },
                    },
                },
            },
        },
    },
    responses: {
        "200": {
            description: "The user was successfully logged in",
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
                                    accessToken: {
                                        type: "string",
                                        example: "eyJhbGciOiJSUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VySWQiOjE5LCJyb2xlSWQiOjMsImlhdCI6MTcwMDgzNDEyMywiZXhwIjoxNzAwODM0NzIzfQ.2YbrSDSRbqK4YQYhbvD1oZZxeso7ybc-5EagOTqx0VBWyoLGvtFlbJmTq_NRwmbeYesm9o5irhK-sPPEWyB9_htQA_YrSYfhwhbeDFeGwFsTY6Hl4KRtWdZMgbS4AnnClSkq79eJylFblgwbI1UfXwcVJqDc5hi2z-s60gIW4Wq5itkEY-aIgVqdrY8gsf-SQokQ4DgqqYUywDYRV6X0gL3KAB7eEJDZH2xdkmmWKLQdsY6I86rMd5Sm_W5eP4epntL8uxEEi3ALAEEsOnoBXbwXNElJekrbWWrRUcW7rfDVKRbeD-opzMs975EHJjkcMBmqx8JesC2dvXIBimO9PA",
                                        description: "The access token of the user",
                                    },
                                    refreshToken: {
                                        type: "string",
                                        example: "eyJhbGciOiJSUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VySWQiOjE5LCJyb2xlSWQiOjMsImlhdCI6MTcwMDgzNDEyMywiZXhwIjoxNzAxMjY2MTIzfQ.FydosENe_XoBkToCdhqKbkdYuT3LFoFfoQgnk_s-tWJfii0yVPqxwwIa-hs0C0Ea4HhPptCI0v9POW5h_h5poX_Bkt_yVsr3ZShy8Y9uUarBHF8QCDRqMwgQodBVDorOnCO4Aa_CgHSNqj4PUoi8Dw15GrXvgpU8jj_gSf0_z4FeD3EvcBXWBrUYhTt-QdCKCpdx4vXjNgFJzyCncaYouuoUn9oKu4qsE2ScY4zaYzAsK-p9pzr95Wt3qTuze64sO2IsLJVuLMHDnP7IywcjHxUYDONkDX55pGctef7b8jEv3Ru4h7oUdjaAqasup3y0A7_PhxqWIU2zfn6Wda0zbA",
                                        description: "The refresh token of the user",
                                    },
                                    userId: {
                                        type: "integer",
                                        example: 19,
                                    },
                                    cityUsers: {
                                        type: "array",
                                        items: {
                                            type: "object",
                                            properties: {
                                                cityId: {
                                                    type: "integer",
                                                    example: 1,
                                                    description: "The id of the city",
                                                },
                                                cityUserId: {
                                                    type: "integer",
                                                    example: 1,
                                                    description: "The id of the user in the city",
                                                },
                                            },
                                        },
                                    },
                                },
                            },
                        },
                    },
                },
            },
        },
        "400": {
            description: "Invalid input given",
            content: {
                "application/json": {
                    schema: {
                        type: "object",
                        properties: {
                            status: {
                                type: "string",
                                example: "error",
                            },
                            errorCode: {
                                type: "integer",
                                example: 2003,
                                description: "The error code",
                            },
                            message: {
                                type: "string",
                                example: "Invalid username or email",
                                description: "The error message",
                            },
                        },
                    },
                },
            },
        },
        "500": {
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
                                example: "ReferenceError getUser is not defined",
                                description: "The error message",
                            },
                        },
                    },
                },
            },
        },
    },
};

module.exports = loginUser;