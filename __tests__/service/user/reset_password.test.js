const userService = require('../../../services/users');
const userRepo = require('../../../repository/users');
const tokenRepo = require('../../../repository/auth');
const AppError = require('../../../utils/appError');
const crypto = require("crypto");
const bcrypt = require("bcrypt");
const database = require('../../../utils/database');
const sendMail = require('../../../utils/sendMail');

jest.mock('../../../repository/users');
jest.mock('../../../repository/auth');
jest.mock('../../../utils/database');
jest.mock('../../../utils/sendMail');

describe('resetPassword', () => {
    beforeEach(() => {
        jest.clearAllMocks();
    });

    it('should throw error if user does not exists', async () => {
        const userId = 1;
        const token = crypto.randomBytes(32).toString("hex")
        userRepo.getUserDataById.mockResolvedValue(null);

        try {
            await userService.resetPassword(userId, 'en', token, 'newPassword');
        } catch (err) {
            expect(err).toBeInstanceOf(AppError);
            expect(err.message).toBe('UserId 1 does not exist');
            expect(err.statusCode).toBe(400);
        }

        expect(userRepo.getUserDataById).toBeCalledTimes(1);
        expect(userRepo.getUserDataById).toBeCalledWith(userId);
    });

    it('should throw error if new password and existing password are the same', async () => {
        const userId = 1;
        const token = crypto.randomBytes(32).toString("hex")
        const currentPassword = await bcrypt.hash(
            'validpassword',
            Number("10") // salt
        )
        userRepo.getUserDataById.mockResolvedValue({ id: userId, password: currentPassword });

        try {
            await userService.resetPassword(userId, 'en', token, 'validpassword');
        } catch (err) {
            expect(err).toBeInstanceOf(AppError);
            expect(err.message).toBe('New password should not be same as the old password');
            expect(err.statusCode).toBe(400);
            expect(err.errorCode).toBe(2004);
        }

        expect(userRepo.getUserDataById).toBeCalledTimes(1);
        expect(userRepo.getUserDataById).toBeCalledWith(userId);
    });

    it('should throw error if the token is not in the database', async () => {
        const userId = 1;
        const token = crypto.randomBytes(32).toString("hex")
        const currentPassword = await bcrypt.hash(
            'validpassword',
            Number("10") // salt
        )
        userRepo.getUserDataById.mockResolvedValue({ id: userId, password: currentPassword });
        tokenRepo.getForgotPasswordToken.mockResolvedValue(null);

        try {
            await userService.resetPassword(userId, 'en', token, 'newPassword');
        } catch (err) {
            expect(err).toBeInstanceOf(AppError);
            expect(err.message).toBe('Invalid data sent');
            expect(err.statusCode).toBe(400);
        }

        expect(userRepo.getUserDataById).toBeCalledTimes(1);
        expect(userRepo.getUserDataById).toBeCalledWith(1);

        expect(tokenRepo.getForgotPasswordToken).toBeCalledTimes(1);
        expect(tokenRepo.getForgotPasswordToken).toBeCalledWith(1, token);
    });

    it('should throw error if the token is expired', async () => {
        const userId = 1;
        const token = crypto.randomBytes(32).toString("hex")
        const currentPassword = await bcrypt.hash(
            'validpassword',
            Number("10") // salt
        )
        // token expires one second ago
        const expiresAt = new Date(Date.now() - 1000).toLocaleString();
        userRepo.getUserDataById.mockResolvedValue({ id: userId, password: currentPassword });
        tokenRepo.getForgotPasswordToken.mockResolvedValue({ expiresAt });

        try {
            await userService.resetPassword(userId, 'en', token, 'newPassword');
        } catch (err) {
            expect(err).toBeInstanceOf(AppError);
            expect(err.message).toBe('Token Expired');
            expect(err.statusCode).toBe(400);
        }

        expect(userRepo.getUserDataById).toBeCalledTimes(1);
        expect(userRepo.getUserDataById).toBeCalledWith(1);

        expect(tokenRepo.getForgotPasswordToken).toBeCalledTimes(1);
        expect(tokenRepo.getForgotPasswordToken).toBeCalledWith(1, token);

        expect(tokenRepo.deleteForgotPasswordToken).toBeCalledTimes(1);
        expect(tokenRepo.deleteForgotPasswordToken).toBeCalledWith(1, token);
    });

    it('success, send mail', async () => {
        const userId = 1;
        const token = crypto.randomBytes(32).toString("hex")
        const currentPassword = await bcrypt.hash(
            'validpassword',
            Number("10") // salt
        )
        // token expires one second ago
        const expiresAt = new Date(Date.now() + 100000).toLocaleString();
        userRepo.getUserDataById.mockResolvedValue({ id: userId, password: currentPassword, email: 'someone@email.com', firstname: 'John', lastname: 'Doe' });
        tokenRepo.getForgotPasswordToken.mockResolvedValue({ expiresAt });

        try {
            await userService.resetPassword(userId, 'en', token, 'newPassword');
        } catch (err) {
            expect(err).toBe(null);
        }

        expect(userRepo.getUserDataById).toBeCalledTimes(1);
        expect(userRepo.getUserDataById).toBeCalledWith(1);

        expect(tokenRepo.getForgotPasswordToken).toBeCalledTimes(1);
        expect(tokenRepo.getForgotPasswordToken).toBeCalledWith(1, token);

        expect(tokenRepo.deleteForgotPasswordToken).toBeCalledTimes(1);
        expect(tokenRepo.deleteForgotPasswordToken).toBeCalledWith(1, token);

        expect(userRepo.updateUserById).toBeCalledTimes(1);
        expect(userRepo.updateUserById).toBeCalledWith(1, { password: expect.any(String) });

        expect(sendMail).toBeCalledTimes(1);
        expect(sendMail).toBeCalledWith(expect.any(String), 'Your password has been reset', null, expect.any(String));

    });

    it('send acual error message if any undefined error occurs', async () => {
        const userId = 1;
        const token = crypto.randomBytes(32).toString("hex")
        const currentPassword = await bcrypt.hash(
            'validpassword',
            Number("10") // salt
        )
        // token expires one second ago
        const expiresAt = new Date(Date.now() + 100000).toLocaleString();
        userRepo.getUserDataById.mockResolvedValue({ id: userId, password: currentPassword, email: 'someone@email.com', firstname: 'John', lastname: 'Doe' });
        tokenRepo.getForgotPasswordToken.mockResolvedValue({ expiresAt });
        sendMail.mockRejectedValue(new Error('Some random error'));

        try {
            await userService.resetPassword(userId, 'en', token, 'newPassword');
        } catch (err) {
            expect(err).toBeInstanceOf(AppError);
            expect(err.message).toBe('Error: Some random error');
            expect(err.statusCode).toBe(500);
        }

        expect(userRepo.getUserDataById).toBeCalledTimes(1);
        expect(userRepo.getUserDataById).toBeCalledWith(1);

        expect(tokenRepo.getForgotPasswordToken).toBeCalledTimes(1);
        expect(tokenRepo.getForgotPasswordToken).toBeCalledWith(1, token);

        expect(tokenRepo.deleteForgotPasswordToken).toBeCalledTimes(1);
        expect(tokenRepo.deleteForgotPasswordToken).toBeCalledWith(1, token);

        expect(userRepo.updateUserById).toBeCalledTimes(1);
        expect(userRepo.updateUserById).toBeCalledWith(1, { password: expect.any(String) });

        expect(sendMail).toBeCalledTimes(1);
        expect(sendMail).toBeCalledWith(expect.any(String), 'Your password has been reset', null, expect.any(String));

    });
});
