const AppError = require("../utils/appError");
const roles = require("../constants/roles");
const userRepository = require("../repository/userRepo");
const permissionsRepository = require("../repository/permissionsRepo");
const moderatorsRepository = require("../repository/moderatorsRepo");
const moderatorPermissionsRepository = require("../repository/moderatorPermissionsRepo");
const cityUserRolesRepo = require("../repository/cityUserRolesRepo");
const citiesRepository = require("../repository/citiesRepo");

async function ensureRequesterIsCityAdminForCities(requesterId, cities) {
    if (!Array.isArray(cities) || cities.length === 0) {
        throw new AppError("cities must be a non-empty array", 400);
    }
    const unauthorized = [];
    for (const cityId of cities) {
        const isAdmin = await cityUserRolesRepo.isUserCityAdmin(
            requesterId,
            cityId
        );
        if (!isAdmin) unauthorized.push(cityId);
    }
    if (unauthorized.length) {
        throw new AppError(
            `Not city admin for cities: ${unauthorized.join(",")}`,
            403
        );
    }
}

async function getPermissionIdsByNames(permissionNames) {
    if (!Array.isArray(permissionNames) || permissionNames.length === 0)
        return [];
    const ids = [];
    for (const name of permissionNames) {
        const perm = await permissionsRepository.getOne({
            filters: [{ key: "name", sign: "=", value: name }],
            columns: "id",
        });
        if (!perm) throw new AppError(`Permission not found: ${name}`, 400);
        ids.push(perm.id);
    }
    return ids;
}

async function upsertModeratorPermissions(moderatorId, permissionIds) {
    // clear existing
    await moderatorPermissionsRepository.delete({
        filters: [{ key: "moderatorId", sign: "=", value: moderatorId }],
    });
    // insert all new
    for (const permissionId of permissionIds) {
        await moderatorPermissionsRepository.create({
            data: { moderatorId, permissionId },
        });
    }
}

const createModerators = async function (
    requesterId,
    requesterRoleId,
    payload
) {
    try {
        if (!requesterId || !requesterRoleId)
            throw new AppError("Unauthorized", 401);
        // Only City Admin or Admin can create moderators
        if (![roles["City Admin"], roles.Admin].includes(requesterRoleId)) {
            throw new AppError(
                "You are not authorized to perform this action",
                403
            );
        }

        const { userId, permissions = [], cities = [] } = payload || {};
        if (!userId || isNaN(Number(userId)))
            throw new AppError("Invalid userId", 400);
        if (!Array.isArray(permissions) || permissions.length === 0)
            throw new AppError("permissions must have at least one item", 400);
        if (!Array.isArray(cities) || cities.length === 0)
            throw new AppError("cities must have at least one item", 400);
        await ensureRequesterIsCityAdminForCities(requesterId, cities);

        const user = await userRepository.getOne({
            filters: [{ key: "id", sign: "=", value: userId }],
            columns: "id, email,roleId",
        });
        if (!user) throw new AppError("User not found", 404);
        // user should not be a moderator or admin or cityAdmin
        if (
            [roles.Moderator, roles.Admin, roles["City Admin"]].includes(
                user.roleId
            )
        )
            throw new AppError(
                "User is already a moderator, admin, or city admin",
                400
            );

        // Early return if user already a moderator in any city
        // const alreadyModeratorAnyCity = await moderatorsRepository.getOne({
        //     filters: [{ key: "userId", sign: "=", value: userId }],
        //     columns: "id"
        // });
        // if (alreadyModeratorAnyCity) throw new AppError("User is already a moderator", 400);

        const permissionIds = await getPermissionIdsByNames(permissions);

        const created = [];
        const already = [];
        for (const cityId of cities) {
            const existing = await moderatorsRepository.getOne({
                filters: [
                    { key: "cityId", sign: "=", value: cityId },
                    { key: "userId", sign: "=", value: userId },
                ],
                columns: "id",
            });
            if (existing) {
                already.push(cityId);
                continue;
            }
            const { id: moderatorId } = await moderatorsRepository.create({
                data: { cityId, userId, createdBy: requesterId },
            });
            await upsertModeratorPermissions(moderatorId, permissionIds);
            created.push({ cityId, moderatorId });
        }

        // Flip role to Moderator (5) if at least one moderator record created
        if (created.length > 0) {
            await userRepository.update({
                data: { roleId: roles.Moderator },
                filters: [{ key: "id", sign: "=", value: userId }],
            });
        }
        return { created, already };
    } catch (error) {
        throw new AppError(error);
    }
};

const updateModerator = async function (requesterId, requesterRoleId, payload) {
    try {
        if (!requesterId || !requesterRoleId)
            throw new AppError("Unauthorized", 401);
        if (![roles["City Admin"], roles.Admin].includes(requesterRoleId)) {
            throw new AppError(
                "You are not authorized to perform this action",
                403
            );
        }
        const {
            userId,
            email,
            permissions = [],
            cities = [],
            removeAbsent = true,
        } = payload || {};
        if (!userId || isNaN(Number(userId)))
            throw new AppError("Invalid userId", 400);
        if (!Array.isArray(permissions) || permissions.length === 0)
            throw new AppError("permissions must have at least one item", 400);
        if (!Array.isArray(cities) || cities.length === 0)
            throw new AppError("cities must have at least one item", 400);
        await ensureRequesterIsCityAdminForCities(requesterId, cities);

        const user = await userRepository.getOne({
            filters: [{ key: "id", sign: "=", value: userId }],
            columns: "id, email",
        });
        if (!user) throw new AppError("User not found", 404);
        if (email && email !== user.email) {
            await userRepository.update({
                data: { email },
                filters: [{ key: "id", sign: "=", value: userId }],
            });
        }

        const permissionIds = await getPermissionIdsByNames(permissions);

        const added = [];
        const updated = [];
        for (const cityId of cities) {
            const existing = await moderatorsRepository.getOne({
                filters: [
                    { key: "cityId", sign: "=", value: cityId },
                    { key: "userId", sign: "=", value: userId },
                ],
                columns: "id",
            });
            if (existing) {
                await upsertModeratorPermissions(existing.id, permissionIds);
                updated.push({ cityId, moderatorId: existing.id });
            } else {
                const { id: moderatorId } = await moderatorsRepository.create({
                    data: { cityId, userId, createdBy: requesterId },
                });
                await upsertModeratorPermissions(moderatorId, permissionIds);
                added.push({ cityId, moderatorId });
            }
        }

        if (removeAbsent) {
            // remove moderator assignments for cities not listed, but only where requester is city admin
            const currentMods = await moderatorsRepository.getAll({
                columns: "id, cityId",
                filters: [{ key: "userId", sign: "=", value: userId }],
            });
            const toRemove = (currentMods.rows || [])
                .filter((m) => !cities.includes(m.cityId))
                .map((m) => m);
            for (const m of toRemove) {
                const isAdmin = await cityUserRolesRepo.isUserCityAdmin(
                    requesterId,
                    m.cityId
                );
                if (isAdmin) {
                    await moderatorsRepository.delete({
                        filters: [{ key: "id", sign: "=", value: m.id }],
                    });
                }
            }
        }

        return { added, updated };
    } catch (error) {
        throw new AppError(error);
    }
};

const deleteModerators = async function (
    requesterId,
    requesterRoleId,
    payload
) {
    try {
        if (!requesterId || !requesterRoleId)
            throw new AppError("Unauthorized", 401);
        if (![roles["City Admin"], roles.Admin].includes(requesterRoleId)) {
            throw new AppError(
                "You are not authorized to perform this action",
                403
            );
        }
        const { userId } = payload || {};
        if (!userId || isNaN(Number(userId)))
            throw new AppError("Invalid userId", 400);

        // Fetch all moderator assignments for the user
        const currentMods = await moderatorsRepository.getAll({
            columns: "id, cityId",
            filters: [{ key: "userId", sign: "=", value: userId }],
        });
        const allCities = (currentMods.rows || []).map((m) => m.cityId);
        if (allCities.length === 0) return { removed: [] };

        // Ensure requester is city admin for ALL cities for complete removal
        await ensureRequesterIsCityAdminForCities(requesterId, allCities);

        // Delete all moderator records
        for (const m of currentMods.rows) {
            await moderatorsRepository.delete({
                filters: [{ key: "id", sign: "=", value: m.id }],
            });
        }

        // Flip role back to Content Creator (3)
        await userRepository.update({
            data: { roleId: roles["Content Creator"] },
            filters: [{ key: "id", sign: "=", value: userId }],
        });

        return { removed: currentMods.rows };
    } catch (error) {
        throw new AppError(error);
    }
};

const listModeratorsForRequester = async function (
    requesterId,
    requesterRoleId,
    pageNo = 1,
    pageSize = 10,
    searchQuery = ""
) {
    try {
        if (!requesterId || !requesterRoleId)
            throw new AppError("Unauthorized", 401);
        if (![roles["City Admin"], roles.Admin].includes(requesterRoleId)) {
            throw new AppError(
                "You are not authorized to perform this action",
                403
            );
        }

        // Determine cities to include
        let cityIds = [];
        if (requesterRoleId === roles.Admin) {
            // Admin: include all cities that have moderators
            const allMods = await moderatorsRepository.getAll({
                columns: "cityId, userId, id",
            });
            cityIds = [...new Set((allMods.rows || []).map((r) => r.cityId))];
        } else {
            // City Admin: cities the requester is admin of
            const adminCityRows = await cityUserRolesRepo.getAll({
                columns: "cityId",
                filters: [
                    { key: "userId", sign: "=", value: requesterId },
                    { key: "isAdmin", sign: "=", value: 1 },
                ],
            });
            cityIds = [
                ...new Set((adminCityRows.rows || []).map((r) => r.cityId)),
            ];
        }

        if (cityIds.length === 0) return { data: [], count: 0 };

        // Fetch moderators in these cities
        const mods = await moderatorsRepository.getAll({
            columns: "id, cityId, userId",
            filters: [{ key: "cityId", sign: "IN", value: cityIds }],
        });
        const rows = mods.rows || [];
        if (rows.length === 0) return { data: [], count: 0 };

        // Group by userId
        const byUser = new Map();
        for (const r of rows) {
            if (!byUser.has(r.userId)) byUser.set(r.userId, []);
            byUser.get(r.userId).push({ moderatorId: r.id, cityId: r.cityId });
        }

        // Prepare list of userIds
        const userIds = [...byUser.keys()];
        if (userIds.length === 0) return { data: [], count: 0 };

        const usersFull = [];
        const allCityIds = new Set();
        const userPermissionsMap = new Map(); // userId -> Set(permissionName)

        // Build per-user data (fetch user info, permissions, collect city ids)
        for (const uid of userIds) {
            const u = await userRepository.getOne({
                columns: "id, username, email, firstname, lastname",
                filters: [{ key: "id", sign: "=", value: uid }],
            });
            if (!u) continue;

            const arr = byUser.get(uid) || [];
            const permSet = new Set();
            for (const item of arr) {
                allCityIds.add(item.cityId);
                const perms = await moderatorPermissionsRepository.getAll({
                    columns: "permissionId",
                    filters: [
                        {
                            key: "moderatorId",
                            sign: "=",
                            value: item.moderatorId,
                        },
                    ],
                });
                const permissionIds = (perms.rows || []).map(
                    (p) => p.permissionId
                );
                for (const pid of permissionIds) {
                    const p = await permissionsRepository.getOne({
                        columns: "id, name",
                        filters: [{ key: "id", sign: "=", value: pid }],
                    });
                    if (p) permSet.add(p.name);
                }
            }
            userPermissionsMap.set(uid, permSet);

            usersFull.push({ u, modArr: arr });
        }

        // Fetch city names in one go
        const allCityIdsArr = [...allCityIds];
        const cityNameMap = new Map(); // cityId -> name
        if (allCityIdsArr.length > 0) {
            const cityRows = await citiesRepository.getAll({
                columns: "id, name",
                filters: [{ key: "id", sign: "IN", value: allCityIdsArr }],
            });
            for (const c of cityRows.rows || []) cityNameMap.set(c.id, c.name);
        }

        // Build flattened users list and apply search filter
        const normalizedSearch = (searchQuery || "")
            .toString()
            .trim()
            .toLowerCase();
        const flattened = [];
        for (const item of usersFull) {
            const u = item.u;
            const modsForUser = item.modArr;
            const cityObjs = [...new Set(modsForUser.map((i) => i.cityId))].map(
                (cid) => ({ id: cid, name: cityNameMap.get(cid) || null })
            );
            const permissions = [
                ...(userPermissionsMap.get(u.id) || new Set()),
            ];

            const entry = {
                id: u.id,
                username: u.username,
                email: u.email,
                firstname: u.firstname,
                lastname: u.lastname,
                cities: cityObjs,
                permissions,
            };

            if (normalizedSearch) {
                const hay = `${entry.username || ""} ${entry.email || ""} ${
                    entry.firstname || ""
                } ${entry.lastname || ""}`.toLowerCase();
                if (hay.includes(normalizedSearch)) {
                    flattened.push(entry);
                }
            } else {
                flattened.push(entry);
            }
        }

        const totalCount = flattened.length;
        // Apply pagination
        const pn = Number(pageNo) >= 1 ? Number(pageNo) : 1;
        const ps = Number(pageSize) >= 1 ? Number(pageSize) : 10;
        const start = (pn - 1) * ps;
        const paged = flattened.slice(start, start + ps);

        return { data: paged, count: totalCount };
    } catch (error) {
        throw new AppError(error);
    }
};

const getModeratorProfile = async function (
    requesterId,
    requesterRoleId,
    targetUserId
) {
    try {
        if (!requesterId || !requesterRoleId)
            throw new AppError("Unauthorized", 401);
        if (!targetUserId || isNaN(Number(targetUserId)))
            throw new AppError("Invalid userId", 400);
        const isSelfRequest = Number(requesterId) === Number(targetUserId);
        // Allow self-access; otherwise require Admin or City Admin
        if (
            !isSelfRequest &&
            ![roles["City Admin"], roles.Admin].includes(requesterRoleId)
        ) {
            throw new AppError(
                "You are not authorized to perform this action",
                403
            );
        }

        // Fetch moderator records for the user
        const mods = await moderatorsRepository.getAll({
            columns: "id, cityId",
            filters: [{ key: "userId", sign: "=", value: targetUserId }],
        });
        const rows = mods.rows || [];

        if (!isSelfRequest && requesterRoleId !== roles.Admin) {
            // Ensure requester manages at least one of these cities
            const adminCityRows =
                await require("../repository/cityUserRolesRepo").getAll({
                    columns: "cityId",
                    filters: [
                        { key: "userId", sign: "=", value: requesterId },
                        { key: "isAdmin", sign: "=", value: 1 },
                    ],
                });
            const myCities = new Set(
                (adminCityRows.rows || []).map((r) => r.cityId)
            );
            const overlap = rows.some((r) => myCities.has(r.cityId));
            if (!overlap)
                throw new AppError(
                    "You are not authorized to view this moderator",
                    403
                );
        }

        // Aggregate permissions across all moderator records and collect cities
        const permSet = new Set();
        const cityIds = new Set();
        for (const r of rows) {
            cityIds.add(r.cityId);
            const perms = await moderatorPermissionsRepository.getAll({
                columns: "permissionId",
                filters: [{ key: "moderatorId", sign: "=", value: r.id }],
            });
            const permissionIds = (perms.rows || []).map((p) => p.permissionId);
            for (const pid of permissionIds) {
                const p = await permissionsRepository.getOne({
                    columns: "id, name",
                    filters: [{ key: "id", sign: "=", value: pid }],
                });
                if (p) permSet.add(p.name);
            }
        }

        // Fetch city names
        const cityObjs = [];
        if (cityIds.size > 0) {
            const cityRows = await citiesRepository.getAll({
                columns: "id, name",
                filters: [{ key: "id", sign: "IN", value: [...cityIds] }],
            });
            for (const c of cityRows.rows || [])
                cityObjs.push({ id: c.id, name: c.name });
        }

        // Basic user info
        const u = await userRepository.getOne({
            columns: "id, username, email, firstname, lastname",
            filters: [{ key: "id", sign: "=", value: targetUserId }],
        });
        if (!u) throw new AppError("User not found", 404);

        return {
            id: u.id,
            username: u.username,
            email: u.email,
            firstname: u.firstname,
            lastname: u.lastname,
            cities: cityObjs,
            permissions: [...permSet],
        };
    } catch (error) {
        throw new AppError(error);
    }
};

module.exports = {
    createModerators,
    updateModerator,
    deleteModerators,
    listModeratorsForRequester,
    getModeratorProfile,
};
