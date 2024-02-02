const userService = require('../../../services/users');
const userRepo = require('../../../repository/users');
const AppError = require('../../../utils/appError');

jest.mock('../../../repository/users');

describe('getUsers', () => {
    const columsToQuery = [
        "id",
        "username",
        "socialMedia",
        "email",
        "website",
        "image",
        "firstname",
        "lastname",
        "description",
        "roleId",
    ];

    beforeEach(() => {
        jest.clearAllMocks();
    });

    // it('should throw error if there are no user ids or user names', async () => {
    //     try {
    //         await userService.getUsers();
    //     } catch (err) {
    //         expect(err).toBeInstanceOf(AppError);
    //         expect(err.message).toBe('You need to send some params to filter');
    //         expect(err.statusCode).toBe(500);
    //     }

    //     expect(userRepo.getAllUsers).toBeCalledTimes(0);
    // });

    it('success with just userIds', async () => {
        userRepo.getAllUsers.mockResolvedValue([{ id: 1, name: 'testuser' }]);
        try {
            const users = await userService.getUsers([1, 2, 3]);
            expect(users).toEqual([{ id: 1, name: 'testuser' }]);
        } catch (err) {
            expect(err).toBe(null);
        }

        expect(userRepo.getAllUsers).toBeCalledTimes(1);
        expect(userRepo.getAllUsers).toBeCalledWith({ id: [1, 2, 3] }, columsToQuery);
    });

    it('success with username', async () => {
        userRepo.getAllUsers.mockResolvedValue([{ id: 1, name: 'testuser' }]);
        try {
            const users = await userService.getUsers(undefined, 'testuser');
            expect(users).toEqual([{ id: 1, name: 'testuser' }]);
        } catch (err) {
            expect(err).toBe(null);
        }

        expect(userRepo.getAllUsers).toBeCalledTimes(1);
        expect(userRepo.getAllUsers).toBeCalledWith({ username: 'testuser' }, columsToQuery);
    });

    it('error while fetching data', async () => {
        userRepo.getAllUsers.mockRejectedValue(new Error('Some error'));
        try {
            const users = await userService.getUsers(undefined, 'testuser');
            expect(users).toEqual([{ id: 1, name: 'testuser' }]);
        } catch (err) {
            expect(err).toBeInstanceOf(AppError);
            expect(err.message).toBe('Error: Some error');
            expect(err.statusCode).toBe(500);
        }

        expect(userRepo.getAllUsers).toBeCalledTimes(1);
        expect(userRepo.getAllUsers).toBeCalledWith({ username: 'testuser' }, columsToQuery);
    });

});
