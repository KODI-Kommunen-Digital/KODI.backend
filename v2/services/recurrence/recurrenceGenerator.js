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
     * @param {Date|string|null} repeatUntil - End date for recurrence (null = infinite)
     * @param {Array} exceptions - List of exception dates to skip
     * @param {Date|string|null} fromDate - Optional: Only generate occurrences from this date onwards (e.g., today)
     * @returns {Array} - Array of occurrence date objects { date, startTime, endTime }
     */
    static generateOccurrences(rule, startDate, repeatUntil, exceptions = [], fromDate = null) {
        const start = new Date(startDate);
        if (isNaN(start.getTime())) {
            throw new Error("Invalid start date");
        }

        // Handle null repeatUntil (infinite recurring events)
        // For infinite events, generate occurrences up to a horizon (default: 1 year from now)
        let until;
        if (!repeatUntil) {
            const horizonYears = parseInt(process.env.MAX_RECURRENCE_HORIZON_YEARS, 10) || 1;
            until = new Date();
            until.setFullYear(until.getFullYear() + horizonYears);
        } else {
            until = new Date(repeatUntil);
            if (isNaN(until.getTime())) {
                throw new Error("Invalid repeatUntil date");
            }
        }

        if (start > until) {
            return [];
        }

        // Use fromDate to skip past occurrences if provided
        // Always normalize effectiveStart to start of day for correct comparison
        // (occurrence dates from getNthWeekdayOfMonth etc. are created at 00:00:00)
        let effectiveStart = new Date(start);
        effectiveStart.setHours(0, 0, 0, 0);  // Normalize to start of day

        if (fromDate) {
            const from = new Date(fromDate);
            from.setHours(0, 0, 0, 0);
            if (!isNaN(from.getTime()) && from > effectiveStart) {
                effectiveStart = from;
            }
        }

        // Format exception dates - extract just the date portion (YYYY-MM-DD)
        const exceptionDates = new Set(
            exceptions.map(e => {
                const dateStr = e.date || e.exceptionDate || e;
                // If already a string in YYYY-MM-DD format, use it directly
                if (typeof dateStr === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(dateStr)) {
                    return dateStr;
                }
                // Otherwise parse and format - use local date to avoid timezone issues
                const d = new Date(dateStr);
                const year = d.getFullYear();
                const month = String(d.getMonth() + 1).padStart(2, '0');
                const day = String(d.getDate()).padStart(2, '0');
                return `${year}-${month}-${day}`;
            })
        );

        let occurrences = [];

        // Safety limit for maximum occurrences to prevent infinite loops/memory issues
        const MAX_OCCURRENCES = parseInt(process.env.MAX_RECURRENCE_OCCURRENCES, 10) || 100;

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

        // Filter out exceptions - extract date portion from ISO startDate for comparison
        return occurrences.map(occ => {
            // Extract date portion (YYYY-MM-DD) from ISO string for exception matching
            const occDateOnly = occ.startDate.split('T')[0];
            return {
                ...occ,
                isException: exceptionDates.has(occDateOnly)
            };
        });
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
        const dayOffset = rule.dayOffset || 0;

        const currentDate = new Date(start);
        let count = 0;

        // eslint-disable-next-line no-unmodified-loop-condition
        while (currentDate <= until && count < limit) {
            // Only add if on or after effectiveStart
            if (currentDate >= effectiveStart) {
                // Calculate end date based on dayOffset
                const endDateObj = new Date(currentDate);
                endDateObj.setDate(endDateObj.getDate() + dayOffset);

                occurrences.push({
                    startDate: this.formatDateTimeISO(currentDate, startTime),
                    endDate: this.formatDateTimeISO(endDateObj, endTime)
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
        const dayOffset = rule.dayOffset || 0;

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
                // Calculate end date based on dayOffset
                const endDateObj = new Date(currentDate);
                endDateObj.setDate(endDateObj.getDate() + dayOffset);

                occurrences.push({
                    startDate: this.formatDateTimeISO(currentDate, startTime),
                    endDate: this.formatDateTimeISO(endDateObj, endTime)
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
     * Generate monthly occurrences
     * Supports two patterns:
     * 1. Date-based: same day of month (e.g., 15th of each month)
     * 2. Nth weekday: specific weekday ordinal (e.g., 1st Wednesday of each month)
     * @param {Object} rule 
     * @param {Date} start 
     * @param {Date} until 
     * @param {number} limit
     * @param {Date} effectiveStart - Only include occurrences on or after this date
     * @returns {Array}
     */
    static generateMonthlyOccurrences(rule, start, until, limit, effectiveStart) {
        // Check if this is Nth weekday pattern
        if (rule.dayOrdinal !== undefined && rule.dayOrdinal !== null && rule.weekdays && rule.weekdays.length === 1) {
            return this.generateMonthlyNthWeekdayOccurrences(rule, start, until, limit, effectiveStart);
        }
        // Otherwise use date-based pattern
        return this.generateMonthlyDateOccurrences(rule, start, until, limit, effectiveStart);
    }

    /**
     * Generate monthly occurrences by same day of month
     * @param {Object} rule 
     * @param {Date} start 
     * @param {Date} until 
     * @param {number} limit
     * @param {Date} effectiveStart
     * @returns {Array}
     */
    static generateMonthlyDateOccurrences(rule, start, until, limit, effectiveStart) {
        const occurrences = [];
        // Ensure positive interval
        const interval = Math.max(1, Math.abs(rule.interval || rule.intervalValue || 1));
        const startTime = rule.startTime || this.extractTime(start);
        const endTime = rule.endTime || this.extractTime(until);
        const targetDayOfMonth = start.getDate();
        const dayOffset = rule.dayOffset || 0;

        let count = 0;
        let iteration = 0;

        while (count < limit) {
            // Calculate target month based on start + iteration * interval
            const targetYear = start.getFullYear();
            const targetMonth = start.getMonth() + (iteration * interval);

            // Set to the 1st of the target month first to avoid overflow issues
            const tempDate = new Date(start);
            tempDate.setFullYear(targetYear);
            tempDate.setMonth(targetMonth, 1);

            const normalizedYear = tempDate.getFullYear();
            const normalizedMonth = tempDate.getMonth();

            // Get number of days in this month
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
                const endDateObj = new Date(occurrenceDate);
                endDateObj.setDate(endDateObj.getDate() + dayOffset);

                occurrences.push({
                    startDate: this.formatDateTimeISO(occurrenceDate, startTime),
                    endDate: this.formatDateTimeISO(endDateObj, endTime)
                });
                count++;
            }
        }

        return occurrences;
    }

    /**
     * Generate monthly occurrences by Nth weekday of month
     * e.g., 1st Wednesday, 2nd Friday, last Monday
     * @param {Object} rule 
     * @param {Date} start 
     * @param {Date} until 
     * @param {number} limit
     * @param {Date} effectiveStart
     * @returns {Array}
     */
    static generateMonthlyNthWeekdayOccurrences(rule, start, until, limit, effectiveStart) {
        const occurrences = [];
        const interval = Math.max(1, Math.abs(rule.interval || rule.intervalValue || 1));
        const startTime = rule.startTime || this.extractTime(start);
        const endTime = rule.endTime || this.extractTime(until);
        const dayOffset = rule.dayOffset || 0;

        // Get weekly information from rule
        const weekdays = rule.weekdays || [];
        const weekdayName = weekdays[0];
        const targetWeekday = recurrenceTypes.WEEKDAY_MAP[weekdayName];
        const dayOrdinal = rule.dayOrdinal;

        let count = 0;
        let iteration = 0;

        while (count < limit) {
            // Calculate target month
            const targetYear = start.getFullYear();
            const targetMonth = start.getMonth() + (iteration * interval);

            // Normalize year/month
            const tempDate = new Date(start);
            tempDate.setFullYear(targetYear);
            tempDate.setMonth(targetMonth, 1);

            const normalizedYear = tempDate.getFullYear();
            const normalizedMonth = tempDate.getMonth();

            // Find the Nth weekday of this month
            const occurrenceDate = this.getNthWeekdayOfMonth(normalizedYear, normalizedMonth, targetWeekday, dayOrdinal);

            iteration++;

            // Skip if no valid date found (e.g., 5th Monday might not exist)
            if (!occurrenceDate) continue;

            if (occurrenceDate > until) break;

            // Only add if on or after effectiveStart
            if (occurrenceDate >= effectiveStart) {
                const endDateObj = new Date(occurrenceDate);
                endDateObj.setDate(endDateObj.getDate() + dayOffset);

                occurrences.push({
                    startDate: this.formatDateTimeISO(occurrenceDate, startTime),
                    endDate: this.formatDateTimeISO(endDateObj, endTime)
                });
                count++;
            }
        }

        return occurrences;
    }

    /**
     * Get the Nth occurrence of a specific weekday in a month
     * @param {number} year 
     * @param {number} month 
     * @param {number} weekday - 0=Sunday, 1=Monday, ..., 6=Saturday
     * @param {number} ordinal - 1=first, 2=second, 3=third, 4=fourth, -1=last
     * @returns {Date|null}
     */
    static getNthWeekdayOfMonth(year, month, weekday, ordinal) {
        if (ordinal === -1) {
            // Last occurrence of the weekday
            // Start from the last day of the month and go backwards
            const lastDay = new Date(year, month + 1, 0);
            let day = lastDay.getDate();
            while (day > 0) {
                const date = new Date(year, month, day);
                if (date.getDay() === weekday) {
                    return date;
                }
                day--;
            }
            return null;
        }

        // Find the Nth occurrence (1st, 2nd, 3rd, 4th)
        let count = 0;
        const daysInMonth = new Date(year, month + 1, 0).getDate();
        for (let day = 1; day <= daysInMonth; day++) {
            const date = new Date(year, month, day);
            if (date.getDay() === weekday) {
                count++;
                if (count === ordinal) {
                    return date;
                }
            }
        }

        // Ordinal not found (e.g., 5th occurrence doesn't exist)
        return null;
    }

    /**
     * Check if a specific date has an occurrence
     * @param {Object} rule 
     * @param {Date|string} startDate 
     * @param {Date|string|null} repeatUntil - null for infinite recurring events
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
     * @param {Date|string|null} repeatUntil - null for infinite recurring events
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
     * Format date with time to ISO string (like 2025-06-28T06:30:00.000Z)
     * @param {Date} date - Date object
     * @param {string} timeStr - Time string in HH:MM:SS format
     * @returns {string} - ISO format datetime
     */
    static formatDateTimeISO(date, timeStr) {
        const [hours, minutes, seconds] = timeStr.split(':').map(Number);
        const result = new Date(date);
        result.setHours(hours, minutes, seconds || 0, 0);
        return result.toISOString();
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
