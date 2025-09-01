const cron = require('node-cron');
const database = require('../utils/database');
const sendPushNotification = require('./sendPushNotification');
const status = require('../constants/status');
require('dotenv').config();

const NOTIFICATION_THRESHOLD_MINUTES = process.env.REMINDER_NOTIFICATION_THRESHOLD_MINUTES? parseInt(process.env.REMINDER_NOTIFICATION_THRESHOLD_MINUTES) : 1440;
const newsFlashCategoryId = process.env.NEWS_FLASH_CATEGORY_ID? parseInt(process.env.NEWS_FLASH_CATEGORY_ID) : 1;
const newsFlashSubcategoryId = process.env.NEWS_FLASH_SUBCATEGORY_ID? parseInt(process.env.NEWS_FLASH_SUBCATEGORY_ID) : 1;
const eventCategoryId = process.env.EVENT_CATEGORY_ID? parseInt(process.env.EVENT_CATEGORY_ID) : 3;
const cronSchedule = process.env.CRON_SCHEDULE || '*/5 * * * *';

class ListingNotificationCron {
    constructor() {
        this.cronJob = null;
    }

    start() {
        this.cronJob = cron.schedule(cronSchedule, async () => {
            try {
                await this.checkAndSendNotifications();
                console.log('Cron job executed successfully');
            } catch (error) {
                console.error('Error in notification cron job:', error);
            }
        });

        console.log('Listing notification cron job started');
    }

    stop() {
        if (this.cronJob) {
            this.cronJob.stop();
            console.log('Listing notification cron job stopped');
        }
    }

    async checkAndSendNotifications() {
        const now = new Date();
        const formatDateForMySQL = (date) => date.toISOString().slice(0, 19).replace('T', ' ');
        const nowInGermany = new Date(now.toLocaleString("en-US", { timeZone: "Europe/Berlin" }));
        const thresholdTime = new Date(nowInGermany.getTime() + (NOTIFICATION_THRESHOLD_MINUTES * 60 * 1000));


        const formattedNow = formatDateForMySQL(nowInGermany);
        const formattedThreshold = formatDateForMySQL(thresholdTime);
        // console.log("formattedThreshold", formattedThreshold);
        // console.log("Current time (Germany):", nowInGermany);
        // console.log("Threshold time:", formattedThreshold);

        const query = `
            SELECT l.id, l.title, l.startDate, l.categoryId, 
                   GROUP_CONCAT(DISTINCT lcm.cityId) as cityIds
            FROM listings l
            LEFT JOIN city_listing_mappings lcm ON l.id = lcm.listingId
            WHERE l.reminderNotification = 0 
              AND l.statusId = ?
              AND l.categoryId = ?
              AND l.startDate BETWEEN ? AND ?
            GROUP BY l.id
        `;
        const queryFlashNews = `
            SELECT l.id, l.title, l.startDate, l.categoryId, l.subcategoryId,
                   GROUP_CONCAT(DISTINCT lcm.cityId) as cityIds
            FROM listings l
            LEFT JOIN city_listing_mappings lcm ON l.id = lcm.listingId
            WHERE l.notification = 0 
              AND l.statusId = ?
              AND l.categoryId = ?
              AND l.subcategoryId = ?
            GROUP BY l.id
        `;
        const updatedListingsQuery = `
            SELECT l.id, l.title, l.startDate, l.categoryId, l.subcategoryId,
                   GROUP_CONCAT(DISTINCT lcm.cityId) as cityIds
            FROM listings l
            LEFT JOIN city_listing_mappings lcm ON l.id = lcm.listingId
            WHERE l.updatedNotification = 1
              AND l.statusId = ?
              AND l.categoryId = ?
            GROUP BY l.id
        `;
        let rows;
        let newsRows;
        let updatedRows;
        try {
            const data = await database.callQuery(query, [
                status.Approved,
                eventCategoryId,
                formattedNow,
                formattedThreshold
            ]);
            rows = data.rows;
            const data2 = await database.callQuery(queryFlashNews, [
                status.Approved,
                newsFlashCategoryId,
                newsFlashSubcategoryId
            ]);
            newsRows = data2.rows;
            const data3 = await database.callQuery(updatedListingsQuery, [
                status.Approved,
                eventCategoryId
            ]);
            updatedRows = data3.rows;
        }
        catch (error) {
            console.error(error)
        }

        for (const listing of rows || []) {
            try {
                await sendPushNotification.sendPushNotificationsForFavListingToUsers(
                    listing.id,
                    'Erinnerung: Baldige Veranstaltung',
                    listing.title,
                    {
                        id: listing.id.toString(),
                        type: 'event_reminder'
                    }
                );
                await database.callQuery(
                    'UPDATE listings SET reminderNotification = 1 WHERE id = ?',
                    [listing.id]
                );

                console.log(`Sent notification for listing ${listing.id}`);
            } catch (error) {
                console.error(`Error processing listing ${listing.id}:`, error);
            }
        }
        for (const newsItem of newsRows || []) {
            try {
                await sendPushNotification.sendPushNotificationToAll(
                    'warnings',
                    'Wichtige Meldung',
                    newsItem.title,
                    {
                        id: newsItem.id.toString(),
                        type: 'important_announcement'
                    }
                );
                await database.callQuery(
                    'UPDATE listings SET notification = 1 WHERE id = ?',
                    [newsItem.id]
                );

                console.log(`Sent news notification for listing ${newsItem.id}: ${newsItem.title}`);
            } catch (error) {
                console.error(`Error processing news listing ${newsItem.id}: ${newsItem.title}`, error);
            }
        }
        for (const updatedListing of updatedRows || []) {
            try {
                await sendPushNotification.sendPushNotificationsForFavListingToUsers(
                    updatedListing.id,
                    'Aktualisierte Veranstaltung',
                    updatedListing.title,
                    {
                        id: updatedListing.id.toString(),
                        type: 'updated_listing'
                    }
                );
                await database.callQuery(
                    'UPDATE listings SET updatedNotification = 0 WHERE id = ?',
                    [updatedListing.id]
                );

                console.log(`Sent updated notification for listing ${updatedListing.id}`);
            } catch (error) {
                console.error(`Error processing updated listing ${updatedListing.id}:`, error);
            }
        }
    }
}

const listingNotificationCron = new ListingNotificationCron();

// Start the cron job when this module is imported
// if (process.env.NODE_ENV !== 'test') {
//     listingNotificationCron.start();
// }

// Handle process termination
process.on('SIGINT', () => {
    listingNotificationCron.stop();
    process.exit(0);
});

process.on('SIGTERM', () => {
    listingNotificationCron.stop();
    process.exit(0);
});

module.exports = listingNotificationCron;
