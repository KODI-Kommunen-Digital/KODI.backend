const admin = require("firebase-admin");
// const firebaseRepository = require("../repository/firebase");
const exceptionRepository = require("../repository/exceptionsRepo");
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

// async function sendPushNotificationsToUser(
//     userId,
//     title = "BreakingNews",
//     body = "Check it out",
//     data = null,
// ) {
//     if (!serviceAccount) return false;
//     try {
//         const firebaseAdmin = admin.initializeApp(
//             {
//                 credential: admin.credential.cert(serviceAccount),
//             },
//             "Test",
//         );

//         const tokens = await firebaseRepository.getTokensForUser(userId);
//         if (!tokens || tokens.length === 0) {
//             return false;
//         }

//         tokens.map(async (token) => {
//             const message = {
//                 token: token.firebaseToken,
//                 notification: {
//                     title,
//                     body,
//                 },
//                 data,
//             };
//             await firebaseAdmin.messaging().send(message);
//         });
//     } catch (error) {
//         try {
//             const occuredAt = new Date();
//             await exceptionRepository.addException(
//                 error.message ?? "no message",
//                 error.stack ?? "no stack",
//                 getDateInFormate(occuredAt),
//             );
//         } catch (err) { }
//     }
//     return true;
// }

module.exports = {
    sendPushNotificationToAll,
    // sendPushNotificationsToUser
};
