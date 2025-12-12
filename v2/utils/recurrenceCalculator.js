const getDateInFormate = require("./getDateInFormate");

function calculateRecurrence(
    startDateStr,
    endDateStr,
    metadata,
    startAfterDate,
    endBeforeDate
) {
    if (!metadata) return { isRecurring: false, upcomingDates: [] };

    // let meta;
    // try {
    //     meta = JSON.parse(metadata);
    // } catch (e) {
    //     return { isRecurring: false, upcomingDates: [] };
    // }

    if (
        !metadata.rules ||
        !Array.isArray(metadata.rules) ||
        metadata.rules.length === 0
    ) {
        return { isRecurring: false, upcomingDates: [] };
    }

    const rule = metadata.rules[0];
    const ruleNum = parseInt(rule.description.split(":")[0]);
    if (isNaN(ruleNum) || ruleNum < 1 || ruleNum > 8) {
        return { isRecurring: false, upcomingDates: [] };
    }

    const startDate = new Date(startDateStr);
    const endDate = new Date(endDateStr);
    const today = new Date();
    let calcStart = new Date(today);
    if (startAfterDate) {
        const after = new Date(startAfterDate);
        if (after > calcStart) calcStart = after;
    }
    let calcEnd = new Date(endDate);
    if (endBeforeDate) {
        const before = new Date(endBeforeDate);
        if (before < calcEnd) calcEnd = before;
    }
    const maxEnd = new Date(calcStart.getTime() + 90 * 24 * 60 * 60 * 1000);
    if (maxEnd < calcEnd) calcEnd = maxEnd;

    const startMs =
        startDate.getHours() * 3600000 +
        startDate.getMinutes() * 60000 +
        startDate.getSeconds() * 1000;
    const endMs =
        endDate.getHours() * 3600000 +
        endDate.getMinutes() * 60000 +
        endDate.getSeconds() * 1000;
    const durationMs = endMs - startMs;

    let upcomingDates = [];

    switch (ruleNum) {
        case 1:
            return { isRecurring: false, upcomingDates: [] };
        case 2: // multi-day
            {
                const days = Math.ceil(
                    (endDate - startDate) / (1000 * 60 * 60 * 24)
                );
                let startI = 0;
                if (calcStart >= startDate) {
                    const diffDays = Math.floor((calcStart - startDate) / (1000 * 60 * 60 * 24));
                    startI = diffDays + 1;
                }
                for (let i = startI; i < days; i++) {
                    const s = addDays(startDate, i);
                    if (s > calcEnd) break;
                    const e = new Date(s.getTime() + durationMs);
                    upcomingDates.push({
                        startDate: getDateInFormate(s),
                        endDate: getDateInFormate(e),
                    });
                }
            }
            break;
        case 3: // weekly on same weekday
            {
                let interval = parseInt(rule.interval);
                if (isNaN(interval) || interval <= 0) interval = 7;
                const weekday = startDate.getDay();
                let current = new Date(calcStart);
                const firstDate = getNextWeekday(current, weekday);
                if (firstDate <= calcEnd) {
                    const s = new Date(firstDate);
                    s.setHours(
                        startDate.getHours(),
                        startDate.getMinutes(),
                        startDate.getSeconds()
                    );
                    const e = new Date(s.getTime() + durationMs);
                    upcomingDates.push({
                        startDate: getDateInFormate(s),
                        endDate: getDateInFormate(e),
                    });
                    current = addDays(firstDate, interval);
                    while (upcomingDates.length < 10 && current <= calcEnd) {
                        const s2 = new Date(current);
                        s2.setHours(
                            startDate.getHours(),
                            startDate.getMinutes(),
                            startDate.getSeconds()
                        );
                        const e2 = new Date(s2.getTime() + durationMs);
                        upcomingDates.push({
                            startDate: getDateInFormate(s2),
                            endDate: getDateInFormate(e2),
                        });
                        current = addDays(current, interval);
                    }
                }
            }
            break;
        case 4: // bi-weekly on same weekday
            {
                let interval = parseInt(rule.interval);
                if (isNaN(interval) || interval <= 0) interval = 14;
                const weekday = startDate.getDay();
                let current = new Date(calcStart);
                const firstDate = getNextWeekday(current, weekday);
                if (firstDate <= calcEnd) {
                    const s = new Date(firstDate);
                    s.setHours(
                        startDate.getHours(),
                        startDate.getMinutes(),
                        startDate.getSeconds()
                    );
                    const e = new Date(s.getTime() + durationMs);
                    upcomingDates.push({
                        startDate: getDateInFormate(s),
                        endDate: getDateInFormate(e),
                    });
                    current = addDays(firstDate, interval);
                    while (upcomingDates.length < 10 && current <= calcEnd) {
                        const s2 = new Date(current);
                        s2.setHours(
                            startDate.getHours(),
                            startDate.getMinutes(),
                            startDate.getSeconds()
                        );
                        const e2 = new Date(s2.getTime() + durationMs);
                        upcomingDates.push({
                            startDate: getDateInFormate(s2),
                            endDate: getDateInFormate(e2),
                        });
                        current = addDays(current, interval);
                    }
                }
            }
            break;
        case 5: // first weekday of month
            {
                const weekday = startDate.getDay();
                let currentYear = calcStart.getFullYear();
                let currentMonth = calcStart.getMonth();
                while (upcomingDates.length < 10) {
                    const date = getFirstWeekdayInMonth(
                        currentYear,
                        currentMonth,
                        weekday
                    );
                    if (date > calcEnd) break;
                    if (date >= calcStart) {
                        const s = new Date(date);
                        s.setHours(
                            startDate.getHours(),
                            startDate.getMinutes(),
                            startDate.getSeconds()
                        );
                        const e = new Date(s.getTime() + durationMs);
                        upcomingDates.push({
                            startDate: getDateInFormate(s),
                            endDate: getDateInFormate(e),
                        });
                    }
                    currentMonth++;
                    if (currentMonth > 11) {
                        currentMonth = 0;
                        currentYear++;
                    }
                }
            }
            break;
        case 6: // every 1st of month
            {
                let currentYear = calcStart.getFullYear();
                let currentMonth = calcStart.getMonth();
                while (upcomingDates.length < 10) {
                    const date = new Date(currentYear, currentMonth, 1);
                    if (date > calcEnd) break;
                    if (date >= calcStart) {
                        const s = new Date(date);
                        s.setHours(
                            startDate.getHours(),
                            startDate.getMinutes(),
                            startDate.getSeconds()
                        );
                        const e = new Date(s.getTime() + durationMs);
                        upcomingDates.push({
                            startDate: getDateInFormate(s),
                            endDate: getDateInFormate(e),
                        });
                    }
                    currentMonth++;
                    if (currentMonth > 11) {
                        currentMonth = 0;
                        currentYear++;
                    }
                }
            }
            break;
        case 7: // every last day of month
            {
                let currentYear = calcStart.getFullYear();
                let currentMonth = calcStart.getMonth();
                while (upcomingDates.length < 10) {
                    const date = new Date(currentYear, currentMonth + 1, 0);
                    if (date > calcEnd) break;
                    if (date >= calcStart) {
                        const s = new Date(date);
                        s.setHours(
                            startDate.getHours(),
                            startDate.getMinutes(),
                            startDate.getSeconds()
                        );
                        const e = new Date(s.getTime() + durationMs);
                        upcomingDates.push({
                            startDate: getDateInFormate(s),
                            endDate: getDateInFormate(e),
                        });
                    }
                    currentMonth++;
                    if (currentMonth > 11) {
                        currentMonth = 0;
                        currentYear++;
                    }
                }
            }
            break;
        case 8: // every xth day of month
            {
                const day = startDate.getDate();
                let currentYear = calcStart.getFullYear();
                let currentMonth = calcStart.getMonth();
                while (upcomingDates.length < 10) {
                    const date = new Date(currentYear, currentMonth, day);
                    if (date > calcEnd) break;
                    if (date >= calcStart) {
                        const s = new Date(date);
                        s.setHours(
                            startDate.getHours(),
                            startDate.getMinutes(),
                            startDate.getSeconds()
                        );
                        const e = new Date(s.getTime() + durationMs);
                        upcomingDates.push({
                            startDate: getDateInFormate(s),
                            endDate: getDateInFormate(e),
                        });
                    }
                    currentMonth++;
                    if (currentMonth > 11) {
                        currentMonth = 0;
                        currentYear++;
                    }
                }
            }
            break;
    }

    if (metadata.exceptions && Array.isArray(metadata.exceptions)) {
        const exceptionDates = new Set(
            metadata.exceptions.map((ex) => ex.exceptionDate.split(" ")[0])
        );
        upcomingDates = upcomingDates.filter(
            (date) => !exceptionDates.has(date.startDate.split(" ")[0])
        );
    }

    return { isRecurring: ruleNum !== 1, upcomingDates };
}

function addDays(date, days) {
    const d = new Date(date);
    d.setDate(d.getDate() + days);
    return d;
}

function getFirstWeekdayInMonth(year, month, weekday) {
    const date = new Date(year, month, 1);
    const day = date.getDay();
    const diff = (weekday - day + 7) % 7;
    date.setDate(date.getDate() + diff);
    return date;
}

function getNextWeekday(date, weekday) {
    const d = new Date(date);
    const currentDay = d.getDay();
    let diff = weekday - currentDay;
    if (diff <= 0) diff += 7;
    d.setDate(d.getDate() + diff);
    return d;
}

module.exports = calculateRecurrence;
