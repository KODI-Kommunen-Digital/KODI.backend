const axios = require("axios");
const sessionsRepo = require("../repository/userChatbotSessionsRepo");
const chatsRepo = require("../repository/userChatbotChatsRepo");

const CHATBOT_URL = process.env.CHATBOT_URL || "http://23.88.109.43:8000/query";
if (!CHATBOT_URL) {
    throw new Error("please configure chat boat url variable in .env");
}
const keyTranslationMap = {
    Orte: "places",
    Daten: "data",
    Antwort: "answer",
    Veranstaltungen: "events",
    "Zusätzliche Informationen": "additionalInformation",
};
function transformResponseKeys(obj) {
    const transformed = {};

    for (const key in obj) {
        const trimmedKey = key.trim(); // Remove extra whitespace
        const translatedKey = keyTranslationMap[trimmedKey] || trimmedKey;

        transformed[translatedKey] = obj[key];
    }

    return transformed;
}

async function sendMessage({ userId, message, sessionId }) {
    // Helper to capitalize the first letter of each word
    function capitalizeWords(str) {
        return str.replace(
            /\w\S*/g,
            (txt) => txt.charAt(0).toUpperCase() + txt.substr(1)
        );
    }

    let session = null;
    if (!sessionId) {
        // Capitalize message and use as session name
        const sessionName = capitalizeWords(message);
        session = await sessionsRepo.create({
            data: { userId, name: sessionName },
        });
        sessionId = session.id;
    } else {
        session = await sessionsRepo.getOne({
            filters: [{ key: "id", sign: "=", value: sessionId }],
        });
        if (!session) throw new Error("Session not found");
    }
    // Store user message as string (not JSON)
    await chatsRepo.create({
        data: { sessionId, sender: "user", message: JSON.stringify(message) },
    });
    // Query chatbot
    const botRes = await axios.post(CHATBOT_URL, { query: message });

    const transformedBotData = transformResponseKeys(botRes.data);

    const botMessage = JSON.stringify(transformedBotData);
    await chatsRepo.create({
        data: { sessionId, sender: "bot", message: String(botMessage) },
    });
    return { sessionId, ...botRes.data };
}

async function getChatHistory(sessionId) {
    return chatsRepo.getChatsBySessionId(sessionId);
}

async function getChatList(userId) {
    return sessionsRepo.getSessionsByUserId(userId);
}

module.exports = { sendMessage, getChatHistory, getChatList };
