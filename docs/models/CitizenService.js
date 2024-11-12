const CitizenService = {
    properties: {
        id: {
            type: 'integer',
            example: 1
        },
        title: {
            type: 'string',
            example: 'Digitale Verwaltung'
        },
        link: {
            type: 'string',
            example: 'https://vgem-fuchstal.de/vg-fuchstal/was-erledige-ich-wo/#online-antraege'
        },
        image: {
            type: 'string',
            example: 'admin/CitizenService1.jpg'
        },
        isExternalLink: {
            type: 'integer',
            example: 1
        }
    },
}

const DigitalManagement = {
    properties: {
        id: {
            type: 'integer',
            example: 1
        },
        cityId: {
            type: 'integer',
            example: 1
        },
        title: {
            type: 'string',
            example: 'Digitale Verwaltung'
        },
        link: {
            type: 'string',
            example: 'https://vgem-fuchstal.de/vg-fuchstal/was-erledige-ich-wo/#online-antraege'
        },
        image: {
            type: 'string',
            example: 'admin/CitizenService1.jpg'
        },
    },
}

module.exports = {
    CitizenService,
    DigitalManagement
};