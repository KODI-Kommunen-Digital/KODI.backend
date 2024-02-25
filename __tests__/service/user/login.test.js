const userService = require('../../../services/users');
const userRepo = require('../../../repository/users');
const tokenRepo = require('../../../repository/auth');
const AppError = require('../../../utils/appError');
const bcrypt = require("bcrypt");

jest.mock('../../../repository/users');
jest.mock('../../../repository/auth');
jest.mock('../../../utils/database');
jest.mock('../../../utils/sendMail');


describe('login user', () => {

    beforeEach(() => {
        jest.clearAllMocks();
    });


    it('should throw error if email not found', async () => {
        const email = '';
        const password = '';

        userRepo.getUserByUsernameOrEmail.mockResolvedValue(null);

        try {
            await userService.login({ email, password }, '', '', '');
        } catch (error) {
            expect(error).toBeInstanceOf(AppError);
            expect(error.statusCode).toBe(401);
            expect(error.message).toBe('Invalid username or email');
            expect(error.errorCode).toBe(2003);
        }
    });

    it('should throw error if email is not verified', async () => {
        const email = 'someone@example.com';
        const password = 'validpassword';

        userRepo.getUserByUsernameOrEmail.mockResolvedValue({ emailVerified: false });

        try {
            await userService.login({ email, password }, '', '', '');
        } catch (error) {
            expect(error).toBeInstanceOf(AppError);
            expect(error.statusCode).toBe(401);
            expect(error.message).toBe('Verification email sent to your email id. Please verify first before trying to login.');
            expect(error.errorCode).toBe(2006);
        }
    });

    it('should throw error if password is invalid', async () => {
        const email = 'someone@example.com';
        const password = 'validpassword';

        userRepo.getUserByUsernameOrEmail.mockResolvedValue({ emailVerified: true, password: '' });

        try {
            await userService.login({ email, password }, '', '', '');
        } catch (error) {
            expect(error).toBeInstanceOf(AppError);
            expect(error.statusCode).toBe(401);
            expect(error.message).toBe('Invalid password');
            expect(error.errorCode).toBe(2002);
        }
    });

    it('should delete exisiting token if sourceAddress, browser and deviceType are the same', async () => {
        const email = 'someone@example.com';
        const password = 'validpassword';
        const resPass = await bcrypt.hash(
            password,
            Number("10") // salt
        )

        userRepo.getUserByUsernameOrEmail.mockResolvedValue({ id: 1, emailVerified: true, password: resPass, roleId: 3 });
        userRepo.getuserCityMappings.mockResolvedValue([{ cityId: 1 }]);
        userRepo.getuserCityMappings.mockResolvedValue([{ cityId: 1 }]);
        tokenRepo.getRefreshToken.mockResolvedValue({ sourceAddress: '127.0.1', browser: 'chrome', device: 'pc' });

        try {
            await userService.login({ email, password }, '127.0.1', 'chrome', 'pc');
        } catch (error) {
            expect(error).toBe(null);
        }
        // assert deleteRefreshToken has been called exactly once
        expect(tokenRepo.deleteRefreshToken).toHaveBeenCalledTimes(1);
        // assert deleteRefreshToken has been called with userId 1
        expect(tokenRepo.deleteRefreshToken).toHaveBeenCalledWith(1);
    });

    it('should not delete exisiting token if any of sourceAddress, browser or deviceType are not the same as payload', async () => {
        const email = 'someone@example.com';
        const password = 'validpassword';
        const resPass = await bcrypt.hash(
            password,
            Number("10") // salt
        )

        userRepo.getUserByUsernameOrEmail.mockResolvedValue({ id: 1, emailVerified: true, password: resPass, roleId: 3 });
        userRepo.getuserCityMappings.mockResolvedValue([{ cityId: 1 }]);
        userRepo.getuserCityMappings.mockResolvedValue([{ cityId: 1 }]);
        tokenRepo.getRefreshToken.mockResolvedValue({ sourceAddress: '127.0.1', browser: 'chrome', device: 'pc' });
        tokenRepo.insertRefreshTokenData.mockResolvedValue(null);

        try {
            await userService.login({ email, password }, '127.0.0', 'chrome', 'pc');
        } catch (error) {
            expect(error).toBe(null);
        }
        // assert deleteRefreshToken haven't been called at all
        expect(tokenRepo.deleteRefreshToken).toHaveBeenCalledTimes(0);
    });

    it('should insert new refreshtoken data', async () => {
        const email = 'someone@example.com';
        const password = 'validpassword';
        const resPass = await bcrypt.hash(
            password,
            Number("10") // salt
        )

        userRepo.getUserByUsernameOrEmail.mockResolvedValue({ id: 1, emailVerified: true, password: resPass, roleId: 3 });
        userRepo.getuserCityMappings.mockResolvedValue([{ cityId: 1 }]);
        userRepo.getuserCityMappings.mockResolvedValue([{ cityId: 1 }]);
        tokenRepo.getRefreshToken.mockResolvedValue({ sourceAddress: '127.0.1', browser: 'chrome', device: 'pc' });
        tokenRepo.insertRefreshTokenData.mockResolvedValue(null);

        try {
            await userService.login({ email, password }, '127.0.0', 'chrome', 'pc');
        } catch (error) {
            expect(error).toBe(null);
        }
        // assert deleteRefreshToken haven't been called at all
        expect(tokenRepo.deleteRefreshToken).toHaveBeenCalledTimes(0);
        // assert insertRefreshTokenData has been called exactly once
        expect(tokenRepo.insertRefreshTokenData).toHaveBeenCalledTimes(1);
        // assert insertRefreshTokenData has been called with 
        // userId 1 cityUser as same as userCityMappings return and refreshtoken is a string
        expect(tokenRepo.insertRefreshTokenData).toHaveBeenCalledWith({ userId: 1, sourceAddress: '127.0.0', browser: 'chrome', device: 'pc', refreshToken: expect.any(String) });
    });

    it('should return new tokens', async () => {
        const username = 'johndoe';
        const password = 'validpassword';
        const resPass = await bcrypt.hash(
            password,
            Number("10") // salt
        )

        userRepo.getUserByUsernameOrEmail.mockResolvedValue({ id: 1, emailVerified: true, password: resPass, roleId: 3 });
        userRepo.getuserCityMappings.mockResolvedValue([{ "cityId": 1, "cityUserId": 1 }]);
        tokenRepo.getRefreshToken.mockResolvedValue({ sourceAddress: '127.0.1', browser: 'chrome', device: 'pc' });
        tokenRepo.insertRefreshTokenData.mockResolvedValue(null);

        let result;
        try {
            result = await userService.login({ username, password }, '127.0.0', 'chrome', 'pc');
        } catch (error) {
            expect(error).toBe(null);
        }

        // assert getUserByUsernameOrEmail has been called exactly once
        expect(userRepo.getUserByUsernameOrEmail).toHaveBeenCalledTimes(1);
        // assert getUserByUsernameOrEmail has been called with email from request
        expect(userRepo.getUserByUsernameOrEmail).toHaveBeenCalledWith(username, username);
        // assert getuserCityMappings has been called exactly once
        expect(userRepo.getuserCityMappings).toHaveBeenCalledTimes(1);
        // assert getuserCityMappings has been called with userId 1
        expect(userRepo.getuserCityMappings).toHaveBeenCalledWith(1);

        // assert deleteRefreshToken haven't been called at all
        expect(tokenRepo.deleteRefreshToken).toHaveBeenCalledTimes(0);
        // assert getRefreshToken has been called exactly once
        expect(tokenRepo.getRefreshToken).toHaveBeenCalledTimes(1);
        // assert getRefreshToken has been called with userId 1
        expect(tokenRepo.getRefreshToken).toHaveBeenCalledWith(1);
        // assert insertRefreshTokenData has been called exactly once
        expect(tokenRepo.insertRefreshTokenData).toHaveBeenCalledTimes(1);
        // assert insertRefreshTokenData has been called with userId, sourceAddress, browser, device and refreshtoken
        expect(tokenRepo.insertRefreshTokenData).toHaveBeenCalledWith({ userId: 1, sourceAddress: '127.0.0', browser: 'chrome', device: 'pc', refreshToken: expect.any(String) });
        // assert result is an object with accessToken, refreshToken, userId and cityUsers(which was returned by userRepo.getuserCityMappings)
        expect(result).toEqual({ accessToken: expect.any(String), refreshToken: expect.any(String), userId: 1, cityUsers: [{ cityId: 1, cityUserId: 1 }] });

    });
});