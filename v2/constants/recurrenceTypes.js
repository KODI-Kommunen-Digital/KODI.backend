/**
 * Recurrence Types Constants
 * Defines the supported recurrence frequencies and weekday names
 */
module.exports = {
    DAILY: "Daily",
    WEEKLY: "Weekly",
    MONTHLY: "Monthly",
    FREQUENCIES: ["Daily", "Weekly", "Monthly"],
    WEEKDAYS: ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"],
    WEEKDAY_MAP: {
        "Monday": 1,
        "Tuesday": 2,
        "Wednesday": 3,
        "Thursday": 4,
        "Friday": 5,
        "Saturday": 6,
        "Sunday": 0
    },
    // Day ordinals for "Nth weekday of month" pattern
    // 1 = first, 2 = second, 3 = third, 4 = fourth, -1 = last
    DAY_ORDINALS: [1, 2, 3, 4, -1]
};
