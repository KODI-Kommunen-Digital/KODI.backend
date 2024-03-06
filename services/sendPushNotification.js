const admin = require("firebase-admin");
const serviceAccount = process.env.FIREBASE_PRIVATE ? JSON.parse(process.env.FIREBASE_PRIVATE) : {};
const firebaseRepo = require("../repository/firebase");
admin.initializeApp({
    credential: admin.credential.cert(serviceAccount)
});

async function sendPushNotificationToAll(topic="warnings", title="New Notification", body="Check it out", data=null) {

    try {

        if (!serviceAccount)
            return false

        const message = {
            topic,
            notification: {
                title,
                body
            },
            data
        }
        const response = await admin.messaging().send(message)
        return response
    } catch (err) {
        return false
    }
}


async function sendPushNotificationsToUser(userId, title="BreakingNews", body="Check it out", data=null) {

    const firebaseAdmin = admin.initializeApp({
        credential: admin.credential.cert(serviceAccount)
    }, "Test");

    const tokens = await firebaseRepo.getTokensForUser(userId);
    if (!tokens) {
        return false;
    }
    tokens.map(async (token) => {
        const message = {
            token,
            notification: {
                title,
                body
            },
            data
        }
        await firebaseAdmin.messaging().send(message)
    })
    return true;
}

module.exports = { sendPushNotificationToAll, sendPushNotificationsToUser }