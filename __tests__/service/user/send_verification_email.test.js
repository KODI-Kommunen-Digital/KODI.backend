const userService = require('../../../services/users');
const userRepo = require('../../../repository/users');
const tokenRepo = require('../../../repository/auth');
const AppError = require('../../../utils/appError');
const sendMail = require('../../../utils/sendMail');

jest.mock('../../../repository/users');
jest.mock('../../../repository/auth');
jest.mock('../../../utils/database');
jest.mock('../../../utils/sendMail');

describe('sendVerificationEmail', () => {
    beforeEach(() => {
        jest.clearAllMocks();
    });

    it('should throw error if user with email does not exists', async () => {
        userRepo.getUserWithEmail.mockResolvedValue(null);

        try {
            await userService.sendVerificationEmail('someone@email.com', 'en');
        } catch (err) {
            expect(err).toBeInstanceOf(AppError);
            expect(err.message).toBe('Email someone@email.com does not exist');
            expect(err.statusCode).toBe(400);
        }

        expect(userRepo.getUserWithEmail).toBeCalledTimes(1);
        expect(userRepo.getUserWithEmail).toBeCalledWith('someone@email.com');
    });

    it('should throw error if email is already verified', async () => {
        userRepo.getUserWithEmail.mockResolvedValue({ emailVerified: true });

        try {
            await userService.sendVerificationEmail('someone@email.com', 'en');
        } catch (err) {
            expect(err).toBeInstanceOf(AppError);
            expect(err.message).toBe('Email already verified');
            expect(err.statusCode).toBe(400);
        }

        expect(userRepo.getUserWithEmail).toBeCalledTimes(1);
        expect(userRepo.getUserWithEmail).toBeCalledWith('someone@email.com');
    });

    it('success', async () => {
        userRepo.getUserWithEmail.mockResolvedValue({ emailVerified: false, id: 1, email: 'someone@email.com', fisttname: 'John', lastname: 'Doe' });

        try {
            await userService.sendVerificationEmail('someone@email.com', 'en');
        } catch (err) {
            expect(err).toBe(null);
        }

        expect(userRepo.getUserWithEmail).toBeCalledTimes(1);
        expect(userRepo.getUserWithEmail).toBeCalledWith('someone@email.com');

        expect(tokenRepo.deleteVerificationToken).toBeCalledTimes(1);
        expect(tokenRepo.deleteVerificationToken).toBeCalledWith({ userId: 1 });

        expect(tokenRepo.insertVerificationTokenData).toBeCalledTimes(1);
        // expect token to be inserted with userId, token, and expiresAt, where expiresAt is between 23-24 hours from now
        expect(tokenRepo.insertVerificationTokenData).toBeCalledWith(expect.objectContaining({
            userId: 1,
            token: expect.any(String),
            expiresAt: expect.any(String)
        }));

        expect(sendMail).toBeCalledTimes(1);
        expect(sendMail).toBeCalledWith(expect.any(String), 'Verify your email', null, expect.any(String));

        const [callArguments] = tokenRepo.insertVerificationTokenData.mock.calls[0];
        const { expiresAt } = callArguments;
        // convert expiresAt to milliseconds
        let expiresAtInMilliseconds = new Date(expiresAt).getTime();

        const now = Date.now();
        // lower bound is 23 hours and 59 minutes from now
        // upper bound is 24 hours from now
        // asserting the token should expire between 23:59-24 hours from now
        const lowerBound = now + (23 + .59 / 60) * 60 * 60 * 1000;
        const upperBound = now + 24 * 60 * 60 * 1000;

        // Check if the expiresAt is within the specified range
        expect(expiresAtInMilliseconds).toBeGreaterThanOrEqual(lowerBound);
        expect(expiresAtInMilliseconds).toBeLessThanOrEqual(upperBound);
    });
});
