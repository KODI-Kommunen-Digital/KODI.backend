const userService = require('../../../services/users');
const userRepo = require('../../../repository/users');
const AppError = require('../../../utils/appError');
const database = require('../../../utils/database');
const sendMail = require('../../../utils/sendMail');

jest.mock('../../../repository/users');
jest.mock('../../../utils/database');
jest.mock('../../../utils/sendMail');

describe('register user', () => {
    const samplePayload = {
        username: 'johndoe',
        email: 'email@example.com',
        roleId: 1,
        firstname: 'John',
        lastname: 'Doe',
        password: 'MyPassword123',
        description: 'I am a content creator',
        website: 'https://www.user-website.com',
        socialMedia: {
            Facebook: 'facebook'
        }
    };
    beforeEach(() => {
        jest.clearAllMocks();
    });

    it('should throw error if an empty payload is sent', async () => {
        try {
            await userService.register(null);
        } catch (error) {
            expect(error.message).toBe('Empty payload sent');
            expect(error.statusCode).toBe(400);
            expect(error.errorCode).toBe(1001);
        }
    });

    it('should throw error if username is not present in the payload', async () => {
        try {
            await userService.register({});
        } catch (error) {
            expect(error.message).toBe('Username is not present');
            expect(error.statusCode).toBe(400);
            expect(error.errorCode).toBe(1002);
        }
    });

    it('should throw error is username is already registered', async () => {
        userRepo.getUserWithUsername.mockResolvedValue({ id: 1 });
        try {
            await userService.register({
                username: 'johndoe'
            });
        } catch (error) {
            expect(error.message).toBe(`User with username 'johndoe' already exists`);
            expect(error.statusCode).toBe(400);
            expect(error.errorCode).toBe(2005);
        }
    });

    // invalid username test cases
    const testCases = [
        {
            username: 'john doe',
            errorMessage: `Username 'john doe' is not valid`
        },
        {
            username: '_johndoe',
            errorMessage: `Username '_johndoe' is not valid`
        },
        {
            username: '!johndoe',
            errorMessage: `Username '!johndoe' is not valid`
        }
    ];

    for (const testCase of testCases) {
        it(`should throw error if username is invalid: ${testCase.username}`, async () => {
            userRepo.getUserWithUsername.mockResolvedValue(null);
            try {
                await userService.register({
                    username: testCase.username
                });
            } catch (error) {
                expect(error.message).toBe(testCase.errorMessage);
                expect(error.statusCode).toBe(400);
                expect(error.errorCode).toBe(2001);
            }
        });
    }

    // // invalid email test cases
    // const invalidEmailTestCases = [
    //     { email: 'invalidemail.com', errorMessage: `No '@' symbol` },
    //     { email: 'user@invalid@domain.com', errorMessage: `Multiple '@' symbols` },
    //     { email: 'user@', errorMessage: `No domain` },
    //     { email: '@domain.com', errorMessage: `No username` },
    //     { email: 'user@domain', errorMessage: `Missing top-level domain (TLD)` },
    //     { email: 'user@dom!ain.com', errorMessage: `Domain contains invalid characters` },
    //     { email: 'user name@domain.com', errorMessage: `Username contains spaces` },
    //     { email: '.username@domain.com', errorMessage: `Username starts with a dot` },
    //     { email: 'username.@domain.com', errorMessage: `Username ends with a dot` },
    //     { email: 'user@domain.c', errorMessage: `TLD is too short` }
    // ]

    // for (const testCase of invalidEmailTestCases) {
    //     it(`should throw error if email is invalid: ${testCase.email}`, async () => {
    //         userRepo.getUserWithEmail.mockResolvedValue(null);

    //         await expect(userService.register({
    //             username: 'johndoe',
    //             email: testCase.email
    //         })).rejects.toThrow(new AppError(testCase.errorMessage, 400, testCase.errorCode));
    //     });
    // }

    it('should throw error if email is not present in the payload', async () => {
        try {
            await userService.register({ username: 'johndoe' });
        } catch (error) {
            expect(error.message).toBe('Email is not present');
            expect(error.statusCode).toBe(400);
            expect(error.errorCode).toBe(1006);
        }
    });

    it('should throw error if email is already registered', async () => {
        userRepo.getUserWithUsername.mockResolvedValue(null);
        userRepo.getUserWithEmail.mockResolvedValue({ id: 1 });
        try {
            await userService.register({
                username: 'johndoe',
                email: 'someone@example.com'
            });
        } catch (error) {
            expect(error.message).toBe(`User with email 'someone@example.com' is already registered`);
            expect(error.statusCode).toBe(400);
            expect(error.errorCode).toBe(2007);
        }
    });

    it('should throw error if firstname is not present in the payload', async () => {
        userRepo.getUserWithUsername.mockResolvedValue(null);
        userRepo.getUserWithEmail.mockResolvedValue(null);
        try {
            await userService.register({
                username: 'johndoe',
                email: 'someone@example.com'
            })
        } catch (error) {
            expect(error.message).toBe('Firstname is not present');
            expect(error.statusCode).toBe(400);
            expect(error.errorCode).toBe(1004);
        }
    });

    it('should throw error if lastname is not present in the payload', async () => {
        userRepo.getUserWithUsername.mockResolvedValue(null);
        userRepo.getUserWithEmail.mockResolvedValue(null);

        try {
            await userService.register({
                username: 'johndoe',
                email: 'someone@example.com',
                firstname: 'John'
            });
        } catch (error) {
            // Assert both error message and error code
            expect(error.message).toBe('Lastname is not present');
            expect(error.statusCode).toBe(400);
            expect(error.errorCode).toBe(1005);
        }
    });

    it('should throw error if password is not present in the payload', async () => {
        userRepo.getUserWithUsername.mockResolvedValue(null);
        userRepo.getUserWithEmail.mockResolvedValue(null);

        try {
            await userService.register({
                username: 'johndoe',
                email: 'someone@example.com',
                firstname: 'John',
                lastname: 'Doe'
            });
        } catch (error) {
            expect(error.message).toBe('Password is not present');
            expect(error.statusCode).toBe(400);
            expect(error.errorCode).toBe(1003);
        }
    });

    it('should throw error if password is not present in the payload', async () => {
        userRepo.getUserWithUsername.mockResolvedValue(null);
        userRepo.getUserWithEmail.mockResolvedValue(null);

        try {
            await userService.register({
                username: 'johndoe',
                email: 'someone@example.com',
                firstname: 'John',
                lastname: 'Doe'
            });
        } catch (error) {
            expect(error.message).toBe('Password is not present');
            expect(error.statusCode).toBe(400);
            expect(error.errorCode).toBe(1003);
        }
    });

    // Invalid passwords test cases
    const testPasswords = [
        "short",                    // Error: Invalid Password (too short)
        "spaces are not allowed",   // Error: Invalid Password (contains whitespace)
        "\nnewline123",             // Error: Invalid Password (contains newline)
        "  leadingSpace",           // Error: Invalid Password (contains leading whitespace)
        "trailingSpace  "           // Error: Invalid Password (contains trailing whitespace)
    ];
    for (const password of testPasswords) {
        it(`should throw error as password is invalid: ${password}`, async () => {
            userRepo.getUserWithUsername.mockResolvedValue(null);
            userRepo.getUserWithEmail.mockResolvedValue(null);

            try {
                await userService.register({
                    username: 'johndoe',
                    email: 'someone@example.com',
                    firstname: 'John',
                    lastname: 'Doe',
                    password: password
                });
            } catch (error) {
                expect(error.message).toBe('Invalid Password. ');
                expect(error.statusCode).toBe(400);
                expect(error.errorCode).toBe(2002);
            }
        });
    }

    // Invalid phone numbers test cases
    const invalidPhoneNumbers = [
        { phoneNumber: "555-1234", reason: "Missing area code" },
        { phoneNumber: "(123) 456-7890 ext 42", reason: "Contains additional text" }
    ];

    for (const testCase of invalidPhoneNumbers) {
        it(`should throw error as phone number is invalid: ${testCase.phoneNumber}, reason: ${testCase.reason}`, async () => {
            userRepo.getUserWithUsername.mockResolvedValue(null);
            userRepo.getUserWithEmail.mockResolvedValue(null);

            try {
                await userService.register({
                    username: 'johndoe',
                    email: 'someone@example.com',
                    firstname: 'John',
                    lastname: 'Doe',
                    password: 'validpassword',
                    phoneNumber: testCase.phoneNumber
                });
            } catch (error) {
                expect(error.message).toBe('Phone number is not valid');
            }
        });
    }

    const validPhoneNumbers = [
        "(123) 456-7890",
        "123.456.7890",
        "123 456 7890",
        "123-456-7890",
        "(123)-456-7890",
        "(123)456-7890",
        // "1-800-123-4567"
    ];
    for (const phoneNumber of validPhoneNumbers) {
        it(`should not throw phone number is invalid: ${phoneNumber}`, async () => {
            userRepo.getUserWithUsername.mockResolvedValue(null);
            userRepo.getUserWithEmail.mockResolvedValue(null);

            try {
                await userService.register({
                    username: 'johndoe',
                    email: 'someone@example.com',
                    firstname: 'John',
                    lastname: 'Doe',
                    password: 'validpassword',
                    phoneNumber: phoneNumber
                });
            } catch (error) {
                // error message should not be Phone number is not valid
                expect(error.message).not.toBe('Phone number is not valid');
            }
        });
    }

    // TODO: test for social media

    it('should return a user id', async () => {
        const sampleConnection = {
            release: jest.fn()
        };
        userRepo.getUserWithUsername.mockResolvedValue(null);
        userRepo.getUserWithEmail.mockResolvedValue(null);
        database.createTransaction.mockResolvedValue(sampleConnection);
        userRepo.createUser.mockResolvedValue({ id: 1 });
        userRepo.addVerificationToken.mockResolvedValue(null);
        sendMail.mockResolvedValue(null);
        database.commitTransaction.mockResolvedValue(null);

        const result = await userService.register(samplePayload);
        expect(result).toEqual(1);
        expect(userRepo.createUser).toHaveBeenCalledTimes(1);
        expect(userRepo.createUser).toHaveBeenCalledWith(expect.objectContaining({
            username: 'johndoe',
            email: 'email@example.com',
            firstname: 'John',
            lastname: 'Doe',
            description: 'I am a content creator',
            website: 'https://www.user-website.com',
            roleId: 3,
            socialMedia: "{\"Facebook\":\"facebook\"}",
        }), sampleConnection);
    });


    it('should rollback if error while creating a user', async () => {
        const sampleConnection = {
            release: jest.fn()
        };
        userRepo.getUserWithUsername.mockResolvedValue(null);
        userRepo.getUserWithEmail.mockResolvedValue(null);
        database.createTransaction.mockResolvedValue(sampleConnection);
        userRepo.createUser.mockResolvedValue({ id: 1 });
        userRepo.addVerificationToken.mockResolvedValue(null);
        // sendmail throws an error
        sendMail.mockRejectedValue(new AppError('Error sending verification email'));
        database.rollbackTransaction.mockResolvedValue(null);
        try {
            await userService.register(samplePayload);
        } catch (error) {
            expect(error.message).toBe('Error sending verification email');
        }
        expect(userRepo.createUser).toHaveBeenCalledTimes(1);
        expect(userRepo.createUser).toHaveBeenCalledWith(expect.objectContaining({
            username: 'johndoe',
            email: 'email@example.com',
            firstname: 'John',
            lastname: 'Doe',
            description: 'I am a content creator',
            website: 'https://www.user-website.com',
            roleId: 3,
            socialMedia: "{\"Facebook\":\"facebook\"}",
        }), sampleConnection);
    });
});
