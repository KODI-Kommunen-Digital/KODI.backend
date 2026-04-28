const express = require("express");
const router = express.Router();
const deviceRouter = express.Router(); // Separate router for device registration (no cityId needed)
const database = require("../services/database");
const tables = require("../constants/tableNames");
const AppError = require("../utils/appError");

router.get("/streets", async function (req, res, next) {
    const cityId = req.cityId;

    if (!cityId || isNaN(cityId)) {
        return next(new AppError(`invalid cityId given`, 400));
    }
    if (cityId) {
        try {
            const response = await database.get(
                tables.CITIES_TABLE,
                { id: parseInt(cityId) },
                null,
            );
            if (response.rows.cities && response.rows.cities.length === 0) {
                return next(
                    new AppError(`Invalid CityId '${cityId}' given`, 400),
                );
            }
        } catch (err) {
            return next(new AppError(err));
        }
    }

    database
        .get(
            tables.MULLKALENDER_STREETS,
            { cityId },
            "id, name, hashedStreetName",
        )
        .then((response) => {
            const data = response.rows;
            res.status(200).json({
                status: "success",
                data,
            });
        })
        .catch((err) => {
            return next(new AppError(err));
        });
});

router.get("/wasteTypes", async function (req, res, next) {
    const cityId = req.cityId;

    if (!cityId || isNaN(cityId)) {
        return next(new AppError(`invalid cityId given`, 400));
    }
    if (cityId) {
        try {
            const response = await database.get(
                tables.CITIES_TABLE,
                { id: parseInt(cityId) },
                null,
            );
            if (response.rows.cities && response.rows.cities.length === 0) {
                return next(
                    new AppError(`Invalid CityId '${cityId}' given`, 400),
                );
            }
        } catch (err) {
            return next(new AppError(err));
        }
    }

    database
        .get(tables.MULLKALENDER_WASTE_TYPES, null)
        .then((response) => {
            const data = response.rows;
            res.status(200).json({
                status: "success",
                data,
            });
        })
        .catch((err) => {
            return next(new AppError(err));
        });
});

router.get("/streets/:streetId/pickupDates", async function (req, res, next) {
    const cityId = req.cityId;
    const streetId = req.params.streetId;
    const wasteIdParam = req.query.wasteIds;

    if (!cityId || isNaN(cityId)) {
        return next(new AppError(`invalid cityId given`, 400));
    }

    // Parse and validate optional comma-separated wasteId filter
    let wasteIds = [];
    if (wasteIdParam) {
        wasteIds = wasteIdParam.split(",").map((id) => id.trim());
        if (wasteIds.some((id) => isNaN(id) || id === "")) {
            return next(
                new AppError(
                    `Invalid wasteId values given. Provide comma-separated numeric IDs.`,
                    400,
                ),
            );
        }
        wasteIds = wasteIds.map((id) => parseInt(id));
    }

    if (cityId) {
        try {
            let response = await database.get(
                tables.CITIES_TABLE,
                { id: parseInt(cityId) },
                null,
            );
            if (response.rows.cities && response.rows.cities.length === 0) {
                return next(
                    new AppError(`Invalid CityId '${cityId}' given`, 400),
                );
            }

            const queryParams = [streetId, cityId];
            let wasteIdFilter = "";
            if (wasteIds.length > 0) {
                const placeholders = wasteIds.map(() => "?").join(", ");
                wasteIdFilter = ` and mwt.id in (${placeholders})`;
                queryParams.push(...wasteIds);
            }

            response = await database.callQuery(
                `with street as (select * from mullkalender_streets
                    where id = ? and cityId = ?)
                    select md.dateofPickup, mwt.name as wastetypeName, md.dateEpoch, mwt.id as wasteTypeId from street mst
                    inner join mullkalender_street_properties_house msph
                    on msph.streetId = mst.id
                    inner join mullkalender_properties mp
                    on mp.id = msph.propertyId
                    inner join mullkalender_pickup_groups mpg
                    on mpg.pickupGroupId = mp.pickupGroupId
                    inner join mullkalender_dates md
                    on md.dateGroup = mpg.dateGroupId
                    inner join mullkalender_waste_types mwt
                    on mwt.id = mpg.wasteId${wasteIdFilter} order by md.dateofPickup;`,
                queryParams,
            );

            const groupedDates = {};

            response.rows.forEach((element) => {
                if (!groupedDates[element.dateofPickup.toISOString()]) {
                    groupedDates[element.dateofPickup.toISOString()] = [];
                }
                groupedDates[element.dateofPickup.toISOString()].push(element);
            });

            res.status(200).json({
                status: "success",
                data: groupedDates,
            });
        } catch (err) {
            return next(new AppError(err));
        }
    }
});

// POST /register - Register/Update device with FCM token
deviceRouter.post("/register", async function (req, res, next) {
    const payload = req.body;

    if (!payload.deviceId) {
        return next(new AppError(`deviceId is required`, 400));
    }

    if (!payload.fcmToken) {
        return next(new AppError(`fcmToken is required`, 400));
    }

    try {
        // Check if device already exists
        /* eslint-disable camelcase */
        const existingDevice = await database.get(
            tables.MULLKALENDER_PUSH_DEVICES,
            { device_id: payload.deviceId },
            "id, device_id, fcm_token, device_type, app_version, is_active",
        );

        let deviceData;

        if (existingDevice.rows && existingDevice.rows.length > 0) {
            // Update existing device
            const existing = existingDevice.rows[0];
            const updateData = {
                fcm_token: payload.fcmToken,
                device_type: payload.deviceType || "android",
                app_version: payload.appVersion || null,
                is_active: true,
            };

            await database.update(
                tables.MULLKALENDER_PUSH_DEVICES,
                updateData,
                { id: existing.id },
            );

            deviceData = {
                id: existing.id,
                deviceId: payload.deviceId,
                fcmToken: payload.fcmToken,
                deviceType: updateData.device_type,
                appVersion: updateData.app_version,
                isActive: true,
            };
        } else {
            // Create new device
            const insertData = {
                device_id: payload.deviceId,
                fcm_token: payload.fcmToken,
                device_type: payload.deviceType || "android",
                app_version: payload.appVersion || null,
                is_active: true,
            };
            /* eslint-enable camelcase */

            const result = await database.create(
                tables.MULLKALENDER_PUSH_DEVICES,
                insertData,
            );

            deviceData = {
                id: result.id,
                deviceId: payload.deviceId,
                fcmToken: payload.fcmToken,
                deviceType: insertData.device_type,
                appVersion: insertData.app_version,
                isActive: true,
            };
        }

        return res.status(200).json({
            status: "success",
            data: deviceData,
        });
    } catch (err) {
        return next(new AppError(err));
    }
});

// GET /subscription/:deviceId - Get device subscription details
deviceRouter.get("/subscription/:deviceId", async function (req, res, next) {
    const deviceId = req.params.deviceId;

    if (!deviceId) {
        return next(new AppError(`deviceId is required`, 400));
    }

    try {
        // Find the device
        /* eslint-disable camelcase */
        const deviceResult = await database.get(
            tables.MULLKALENDER_PUSH_DEVICES,
            { device_id: deviceId },
            "id, device_id, fcm_token, device_type, app_version, is_active, created_at, updated_at",
        );

        if (!deviceResult.rows || deviceResult.rows.length === 0) {
            return next(new AppError(`Device not found`, 404));
        }

        const device = deviceResult.rows[0];

        // Get street subscription (don't filter by is_active to show subscription even if inactive)
        const streetSubscription = await database.get(
            tables.MULLKALENDER_PUSH_DEVICE_STREETS,
            { push_device_id: device.id },
            "id, city_id, street_id, is_active",
        );

        let street = null;
        let wasteTypes = [];

        if (streetSubscription.rows && streetSubscription.rows.length > 0) {
            const deviceStreet = streetSubscription.rows[0];

            // Get street details
            const streetResult = await database.get(
                tables.MULLKALENDER_STREETS,
                { id: deviceStreet.street_id },
                "id, name, hashedStreetName",
            );

            if (streetResult.rows && streetResult.rows.length > 0) {
                street = {
                    ...streetResult.rows[0],
                    isActive: deviceStreet.is_active,
                };
            }

            // Get waste type subscriptions
            const wasteTypeSubscriptions = await database.get(
                tables.MULLKALENDER_PUSH_DEVICE_WASTE_TYPES,
                { device_street_id: deviceStreet.id },
                "waste_type_id",
            );

            if (
                wasteTypeSubscriptions.rows &&
                wasteTypeSubscriptions.rows.length > 0
            ) {
                const wasteTypeIds = wasteTypeSubscriptions.rows.map(
                    (w) => w.waste_type_id,
                );
                /* eslint-enable camelcase */

                const wasteTypesResult = await database.get(
                    tables.MULLKALENDER_WASTE_TYPES,
                    { id: wasteTypeIds },
                    "id, name",
                );

                wasteTypes = wasteTypesResult.rows || [];
            }
        }

        return res.status(200).json({
            status: "success",
            data: {
                device: {
                    id: device.id,
                    deviceId: device.device_id,
                    fcmToken: device.fcm_token,
                    deviceType: device.device_type,
                    appVersion: device.app_version,
                    isActive: device.is_active,
                    createdAt: device.created_at,
                    updatedAt: device.updated_at,
                },
                street,
                wasteTypes,
            },
        });
    } catch (err) {
        return next(new AppError(err));
    }
});

// PATCH /status/:deviceId - Update subscribed street active/inactive status for the device
deviceRouter.patch("/status/:deviceId", async function (req, res, next) {
    const deviceId = req.params.deviceId;
    const payload = req.body;

    if (!deviceId) {
        return next(new AppError(`deviceId is required`, 400));
    }

    if (typeof payload.isActive !== "boolean") {
        return next(new AppError(`isActive (boolean) is required`, 400));
    }

    try {
        // Find the device
        /* eslint-disable camelcase */
        const deviceResult = await database.get(
            tables.MULLKALENDER_PUSH_DEVICES,
            { device_id: deviceId },
            "id",
        );

        if (!deviceResult.rows || deviceResult.rows.length === 0) {
            return next(new AppError(`Device not found`, 404));
        }

        const pushDeviceId = deviceResult.rows[0].id;

        // Find subscribed street(s) for this device (do not filter by is_active so we can reactivate)
        const streetSubscriptions = await database.get(
            tables.MULLKALENDER_PUSH_DEVICE_STREETS,
            { push_device_id: pushDeviceId },
            "id",
        );

        if (
            !streetSubscriptions.rows ||
            streetSubscriptions.rows.length === 0
        ) {
            return next(
                new AppError(
                    `No street subscription found for this device`,
                    404,
                ),
            );
        }

        // Update subscribed street(s) active status
        await database.update(
            tables.MULLKALENDER_PUSH_DEVICE_STREETS,
            { is_active: payload.isActive },
            { push_device_id: pushDeviceId },
        );
        /* eslint-enable camelcase */

        return res.status(200).json({
            status: "success",
            data: {
                deviceId,
                isActive: payload.isActive,
            },
            message: payload.isActive
                ? "Street subscription activated successfully"
                : "Street subscription deactivated successfully",
        });
    } catch (err) {
        return next(new AppError(err));
    }
});

// POST /pushNotification/subscribe - Subscribe to street and waste types
router.post("/pushNotification/subscribe", async function (req, res, next) {
    const cityId = req.cityId;
    const payload = req.body;

    if (!cityId || isNaN(cityId)) {
        return next(new AppError(`Invalid cityId given`, 400));
    }

    if (!payload.deviceId) {
        return next(new AppError(`deviceId is required`, 400));
    }

    if (!payload.streetId || isNaN(payload.streetId)) {
        return next(new AppError(`Valid streetId is required`, 400));
    }

    if (!payload.wasteTypeIds || !Array.isArray(payload.wasteTypeIds)) {
        return next(new AppError(`wasteTypeIds array is required`, 400));
    }

    try {
        // Find the device (works regardless of device active status)
        /* eslint-disable camelcase */
        const deviceResult = await database.get(
            tables.MULLKALENDER_PUSH_DEVICES,
            { device_id: payload.deviceId },
            "id",
        );

        if (!deviceResult.rows || deviceResult.rows.length === 0) {
            return next(
                new AppError(`Device not found. Please register first.`, 404),
            );
        }

        const pushDeviceId = deviceResult.rows[0].id;

        // Validate street exists for this city
        const streetResult = await database.get(
            tables.MULLKALENDER_STREETS,
            { id: parseInt(payload.streetId), cityId: parseInt(cityId) },
            "id, name",
        );

        if (!streetResult.rows || streetResult.rows.length === 0) {
            return next(new AppError(`Street not found for this city`, 404));
        }

        // Validate waste types exist (skip when empty - used to remove all waste type subscriptions)
        let wasteTypesResult = { rows: [] };
        if (payload.wasteTypeIds.length > 0) {
            wasteTypesResult = await database.get(
                tables.MULLKALENDER_WASTE_TYPES,
                { id: payload.wasteTypeIds },
                "id, name",
            );
            if (
                !wasteTypesResult.rows ||
                wasteTypesResult.rows.length !== payload.wasteTypeIds.length
            ) {
                return next(
                    new AppError(`One or more waste types not found`, 404),
                );
            }
        }

        // Check if device already has a street subscription
        const existingStreet = await database.get(
            tables.MULLKALENDER_PUSH_DEVICE_STREETS,
            { push_device_id: pushDeviceId },
            "id, street_id, is_active",
        );

        let deviceStreetId;

        if (existingStreet.rows && existingStreet.rows.length > 0) {
            const currentStreetSubscription = existingStreet.rows[0];

            if (
                currentStreetSubscription.street_id !==
                parseInt(payload.streetId)
            ) {
                // Street changed - preserve is_active status, delete old and create new
                const preservedIsActive = currentStreetSubscription.is_active;

                await database.deleteData(
                    tables.MULLKALENDER_PUSH_DEVICE_WASTE_TYPES,
                    { device_street_id: currentStreetSubscription.id },
                );

                await database.deleteData(
                    tables.MULLKALENDER_PUSH_DEVICE_STREETS,
                    { id: currentStreetSubscription.id },
                );

                // Create new street subscription with preserved is_active status
                const streetInsertResult = await database.create(
                    tables.MULLKALENDER_PUSH_DEVICE_STREETS,
                    {
                        push_device_id: pushDeviceId,
                        city_id: parseInt(cityId),
                        street_id: parseInt(payload.streetId),
                        is_active: preservedIsActive,
                    },
                );
                deviceStreetId = streetInsertResult.id;
            } else {
                // Same street - just update waste types, don't change is_active
                deviceStreetId = currentStreetSubscription.id;

                // Delete existing waste type subscriptions
                await database.deleteData(
                    tables.MULLKALENDER_PUSH_DEVICE_WASTE_TYPES,
                    { device_street_id: deviceStreetId },
                );
            }
        } else {
            // No existing subscription - create new with is_active = true
            const streetInsertResult = await database.create(
                tables.MULLKALENDER_PUSH_DEVICE_STREETS,
                {
                    push_device_id: pushDeviceId,
                    city_id: parseInt(cityId),
                    street_id: parseInt(payload.streetId),
                    is_active: true,
                },
            );
            deviceStreetId = streetInsertResult.id;
        }

        // Insert waste type subscriptions
        for (const wasteTypeId of payload.wasteTypeIds) {
            await database.create(tables.MULLKALENDER_PUSH_DEVICE_WASTE_TYPES, {
                device_street_id: deviceStreetId,
                waste_type_id: parseInt(wasteTypeId),
            });
        }
        /* eslint-enable camelcase */

        return res.status(200).json({
            status: "success",
            data: {
                deviceStreetId,
                street: streetResult.rows[0],
                wasteTypes: wasteTypesResult.rows,
            },
        });
    } catch (err) {
        return next(new AppError(err));
    }
});

module.exports = {
    router,
    deviceRouter,
};
