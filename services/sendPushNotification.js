const admin = require("firebase-admin");
const database = require("./database");
const tables = require("../constants/tableNames");

async function sendPushNotification(userId, sourceAddress) {
    const serviceAccount = require("./config/privateKey.json");

    admin.initializeApp({
        credential: admin.credential.cert(serviceAccount)
    });

    const response = await database.get(tables.FIREBASE_TOKEN, { deviceAddress: sourceAddress, userId: userId });
    const token = response.rows[0].firebaseToken

    console.log("Token", token)
    const message = {
        token:token,
        notification: {
            title: "Hello world!",
            body: "Greetings from node app third Test"
        },
        data: {
            sentBy: "Moizzz"
        }
    }
    try {
        await admin.messaging().send(message)
        console.log("Message sent")
    } catch (e) {
        console.log('Error sending push notification', e);
    }

    console.log("Token", token.length)

    console.log("Success")
}

sendPushNotification(12, "::1")