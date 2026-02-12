const fs = require("fs").promises;
const axios = require("axios");
const {
    sendPushNotificationToAll,
} = require("../services/sendPushNotification.js"); // Import your notification service
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
    await sendPushNotificationToAll("warnings", "New Notification", message, {
        alert: "true",
    });
}

// --- Polling job ---
async function poll() {
    console.log("🔄 Starting polling job...");
    const state = await loadState();
    const httpClient = axios; // Use axios or mockAxios for testing

    try {
        // Fetch heat
        const heatRes = await httpClient(HEAT_URL);
        const heat = heatRes.data;
        console.log("current heat grade:", heat.grade);
        console.log("last heat grade:", state.temperature?.grade);
        if (
            state.temperature?.grade !== heat.grade &&
            heat.grade !== "Normale Temperaturen"
        ) {
            console.log(
                "Heat grade changed and is above normal, sending notification."
            );
            await notify(heat.text);
        }

        state.temperature = heat; // update state
        state.temperature.lastUpdated = Date.now();

        // Fetch AQI
        const aqiRes = await httpClient(AQI_URL);
        const aqi = aqiRes.data;
        console.log("current aqi:", aqi.aqi);
        console.log("last aqi:", state.aqi?.aqi);
        if (state.aqi?.aqi !== aqi.aqi && aqi.aqi > 3) {
            console.log(
                "AQI changed and is above threshold, sending notification."
            );
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
function randomBetween(min, max, decimals = 1) {
    const factor = Math.pow(10, decimals);
    return Math.round((Math.random() * (max - min) + min) * factor) / factor;
}
// eslint-disable-next-line no-unused-vars
const mockAxios = async (url) => {
    if (url.includes("heat")) {
        const temp = randomBetween(20, 40, 1); // random temperature 20–40 °C
        const grades = [
            "Normale Temperaturen",
            "Starke Hitze",
            "Extreme Hitze",
        ];
        const texts = [
            "Genießen Sie Ihre Zeit im Freien – keine Risiken.",
            "Bleiben Sie im Schatten – gesundheitliche Risiken möglich.",
            "Bleiben Sie im Haus – hohe Gesundheitsrisiken.",
        ];

        const idx = Math.floor(Math.random() * grades.length);

        return {
            data: {
                temperature: temp,
                grade: grades[idx],
                text: texts[idx],
            },
        };
    }

    if (url.includes("aqi")) {
        const aqi = Math.floor(Math.random() * 10) + 1; // AQI scale 1–10
        const texts = [
            "Sehr gute Luftqualität – genießen Sie den Tag.",
            "Luftqualität ist moderat – empfindliche Personen aufpassen.",
            "Luftqualität ist schlecht – reduzieren Sie Outdoor-Aktivitäten.",
            "Sehr schlechte Luftqualität – vermeiden Sie körperliche Anstrengung.",
        ];

        let text;
        if (aqi <= 3) text = texts[0];
        else if (aqi <= 5) text = texts[1];
        else if (aqi <= 7) text = texts[2];
        else text = texts[3];

        return {
            data: {
                aqi,
                text,
            },
        };
    }

    throw new Error("Unknown mock URL: " + url);
};
