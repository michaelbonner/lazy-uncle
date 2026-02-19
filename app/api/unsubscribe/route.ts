import { notificationPreferences } from "../../../drizzle/schema";
import db from "../../../lib/db";
import {
  type UnsubscribeType,
  verifyUnsubscribeToken,
} from "../../../lib/unsubscribe-token";
import { eq } from "drizzle-orm";
import { NextRequest } from "next/server";

const PREFERENCE_FIELD: Record<
  UnsubscribeType,
  keyof typeof notificationPreferences.$inferInsert
> = {
  submission: "emailNotifications",
  summary: "summaryNotifications",
  reminder: "birthdayReminders",
};

const LABEL: Record<UnsubscribeType, string> = {
  submission: "new submission emails",
  summary: "daily summary emails",
  reminder: "birthday reminder emails",
};

function html(title: string, body: string): Response {
  return new Response(
    `<!doctype html>
<html lang="en">
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1" />
  <title>${title} — Lazy Uncle</title>
  <style>
    body { font-family: system-ui, sans-serif; max-width: 480px; margin: 80px auto; padding: 0 24px; color: #111; }
    h1 { font-size: 1.5rem; margin-bottom: 0.5rem; }
    p  { color: #555; line-height: 1.6; }
    a  { color: #0891b2; }
  </style>
</head>
<body>${body}</body>
</html>`,
    { headers: { "Content-Type": "text/html; charset=utf-8" } },
  );
}

export async function GET(request: NextRequest): Promise<Response> {
  const { searchParams } = request.nextUrl;
  const userId = searchParams.get("userId");
  const type = searchParams.get("type") as UnsubscribeType | null;
  const token = searchParams.get("token");

  if (
    !userId ||
    !type ||
    !token ||
    !["submission", "summary", "reminder"].includes(type)
  ) {
    return html(
      "Invalid link",
      `<h1>Invalid unsubscribe link</h1>
       <p>This link is missing required information. Please use the link directly from your email.</p>`,
    );
  }

  if (!verifyUnsubscribeToken(userId, type, token)) {
    return html(
      "Invalid link",
      `<h1>Invalid unsubscribe link</h1>
       <p>This link is not valid or has been tampered with.</p>`,
    );
  }

  const field = PREFERENCE_FIELD[type];

  try {
    const existing = await db.query.notificationPreferences.findFirst({
      where: eq(notificationPreferences.userId, userId),
    });

    if (existing) {
      await db
        .update(notificationPreferences)
        .set({ [field]: false })
        .where(eq(notificationPreferences.userId, userId));
    }
    // If no preferences row exists the default is already off — nothing to do.
  } catch {
    return html(
      "Something went wrong",
      `<h1>Something went wrong</h1>
       <p>We couldn't process your unsubscribe request. Please try again or adjust your preferences in <a href="${process.env.BETTER_AUTH_URL ?? ""}/settings">Settings</a>.</p>`,
    );
  }

  const label = LABEL[type];
  const settingsUrl = `${process.env.BETTER_AUTH_URL ?? ""}/settings`;

  return html(
    "Unsubscribed",
    `<h1>You've been unsubscribed</h1>
     <p>You will no longer receive ${label} from Lazy Uncle.</p>
     <p>You can re-enable this at any time in your <a href="${settingsUrl}">notification settings</a>.</p>`,
  );
}
