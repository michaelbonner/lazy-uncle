// bun scripts/send-birthday-reminders.ts
import { notificationService } from "../lib/notification-service";

console.log("Running birthday reminder job...");
await notificationService.processUpcomingBirthdayReminders();
console.log("Done.");
process.exit(0);
