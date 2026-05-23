import Link from "next/link";
import { NextPage } from "next";
import {
  HiOutlineCake,
  HiOutlineCalendar,
  HiOutlineLink,
  HiOutlineMail,
} from "react-icons/hi";
import MainLayout from "../components/layout/MainLayout";

const SharingPreview = () => {
  return (
    <figure className="relative mx-auto w-full max-w-md lg:mx-0 lg:max-w-none">
      <div className="rounded-xl border border-rule bg-paper px-7 py-8 md:px-9 md:py-10">
        <div className="flex items-center justify-between border-b border-rule pb-4">
          <span className="inline-flex items-center gap-2 font-sans text-sm text-ink-soft">
            <HiOutlineLink className="h-4 w-4" aria-hidden />
            Private link
          </span>
          <span className="font-sans text-xs text-ink-muted">
            Expires in 7 days
          </span>
        </div>
        <p className="mt-6 font-mono text-sm text-ink-soft break-all">
          lazyuncle.net/share/aL7…q9X
        </p>
        <div className="mt-6 space-y-3 border-t border-rule pt-6">
          <div className="flex items-baseline justify-between">
            <p className="font-display text-lg text-ink">From Mom</p>
            <p className="font-sans text-xs text-ink-muted">Just now</p>
          </div>
          <p className="font-sans text-sm text-ink-soft">
            <span className="text-ink">Cousin Theo</span> — March 14
          </p>
          <p className="font-sans text-sm text-ink-soft">
            <span className="text-ink">Aunt Patrice</span> — November 2, 1962
          </p>
        </div>
      </div>
    </figure>
  );
};

const ReminderPreview = () => {
  return (
    <figure className="relative mx-auto w-full max-w-md lg:mx-0 lg:max-w-none">
      <div className="rounded-xl border border-rule bg-paper px-7 py-8 md:px-9 md:py-10">
        <div className="flex items-center justify-between border-b border-rule pb-4">
          <span className="inline-flex items-center gap-2 font-sans text-sm text-ink-soft">
            <HiOutlineMail className="h-4 w-4" aria-hidden />
            Sample reminder
          </span>
          <span className="font-sans text-sm text-ink-muted">in 3 days</span>
        </div>
        <p className="mt-6 font-display text-5xl font-semibold leading-[1.05] text-balance text-ink md:text-6xl">
          Theo
        </p>
        <p className="mt-3 font-sans text-base text-ink-soft md:text-lg">
          turns 12 on Tuesday, March 14.
        </p>
        <p className="mt-6 font-display text-base italic text-ink-soft md:text-lg">
          Reading the Wings of Fire series.
        </p>
        <p className="mt-8 font-sans text-sm text-ink-muted">
          Arrives at 9:00 a.m. your time.
        </p>
      </div>
    </figure>
  );
};

const NoYearPreview = () => {
  return (
    <figure className="relative mx-auto w-full max-w-md lg:mx-0 lg:max-w-none">
      <div className="rounded-xl border border-rule bg-paper px-7 py-8 md:px-9 md:py-10">
        <div className="flex items-center justify-between border-b border-rule pb-4">
          <span className="inline-flex items-center gap-2 font-sans text-sm text-ink-soft">
            <HiOutlineCake className="h-4 w-4" aria-hidden />
            Avery
          </span>
          <span className="font-sans text-xs text-ink-muted">
            Year unknown
          </span>
        </div>
        <p className="mt-6 font-display text-5xl font-semibold leading-[1.05] text-balance text-ink md:text-6xl">
          May 9
        </p>
        <p className="mt-3 font-sans text-base text-ink-soft md:text-lg">
          Celebrate every year.
        </p>
        <p className="mt-8 font-sans text-sm text-ink-muted">
          We&rsquo;ll skip the age and just remind you in time.
        </p>
      </div>
    </figure>
  );
};

const CalendarPreview = () => {
  const days = [
    { num: 1, label: null },
    { num: 2, label: null },
    { num: 3, label: null },
    { num: 4, label: "Theo" },
    { num: 5, label: null },
    { num: 6, label: null },
    { num: 7, label: null },
    { num: 8, label: null },
    { num: 9, label: "Avery" },
    { num: 10, label: null },
    { num: 11, label: null },
    { num: 12, label: null },
    { num: 13, label: null },
    { num: 14, label: null },
  ];
  return (
    <figure className="relative mx-auto w-full max-w-md lg:mx-0 lg:max-w-none">
      <div className="rounded-xl border border-rule bg-paper px-7 py-8 md:px-9 md:py-10">
        <div className="flex items-center justify-between border-b border-rule pb-4">
          <span className="inline-flex items-center gap-2 font-sans text-sm text-ink-soft">
            <HiOutlineCalendar className="h-4 w-4" aria-hidden />
            May 2026
          </span>
          <span className="font-sans text-xs text-ink-muted">
            Birthdays · subscribed
          </span>
        </div>
        <div className="mt-6 grid grid-cols-7 gap-1 text-center font-sans text-xs text-ink-muted">
          {["S", "M", "T", "W", "T", "F", "S"].map((d, i) => (
            <div key={`${d}-${i}`} className="pb-2">
              {d}
            </div>
          ))}
          {days.map((day) => (
            <div
              key={day.num}
              className="aspect-square rounded-md border border-rule/60 p-1 text-left"
            >
              <div className="text-[10px] text-ink-muted">{day.num}</div>
              {day.label && (
                <div className="mt-0.5 truncate rounded bg-accent/10 px-1 py-0.5 text-[10px] font-medium text-accent-deep">
                  {day.label}
                </div>
              )}
            </div>
          ))}
        </div>
        <p className="mt-6 font-sans text-sm text-ink-muted">
          Subscribe once. Birthdays show up everywhere your calendar lives.
        </p>
      </div>
    </figure>
  );
};

type FeatureBlockProps = {
  eyebrow: string;
  title: string;
  paragraphs: string[];
  bullets?: string[];
  visual: React.ReactNode;
  reverse?: boolean;
};

const FeatureBlock = ({
  eyebrow,
  title,
  paragraphs,
  bullets,
  visual,
  reverse,
}: FeatureBlockProps) => {
  return (
    <div
      className={`grid gap-12 lg:grid-cols-12 lg:gap-16 ${
        reverse ? "lg:[&>*:first-child]:order-2" : ""
      }`}
    >
      <div className="lg:col-span-6">
        <p className="font-sans text-sm uppercase tracking-[0.18em] text-ink-muted">
          {eyebrow}
        </p>
        <h2 className="mt-3 font-display text-3xl font-semibold leading-tight text-balance text-ink md:text-4xl">
          {title}
        </h2>
        <div className="mt-6 space-y-5 font-sans text-lg leading-relaxed text-ink-soft">
          {paragraphs.map((p, i) => (
            <p key={i}>{p}</p>
          ))}
        </div>
        {bullets && (
          <ul className="mt-6 space-y-3 font-sans text-base text-ink-soft">
            {bullets.map((b) => (
              <li key={b} className="flex items-start gap-3">
                <span
                  aria-hidden
                  className="mt-2 inline-block h-1.5 w-1.5 flex-none rounded-full bg-accent"
                />
                <span>{b}</span>
              </li>
            ))}
          </ul>
        )}
      </div>
      <div className="lg:col-span-6">{visual}</div>
    </div>
  );
};

const FeaturesPage: NextPage = () => {
  return (
    <MainLayout
      title="Features | Lazy Uncle: Simple Free Birthday Reminder App"
      description="Sharing links without sign-ups, gentle email reminders, birthdays without years, and a calendar feed that follows you everywhere. Everything Lazy Uncle does, and nothing it doesn't."
    >
      <main className="font-sans text-ink">
        <section className="mx-auto max-w-4xl px-6 pt-12 pb-16 md:px-12 md:pt-20 md:pb-24">
          <p className="font-sans text-sm uppercase tracking-[0.18em] text-ink-muted">
            Features
          </p>
          <h1 className="mt-3 font-display text-4xl font-semibold leading-[1.08] text-balance text-ink md:text-5xl lg:text-[3.5rem]">
            Everything Lazy Uncle does, on purpose.
          </h1>
          <p className="mt-6 max-w-2xl font-sans text-lg leading-relaxed text-ink-soft md:text-xl">
            A short list, deliberately. Lazy Uncle does four things well so you
            never have to apologize for forgetting a birthday again. No
            timelines, no streaks, no AI nudging you to do more.
          </p>
        </section>

        <section className="border-t border-rule bg-paper-deep">
          <div className="mx-auto max-w-6xl px-6 py-20 md:px-12 md:py-28">
            <FeatureBlock
              eyebrow="Sharing"
              title="One private link. No sign-up for anyone else."
              paragraphs={[
                "Most family birthdays live in one person's head, your mom, your partner, the sibling with the better memory. Send them a private link and they can add dates straight from their phone. No account, no app, no password reset to talk them through.",
                "Submissions land in your review queue. You approve them, edit a date, or skip the ones you already know about.",
              ]}
              bullets={[
                "Cryptographically secure tokens, expire after 7 days by default",
                "Built-in duplicate detection so the same birthday doesn't land twice",
                "Rate-limited and bot-protected, so your link can be shared freely",
              ]}
              visual={<SharingPreview />}
            />
          </div>
        </section>

        <section className="border-t border-rule">
          <div className="mx-auto max-w-6xl px-6 py-20 md:px-12 md:py-28">
            <FeatureBlock
              eyebrow="Reminders"
              title="A calm email a few days before. That's it."
              paragraphs={[
                "Lazy Uncle sends one email, in your time zone, ahead of the day, with a name, a date, and any note you left for yourself. No push notifications at midnight. No pop-ups in the corner of your laptop. No second reminder if you already opened the first.",
                "If you'd rather see the whole week at once, switch to a daily summary instead. Same calm tone, one email a day.",
              ]}
              bullets={[
                "Send time defaults to 9:00 a.m. local",
                "Individual or daily-summary mode, your choice",
                "Includes age, zodiac, and the notes you've kept",
              ]}
              visual={<ReminderPreview />}
              reverse
            />
          </div>
        </section>

        <section className="border-t border-rule bg-paper-deep">
          <div className="mx-auto max-w-6xl px-6 py-20 md:px-12 md:py-28">
            <FeatureBlock
              eyebrow="No year required"
              title="Some birthdays are a month and a day. That's allowed."
              paragraphs={[
                "Half the people in your life would rather you didn't know exactly how old they are, and the other half you just don't remember the year for. Lazy Uncle treats the year as optional. Add a name and a date, skip the rest, and the reminder still arrives on time.",
                "When the year is there, you'll see the age and the zodiac sign quietly alongside. When it isn't, nothing is missing, just the reminder you came for.",
              ]}
              visual={<NoYearPreview />}
            />
          </div>
        </section>

        <section className="border-t border-rule">
          <div className="mx-auto max-w-6xl px-6 py-20 md:px-12 md:py-28">
            <FeatureBlock
              eyebrow="Calendar feed"
              title="Birthdays show up wherever your calendar already lives."
              paragraphs={[
                "Subscribe once with the iCal link Lazy Uncle gives you and every birthday on your list appears in Google Calendar, Apple Calendar, Outlook, or anything else that speaks the standard. When you add a new person, the feed updates on its own.",
                "It's a one-way subscription, so the birthdays stay tidy in their own calendar layer rather than mixed in with your meetings.",
              ]}
              bullets={[
                "Standard iCal format, works with every major calendar",
                "Updates automatically when you add or edit birthdays",
                "Keeps recurring annually with no year, when there isn't one",
              ]}
              visual={<CalendarPreview />}
              reverse
            />
          </div>
        </section>

        <section className="border-t border-rule">
          <div className="mx-auto max-w-2xl px-6 py-20 text-center md:px-12 md:py-24">
            <p className="font-display text-2xl font-medium leading-snug text-ink md:text-3xl">
              Four features. None of them in your way.
            </p>
            <p className="mt-4 font-sans text-base text-ink-soft md:text-lg">
              Free forever. No credit card. Sign in and your list starts
              instantly.
            </p>
            <div className="mt-8 flex flex-col items-center gap-3 sm:flex-row sm:justify-center">
              <Link
                href="/"
                className="inline-flex items-center justify-center rounded-md bg-accent px-6 py-3 font-medium text-white transition hover:bg-accent-deep focus:outline-hidden focus:ring-2 focus:ring-accent/40 focus:ring-offset-2 focus:ring-offset-paper"
              >
                Start your list
              </Link>
              <Link
                href="/how-it-works"
                className="inline-flex items-center justify-center rounded-md border border-rule px-6 py-3 font-medium text-ink transition hover:border-accent hover:text-accent-deep focus:outline-hidden focus:ring-2 focus:ring-accent/30 focus:ring-offset-2 focus:ring-offset-paper"
              >
                See how it works
              </Link>
            </div>
          </div>
        </section>
      </main>
    </MainLayout>
  );
};

export default FeaturesPage;
