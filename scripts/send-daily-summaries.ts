// bun scripts/send-daily-summaries.ts
import { notificationService } from "../lib/notification-service";

console.log("Running daily summary notifications job...");
await notificationService.processDailySummaryNotifications();
console.log("Done.");
process.exit(0);
