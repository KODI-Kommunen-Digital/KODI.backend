const cron = require("node-cron");
const { callQuery } = require("./database");
const reportEmail = require("../emailTemplates/de/userReportEmail");
const sendMail = require("./sendMail");

const IS_REPORT_CRON_ENABLED = process.env.IS_REPORT_CRON_ENABLED === "True";
const REPORT_CRON_SCHEDULE = process.env.REPORT_CRON_SCHEDULE;
const CRON_REPORT_EMAIL = process.env.CRON_REPORT_EMAIL;

if (IS_REPORT_CRON_ENABLED) {
    console.log("email cron started with schedule:", REPORT_CRON_SCHEDULE);
    cron.schedule(REPORT_CRON_SCHEDULE, async () => {
        try {
            const data = await callQuery(
                "SELECT count(*) as total FROM users where roleId <> 1"
            );
            const { subject, body } = reportEmail(data.rows[0].total);
            console.log("data", data.rows[0].total, subject, body);

            await sendMail(CRON_REPORT_EMAIL, subject, null, body);
            console.log("User report email sent successfully");
        } catch (error) {
            console.error("Error sending email:", error);
        }
    });
}
