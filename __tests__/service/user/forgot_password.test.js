const userService = require('../../../services/users');
const userRepo = require('../../../repository/users');
const AppError = require('../../../utils/appError');
const database = require('../../../utils/database');
const sendMail = require('../../../utils/sendMail');

jest.mock('../../../repository/users');
jest.mock('../../../utils/database');
jest.mock('../../../utils/sendMail');

describe('forgotPassword', () => {
    beforeEach(() => {
        jest.clearAllMocks();
    });

    it('should throw error if user does not exists', async () => {
        const username = 'user';
        database.createTransaction.mockResolvedValue({ id: 1 });
        userRepo.getUserByUsernameOrEmail.mockResolvedValue(null);

        try {
            await userService.forgotPassword(username);
        } catch (err) {
            expect(err).toBeInstanceOf(AppError);
            expect(err.statusCode).toBe(404);
            expect(err.message).toBe('Username user does not exist');
        }
        expect(database.createTransaction).toBeCalledTimes(1);

        expect(userRepo.getUserByUsernameOrEmail).toBeCalledTimes(1);
        expect(userRepo.getUserByUsernameOrEmail).toBeCalledWith(username, username);
    });

    it('should send email if no errors', async () => {
        const username = 'user';
        const email = 'someone@example.com';
        const transaction = { cityId: 1 };  // transaction object(not based on real values)
        database.createTransaction.mockResolvedValue(transaction);
        userRepo.getUserByUsernameOrEmail.mockResolvedValue({ id: 2, username, email });
        userRepo.deleteForgotTokenForUserWithConnection.mockResolvedValue(null);
        sendMail.mockResolvedValue(null);
        database.commitTransaction.mockResolvedValue(null);

        try {
            await userService.forgotPassword(username);
        } catch (err) {
            expect(err).toBe(null);
        }
        expect(database.createTransaction).toBeCalledTimes(1);

        expect(userRepo.getUserByUsernameOrEmail).toBeCalledTimes(1);
        expect(userRepo.getUserByUsernameOrEmail).toBeCalledWith(username, username);

        expect(userRepo.deleteForgotTokenForUserWithConnection).toBeCalledTimes(1);
        expect(userRepo.deleteForgotTokenForUserWithConnection).toBeCalledWith(2, { cityId: 1 });

        expect(userRepo.addForgotPasswordTokenWithConnection).toBeCalledTimes(1);
        expect(userRepo.addForgotPasswordTokenWithConnection.mock.calls[0][0]).toEqual(expect.objectContaining({
            userId: 2,
            token: expect.any(String),
            expiresAt: expect.any(String)
        }));

        expect(sendMail).toBeCalledTimes(1);
        expect(sendMail).toBeCalledWith(email, 'Setze dein Passwort zurück', null, expect.any(String));

        expect(database.commitTransaction).toBeCalledTimes(1);
        expect(database.commitTransaction).toBeCalledWith({ cityId: 1 });
    });

    it('should send email in english if no errors and language of selection is english', async () => {
        const username = 'user';
        const email = 'someone@example.com';
        const transaction = { cityId: 1 };  // transaction object(not based on real values)
        database.createTransaction.mockResolvedValue(transaction);
        userRepo.getUserByUsernameOrEmail.mockResolvedValue({ id: 2, username, email });
        userRepo.deleteForgotTokenForUserWithConnection.mockResolvedValue(null);
        sendMail.mockResolvedValue(null);
        database.commitTransaction.mockResolvedValue(null);

        try {
            await userService.forgotPassword(username, 'en');
        } catch (err) {
            expect(err).toBe(null);
        }
        expect(database.createTransaction).toBeCalledTimes(1);

        expect(userRepo.getUserByUsernameOrEmail).toBeCalledTimes(1);
        expect(userRepo.getUserByUsernameOrEmail).toBeCalledWith(username, username);

        expect(userRepo.deleteForgotTokenForUserWithConnection).toBeCalledTimes(1);
        expect(userRepo.deleteForgotTokenForUserWithConnection).toBeCalledWith(2, { cityId: 1 });

        expect(userRepo.addForgotPasswordTokenWithConnection).toBeCalledTimes(1);
        expect(userRepo.addForgotPasswordTokenWithConnection.mock.calls[0][0]).toEqual(expect.objectContaining({
            userId: 2,
            token: expect.any(String),
            expiresAt: expect.any(String)
        }));

        expect(sendMail).toBeCalledTimes(1);
        expect(sendMail).toBeCalledWith(email, 'Reset your password', null, expect.any(String));

        expect(database.commitTransaction).toBeCalledTimes(1);
        expect(database.commitTransaction).toBeCalledWith({ cityId: 1 });
    });

    it('should rollback if any errors', async () => {
        const username = 'user';
        const email = 'someone@example.com';
        const transaction = { cityId: 1 };  // transaction object(not based on real values)
        database.createTransaction.mockResolvedValue(transaction);
        userRepo.getUserByUsernameOrEmail.mockResolvedValue({ id: 2, username, email });
        userRepo.deleteForgotTokenForUserWithConnection.mockResolvedValue(null);
        sendMail.mockRejectedValue(new Error('error'));

        try {
            await userService.forgotPassword(username, 'en');
        } catch (err) {
            expect(err).toBeInstanceOf(Error);
            expect(err.message).toBe('Error: error');
            expect(err.statusCode).toBe(500);
        }
        expect(database.createTransaction).toBeCalledTimes(1);

        expect(userRepo.getUserByUsernameOrEmail).toBeCalledTimes(1);
        expect(userRepo.getUserByUsernameOrEmail).toBeCalledWith(username, username);

        expect(userRepo.deleteForgotTokenForUserWithConnection).toBeCalledTimes(1);
        expect(userRepo.deleteForgotTokenForUserWithConnection).toBeCalledWith(2, { cityId: 1 });

        expect(userRepo.addForgotPasswordTokenWithConnection).toBeCalledTimes(1);
        expect(userRepo.addForgotPasswordTokenWithConnection.mock.calls[0][0]).toEqual(expect.objectContaining({
            userId: 2,
            token: expect.any(String),
            expiresAt: expect.any(String)
        }));

        expect(sendMail).toBeCalledTimes(1);
        expect(sendMail).toBeCalledWith(email, 'Reset your password', null, expect.any(String));

        expect(database.commitTransaction).toBeCalledTimes(0);

        expect(database.rollbackTransaction).toBeCalledTimes(1);
    });
});
