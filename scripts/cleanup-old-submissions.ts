// bun scripts/cleanup-old-submissions.ts
import { SubmissionService } from "../lib/submission-service";

console.log("Running old submissions cleanup job...");
const cleaned = await SubmissionService.cleanupOldRejectedSubmissions(30);
console.log(`Done. Cleaned up ${cleaned} old rejected submission(s).`);
process.exit(0);
