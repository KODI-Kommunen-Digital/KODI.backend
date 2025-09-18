const fs = require("fs").promises;
const axios = require("axios");
// const {
//     sendPushNotificationToAll,
// } = require("../services/sendPushNotification.js"); // Import your notification service
const HEAT_URL = "https://alerts.troisdorf.civora.org/alerts/heat";
const AQI_URL = "https://alerts.troisdorf.civora.org/alerts/aqi";
const STATE_FILE = "./lastReadings.json";

// --- Load last readings from file or initialize ---
async function loadState() {
    try {
        const data = await fs.readFile(STATE_FILE, "utf-8");
        return JSON.parse(data);
    } catch {
        return { temperature: null, aqi: null };
    }
}

async function saveState(state) {
    await fs.writeFile(STATE_FILE, JSON.stringify(state, null, 2), {
        encoding: "utf-8",
        flag: "w",
    });
}

async function notify(message) {
    console.log("🔔 Notification:", message);
    // await sendPushNotificationToAll("warnings", "New Notification", message);
}

// --- Polling job ---
async function poll() {
    console.log("🔄 Starting polling job...");
    const state = await loadState();

    try {
        // Fetch heat
        const heatRes = await axios(HEAT_URL);
        const heat = heatRes.data;

        if (
            state.temperature?.grade !== heat.grade &&
            heat.grade !== "Normale Temperaturen"
        ) {
            await notify(heat.text);
        }

        state.temperature = heat; // update state
        state.temperature.lastUpdated = Date.now();

        // Fetch AQI
        const aqiRes = await axios(AQI_URL);
        const aqi = aqiRes.data;

        if (state.aqi?.aqi !== aqi.aqi && aqi.aqi > 3) {
            await notify(aqi.text);
        }

        state.aqi = aqi; // update state
        state.aqi.lastUpdated = Date.now();
        // Save updated state
        await saveState(state);
        console.log("✅ Polling completed, state updated.");
    } catch (err) {
        console.error("Polling error:", err);
    }
}

// Run immediately once, then every 30 minutes
poll();
setInterval(poll, 1000 * 60 * 60);
