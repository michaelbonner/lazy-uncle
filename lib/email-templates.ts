const brand = {
  paper: "#f7f3eb",
  cream: "#fffdf8",
  green: "#24483e",
  ink: "#263a32",
  muted: "#64736b",
  rule: "#e4ded1",
};

export function escapeHtml(value: string): string {
  return value.replace(/[&<>"']/g, (character) => {
    const entities: Record<string, string> = {
      "&": "&amp;",
      "<": "&lt;",
      ">": "&gt;",
      '"': "&quot;",
      "'": "&#39;",
    };
    return entities[character];
  });
}

function siteUrl(path: string): string {
  return new URL(
    path,
    process.env.BETTER_AUTH_URL ?? "https://www.lazyuncle.net",
  ).toString();
}

function paragraph(content: string): string {
  return `<p style="margin:0 0 20px;color:${brand.ink};font:16px/1.65 Arial,Helvetica,sans-serif;">${content}</p>`;
}

function detail(label: string, value: string): string {
  return `<tr><td style="padding:8px 14px 8px 0;color:${brand.muted};font:14px/1.5 Arial,Helvetica,sans-serif;vertical-align:top;white-space:nowrap;">${label}</td><td style="padding:8px 0;color:${brand.ink};font:15px/1.5 Arial,Helvetica,sans-serif;overflow-wrap:anywhere;">${escapeHtml(value)}</td></tr>`;
}

function panel(content: string): string {
  return `<table role="presentation" cellpadding="0" cellspacing="0" width="100%" style="margin:4px 0 24px;border:1px solid ${brand.rule};border-radius:10px;background:${brand.cream};"><tr><td style="padding:16px 20px;">${content}</td></tr></table>`;
}

function button(label: string, url: string): string {
  return `<table role="presentation" cellpadding="0" cellspacing="0" style="margin:8px 0 24px;"><tr><td style="border-radius:7px;background:${brand.green};"><a href="${escapeHtml(url)}" style="display:inline-block;padding:14px 22px;color:#ffffff;font:600 16px/1.3 Arial,Helvetica,sans-serif;text-decoration:none;">${label}</a></td></tr></table>`;
}

function layout({
  preheader,
  title,
  body,
  footer,
}: {
  preheader: string;
  title: string;
  body: string;
  footer?: { description: string; unsubscribeUrl: string };
}): string {
  const logoUrl = siteUrl("/lazy-uncle-email.png");
  const homeUrl = siteUrl("/");
  return `<!doctype html>
<html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><meta name="color-scheme" content="light"><title>${escapeHtml(title)} | Lazy Uncle</title></head>
<body style="margin:0;padding:0;background:${brand.paper};">
<span style="display:none!important;visibility:hidden;opacity:0;height:0;width:0;overflow:hidden;mso-hide:all;">${escapeHtml(preheader)}</span>
<table role="presentation" cellpadding="0" cellspacing="0" width="100%" style="background:${brand.paper};"><tr><td align="center" style="padding:28px 12px 40px;">
<table role="presentation" cellpadding="0" cellspacing="0" width="100%" style="max-width:600px;border:1px solid ${brand.rule};border-radius:12px;background:#ffffff;">
<tr><td style="padding:28px 28px 22px;border-bottom:1px solid ${brand.rule};"><a href="${escapeHtml(homeUrl)}" style="text-decoration:none;"><img src="${escapeHtml(logoUrl)}" width="190" height="57" alt="Lazy Uncle" style="display:block;width:190px;height:auto;border:0;color:${brand.green};font:600 22px Arial,Helvetica,sans-serif;"></a></td></tr>
<tr><td style="padding:30px 28px 12px;"><h1 style="margin:0 0 20px;color:${brand.green};font:normal 32px/1.2 Georgia,'Times New Roman',serif;">${escapeHtml(title)}</h1>${body}</td></tr>
<tr><td style="padding:20px 28px 28px;border-top:1px solid ${brand.rule};color:${brand.muted};font:13px/1.6 Arial,Helvetica,sans-serif;">${footer ? `${escapeHtml(footer.description)} <a href="${escapeHtml(footer.unsubscribeUrl)}" style="color:${brand.green};text-decoration:underline;">Unsubscribe</a><br><br>` : ""}<a href="${escapeHtml(homeUrl)}" style="color:${brand.green};text-decoration:none;">Lazy Uncle</a></td></tr>
</table></td></tr></table></body></html>`;
}

export function magicLinkEmail(url: string): { html: string; text: string } {
  const text = `Sign in to Lazy Uncle: ${url}\n\nThis link expires in 5 minutes and can only be used once. If you didn't request this, you can safely ignore this email.`;
  const html = layout({
    preheader: "Your secure sign-in link is ready. It expires in 5 minutes.",
    title: "Your sign-in link",
    body: `${paragraph("Use this link to sign in to Lazy Uncle. It expires in 5 minutes and can only be used once.")}${button("Sign in to Lazy Uncle", url)}${paragraph(`If the button doesn't work, copy this link into your browser:<br><a href="${escapeHtml(url)}" style="color:${brand.green};overflow-wrap:anywhere;word-break:break-all;">${escapeHtml(url)}</a>`)}${paragraph("Didn't request this? You can safely ignore this email.")}`,
  });
  return { html, text };
}

export type SubmissionEmailData = {
  submitterName?: string;
  birthdayName: string;
  birthdayDate: string;
  relationship?: string;
  notes?: string;
  sharingLinkDescription?: string;
};

export function submissionEmail({
  submission,
  userName,
  unsubscribeUrl,
}: {
  submission: SubmissionEmailData;
  userName: string | null | undefined;
  unsubscribeUrl: string;
}): { html: string; text: string } {
  const greeting = userName ? `Hi ${userName}` : "Hello";
  const sender = submission.submitterName
    ? ` from ${submission.submitterName}`
    : "";
  const link = submission.sharingLinkDescription
    ? ` via your “${submission.sharingLinkDescription}” sharing link`
    : "";
  const relationship = submission.relationship
    ? ` (${submission.relationship})`
    : "";
  const text = `${greeting},\n\nYou have a new birthday submission${sender}${link}.\n\nName: ${submission.birthdayName}${relationship}\nDate: ${submission.birthdayDate}${submission.notes ? `\nNotes: ${submission.notes}` : ""}\n\nReview it in your Lazy Uncle dashboard: ${siteUrl("/birthdays")}\n\nUnsubscribe: ${unsubscribeUrl}`;
  const details =
    detail("Name", `${submission.birthdayName}${relationship}`) +
    detail("Date", submission.birthdayDate) +
    (submission.notes ? detail("Notes", submission.notes) : "");
  return {
    html: layout({
      preheader: `${submission.birthdayName} was added through your sharing link.`,
      title: "A birthday to review",
      body: `${paragraph(`${escapeHtml(greeting)},`)}${paragraph(`You have a new birthday submission${sender ? ` from ${escapeHtml(submission.submitterName ?? "")}` : ""}${link ? ` via your “${escapeHtml(submission.sharingLinkDescription ?? "")}” sharing link` : ""}.`)}${panel(`<table role="presentation" cellpadding="0" cellspacing="0" width="100%">${details}</table>`)}${paragraph("Review and import this birthday in your Lazy Uncle dashboard.")}${button("Review submissions", siteUrl("/birthdays"))}`,
      footer: {
        description:
          "You receive these emails because submission notifications are on.",
        unsubscribeUrl,
      },
    }),
    text,
  };
}

export function summaryEmail({
  submissions,
  userName,
  unsubscribeUrl,
}: {
  submissions: SubmissionEmailData[];
  userName: string | null | undefined;
  unsubscribeUrl: string;
}): { html: string; text: string } {
  const count = submissions.length;
  const greeting = userName ? `Hi ${userName}` : "Hello";
  const text = `${greeting},\n\nYou have ${count} new birthday submissions waiting for review.\n\n${submissions.map((item, index) => `${index + 1}. ${item.birthdayName} (${item.birthdayDate})${item.submitterName ? ` from ${item.submitterName}` : ""}`).join("\n")}\n\nReview them in your Lazy Uncle dashboard: ${siteUrl("/birthdays")}\n\nUnsubscribe: ${unsubscribeUrl}`;
  const rows = submissions
    .map(
      (item) =>
        `<tr><td style="padding:12px 0;border-bottom:1px solid ${brand.rule};color:${brand.ink};font:15px/1.5 Arial,Helvetica,sans-serif;"><strong>${escapeHtml(item.birthdayName)}</strong><br><span style="color:${brand.muted};">${escapeHtml(item.birthdayDate)}${item.submitterName ? ` · From ${escapeHtml(item.submitterName)}` : ""}</span></td></tr>`,
    )
    .join("");
  return {
    html: layout({
      preheader: `${count} birthday submissions are waiting for review.`,
      title: `${count} birthday ${count === 1 ? "submission" : "submissions"} to review`,
      body: `${paragraph(`${escapeHtml(greeting)},`)}${paragraph(`You have ${count} new birthday ${count === 1 ? "submission" : "submissions"} waiting for review.`)}${panel(`<table role="presentation" cellpadding="0" cellspacing="0" width="100%">${rows}</table>`)}${button("Review submissions", siteUrl("/birthdays"))}`,
      footer: {
        description: "You receive these emails because daily summaries are on.",
        unsubscribeUrl,
      },
    }),
    text,
  };
}

export function birthdayReminderEmail({
  birthdays,
  userName,
  unsubscribeUrl,
  currentYear,
}: {
  birthdays: Array<{ name: string; year: number | null }>;
  userName: string | null | undefined;
  unsubscribeUrl: string;
  currentYear: number;
}): { html: string; text: string } {
  const count = birthdays.length;
  const greeting = userName ? `Hi ${userName}` : "Hello";
  const birthdayLines = birthdays.map(
    (birthday) =>
      `${birthday.name}${birthday.year == null ? "" : ` (turns ${currentYear - birthday.year})`}`,
  );
  const title =
    count === 1
      ? `${birthdays[0].name}'s birthday is today`
      : `${count} birthdays today`;
  const text = `${greeting},\n\n${title}.\n\n${birthdayLines.map((line, index) => `${index + 1}. ${line}`).join("\n")}\n\nDon't forget to wish them a happy birthday!\n\nUnsubscribe: ${unsubscribeUrl}`;
  const rows = birthdayLines
    .map(
      (line) =>
        `<tr><td style="padding:12px 0;border-bottom:1px solid ${brand.rule};color:${brand.ink};font:15px/1.5 Arial,Helvetica,sans-serif;">${escapeHtml(line)}</td></tr>`,
    )
    .join("");
  return {
    html: layout({
      preheader:
        count === 1
          ? `A reminder for ${birthdays[0].name}'s birthday.`
          : `You have ${count} birthdays to celebrate today.`,
      title,
      body: `${paragraph(`${escapeHtml(greeting)},`)}${paragraph(count === 1 ? "Someone you care about has a birthday today." : "It's a big day for the people you care about.")}${panel(`<table role="presentation" cellpadding="0" cellspacing="0" width="100%">${rows}</table>`)}${paragraph("Don't forget to wish them a happy birthday!")}`,
      footer: {
        description:
          "You receive these emails because birthday reminders are on.",
        unsubscribeUrl,
      },
    }),
    text,
  };
}
