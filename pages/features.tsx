import MainLayout from "../components/layout/MainLayout";
import { NextPage } from "next";
import Link from "next/link";
import {
  HiOutlineCake,
  HiOutlineCalendar,
  HiOutlineLink,
  HiOutlineMail,
} from "react-icons/hi";

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
          <span className="font-sans text-xs text-ink-muted">Year unknown</span>
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
  number: string;
  eyebrow: string;
  title: string;
  paragraphs: string[];
  visual: React.ReactNode;
  reverse?: boolean;
};

const FeatureBlock = ({
  number,
  eyebrow,
  title,
  paragraphs,
  visual,
  reverse,
}: FeatureBlockProps) => {
  return (
    <div
      className={`grid items-start gap-12 lg:grid-cols-12 lg:gap-20 ${
        reverse ? "lg:[&>*:first-child]:order-2" : ""
      }`}
    >
      <div className="lg:col-span-6">
        <p className="font-sans text-sm font-semibold uppercase tracking-[0.16em] text-accent-deep">
          {number} / {eyebrow}
        </p>
        <h2 className="mt-5 font-display text-4xl leading-[1.12] text-balance text-ink md:text-5xl">
          {title}
        </h2>
        <div className="mt-6 max-w-xl space-y-5 font-sans text-lg/8 text-ink-soft">
          {paragraphs.map((p, i) => (
            <p key={i}>{p}</p>
          ))}
        </div>
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
        <section className="bg-evergreen text-cream">
          <div className="mx-auto grid max-w-7xl gap-8 px-5 py-20 sm:px-8 md:grid-cols-[3fr_2fr] md:items-end md:gap-16 md:py-28 lg:px-12">
            <p className="font-sans text-sm font-semibold uppercase tracking-[0.16em] text-cream/70 md:col-span-2">
              Features
            </p>
            <h1 className="font-display text-5xl leading-[1.06] text-balance sm:text-6xl">
              Just enough birthday help.
            </h1>
            <p className="max-w-xl font-sans text-lg/8 text-cream/85 md:text-xl/9">
              One place for dates, a way for family to help, and a heads-up
              before the day. That&rsquo;s the whole product.
            </p>
          </div>
        </section>

        <section className="border-t border-rule bg-paper-deep">
          <div className="mx-auto max-w-6xl px-6 py-20 md:px-12 md:py-28">
            <FeatureBlock
              number="01"
              eyebrow="Sharing"
              title="One private link. No sign-up for anyone else."
              paragraphs={[
                "Send a private link to the person who remembers every date. They can add birthdays from their phone without creating an account.",
                "You review each submission before it joins your list. Links expire after a week by default.",
              ]}
              visual={<SharingPreview />}
            />
          </div>
        </section>

        <section className="border-t border-rule">
          <div className="mx-auto max-w-6xl px-6 py-20 md:px-12 md:py-28">
            <FeatureBlock
              number="02"
              eyebrow="Reminders"
              title="A calm email a few days before. That's it."
              paragraphs={[
                "An email arrives before the birthday, in your time zone, with the name, date, and note you saved.",
                "You can get individual reminders or switch to a daily summary.",
              ]}
              visual={<ReminderPreview />}
              reverse
            />
          </div>
        </section>

        <section className="border-t border-rule bg-paper-deep">
          <div className="mx-auto max-w-6xl px-6 py-20 md:px-12 md:py-28">
            <FeatureBlock
              number="03"
              eyebrow="No year required"
              title="Some birthdays are a month and a day. That's allowed."
              paragraphs={[
                "Add a name, month, and day. If you don't know the year, leave it blank. The reminder still arrives on time.",
                "When you do know the year, Lazy Uncle can show the age too.",
              ]}
              visual={<NoYearPreview />}
            />
          </div>
        </section>

        <section className="border-t border-rule">
          <div className="mx-auto max-w-6xl px-6 py-20 md:px-12 md:py-28">
            <FeatureBlock
              number="04"
              eyebrow="Calendar feed"
              title="Birthdays show up wherever your calendar already lives."
              paragraphs={[
                "Subscribe to your birthday feed in Apple Calendar, Google Calendar, or Outlook. New dates appear as you add them.",
                "The birthdays live in their own calendar layer, away from your meetings.",
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
