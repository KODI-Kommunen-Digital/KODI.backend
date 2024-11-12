const Category = {
    properties: {
        id: {
            type: 'integer',
            required: true,
            example: 1
        },
        name: {
            type: 'string',
            required: true,
            example: 'News'
        },
        noOfSubcategories: {
            type: 'integer',
            required: true,
            example: 8
        }
    },
}

module.exports = {
    Category,
};