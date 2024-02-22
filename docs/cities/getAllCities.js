const getAllCitiesSwagger = {
    "summary": "Get all cities",
    "description": "Get all cities",
    "tags": ["Cities"],
    "responses": {
        "200": {
            "description": "Success",
            "content": {
                "application/json": {
                    "schema": {
                        "type": "object",
                        "properties": {
                            "status": {
                                "type": "string",
                                "example": "success"
                            },
                            "data": {
                                "type": "array",
                                "items": {
                                    "type": "object",
                                    "properties": {
                                        "id": {
                                            "type": "integer",
                                            "description": "The unique identifier for the city",
                                            "example": 1
                                        },
                                        "name": {
                                            "type": "string",
                                            "description": "The name of the city",
                                            "example": "Berlin"
                                        },
                                        "image": {
                                            "type": "string",
                                            "description": "Placeholder for the image (currently null)",
                                            "example": null
                                        },
                                        "hasForum": {
                                            "type": "integer",
                                            "description": "Has forum or not integer/null",
                                            "example": 1
                                        }
                                    }
                                }
                            }
                        }
                    }
                }
            }
        },
        "500": {
            "description": "Internal Server Error",
            "content": {
                "application/json": {
                    "schema": {
                        "type": "object",
                        "properties": {
                            "status": {
                                "type": "string",
                                "example": "error"
                            },
                            "data": {
                                "type": "string",
                                "example": "Internal Server Error"
                            }
                        }
                    }
                }
            }
        }
    }
};

module.exports = getAllCitiesSwagger;