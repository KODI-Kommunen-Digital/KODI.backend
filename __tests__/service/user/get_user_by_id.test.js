const userService = require('../../../services/users');
const userRepo = require('../../../repository/users');
const cityRepo = require('../../../repository/cities');
const AppError = require('../../../utils/appError');

jest.mock('../../../repository/users');
jest.mock('../../../repository/cities');
jest.mock('../../../repository/auth');
jest.mock('../../../utils/database');
jest.mock('../../../utils/sendMail');


describe('get user by id', () => {

    beforeEach(() => {
        jest.clearAllMocks();
    });

    // should throw error if cityUser=true and cityId is not provided
    it('should throw error if cityUser=true and cityId is not provided', async () => {
        const userId = 1;
        const cityId = null;
        const cityUser = true;

        try {
            await userService.getUserById(userId, cityUser, cityId);
        } catch (error) {
            expect(error).toBeInstanceOf(AppError);
            expect(error.statusCode).toBe(400);
            expect(error.message).toBe('City id not given');
        }
    });

    // should throw error if cityUser=true and cityId is not valid
    it('should throw error if cityUser=true and cityId is not valid', async () => {
        const userId = 1;
        const cityId = 10;
        const cityUser = true;

        cityRepo.getCityWithId.mockResolvedValue(null);

        try {
            await userService.getUserById(userId, cityUser, cityId);
        } catch (error) {
            expect(error).toBeInstanceOf(AppError);
            expect(error.statusCode).toBe(400);
            expect(error.message).toBe('City with id 10 does not exist');
        }
        expect(cityRepo.getCityWithId).toHaveBeenCalledTimes(1);
        expect(cityRepo.getCityWithId).toHaveBeenCalledWith(cityId);
    });

    // should throw error if cityUser=true and cityId is valid but user is not in the city
    it('should throw error if cityUser=true, cityId is valid, but user is not in the city', async () => {
        const userId = 1;
        const cityId = 10;
        const cityUser = true;

        cityRepo.getCityWithId.mockResolvedValue({ id: 1 });
        userRepo.getCityUser.mockResolvedValue(null);

        try {
            await userService.getUserById(userId, cityUser, cityId);
        } catch (error) {
            expect(error).toBeInstanceOf(AppError);
            expect(error.statusCode).toBe(404);
            expect(error.message).toBe('User 1 is not found in city 10');
        }
        expect(cityRepo.getCityWithId).toHaveBeenCalledTimes(1);
        expect(cityRepo.getCityWithId).toHaveBeenCalledWith(cityId);

        expect(userRepo.getCityUser).toHaveBeenCalledTimes(1);
        expect(userRepo.getCityUser).toHaveBeenCalledWith(cityId, userId);
    });

    // should throw error if cityUser=true, cityId is valid, user is in the city and cityUser is not valid
    it('should throw error if cityUser=true, cityId is valid, user is in the city and cityUser is not valid', async () => {
        const userId = 1;
        const cityId = 10;
        const cityUser = true;

        cityRepo.getCityWithId.mockResolvedValue({ id: 1 });
        userRepo.getCityUser.mockResolvedValue({ id: 1, userId: 2 });
        userRepo.getUserWithId.mockResolvedValue(null);

        try {
            await userService.getUserById(userId, cityUser, cityId);
        } catch (error) {
            expect(error).toBeInstanceOf(AppError);
            expect(error.statusCode).toBe(404);
            expect(error.message).toBe('User with id 2 does not exist');
        }
        expect(cityRepo.getCityWithId).toHaveBeenCalledTimes(1);
        expect(cityRepo.getCityWithId).toHaveBeenCalledWith(cityId);

        expect(userRepo.getCityUser).toHaveBeenCalledTimes(1);
        expect(userRepo.getCityUser).toHaveBeenCalledWith(cityId, userId);

        expect(userRepo.getUserWithId).toHaveBeenCalledTimes(1);
        expect(userRepo.getUserWithId).toHaveBeenCalledWith(2);
    });

    // should return data with userId cityUserId if cityUser=true, cityId is valid and user is in the city
    it('should return data with userId cityUserId if cityUser=true, cityId is valid and user is in the city', async () => {
        const userId = 1;
        const cityId = 10;
        const cityUser = true;

        cityRepo.getCityWithId.mockResolvedValue({ id: 1 });
        userRepo.getCityUser.mockResolvedValue({ id: 1, userId: 2 });
        userRepo.getUserWithId.mockResolvedValue({ id: 5 });

        try {
            const result = await userService.getUserById(userId, cityUser, cityId);
            expect(result).toEqual({ id: 5 });
        } catch (error) {
            expect(error).toBe(null);
        }
        expect(cityRepo.getCityWithId).toHaveBeenCalledTimes(1);
        expect(cityRepo.getCityWithId).toHaveBeenCalledWith(cityId);

        expect(userRepo.getCityUser).toHaveBeenCalledTimes(1);
        expect(userRepo.getCityUser).toHaveBeenCalledWith(cityId, userId);

        expect(userRepo.getUserWithId).toHaveBeenCalledTimes(1);
        expect(userRepo.getUserWithId).toHaveBeenCalledWith(2);
    });

    // should throw error if cityUser=false and userId is not valid
    it('should throw error if cityUser=false and userId is not valid', async () => {
        const userId = 1;
        userRepo.getUserWithId.mockResolvedValue(null);

        try {
            await userService.getUserById(userId);
        } catch (error) {
            expect(error).toBeInstanceOf(AppError);
            expect(error.statusCode).toBe(404);
            expect(error.message).toBe('User with id 1 does not exist');
        }
        expect(cityRepo.getCityWithId).toHaveBeenCalledTimes(0);
        expect(userRepo.getCityUser).toHaveBeenCalledTimes(0);

        expect(userRepo.getUserWithId).toHaveBeenCalledTimes(1);
        expect(userRepo.getUserWithId).toHaveBeenCalledWith(1);
    });

    // should return user details if cityUser=false/undefined and userId is valid
    it('should return user details if cityUser=false and userId is valid', async () => {
        const userId = 1;
        userRepo.getUserWithId.mockResolvedValue({
            id: 1,
            username: "johndoe",
            email: "email@example.com",
            image: "https://www.user-image.com",
            firstname: "John",
            lastname: "Doe",
            description: "I am a content creator",
            website: "https://www.user-website.com",
            socialMedia: {
                Facebook: "facebook"
            },
            roleId: 3
        });

        try {
            const result = await userService.getUserById(userId);
            expect(result).toEqual({
                id: 1,
                username: "johndoe",
                email: "email@example.com",
                image: "https://www.user-image.com",
                firstname: "John",
                lastname: "Doe",
                description: "I am a content creator",
                website: "https://www.user-website.com",
                socialMedia: {
                    Facebook: "facebook"
                },
                roleId: 3
            });
        } catch (error) {
            expect(error).toBe(null);
        }
        expect(cityRepo.getCityWithId).toHaveBeenCalledTimes(0);
        expect(userRepo.getCityUser).toHaveBeenCalledTimes(0);

        expect(userRepo.getUserWithId).toHaveBeenCalledTimes(1);
        expect(userRepo.getUserWithId).toHaveBeenCalledWith(1);
    });

});