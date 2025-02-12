const admin = require("firebase-admin");
const firebaseRepository = require("../repository/firebaseTokenRepo");
const exceptionRepository = require("../repository/exceptionsRepo");
const usersRepository = require("../repository/userRepo");
const serviceAccount = process.env.FIREBASE_PRIVATE
    ? JSON.parse(process.env.FIREBASE_PRIVATE)
    : {};
const getDateInFormate = require("../utils/getDateInFormate");

try {
    admin.initializeApp({
        credential: admin.credential.cert(serviceAccount),
    });
} catch (err) {
    if (!err.message.includes("The default Firebase app already exists."))
        console.log("error in firebase admin initialization", err);
}

async function sendPushNotificationToAll(
    topic = "warnings",
    title = "New Notification",
    body = "Check it out",
    data = null,
) {
    try {
        if (!serviceAccount) return false;

        const message = {
            topic,
            notification: {
                title,
                body,
            },
            data,
        };
        const response = await admin.messaging().send(message);
        return response;
    } catch (err) {
        try {
            const occuredAt = new Date();
            // await exceptionRepository.addException(
            //     err.message ?? "no message",
            //     err.stack ?? "no stack",
            //     getDateInFormate(occuredAt),
            // );
            await exceptionRepository.create({
                message: err.message ?? "no message",
                stackTrace: err.stack ?? "no stack",
                occuredAt: getDateInFormate(occuredAt),
            })
        } catch (err) { }
        return false;
    }
}

async function sendPushNotificationsToUsers(cityIds, categoryId, title = "", body = "Check it out", data = null) {
    try {
        if (!serviceAccount) return false;
        const users = await usersRepository.getUsersForNotification(cityIds, categoryId);
        if (!users || users.length === 0) {
            return false;
        }
        const userIds = users.map(user => user.userId);
        await sendPushNotifications(userIds, title, body, data);
    } catch (error) {
        return false;
    }
}

async function sendPushNotificationsToAdmin(cityIds, categoryId, title = "New Notification from a User", body= "Please verify the listing", data=null) {
    try {
        if (!serviceAccount) return false;
        const AdminUsers = await usersRepository.getAll({
            filters: [
                {
                    key: "roleId",
                    sign: "=",
                    value: 1
                }
            ]
        });
        if (!AdminUsers || AdminUsers.length === 0) {
            return false;
        }
        const AdminUserIds = AdminUsers.rows.map(user => user.id);
        const users = await usersRepository.getUsersForNotificationWithUserFilter(cityIds, categoryId, AdminUserIds);
        const userIds = users.map(user => user.userId);
        await sendPushNotifications(userIds, title, body, data);
    } catch (error) {
        return false;
    }
}


async function sendPushNotifications(userIds, title = "", body = "Check it out", data = null) {
    try {
        if (!serviceAccount) return false;

        const tokenPromises = userIds.map(async (userId) => {
            const { rows } = await firebaseRepository.getAll({
                columns: "firebaseToken",
                filters: [{ key: "userId", sign: "=", value: userId }],
            });
            return rows.map(row => row.firebaseToken); 
        });
        
        const tokensList = (await Promise.all(tokenPromises)).flat();
        
        const tokens = tokensList.filter(token => token);
        if (!tokens || tokens.length === 0) {
            return false;
        }

        const sendPromises = tokens.map(async (token) => {
            const message = {
                token,
                notification: {
                    title,
                    body,
                },
                data
            };
            try {
                return await admin.messaging().send(message);
            } catch (error) {
                console.error(`Error sending to token ${token.firebaseToken}:`, error);
                return null;
            }
        });
        await Promise.all(sendPromises);
    } catch (error) {
        try {
            const occuredAt = new Date();
            await exceptionRepository.create(
                error.message ?? "no message",
                error.stack ?? "no stack",
                getDateInFormate(occuredAt),
            );
        } catch (error) { }
        return false;
    }
    return true;
}

module.exports = {
    sendPushNotificationToAll,
    sendPushNotificationsToUsers,
    sendPushNotificationsToAdmin
};
