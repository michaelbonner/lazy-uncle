import {
  birthdayReminderEmail,
  magicLinkEmail,
  submissionEmail,
  summaryEmail,
} from "./email-templates";
import { describe, expect, it, vi } from "vitest";

describe("branded email templates", () => {
  it("renders the sign-in link with the logo, action, and readable fallback", () => {
    vi.stubEnv("BETTER_AUTH_URL", "https://preview.lazyuncle.net");
    const url = 'https://preview.lazyuncle.net/sign-in?token=one&next="two"';
    const { html, text } = magicLinkEmail(url);

    expect(html).toContain(
      "https://preview.lazyuncle.net/lazy-uncle-email.png",
    );
    expect(html).toContain('alt="Lazy Uncle"');
    expect(html).toContain("Sign in to Lazy Uncle");
    expect(html).toContain("token=one&amp;next=&quot;two&quot;");
    expect(html).toContain("5 minutes");
    expect(text).toContain(url);
    vi.unstubAllEnvs();
  });

  it("escapes user content in submission and summary HTML", () => {
    const submission = {
      birthdayName: '<img src=x onerror="alert(1)">',
      birthdayDate: "May 10",
      submitterName: "Sam & Pat",
      notes: "<script>alert(1)</script>",
      sharingLinkDescription: "Friends & family",
    };
    const unsubscribeUrl =
      "https://www.lazyuncle.net/unsubscribe?token=a&kind=submission";
    const single = submissionEmail({
      submission,
      userName: "Alex <Admin>",
      unsubscribeUrl,
    });
    const summary = summaryEmail({
      submissions: [submission],
      userName: "Alex <Admin>",
      unsubscribeUrl,
    });

    for (const email of [single, summary]) {
      expect(email.html).toContain("Alex &lt;Admin&gt;");
      expect(email.html).toContain(
        "&lt;img src=x onerror=&quot;alert(1)&quot;&gt;",
      );
      expect(email.html).not.toContain("<script>");
      expect(email.html).toContain("token=a&amp;kind=submission");
      expect(email.text).toContain(submission.birthdayName);
    }
    expect(single.html).toContain("&lt;script&gt;alert(1)&lt;/script&gt;");
    expect(summary.html).toContain("Sam &amp; Pat");
  });

  it("renders one or multiple birthday reminders with unsubscribe links", () => {
    const single = birthdayReminderEmail({
      birthdays: [{ name: "Lee", year: 1990 }],
      userName: null,
      unsubscribeUrl: "https://example.com/stop",
      currentYear: 2026,
    });
    const multiple = birthdayReminderEmail({
      birthdays: [
        { name: "Lee", year: 1990 },
        { name: "Jo", year: null },
      ],
      userName: "Alex",
      unsubscribeUrl: "https://example.com/stop",
      currentYear: 2026,
    });

    expect(single.html).toContain("Lee&#39;s birthday is today");
    expect(single.html).toContain("turns 36");
    expect(multiple.html).toContain("2 birthdays today");
    expect(multiple.html).toContain("Jo");
    expect(single.html).toContain("Unsubscribe");
    expect(multiple.text).toContain("https://example.com/stop");
  });
});
