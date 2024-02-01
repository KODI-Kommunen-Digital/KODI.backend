const userService = require('../../../services/users');
const userRepo = require('../../../repository/users');
const tokenRepo = require('../../../repository/auth');
const AppError = require('../../../utils/appError');
const sendMail = require('../../../utils/sendMail');

jest.mock('../../../repository/users');
jest.mock('../../../repository/auth');
jest.mock('../../../utils/sendMail');

describe('verifyEmail', () => {
    beforeEach(() => {
        jest.clearAllMocks();
    });

    it('should throw error if user with userId does not exists', async () => {
        userRepo.getUserDataById.mockResolvedValue(null);

        try {
            await userService.verifyEmail(100, '', 'en');
        } catch (err) {
            expect(err).toBeInstanceOf(AppError);
            expect(err.message).toBe('UserId 100 does not exist');
            expect(err.statusCode).toBe(400);
        }

        expect(userRepo.getUserDataById).toBeCalledTimes(1);
        expect(userRepo.getUserDataById).toBeCalledWith(100);
    });

    it('should return if email is already verified', async () => {
        userRepo.getUserDataById.mockResolvedValue({ id: 2, emailVerified: true });

        try {
            const res = await userService.verifyEmail(2, '', 'en');
            expect(res).toBe("Email has already been vefified!!");
        } catch (err) {
            expect(err).toBe(null);
        }

        expect(userRepo.getUserDataById).toBeCalledTimes(1);
        expect(userRepo.getUserDataById).toBeCalledWith(2);
    });

    it('should throw error if token does not exists', async () => {
        userRepo.getUserDataById.mockResolvedValue({ id: 2, emailVerified: false });
        tokenRepo.getEmailVerificationToken.mockResolvedValue(null);

        try {
            await userService.verifyEmail(2, 'tokenHolder', 'en');
        } catch (err) {
            expect(err).toBeInstanceOf(AppError);
            expect(err.message).toBe('Invalid data sent');
            expect(err.statusCode).toBe(400);
        }

        expect(userRepo.getUserDataById).toBeCalledTimes(1);
        expect(userRepo.getUserDataById).toBeCalledWith(2);

        expect(tokenRepo.getEmailVerificationToken).toBeCalledTimes(1);
        expect(tokenRepo.getEmailVerificationToken).toBeCalledWith(2, 'tokenHolder');

        expect(tokenRepo.deleteVerificationToken).toBeCalledTimes(0);
    });

    it('should throw error if token has expired', async () => {
        userRepo.getUserDataById.mockResolvedValue({ id: 2, emailVerified: false });
        tokenRepo.getEmailVerificationToken.mockResolvedValue({ expiresAt: new Date(Date.now() - 1000).toLocaleString() });

        try {
            await userService.verifyEmail(2, 'tokenHolder', 'en');
        } catch (err) {
            expect(err).toBeInstanceOf(AppError);
            expect(err.message).toBe('Token Expired, send verification mail again');
            expect(err.statusCode).toBe(400);
        }

        expect(userRepo.getUserDataById).toBeCalledTimes(1);
        expect(userRepo.getUserDataById).toBeCalledWith(2);

        expect(tokenRepo.getEmailVerificationToken).toBeCalledTimes(1);
        expect(tokenRepo.getEmailVerificationToken).toBeCalledWith(2, 'tokenHolder');

        expect(tokenRepo.deleteVerificationToken).toBeCalledTimes(1);
        expect(tokenRepo.deleteVerificationToken).toBeCalledWith({ userId: 2, token: 'tokenHolder' });

        expect(userRepo.updateUserById).toBeCalledTimes(0);
    });

    it('success', async () => {
        userRepo.getUserDataById.mockResolvedValue({ id: 2, emailVerified: false, email: 'someone@example.com' });
        tokenRepo.getEmailVerificationToken.mockResolvedValue({ expiresAt: new Date(Date.now() + 60 * 1000).toLocaleString() });

        try {
            await userService.verifyEmail(2, 'tokenHolder', 'en');
        } catch (err) {
            expect(err).toBe(null);
        }

        expect(userRepo.getUserDataById).toBeCalledTimes(1);
        expect(userRepo.getUserDataById).toBeCalledWith(2);

        expect(tokenRepo.getEmailVerificationToken).toBeCalledTimes(1);
        expect(tokenRepo.getEmailVerificationToken).toBeCalledWith(2, 'tokenHolder');

        expect(tokenRepo.deleteVerificationToken).toBeCalledTimes(1);
        expect(tokenRepo.deleteVerificationToken).toBeCalledWith({ userId: 2, token: 'tokenHolder' });

        expect(userRepo.updateUserById).toBeCalledTimes(1);
        expect(userRepo.updateUserById).toBeCalledWith(2, { emailVerified: true });

        expect(sendMail).toBeCalledTimes(1);
        expect(sendMail).toBeCalledWith('someone@example.com', 'Your email has been verified', null, expect.any(String));
    });

    it('error while sending email', async () => {
        userRepo.getUserDataById.mockResolvedValue({ id: 2, emailVerified: false, email: 'someone@example.com' });
        tokenRepo.getEmailVerificationToken.mockResolvedValue({ expiresAt: new Date(Date.now() + 60 * 1000).toLocaleString() });
        sendMail.mockRejectedValue(new Error('Error sending email'));

        try {
            await userService.verifyEmail(2, 'tokenHolder', 'en');
        } catch (err) {
            expect(err).toBeInstanceOf(AppError);
            expect(err.message).toBe('Error: Error sending email');
            expect(err.statusCode).toBe(500);
        }

        expect(userRepo.getUserDataById).toBeCalledTimes(1);
        expect(userRepo.getUserDataById).toBeCalledWith(2);

        expect(tokenRepo.getEmailVerificationToken).toBeCalledTimes(1);
        expect(tokenRepo.getEmailVerificationToken).toBeCalledWith(2, 'tokenHolder');

        expect(tokenRepo.deleteVerificationToken).toBeCalledTimes(1);
        expect(tokenRepo.deleteVerificationToken).toBeCalledWith({ userId: 2, token: 'tokenHolder' });

        expect(userRepo.updateUserById).toBeCalledTimes(1);
        expect(userRepo.updateUserById).toBeCalledWith(2, { emailVerified: true });

        expect(sendMail).toBeCalledTimes(1);
        expect(sendMail).toBeCalledWith('someone@example.com', 'Your email has been verified', null, expect.any(String));
    });

    

});
