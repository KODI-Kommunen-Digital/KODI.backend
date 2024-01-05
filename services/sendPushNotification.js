const admin = require("firebase-admin");
const database = require("./database");
const tables = require("../constants/tableNames");
const AppError = require("../utils/appError");
const serviceAccount = require("./config/privateKey.json");

async function sendPushNotification(userId, sourceAddress, title="New Notification", body="Check it out", imageUrl, next) {

    admin.initializeApp({
        credential: admin.credential.cert(serviceAccount)
    });

    const response = await database.get(tables.FIREBASE_TOKEN, { deviceAddress: sourceAddress, userId: userId });
    if(!response || response.rows?.length === 0) {
        return false
    }
    const token = response.rows[0].firebaseToken
    const message = {
        token:token,
        notification: {
            title: title,
            body: body
        }
    }
    if(imageUrl.match(/(http(s)?:\/\/.)?(www\.)?[-a-zA-Z0-9@:%._\+~#=]{2,256}\.[a-z]{2,6}\b([-a-zA-Z0-9@:%_\+.~#?&//=]*)/g)) {
        message.notification.imageUrl = imageUrl
    }
    
    try {
        await admin.messaging().send(message)
    } catch (err) {
        return false
    }
    return true
}

module.exports = sendPushNotification