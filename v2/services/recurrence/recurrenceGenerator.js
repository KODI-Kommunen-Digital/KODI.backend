/**
 * Recurrence Generator
 * Generates occurrence dates based on recurrence rules
 * 
 * This module is designed to be independent and reusable in other projects.
 */

const recurrenceTypes = require("../../constants/recurrenceTypes");

class RecurrenceGenerator {
    /**
     * Generate all occurrences for a recurrence rule
     * @param {Object} rule - The recurrence rule (from DB or API)
     * @param {Date|string} startDate - First occurrence date
     * @param {Date|string} repeatUntil - End date for recurrence
     * @param {Array} exceptions - List of exception dates to skip
     * @param {Date|string|null} fromDate - Optional: Only generate occurrences from this date onwards (e.g., today)
     * @returns {Array} - Array of occurrence date objects { date, startTime, endTime }
     */
    static generateOccurrences(rule, startDate, repeatUntil, exceptions = [], fromDate = null) {
        const start = new Date(startDate);
        const until = new Date(repeatUntil);

        if (isNaN(start.getTime()) || isNaN(until.getTime())) {
            throw new Error("Invalid start or repeatUntil date");
        }

        if (start > until) {
            return [];
        }

        // Use fromDate to skip past occurrences if provided
        let effectiveStart = start;
        if (fromDate) {
            const from = new Date(fromDate);
            from.setHours(0, 0, 0, 0);
            if (!isNaN(from.getTime()) && from > start) {
                effectiveStart = from;
            }
        }

        const exceptionDates = new Set(
            exceptions.map(e => this.formatDateOnly(new Date(e.date || e.exceptionDate || e)))
        );

        let occurrences = [];

        // Safety limit for maximum occurrences to prevent infinite loops/memory issues
        const MAX_OCCURRENCES = 1500;

        switch (rule.freq) {
            case recurrenceTypes.DAILY:
                occurrences = this.generateDailyOccurrences(rule, start, until, MAX_OCCURRENCES, effectiveStart);
                break;
            case recurrenceTypes.WEEKLY:
                occurrences = this.generateWeeklyOccurrences(rule, start, until, MAX_OCCURRENCES, effectiveStart);
                break;
            case recurrenceTypes.MONTHLY:
                occurrences = this.generateMonthlyOccurrences(rule, start, until, MAX_OCCURRENCES, effectiveStart);
                break;
            default:
                return [];
        }

        // Filter out exceptions
        return occurrences.map(occ => ({
            ...occ,
            isException: exceptionDates.has(occ.date)
        }));
    }

    /**
     * Generate daily occurrences
     * @param {Object} rule 
     * @param {Date} start 
     * @param {Date} until 
     * @param {number} limit
     * @param {Date} effectiveStart - Only include occurrences on or after this date
     * @returns {Array}
     */
    static generateDailyOccurrences(rule, start, until, limit, effectiveStart) {
        const occurrences = [];
        // Ensure positive interval
        const interval = Math.max(1, Math.abs(rule.interval || rule.intervalValue || 1));
        const startTime = rule.startTime || this.extractTime(start);
        const endTime = rule.endTime || this.extractTime(until);

        const currentDate = new Date(start);
        let count = 0;

        // eslint-disable-next-line no-unmodified-loop-condition
        while (currentDate <= until && count < limit) {
            // Only add if on or after effectiveStart
            if (currentDate >= effectiveStart) {
                occurrences.push({
                    date: this.formatDateOnly(currentDate),
                    startTime,
                    endTime
                });
                count++;
            }
            currentDate.setDate(currentDate.getDate() + interval);
        }

        return occurrences;
    }

    /**
     * Generate weekly occurrences
     * @param {Object} rule 
     * @param {Date} start 
     * @param {Date} until 
     * @param {number} limit
     * @param {Date} effectiveStart - Only include occurrences on or after this date
     * @returns {Array}
     */
    static generateWeeklyOccurrences(rule, start, until, limit, effectiveStart) {
        const occurrences = [];
        // Ensure positive interval
        const interval = Math.max(1, Math.abs(rule.interval || rule.intervalValue || 1));
        const weekdays = rule.weekdays || [];
        const startTime = rule.startTime || this.extractTime(start);
        const endTime = rule.endTime || this.extractTime(until);

        if (!weekdays.length) return occurrences;

        // Convert weekday names to day numbers (0 = Sunday, 1 = Monday, etc.)
        const targetDays = weekdays.map(day => recurrenceTypes.WEEKDAY_MAP[day]);

        const currentDate = new Date(start);
        let weekCounter = 0;
        let lastWeekNumber = this.getWeekNumber(start);
        let count = 0;

        // eslint-disable-next-line no-unmodified-loop-condition
        while (currentDate <= until && count < limit) {
            const currentWeekNumber = this.getWeekNumber(currentDate);

            // Check if we moved to a new week
            if (currentWeekNumber !== lastWeekNumber) {
                weekCounter++;
                lastWeekNumber = currentWeekNumber;
            }

            // Only add occurrence if it's on the right interval week, right day, AND on/after effectiveStart
            if (weekCounter % interval === 0 && targetDays.includes(currentDate.getDay()) && currentDate >= effectiveStart) {
                occurrences.push({
                    date: this.formatDateOnly(currentDate),
                    startTime,
                    endTime
                });
                count++;
            }

            currentDate.setDate(currentDate.getDate() + 1);

            // Safety break for loop iteration limit (e.g. if 'until' is very far in future)
            if (count >= limit) break;
        }

        return occurrences;
    }

    /**
     * Generate monthly occurrences (same day of month)
     * @param {Object} rule 
     * @param {Date} start 
     * @param {Date} until 
     * @param {number} limit
     * @param {Date} effectiveStart - Only include occurrences on or after this date
     * @returns {Array}
     */
    static generateMonthlyOccurrences(rule, start, until, limit, effectiveStart) {
        const occurrences = [];
        // Ensure positive interval
        const interval = Math.max(1, Math.abs(rule.interval || rule.intervalValue || 1));
        const startTime = rule.startTime || this.extractTime(start);
        const endTime = rule.endTime || this.extractTime(until);
        const targetDayOfMonth = start.getDate();

        let count = 0;
        let iteration = 0;

        while (count < limit) {
            // Calculate target month based on start + iteration * interval
            // We use temp dates to handle year/month wrapping correctly
            const targetYear = start.getFullYear();
            const targetMonth = start.getMonth() + (iteration * interval);

            // Determine days in that target month
            // We set to the 1st of the target month first to avoid overflow issues
            const tempDate = new Date(start);
            tempDate.setFullYear(targetYear);
            tempDate.setMonth(targetMonth, 1);

            const normalizedYear = tempDate.getFullYear();
            const normalizedMonth = tempDate.getMonth();

            // Get number of days in this month (Standard JS trick: day 0 of next month is last day of current)
            const daysInMonth = new Date(normalizedYear, normalizedMonth + 1, 0).getDate();

            // Clamp target day to match the month (e.g., Jan 31 -> Feb 28)
            const actualDay = Math.min(targetDayOfMonth, daysInMonth);

            // Create occurrence date
            const occurrenceDate = new Date(start);
            occurrenceDate.setFullYear(normalizedYear);
            occurrenceDate.setMonth(normalizedMonth, 1);
            occurrenceDate.setDate(actualDay);

            iteration++;

            if (occurrenceDate > until) break;

            // Only add if on or after effectiveStart
            if (occurrenceDate >= effectiveStart) {
                occurrences.push({
                    date: this.formatDateOnly(occurrenceDate),
                    startTime,
                    endTime
                });
                count++;
            }
        }

        return occurrences;
    }

    /**
     * Check if a specific date has an occurrence
     * @param {Object} rule 
     * @param {Date|string} startDate 
     * @param {Date|string} repeatUntil 
     * @param {Date|string} checkDate 
     * @param {Array} exceptions 
     * @returns {boolean}
     */
    static hasOccurrenceOnDate(rule, startDate, repeatUntil, checkDate, exceptions = []) {
        const occurrences = this.generateOccurrences(rule, startDate, repeatUntil, exceptions);
        const checkDateStr = this.formatDateOnly(new Date(checkDate));
        return occurrences.some(occ => occ.date === checkDateStr && !occ.isException);
    }

    /**
     * Get next N occurrences from a given date
     * @param {Object} rule 
     * @param {Date|string} startDate 
     * @param {Date|string} repeatUntil 
     * @param {Date|string} fromDate 
     * @param {number} count 
     * @param {Array} exceptions 
     * @returns {Array}
     */
    static getNextOccurrences(rule, startDate, repeatUntil, fromDate, count, exceptions = []) {
        const allOccurrences = this.generateOccurrences(rule, startDate, repeatUntil, exceptions);
        const fromDateStr = this.formatDateOnly(new Date(fromDate));

        return allOccurrences
            .filter(occ => occ.date >= fromDateStr && !occ.isException)
            .slice(0, count);
    }

    /**
     * Format date to YYYY-MM-DD string
     * @param {Date} date 
     * @returns {string}
     */
    static formatDateOnly(date) {
        return date.toISOString().split("T")[0];
    }

    /**
     * Extract time portion from a date
     * @param {Date} date 
     * @returns {string} - HH:MM:SS format
     */
    static extractTime(date) {
        return date.toTimeString().split(" ")[0];
    }

    /**
     * Get ISO week number
     * @param {Date} date 
     * @returns {number}
     */
    static getWeekNumber(date) {
        const d = new Date(Date.UTC(date.getFullYear(), date.getMonth(), date.getDate()));
        const dayNum = d.getUTCDay() || 7;
        d.setUTCDate(d.getUTCDate() + 4 - dayNum);
        const yearStart = new Date(Date.UTC(d.getUTCFullYear(), 0, 1));
        return Math.ceil((((d - yearStart) / 86400000) + 1) / 7);
    }
}

module.exports = RecurrenceGenerator;
