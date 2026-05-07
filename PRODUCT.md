# Product

## Register

brand

## Users

Adults — parents, aunts, uncles, partners, friends — who want to keep track of birthdays for the people they love without taking on yet another productivity tool. Think of the user signing up at the kitchen table after forgetting a niece's birthday for the second year running, or the family member trying to consolidate dates that currently live across Apple Calendar, a Notes file, and their head.

The job to be done: "stop forgetting birthdays, and make remembering feel low-effort and pleasant — not like another inbox." Many users will share their list with relatives so that elders, partners, and adult children can contribute dates without needing an account.

Primary contexts:
- Phone, on the couch — adding a date they just learned about
- Desktop, occasional sit-down — bulk import, sharing setup
- Email — receiving a reminder; sometimes deciding what to buy as a result

Audience skews wide on age and tech comfort because the share-link surface is filled in by extended family, including older relatives. Plain-English copy and obvious affordances matter more than density.

## Product Purpose

Lazy Uncle is a free, ad-free birthday reminder app. The product exists because every general-purpose tool (calendars, note apps, social networks) handles birthdays incidentally and badly: they bury the date, demand a year, can't be shared without giving up an account, or push noise the rest of the year.

Success looks like a user who:
- adds dates once, in under a minute
- shares a private link with a few relatives who actually use it
- gets a calm reminder a few days before each birthday and acts on it
- never thinks about the app between reminders

The brand surface (this home page, marketing pages) exists to convert that audience without overselling. The app surface (`/birthdays/*`) gets out of the way.

## Brand Personality

**Calm, warm, low-effort.**

- **Voice**: friendly and human, never breathless. Plain English. The product is named "Lazy Uncle" — leaning into ease, slight self-deprecation, and family warmth. Avoid hype words, avoid productivity-jargon ("workflow", "supercharge", "powered by"), avoid emoji.
- **Emotional goal**: relief. The user's nervous system should drop a notch when they land. The product carries the load so they don't have to.
- **Tone references in current copy that work**: "calm, beautiful place", "gentle nudges", "fewer forgotten birthdays, more joyful ones". Tone references that should be cut: anything that sounds like a SaaS landing page (e.g. "Reminders that just work", capability flexing).

Positive aesthetic references:
- **Cron / Notion Calendar / Fey** — modern personal tools with careful spacing, cinematic restraint, no gimmicks
- **Things 3 / Bear / Day One** — calm consumer apps designed for individuals, slightly editorial, deeply anti-enterprise

## Anti-references

Three explicit lanes to avoid. If the home page starts feeling like any of these, rework it.

1. **Dense SaaS dashboards (Notion, Asana, Monday-style marketing).** Sidebars stuffed with icons, three-column feature grids of identical cards, "10x your productivity" energy. Lazy Uncle is the opposite of a productivity tool — it should feel like personal infrastructure, not a workspace.
2. **Greeting-card / Hallmark / cutesy birthday-app cliché.** No cartoon balloons, no confetti showers as a design crutch, no twee illustrations, no comic-style typography. Warmth comes from copy and color, not decoration.
3. **Social network / engagement-bait feeds.** No Facebook-style birthday wall, no "X people have a birthday today!" notification spam, no streaks or gamification. The product is deliberately quiet between reminders.

Soft anti-reference (not user-flagged but worth noting because the home page currently leans this way): the **gen-AI SaaS template** — dark slate hero with teal radial glow, glassmorphic feature cards, identical 3-column feature grids, animated cards floating in. The aesthetic isn't itself banned, but if it becomes indistinguishable from every AI-product launch this quarter, the brand has failed to differentiate.

## Design Principles

1. **Quiet earns trust.** The product asks people to trust it with personal relationships. Loud design (gradient text, big glow, emphatic CTAs everywhere) reads as the opposite of the promise. Whitespace, restraint, and a single confident color choice signal that the product knows what it is.
2. **Earn the name "lazy."** Every visible action should feel like it took the user no effort to get there. If the home page itself looks effortful — multiple competing CTAs, dense feature grids — the brand contradicts the product.
3. **Personal, not productive.** The frame of reference is "thing my family uses" not "tool my team adopts." Pull from consumer-app vocabulary (warmth, individual voice, light editorial flourishes) before SaaS-marketing vocabulary (feature lists, benefit pills, social proof bars).
4. **Show one birthday well.** The product is fundamentally about a small, intimate list. Marketing surfaces should treat that list as the hero — a single beautifully-rendered upcoming-birthday moment will sell harder than a feature grid will.
5. **Trust comes from what's missing.** "Free forever, no ads, no upselling" is a promise the design itself must honor. No popups, no email-capture before value, no fake urgency, no dark patterns. The home page should be one of the most restrained things the user has seen on the web that day.

## Accessibility & Inclusion

Target: **WCAG 2.2 AA** as a baseline.

- Contrast ratio ≥ 4.5:1 for body text, ≥ 3:1 for large text and UI controls. Audit cyan-on-slate combinations carefully — current home page uses several `text-cyan-100/70` and `text-cyan-50/80` values on dark surfaces that need verification.
- Visible focus indicators on every interactive element (current `focus:ring-cyan-200/80` is a good start; verify it appears on keyboard-only nav).
- Respect `prefers-reduced-motion` — current hero/card/feature animations should disable cleanly.
- Audience includes older relatives via the share link surface. Default font sizes should not feel small on a phone held at arm's length; avoid going below 14px for any non-decorative text.
- Form fields must have associated labels (current MagicLinkForm uses `sr-only` label — good).
- Color is never the sole signaling channel for state (status, errors, alerts).
