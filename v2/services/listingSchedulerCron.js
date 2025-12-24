const cron = require("node-cron");
const database = require("../utils/database");
const sendPushNotification = require("./sendPushNotification");
const status = require("../constants/status");
const categories = require("../constants/categories");
const subcategories = require("../constants/subcategories");
require("dotenv").config();

const cronSchedule = process.env.CRON_SCHEDULE || "*/5 * * * *";

class ListingSchedulerCron {
    constructor() {
        this.cronJob = null;
    }

    start() {
        this.cronJob = cron.schedule(cronSchedule, async () => {
            try {
                await this.checkScheduledListings();
                console.log("Cron job executed successfully");
            } catch (error) {
                console.error("Error in notification cron job:", error);
            }
        });
        console.log("Listing notification cron job started");
    }

    stop() {
        if (this.cronJob) {
            this.cronJob.stop();
            console.log("Listing notification cron job stopped");
        }
    }

    async checkScheduledListings() {
        const now = new Date();

        // Helper to format any Date to MySQL datetime string in local time
        const formatDateForMySQLLocal = (date) => {
            const pad = (n) => (n < 10 ? "0" + n : n);
            return (
                date.getFullYear() +
                "-" +
                pad(date.getMonth() + 1) +
                "-" +
                pad(date.getDate()) +
                " " +
                pad(date.getHours()) +
                ":" +
                pad(date.getMinutes()) +
                ":" +
                pad(date.getSeconds())
            );
        };

        // Get German local time
        const nowInGermany = new Date(
            now.toLocaleString("en-US", { timeZone: "Europe/Berlin" })
        );
        // Format both correctly in German local time
        const formattedNow = formatDateForMySQLLocal(nowInGermany);

        console.log("Now (Germany):", formattedNow);

        const query = `
        SELECT
            l.id,
            l.title,
            l.categoryId,
            l.subcategoryId,
            IFNULL(
                JSON_ARRAYAGG(JSON_OBJECT('cityId', lcm.cityId, 'order', lcm.cityOrder)),
                JSON_ARRAY()
            ) AS cities
            FROM listings l
            LEFT JOIN city_listing_mappings lcm
                ON l.id = lcm.listingId
            WHERE l.scheduledAt <= '${formattedNow}'
                AND l.statusId = ${status.Scheduled}
            GROUP BY l.id, l.title;
        `;

        const data = await database.callQuery(query);
        const rows = data.rows;

        for (const listing of rows || []) {
            try {
                const listingId = listing.id;
                const cityMappings = listing.cities;
                const cityIds = cityMappings.map((mapping) => mapping.cityId);

                // Fetch main city from listing.cities with order 1
                const mainCityMapping = cityMappings.find(
                    (mapping) => mapping.order === 1
                );
                if (!mainCityMapping) {
                    console.warn(
                        `No main city found for listing ${listingId}, skipping notification.`
                    );
                    continue;
                }
                const mainCityId = mainCityMapping.cityId;

                // Fetch main city details
                const cityData = await database.callQuery(
                    "SELECT id, name FROM cities WHERE id = ?",
                    [mainCityId]
                );
                if (cityData.rows.length === 0) {
                    console.warn(
                        `Main city with ID ${mainCityId} not found for listing ${listingId}, skipping notification.`
                    );
                    continue;
                }
                const mainCity = cityData.rows[0];
                if (
                    parseInt(listing.categoryId) === categories.News &&
                            parseInt(listing.subcategoryId) === subcategories.newsflash
                        
                ){
                    await sendPushNotification.sendPushNotificationsToUsers(
                        cityIds,
                        null,
                        "Eilmeldung",
                        mainCity.name + " - " + listing.title,
                        { cityId: mainCity.id.toString(), id: listingId.toString() }
                    );
                }

                // Update listing status to Active
                await database.callQuery(
                    "UPDATE listings SET statusId = 1 WHERE id = ?",
                    [listingId]
                );

                console.log(`Sent notification for listing ${listing.id}`);
            } catch (error) {
                console.error(`Error processing listing ${listing.id}:`, error);
            }
        }

        console.log("Checked scheduled listings at", formattedNow);
        console.log("Listings processed:", rows.length);
    }
}

const listingSchedulerCron = new ListingSchedulerCron();

// Handle process termination
process.on("SIGINT", () => {
    listingSchedulerCron.stop();
    process.exit(0);
});

process.on("SIGTERM", () => {
    listingSchedulerCron.stop();
    process.exit(0);
});

module.exports = listingSchedulerCron;
