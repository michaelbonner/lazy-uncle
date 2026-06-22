import { router } from "../trpc";
import { birthdayRouter } from "./birthday";
import { notificationRouter } from "./notification";
import { sharingRouter } from "./sharing";
import { submissionRouter } from "./submission";

export const appRouter = router({
  birthday: birthdayRouter,
  sharing: sharingRouter,
  submission: submissionRouter,
  notification: notificationRouter,
});

export type AppRouter = typeof appRouter;
