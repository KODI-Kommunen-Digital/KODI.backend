/**
 * Recurrence Serializer
 * Handles conversion between API format and database format
 * 
 * This module is designed to be independent and reusable in other projects.
 */

const getDateInFormate = require("../../utils/getDateInFormate");

class RecurrenceSerializer {
    /**
     * Convert API input to database format
     * @param {Object} input - API recurrence rule input
     * @returns {Object} - { ruleData, listingDates: { startDate, endDate } }
     */
    static toDatabase(input) {
        const startDateTime = new Date(input.start);
        const endDateTime = new Date(input.end);
        // repeatUntil is optional - if not provided, event runs indefinitely
        const repeatUntilDateTime = input.repeatUntil ? new Date(input.repeatUntil) : null;

        // Extract time portions
        const startTime = this.extractTimeString(startDateTime);
        const endTime = this.extractTimeString(endDateTime);

        // Calculate day offset (how many days the event spans)
        // e.g., event starts 8PM and ends 1AM next day = 1 day offset
        const startDateOnly = new Date(startDateTime.getFullYear(), startDateTime.getMonth(), startDateTime.getDate());
        const endDateOnly = new Date(endDateTime.getFullYear(), endDateTime.getMonth(), endDateTime.getDate());
        const dayOffset = Math.round((endDateOnly - startDateOnly) / (24 * 60 * 60 * 1000));

        // Prepare rule data for database (each rule stores its own dates)
        const ruleData = {
            freq: input.freq,
            intervalValue: input.interval || 1,
            weekdays: input.weekdays && input.weekdays.length > 0
                ? JSON.stringify(input.weekdays)
                : null,
            startTime,
            endTime,
            dayOffset: dayOffset || 0,  // Store how many days the event spans
            dayOrdinal: input.dayOrdinal || null,  // For Monthly Nth weekday pattern
            startDate: getDateInFormate(startDateTime),  // Rule's own start date
            repeatUntil: repeatUntilDateTime ? getDateInFormate(repeatUntilDateTime) : null  // null = infinite
        };

        // Prepare listing dates (used to update listing's overall date range)
        // If repeatUntil is not provided, endDate is null (infinite)
        const listingDates = {
            startDate: getDateInFormate(startDateTime),
            endDate: repeatUntilDateTime ? getDateInFormate(repeatUntilDateTime) : null
        };

        return { ruleData, listingDates };
    }

    /**
     * Convert database record to API response format
     * @param {Object} dbRecord - Database recurrence rule record
     * @param {Object} listing - Listing record (for startDate/endDate)
     * @param {Array} exceptions - Associated exception records
     * @returns {Object} - API response format matching input structure
     */
    static toApiResponse(dbRecord, listing, exceptions = []) {
        // Parse weekdays from JSON if stored as string
        let weekdays = [];
        if (dbRecord.weekdays) {
            try {
                weekdays = typeof dbRecord.weekdays === 'string'
                    ? JSON.parse(dbRecord.weekdays)
                    : dbRecord.weekdays;
            } catch (e) {
                weekdays = [];
            }
        }

        // Use rule's own startDate and repeatUntil, fallback to listing dates for backward compatibility
        const startDate = dbRecord.startDate
            ? new Date(dbRecord.startDate)
            : (listing.startDate ? new Date(listing.startDate) : new Date());

        // repeatUntil can be null for infinite recurring events
        let repeatUntilDate = null;
        if (dbRecord.repeatUntil) {
            repeatUntilDate = new Date(dbRecord.repeatUntil);
        } else if (listing.endDate) {
            repeatUntilDate = new Date(listing.endDate);
        }
        // If both are null, the event runs indefinitely

        // Format start with time from the rule
        const startDateStr = this.formatDateOnly(startDate);
        const start = `${startDateStr} ${dbRecord.startTime || "00:00:00"}`;

        // Calculate end date considering dayOffset (for events that span midnight)
        const dayOffset = dbRecord.dayOffset || 0;
        const endDateObj = new Date(startDate);
        endDateObj.setDate(endDateObj.getDate() + dayOffset);
        const endDateStr = this.formatDateOnly(endDateObj);
        const end = `${endDateStr} ${dbRecord.endTime || "00:00:00"}`;

        // repeatUntil is null for infinite events
        const repeatUntil = repeatUntilDate
            ? `${this.formatDateOnly(repeatUntilDate)} ${dbRecord.endTime || "00:00:00"}`
            : null;

        // Format exceptions
        const formattedExceptions = exceptions.map(exc => ({
            id: exc.id,
            date: this.formatDateOnly(new Date(exc.exceptionDate)),
            reason: exc.reason || null
        }));

        return {
            freq: dbRecord.freq,
            interval: dbRecord.intervalValue || dbRecord.interval || 1,
            weekdays,
            start,
            end,
            repeatUntil,  // null if event runs indefinitely
            dayOffset,
            dayOrdinal: dbRecord.dayOrdinal || null,  // For Monthly Nth weekday pattern
            exceptions: formattedExceptions
        };
    }

    /**
     * Extract time string in HH:MM:SS format from a Date object
     * @param {Date} date 
     * @returns {string}
     */
    static extractTimeString(date) {
        const hours = String(date.getHours()).padStart(2, '0');
        const minutes = String(date.getMinutes()).padStart(2, '0');
        const seconds = String(date.getSeconds()).padStart(2, '0');
        return `${hours}:${minutes}:${seconds}`;
    }

    /**
     * Format date to YYYY-MM-DD string
     * @param {Date} date 
     * @returns {string}
     */
    static formatDateOnly(date) {
        const year = date.getFullYear();
        const month = String(date.getMonth() + 1).padStart(2, '0');
        const day = String(date.getDate()).padStart(2, '0');
        return `${year}-${month}-${day}`;
    }
}

module.exports = RecurrenceSerializer;
