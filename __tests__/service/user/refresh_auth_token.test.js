const tokenRepo = require('../../../repository/auth');
const AppError = require('../../../utils/appError');
const refreshAuthToken = require('../../../services/users').refreshAuthToken;
const jwt = require("jsonwebtoken");

jest.mock('../../../repository/auth');

describe('refreshAuthToken', () => {

    const tempGenerator = function (payload, accessExpiry, refreshExpiry) {
        const accessSecretKey = `-----BEGIN RSA PRIVATE KEY-----\n${process.env.ACCESS_PRIVATE}\n-----END RSA PRIVATE KEY-----`;
        const refreshSecretKey = `-----BEGIN RSA PRIVATE KEY-----\n${process.env.REFRESH_PRIVATE}\n-----END RSA PRIVATE KEY-----`;

        const accessToken = jwt.sign(payload, accessSecretKey, {
            expiresIn: accessExpiry || Number(process.env.AUTH_EXPIRATION),
            algorithm: "RS256",
        });

        const refreshToken = jwt.sign(payload, refreshSecretKey, {
            expiresIn: refreshExpiry || Number(process.env.REFRESH_EXPIRATION),
            algorithm: "RS256",
        });

        return { accessToken, refreshToken };
    }

    beforeEach(() => {
        jest.clearAllMocks();
    });

    it('should throw an error for invalid userId', async () => {
        const userId = 'invalidUserId';
        const sourceAddress = '127.0.0.1';
        const refreshToken = 'inValidRefreshToken';

        try {
            await refreshAuthToken(userId, sourceAddress, refreshToken)
        } catch (error) {
            expect(error).toBeInstanceOf(AppError);
            expect(error.message).toBe('Invalid UserId invalidUserId')
            expect(error.statusCode).toBe(404)
        }
    });

    it('should throw an error for missing refreshToken', async () => {
        const userId = '1';
        const sourceAddress = '127.0.0.1';
        const refreshToken = '';

        try {
            await refreshAuthToken(userId, sourceAddress, refreshToken)
        } catch (error) {
            expect(error).toBeInstanceOf(AppError);
            expect(error.message).toBe('Refresh token not present')
            expect(error.statusCode).toBe(400)
        }
    });

    it('should throw error if given token is not in refreshtoken table', async () => {
        const userId = '1';
        const sourceAddress = '127.0.0.1';
        const tokensRes = tempGenerator({ userId: 1, id: 123 });


        tokenRepo.getRefreshTokenByRefreshToken.mockResolvedValue(null);

        try {
            const result = await refreshAuthToken(userId, sourceAddress, tokensRes.refreshToken);
        } catch (error) {
            expect(error).toBeInstanceOf(AppError);
            expect(error.message).toBe('Invalid refresh token')
            expect(error.statusCode).toBe(400)
        }

        // Assertions
        expect(tokenRepo.getRefreshTokenByRefreshToken).toHaveBeenCalledTimes(1);
        expect(tokenRepo.getRefreshTokenByRefreshToken).toHaveBeenCalledWith(tokensRes.refreshToken);

        expect(tokenRepo.deleteRefreshTokenByTokenUid).toHaveBeenCalledTimes(0);
        expect(tokenRepo.insertRefreshTokenData).toHaveBeenCalledTimes(0);
    });

    it('should throw error if the refresh token.userId in given token is not the same as request userId', async () => {
        const userId = '1';
        const sourceAddress = '127.0.0.1';
        const tokensRes = tempGenerator({ userId: 2, id: 124 });

        try {
            await refreshAuthToken(userId, sourceAddress, tokensRes.refreshToken);
        } catch (error) {
            expect(error).toBeInstanceOf(AppError);
            expect(error.message).toBe('Invalid refresh token')
            expect(error.statusCode).toBe(403)
        }
        // Assertions
        expect(tokenRepo.getRefreshTokenByRefreshToken).toHaveBeenCalledTimes(0);

        expect(tokenRepo.deleteRefreshTokenByTokenUid).toHaveBeenCalledTimes(0);
        expect(tokenRepo.insertRefreshTokenData).toHaveBeenCalledTimes(0);
    });

    it('should throw error if the refresh token.userId in given token is not the same as database refreshtoken.userId', async () => {
        const userId = '1';
        const sourceAddress = '127.0.0.1';
        const tokensRes = tempGenerator({ userId: 1, id: 124 });


        tokenRepo.getRefreshTokenByRefreshToken.mockResolvedValue({ userId: 2, id: 124 });

        try {
            await refreshAuthToken(userId, sourceAddress, tokensRes.refreshToken);
        } catch (error) {
            expect(error).toBeInstanceOf(AppError);
            expect(error.message).toBe('Invalid refresh token')
            expect(error.statusCode).toBe(400)
        }
        // Assertions
        expect(tokenRepo.getRefreshTokenByRefreshToken).toHaveBeenCalledTimes(1);
        expect(tokenRepo.getRefreshTokenByRefreshToken).toHaveBeenCalledWith(tokensRes.refreshToken);

        expect(tokenRepo.deleteRefreshTokenByTokenUid).toHaveBeenCalledTimes(0);
        expect(tokenRepo.insertRefreshTokenData).toHaveBeenCalledTimes(0);
    });

    it('should throw error if the refresh token is expired', async () => {
        const userId = '1';
        const sourceAddress = '127.0.0.1';
        const tokensRes = tempGenerator({ userId: 1, id: 124 }, null, 1);

        try {
            // sleep for one second to make the token expired
            await new Promise(resolve => setTimeout(resolve, 1100));
            await refreshAuthToken(userId, sourceAddress, tokensRes.refreshToken);
        } catch (error) {
            expect(error).toBeInstanceOf(AppError);
            expect(error.message).toBe('Unauthorized! Refresh Token was expired!')
            expect(error.statusCode).toBe(401)
        }
        // Assertions
        expect(tokenRepo.getRefreshTokenByRefreshToken).toHaveBeenCalledTimes(0);
        expect(tokenRepo.deleteRefreshTokenByTokenUid).toHaveBeenCalledTimes(0);
        expect(tokenRepo.insertRefreshTokenData).toHaveBeenCalledTimes(0);
    });

    it('should refresh the auth token successfully', async () => {
        const userId = '1';
        const sourceAddress = '127.0.0.1';
        const tokensRes = tempGenerator({ userId: 1, id: 123 });


        tokenRepo.getRefreshTokenByRefreshToken.mockResolvedValue({ userId: 1, id: 123 });
        tokenRepo.deleteRefreshTokenByTokenUid.mockResolvedValue(null);
        tokenRepo.insertRefreshTokenData.mockResolvedValue(null);

        const result = await refreshAuthToken(userId, sourceAddress, tokensRes.refreshToken);

        // Assertions
        expect(tokenRepo.getRefreshTokenByRefreshToken).toHaveBeenCalledTimes(1);
        expect(tokenRepo.getRefreshTokenByRefreshToken).toHaveBeenCalledWith(tokensRes.refreshToken);

        expect(tokenRepo.deleteRefreshTokenByTokenUid).toHaveBeenCalledTimes(1);
        expect(tokenRepo.deleteRefreshTokenByTokenUid).toHaveBeenCalledWith(123);

        expect(tokenRepo.insertRefreshTokenData).toHaveBeenCalledTimes(1);
        expect(tokenRepo.insertRefreshTokenData).toHaveBeenCalledWith({
            userId: "1",
            sourceAddress,
            refreshToken: expect.any(String),
        });

        expect(result).toEqual({
            accessToken: expect.any(String),
            refreshToken: expect.any(String),
        });
    });
});
