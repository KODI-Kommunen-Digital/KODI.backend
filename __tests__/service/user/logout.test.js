const userService = require('../../../services/users');
const tokenRepo = require('../../../repository/auth');
const AppError = require('../../../utils/appError');

jest.mock('../../../repository/users');
jest.mock('../../../repository/auth');

describe('logout', () => {
    beforeEach(() => {
        jest.clearAllMocks();
    });

    it('should throw error if user with refreshtoken does not exists', async () => {
        tokenRepo.getRefreshTokenByRefreshToken.mockResolvedValue(null);

        try {
            await userService.logout(100, 'sampleRefreshTokenNotReal');
        } catch (err) {
            expect(err).toBeInstanceOf(AppError);
            expect(err.message).toBe('User with id sampleRefreshTokenNotReal does not exist');
            expect(err.statusCode).toBe(404);
        }

        expect(tokenRepo.getRefreshTokenByRefreshToken).toBeCalledTimes(1);
        expect(tokenRepo.getRefreshTokenByRefreshToken).toBeCalledWith('sampleRefreshTokenNotReal');
    });

    it('success', async () => {
        tokenRepo.getRefreshTokenByRefreshToken.mockResolvedValue({ userId: 100, token: 'sampleRefreshTokenNotReal' });

        try {
            await userService.logout(100, 'sampleRefreshTokenNotReal');
        } catch (err) {
            expect(err).toBe(null);
        }

        expect(tokenRepo.getRefreshTokenByRefreshToken).toBeCalledTimes(1);
        expect(tokenRepo.getRefreshTokenByRefreshToken).toBeCalledWith('sampleRefreshTokenNotReal');

        expect(tokenRepo.deleteRefreshTokenFor).toBeCalledTimes(1);
        expect(tokenRepo.deleteRefreshTokenFor).toBeCalledWith({ userId: 100, refreshToken: 'sampleRefreshTokenNotReal' });
    });

    it('error while deleting token', async () => {
        tokenRepo.getRefreshTokenByRefreshToken.mockResolvedValue({ userId: 100, token: 'sampleRefreshTokenNotReal' });
        tokenRepo.deleteRefreshTokenFor.mockRejectedValue(new Error('Some error'));

        try {
            await userService.logout(100, 'sampleRefreshTokenNotReal');
        } catch (err) {
            expect(err).toBeInstanceOf(AppError);
            expect(err.message).toBe('Error: Some error');
            expect(err.statusCode).toBe(500);
        }

        expect(tokenRepo.getRefreshTokenByRefreshToken).toBeCalledTimes(1);
        expect(tokenRepo.getRefreshTokenByRefreshToken).toBeCalledWith('sampleRefreshTokenNotReal');

        expect(tokenRepo.deleteRefreshTokenFor).toBeCalledTimes(1);
        expect(tokenRepo.deleteRefreshTokenFor).toBeCalledWith({ userId: 100, refreshToken: 'sampleRefreshTokenNotReal' });
    });
});
