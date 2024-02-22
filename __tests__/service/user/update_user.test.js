const bcrypt = require("bcrypt");
const userService = require('../../../services/users');
const userRepo = require('../../../repository/users');
const AppError = require('../../../utils/appError');
const database = require('../../../utils/database');
const sendMail = require('../../../utils/sendMail');

jest.mock('../../../repository/users');
jest.mock('../../../utils/database');
jest.mock('../../../utils/sendMail');

describe('update user', () => {
    const samplePayload = {
        id: 142,
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

    it('should throw an error if user does not exist', async () => {
        userRepo.getUserDataById.mockResolvedValue(null);
        try {
            await userService.updateUser(142, samplePayload);
        } catch (error) {
            expect(error).toBeInstanceOf(AppError);
            expect(error.message).toBe(`User with id 142 does not exist`);
        }
        expect(userRepo.getUserDataById).toHaveBeenCalledWith(142);
        expect(userRepo.getUserDataById).toHaveBeenCalledTimes(1);
    });

    it('should throw an error if username in payload and database are different', async () => {
        userRepo.getUserDataById.mockResolvedValue({ username: 'janedoe' });
        try {
            await userService.updateUser(142, samplePayload);
        } catch (error) {
            expect(error).toBeInstanceOf(AppError);
            expect(error.message).toBe(`Username cannot be edited`);
        }
        expect(userRepo.getUserDataById).toHaveBeenCalledWith(142);
        expect(userRepo.getUserDataById).toHaveBeenCalledTimes(1);
    });

    // invalid email test cases
    const invalidEmailTestCases = [
        { email: 'invalidemail.com', errorMessage: `No '@' symbol` },
        { email: 'user@invalid@domain.com', errorMessage: `Multiple '@' symbols` },
        { email: 'user@', errorMessage: `No domain` },
        { email: '@domain.com', errorMessage: `No username` },
        { email: 'user@domain', errorMessage: `Missing top-level domain (TLD)` },
        { email: 'user@dom!ain.com', errorMessage: `Domain contains invalid characters` },
        { email: 'user name@domain.com', errorMessage: `Username contains spaces` },
        { email: '.username@domain.com', errorMessage: `Username starts with a dot` },
        { email: 'username.@domain.com', errorMessage: `Username ends with a dot` },
        { email: 'user@domain.c', errorMessage: `TLD is too short` }
    ]

    for (const testCase of invalidEmailTestCases) {
        it(`should throw error if email is invalid: ${testCase.email}, reason: ${testCase.errorMessage}`, async () => {
            userRepo.getUserDataById.mockResolvedValue({ username: 'johndoe', email: testCase.email });
            try {
                await userService.updateUser(142, {
                    username: 'johndoe',
                    email: testCase.email,
                });
            } catch (error) {
                expect(error).toBeInstanceOf(AppError);
                expect(error.message).toBe("Invalid email given");
                expect(error.statusCode).toBe(400);
            }
        });
    }

    it('should not throw error if email is valid', async () => {
        userRepo.getUserDataById.mockResolvedValue({ username: 'johndoe', email: 'someone@mail.com' });
        try {
            await userService.updateUser(142, {
                username: 'johndoe',
                email: 'some2ndone@mail.com'
            });
        } catch (error) {
            expect(error).toBeInstanceOf(AppError);
            expect(error.message).not.toBe("Invalid email given");
        }
    });

    it('should throw error if newPassword is given without currentPassword', async () => {
        userRepo.getUserDataById.mockResolvedValue({ username: 'johndoe', email: 'someone@mail.com' });
        try {
            await userService.updateUser(142, {
                username: 'johndoe',
                email: 'someone@mail.com',
                newPassword: 'newPassword'
            });
        } catch (error) {
            expect(error).toBeInstanceOf(AppError);
            expect(error.message).toBe("Current password not given to update password");
            expect(error.statusCode).toBe(400);
        }
    });

    it('should throw error if currentPassword given is invalid', async () => {
        const password = 'validpassword';
        const resPass = await bcrypt.hash(
            'invalidPassword',
            Number("10") // salt
        )
        userRepo.getUserDataById.mockResolvedValue({ username: 'johndoe', email: 'someone@mail.com', password: resPass });
        try {
            await userService.updateUser(142, {
                username: 'johndoe',
                email: 'someone@mail.com',
                currentPassword: password,
                newPassword: password
            });
        } catch (error) {
            expect(error).toBeInstanceOf(AppError);
            expect(error.message).toBe("Incorrect current password given");
            expect(error.statusCode).toBe(401);
        }
    });

    it('should throw error if old password and newPassword are the same', async () => {
        const password = 'validpassword';
        const resPass = await bcrypt.hash(
            password,
            Number("10") // salt
        )
        userRepo.getUserDataById.mockResolvedValue({ username: 'johndoe', email: 'someone@mail.com', password: resPass });
        try {
            await userService.updateUser(142, {
                username: 'johndoe',
                email: 'someone@mail.com',
                currentPassword: password,
                newPassword: password
            });
        } catch (error) {
            expect(error).toBeInstanceOf(AppError);
            expect(error.message).toBe("New password should not be same as the old password");
            expect(error.statusCode).toBe(400);
        }
    });


    // Invalid phone numbers test cases
    const invalidPhoneNumbers = [
        { phoneNumber: "555-1234", reason: "Missing area code" },
        { phoneNumber: "(123) 456-7890 ext 42", reason: "Contains additional text" }
    ];
    for (const testCase of invalidPhoneNumbers) {
        it(`should throw error as phone number is invalid: ${testCase.phoneNumber}, reason: ${testCase.reason}`, async () => {
            const password = 'validpassword';
            const newPassword = 'newPassword';
            const resPass = await bcrypt.hash(
                password,
                Number("10") // salt
            )
            const newResPass = await bcrypt.hash(
                newPassword,
                Number("10") // salt
            )

            userRepo.getUserDataById.mockResolvedValue({ username: 'johndoe', email: 'someone@mail.com', password: resPass });
            try {
                await userService.updateUser(142, {
                    username: 'johndoe',
                    email: 'someone@mail.com',
                    currentPassword: password,
                    newPassword: newPassword,
                    phoneNumber: testCase.phoneNumber
                });
            } catch (error) {
                expect(error).toBeInstanceOf(AppError);
                expect(error.message).toBe("Phone number is not valid");
                expect(error.statusCode).toBe(400);
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
            const password = 'validpassword';
            const newPassword = 'newPassword';
            const resPass = await bcrypt.hash(
                password,
                Number("10") // salt
            )

            userRepo.getUserDataById.mockResolvedValue({ username: 'johndoe', email: 'someone@mail.com', password: resPass });
            try {
                await userService.updateUser(142, {
                    username: 'johndoe',
                    email: 'someone@mail.com',
                    currentPassword: password,
                    newPassword: newPassword,
                    phoneNumber: testCase.phoneNumber
                });
            } catch (error) {
                expect(error.message).not.toBe("Phone number is not valid");
            }
        });
    }

    it(`should throw error if description.length>255`, async () => {
        const password = 'validpassword';
        const newPassword = 'newPassword';
        const resPass = await bcrypt.hash(
            password,
            Number("10") // salt
        )
        let description = "";
        for (let i = 0; i < 256; i++) {
            description += "a";
        }

        userRepo.getUserDataById.mockResolvedValue({ username: 'johndoe', email: 'someone@mail.com', password: resPass });
        try {
            await userService.updateUser(142, {
                username: 'johndoe',
                email: 'someone@mail.com',
                currentPassword: password,
                newPassword: newPassword,
                description: description
            });
        } catch (error) {
            expect(error).toBeInstanceOf(AppError);
            expect(error.message).toBe("Length of Description cannot exceed 255 characters");
            expect(error.statusCode).toBe(400);
        }
    });

    it(`should not throw decription error if description.length <= 255`, async () => {
        const password = 'validpassword';
        const newPassword = 'newPassword';
        const resPass = await bcrypt.hash(
            password,
            Number("10") // salt
        )
        let description = "";
        for (let i = 0; i < 255; i++) {
            description += "a";
        }

        userRepo.getUserDataById.mockResolvedValue({ username: 'johndoe', email: 'someone@mail.com', password: resPass });
        try {
            await userService.updateUser(142, {
                username: 'johndoe',
                email: 'someone@mail.com',
                currentPassword: password,
                newPassword: newPassword,
                description: description
            });
        } catch (error) {
            expect(error).toBeInstanceOf(AppError);
            expect(error.message).not.toBe("Length of Description cannot exceed 255 characters");
        }
    });

    it(`success`, async () => {
        const password = 'validpassword';
        const resPass = await bcrypt.hash(
            password,
            Number("10") // salt
        )

        const user = {
            username: 'johndoe',
            email: 'email@example.com',
            firstname: 'John',
            lastname: 'Doe',
            password: resPass,
            description: 'I am a content creator',
            website: 'https://www.user-website.com',
            roleId: 3,
            socialMedia: "{\"Facebook\":\"facebook\"}",
        };

        userRepo.getUserDataById.mockResolvedValue(user);
        try {
            await userService.updateUser(142, {
                socialMedia: "[{\"Instagram\":\"instagram\"}]",
            });
        } catch (error) {
            expect(error).toBe(null);
        }
        expect(userRepo.updateUserById).toHaveBeenCalledWith(142, expect.objectContaining({ socialMedia: "[{\"Instagram\":\"instagram\"}]" }));
    });
});
