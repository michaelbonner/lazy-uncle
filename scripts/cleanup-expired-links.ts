// bun scripts/cleanup-expired-links.ts
import { SharingService } from "../lib/sharing-service";

console.log("Running expired links cleanup job...");
const cleaned = await SharingService.cleanupExpiredLinks();
console.log(`Done. Cleaned up ${cleaned} expired sharing link(s).`);
process.exit(0);
