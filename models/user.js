
/**
 * @swagger
 * components:
 *  schemas:
 *     User:
 *       type: object
 *       properties:
 *         username:
 *           type: string
 *           required: true
 *           description: The username of the user
 *           example: 'johndoe'
 *         email:
 *           type: string
 *           required: true
 *           description: The email of the user
 *           example: 'email@example.com'
 *           pattern: '/^\(?([0-9]{3})\)?[-. ]?([0-9]{3})[-. ]?([0-9]{4})$/'
 *         roleId:
 *           type: integer
 *           default: 3
 *           required: true
 *           description: The roleId of the user 
 *           example: 1
 *         firstname:
 *           type: string
 *           required: true
 *           description: The first name of the user
 *           example: 'John'
 *         lastname:
 *           type: string
 *           required: true
 *           description: The last name of the user
 *           example: 'Doe'
 *         password:
 *           type: string
 *           required: true
 *           description: The password of the user
 *           example: 'MyPassword123'
 *           pattern: '/^\S{8,}$/'
 *         description:
 *           type: string
 *           required: false
 *           description: The description of the user
 *           example: 'I am a content creator'
 *           maxLength: 255
 *         website:
 *           type: string
 *           required: false
 *           description: The website of the user
 *           example: 'https://www.user-website.com'
 *         socialMedia:
 *           type: object
 *           required: false
 *           description: The social medias of the user
 *           example:
 *             'Facebook': 'facebook'
 *           items:
 *             type: object
 *             properties:
 *               key:
 *                 type: string
 *                 example: 'Facebook'
 *               value:
 *                 type: string
 *                 example: 'facebook'
 *     UpdateUser:
 *       type: object
 *       properties:
 *         email:
 *           type: string
 *           nullable: true
 *           description: The email of the user
 *           example: 'email@example.com'
 *           pattern: '^\b[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Z|a-z]{2,}\b'
 *         firstname:
 *           type: string
 *           nullable: true
 *           description: The first name of the user
 *           example: 'John'
 *         lastname:
 *           type: string
 *           nullable: true
 *           description: The last name of the user
 *           example: 'Doe'
 *         newPassword:
 *           type: string
 *           nullable: true
 *           description: The new password for the user
 *           example: 'MyPassword123'
 *           pattern: '^\S{8,}$'
 *         currentPassword:
 *           type: string
 *           nullable: true
 *           description: The current password of the user
 *         description:
 *           type: string
 *           nullable: true
 *           description: The description of the user
 *           example: 'I am a content creator'
 *           maxLength: 255
 *         website:
 *           type: string
 *           nullable: true
 *           description: The website of the user
 *           example: 'https://www.user-website.com'
 *         socialMedia:
 *           type: object
 *           nullable: true
 *           description: The social media accounts of the user
 *           example:
 *             'Facebook': 'facebook'
 *           additionalProperties:
 *             type: string
 *       anyOf:
 *         - required: [newPassword, currentPassword]
 */

const User = {
    username: '',
    email: '',
    roleId: '',
    firstname: '',
    lastname: '',
    password: '',
    description: '',
    website: null,
    socialMedia: null,
}

module.exports = User;