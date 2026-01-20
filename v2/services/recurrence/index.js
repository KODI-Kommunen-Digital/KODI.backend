/**
 * Recurrence Module
 * Main entry point for recurrence functionality
 * 
 * This module provides:
 * - RecurrenceValidator: Validates recurrence rule objects
 * - RecurrenceGenerator: Generates occurrence dates
 * - RecurrenceSerializer: Converts between API and DB formats
 * 
 * Designed to be modular and reusable in other projects.
 */

const RecurrenceValidator = require("./recurrenceValidator");
const RecurrenceGenerator = require("./recurrenceGenerator");
const RecurrenceSerializer = require("./recurrenceSerializer");

module.exports = {
    RecurrenceValidator,
    RecurrenceGenerator,
    RecurrenceSerializer
};
