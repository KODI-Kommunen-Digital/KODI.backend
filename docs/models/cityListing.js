const CityListing = {
    properties: {
        villageId: {
            type: 'integer',
            required: true,
            description: 'The village ID',
            example: 1
        },
        title: {
            type: 'string',
            required: true,
            description: 'The title of the city listing',
            example: "Sample City"
        },
        place: {
            type: 'string',
            required: true,
            description: 'The place of the city listing',
            example: "Sample Place"
        },
        description: {
            type: 'string',
            required: true,
            description: 'The description of the city listing',
            example: 'This is a sample description'
        },
        categoryId: {
            type: 'number',
            required: true,
            description: 'The category ID',
            example: 1
        },
        subcategoryId: {
            type: 'number',
            required: true,
            description: 'The subcategory ID',
            example: 1
        },
        statusId: {
            type: 'number',
            required: true,
            description: 'The status ID',
            example: 1
        },
        address: {
            type: 'string',
            required: true,
            description: 'The address of the city listing',
            example: '123 Main St'
        },
        email: {
            type: 'string',
            required: true,
            description: 'The email of the city listing',
            example: 'example@example.com'
        },
        phone: {
            type: 'string',
            required: true,
            description: 'The phone number of the city listing',
            example: '123-456-7890'
        },
        website: {
            type: 'string',
            required: true,
            description: 'The website of the city listing',
            example: 'https://example.com'
        },
        price: {
            type: 'number',
            required: true,
            description: 'The price of the city listing',
            example: 100
        },
        discountPrice: {
            type: 'number',
            required: true,
            description: 'The discount price of the city listing',
            example: 0
        },
        logo: {
            type: 'string',
            required: true,
            description: 'The logo of the city listing',
            example: 'https://example.com/logo.jpg'
        },
        longitude: {
            type: 'number',
            required: true,
            description: 'The longitude of the city listing',
            example: 0.0
        },
        latitude: {
            type: 'number',
            required: true,
            description: 'The latitude of the city listing',
            example: 0.0
        },
        zipcode: {
            type: 'string',
            required: true,
            description: 'The zipcode of the city listing',
            example: '12345'
        },
        endDate: {
            type: 'string',
            required: true,
            description: 'The end date of the city listing',
            example: '2022-12-31'
        },
        startDate: {
            type: 'string',
            required: true,
            description: 'The start date of the city listing',
            example: '2022-01-01'
        }
    }
}

const UpdateCityListing = {
    properties: {
        title: {
            type: 'string',
            required: false,
            description: 'The title of the city listing',
            example: "Sample City"
        },
        description: {
            type: 'string',
            required: false,
            description: 'The description of the city listing',
            example: 'This is a sample description'
        },
        subcategoryId: {
            type: 'number',
            required: false,
            description: 'The subcategory ID',
            example: 1
        },
        statusId: {
            type: 'number',
            required: false,
            description: 'The status ID',
            example: 1
        },
        address: {
            type: 'string',
            required: false,
            description: 'The address of the city listing',
            example: '123 Main St'
        },
        email: {
            type: 'string',
            required: false,
            description: 'The email of the city listing',
            example: 'example@example.com'
        },
        phone: {
            type: 'string',
            required: false,
            description: 'The phone number of the city listing',
            example: '123-456-7890'
        },
        website: {
            type: 'string',
            required: false,
            description: 'The website of the city listing',
            example: 'https://example.com'
        },
        price: {
            type: 'number',
            required: false,
            description: 'The price of the city listing',
            example: 100
        },
        discountPrice: {
            type: 'number',
            required: false,
            description: 'The discount price of the city listing',
            example: 0
        },
        logo: {
            type: 'string',
            required: false,
            description: 'The logo of the city listing',
            example: 'https://example.com/logo.jpg'
        },
        longitude: {
            type: 'number',
            required: false,
            description: 'The longitude of the city listing',
            example: 0.0
        },
        latitude: {
            type: 'number',
            required: false,
            description: 'The latitude of the city listing',
            example: 0.0
        },
        zipcode: {
            type: 'string',
            required: false,
            description: 'The zipcode of the city listing',
            example: '12345'
        },
        endDate: {
            type: 'string',
            required: false,
            description: 'The end date of the city listing',
            example: '2022-12-31'
        },
        startDate: {
            type: 'string',
            required: false,
            description: 'The start date of the city listing',
            example: '2022-01-01'
        },
        removePdf: {
            type: 'boolean',
            required: false,
            description: 'Whether or not to remove the PDF',
            example: false
        },
        removeImage: {
            type: 'boolean',
            required: false,
            description: 'Whether or not to remove the image',
            example: false
        },
        pdf: {
            type: 'string',
            required: false,
            description: 'The PDF of the city listing',
            example: 'objectKey.pdf'
        },
    }
}

const FavoriteCityListing = {
    ...CityListing,
    properties: {
        id: {
            type: 'integer',
            required: false,
            description: 'The ID of the favorite city listing',
            example: 1
        },
        userId: {
            type: 'integer',
            required: false,
            description: 'The user ID that added the city listing',
            example: 1
        },
        externalId: {
            type: 'string',
            required: false,
            description: 'The external ID',
            example: ""
        },
        cityId: {
            type: 'string',
            required: false,
            description: 'The external ID',
            example: "1"
        },
        sourceId: {
            type: 'integer',
            required: false,
            description: 'The source ID of the city listing',
            example: 1
        },
        createdAt: {
            type: 'date',
            required: false,
            description: 'The date the favorite city listing was created',
            example: "2023-12-05T18:59:35.000Z"
        },
        expiryDate: {
            type: 'date',
            required: false,
            description: 'The date the favorite city listing was created',
            example: "2024-05-05T18:59:35.000Z"
        },
        pdf: {
            type: 'string',
            required: false,
            description: 'The PDF of the city listing',
            example: "objectKey.pdf"
        },
        ...CityListing.properties,
    }
}


const UserCityListing = {
    ...FavoriteCityListing,
    properties: {
        ...FavoriteCityListing.properties,
        cityId: {
            type: 'integer',
            required: false,
            description: 'The city ID',
            example: 1
        },
    }
}


module.exports = {
    CityListing,
    UpdateCityListing,
    FavoriteCityListing,
    UserCityListing,
};