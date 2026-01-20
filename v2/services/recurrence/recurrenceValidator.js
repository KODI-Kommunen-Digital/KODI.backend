/**
 * Recurrence Validator
 * Validates recurrence rule objects for correctness
 * 
 * This module is designed to be independent and reusable in other projects.
 */

const recurrenceTypes = require("../../constants/recurrenceTypes");

class RecurrenceValidator {
    /**
     * Validates a complete recurrence rule object
     * @param {Object} rule - The recurrence rule to validate
     * @returns {Object} - { isValid: boolean, errors: string[] }
     */
    static validate(rule) {
        const errors = [];

        if (!rule) {
            return { isValid: false, errors: ["Recurrence rule is required"] };
        }

        // Validate frequency
        const freqError = this.validateFrequency(rule.freq);
        if (freqError) errors.push(freqError);

        // Validate interval
        const intervalError = this.validateInterval(rule.interval);
        if (intervalError) errors.push(intervalError);

        // Validate weekdays (required for Weekly frequency)
        const weekdaysError = this.validateWeekdays(rule.weekdays, rule.freq);
        if (weekdaysError) errors.push(weekdaysError);

        // Validate date range
        const dateErrors = this.validateDateRange(rule.start, rule.end, rule.repeatUntil);
        errors.push(...dateErrors);

        // Validate exceptions if provided
        if (rule.exceptions && Array.isArray(rule.exceptions)) {
            const exceptionErrors = this.validateExceptions(rule.exceptions);
            errors.push(...exceptionErrors);
        }

        return {
            isValid: errors.length === 0,
            errors
        };
    }

    /**
     * Validates the frequency value
     * @param {string} freq 
     * @returns {string|null} - Error message or null if valid
     */
    static validateFrequency(freq) {
        if (!freq) {
            return "Frequency (freq) is required";
        }
        if (!recurrenceTypes.FREQUENCIES.includes(freq)) {
            return `Invalid frequency '${freq}'. Must be one of: ${recurrenceTypes.FREQUENCIES.join(", ")}`;
        }
        return null;
    }

    /**
     * Validates the interval value
     * @param {number} interval 
     * @returns {string|null}
     */
    static validateInterval(interval) {
        if (interval === undefined || interval === null) {
            return "Interval is required";
        }
        const intervalNum = Number(interval);
        if (isNaN(intervalNum) || intervalNum < 1 || !Number.isInteger(intervalNum)) {
            return "Interval must be a positive integer";
        }
        return null;
    }

    /**
     * Validates weekdays array
     * @param {Array} weekdays 
     * @param {string} freq 
     * @returns {string|null}
     */
    static validateWeekdays(weekdays, freq) {
        // Weekdays are only required for Weekly frequency
        if (freq === recurrenceTypes.WEEKLY) {
            if (!weekdays || !Array.isArray(weekdays) || weekdays.length === 0) {
                return "Weekdays array is required for Weekly frequency";
            }
            for (const day of weekdays) {
                if (!recurrenceTypes.WEEKDAYS.includes(day)) {
                    return `Invalid weekday '${day}'. Must be one of: ${recurrenceTypes.WEEKDAYS.join(", ")}`;
                }
            }
        }
        // For Daily and Monthly, weekdays should be empty or not provided
        if (freq !== recurrenceTypes.WEEKLY && weekdays && weekdays.length > 0) {
            return `Weekdays should be empty for ${freq} frequency`;
        }
        return null;
    }

    /**
     * Validates the date range
     * @param {string} start - Start datetime
     * @param {string} end - End datetime
     * @param {string} repeatUntil - Repeat until datetime
     * @returns {string[]} - Array of error messages
     */
    static validateDateRange(start, end, repeatUntil) {
        const errors = [];

        if (!start) {
            errors.push("Start datetime is required");
        }
        if (!end) {
            errors.push("End datetime is required");
        }
        if (!repeatUntil) {
            errors.push("RepeatUntil datetime is required");
        }

        if (start && end && repeatUntil) {
            const startDate = new Date(start);
            const endDate = new Date(end);
            const repeatUntilDate = new Date(repeatUntil);

            if (isNaN(startDate.getTime())) {
                errors.push("Invalid start datetime format");
            }
            if (isNaN(endDate.getTime())) {
                errors.push("Invalid end datetime format");
            }
            if (isNaN(repeatUntilDate.getTime())) {
                errors.push("Invalid repeatUntil datetime format");
            }

            if (!errors.length) {
                if (endDate < startDate) {
                    errors.push("End datetime cannot be before start datetime");
                }
                if (repeatUntilDate < startDate) {
                    errors.push("RepeatUntil datetime cannot be before start datetime");
                }

                const maxDurationMs = parseInt(process.env.MAX_RECURRENCE_DURATION_YEARS, 10) || 2;
                const twoYearsMs = maxDurationMs * 365 * 24 * 60 * 60 * 1000;
                const durationMs = repeatUntilDate.getTime() - startDate.getTime();

                if (durationMs > twoYearsMs) {
                    errors.push(`Recurrence duration cannot exceed ${maxDurationMs} years`);
                }
            }
        }

        return errors;
    }

    /**
     * Validates exception dates
     * @param {Array} exceptions 
     * @returns {string[]}
     */
    static validateExceptions(exceptions) {
        const errors = [];

        if (!Array.isArray(exceptions)) {
            return ["Exceptions must be an array"];
        }

        exceptions.forEach((exception, index) => {
            if (!exception.date) {
                errors.push(`Exception at index ${index}: date is required`);
            } else {
                const exDate = new Date(exception.date);
                if (isNaN(exDate.getTime())) {
                    errors.push(`Exception at index ${index}: invalid date format`);
                }
            }
        });

        return errors;
    }
}

module.exports = RecurrenceValidator;
