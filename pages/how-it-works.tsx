import Link from "next/link";
import { NextPage } from "next";
import {
  HiOutlineCake,
  HiOutlineLink,
  HiOutlineMail,
  HiOutlineUserAdd,
} from "react-icons/hi";
import MainLayout from "../components/layout/MainLayout";

type Step = {
  index: string;
  eyebrow: string;
  title: string;
  body: string[];
  icon: React.ComponentType<{ className?: string; "aria-hidden"?: boolean }>;
};

const steps: Step[] = [
  {
    index: "01",
    eyebrow: "Sign in",
    title: "Start a list in under a minute.",
    body: [
      "Sign in with Google, GitHub, or a magic link in your email. Your list starts empty and quiet. No onboarding tour you have to click through, no welcome email, no checklist of things you should be doing.",
      "Your data is yours. You can export it or delete the whole account whenever you want.",
    ],
    icon: HiOutlineUserAdd,
  },
  {
    index: "02",
    eyebrow: "Add the people you love",
    title: "Name, date, optional note. That's the form.",
    body: [
      "Type a name. Pick a month and day. Add the year if you know it, skip it if you don't. If you want, leave yourself a one-line note about what they're into right now, the band, the snack, the book series, so future-you has a head start on a gift.",
      "Migrating from a spreadsheet? Upload a CSV and Lazy Uncle will pull the birthdays in for you.",
    ],
    icon: HiOutlineCake,
  },
  {
    index: "03",
    eyebrow: "Share a private link",
    title: "Let the people who remember do the remembering.",
    body: [
      "Every family has one person who knows everyone's birthday by heart. Send them a private link and they can add the dates from their phone, no account, no password, no app to download. Their submissions show up in your review queue.",
      "Approve the ones you want, skip the duplicates, edit what needs editing. Links expire after a week so nothing lingers.",
    ],
    icon: HiOutlineLink,
  },
  {
    index: "04",
    eyebrow: "Be reminded",
    title: "One calm email, a few days before each birthday.",
    body: [
      "When a birthday is coming up, you get an email at 9 a.m. your local time with the person's name, the date, their age (if you have it), and the note you left yourself. Prefer one summary a day instead? Switch it in settings.",
      "If you'd rather not get email at all, subscribe to the iCal feed and birthdays will appear in your calendar of choice.",
    ],
    icon: HiOutlineMail,
  },
];

const StepCard = ({ step, isLast }: { step: Step; isLast: boolean }) => {
  const Icon = step.icon;
  return (
    <div className="relative grid gap-8 lg:grid-cols-12 lg:gap-16">
      <div className="lg:col-span-3">
        <div className="flex items-baseline gap-4">
          <span className="font-display text-5xl font-semibold text-accent md:text-6xl">
            {step.index}
          </span>
          <Icon
            className="hidden h-6 w-6 text-ink-muted lg:block"
            aria-hidden
          />
        </div>
        <p className="mt-3 font-sans text-sm uppercase tracking-[0.18em] text-ink-muted">
          {step.eyebrow}
        </p>
      </div>
      <div className="lg:col-span-9">
        <h2 className="font-display text-3xl font-semibold leading-tight text-balance text-ink md:text-4xl">
          {step.title}
        </h2>
        <div className="mt-5 space-y-4 font-sans text-lg leading-relaxed text-ink-soft">
          {step.body.map((p, i) => (
            <p key={i}>{p}</p>
          ))}
        </div>
        {!isLast && (
          <div
            aria-hidden
            className="mt-14 h-px w-full bg-rule lg:mt-20"
          />
        )}
      </div>
    </div>
  );
};

const HowItWorksPage: NextPage = () => {
  return (
    <MainLayout
      title="How it works | Lazy Uncle: Simple Free Birthday Reminder App"
      description="Sign in, add the people you love, share a private link with the family member who actually remembers, and get a calm email a few days before each birthday."
    >
      <main className="font-sans text-ink">
        <section className="mx-auto max-w-4xl px-6 pt-12 pb-16 md:px-12 md:pt-20 md:pb-24">
          <p className="font-sans text-sm uppercase tracking-[0.18em] text-ink-muted">
            How it works
          </p>
          <h1 className="mt-3 font-display text-4xl font-semibold leading-[1.08] text-balance text-ink md:text-5xl lg:text-[3.5rem]">
            Four small steps. Then it runs itself.
          </h1>
          <p className="mt-6 max-w-2xl font-sans text-lg leading-relaxed text-ink-soft md:text-xl">
            Lazy Uncle is built so the work is mostly upfront, and even that
            isn&rsquo;t much. Here&rsquo;s the whole arc, from the first time
            you sign in to the email that lands a few days before a birthday.
          </p>
        </section>

        <section className="border-t border-rule bg-paper-deep">
          <div className="mx-auto max-w-6xl px-6 py-20 md:px-12 md:py-28">
            <div className="space-y-14 lg:space-y-20">
              {steps.map((step, i) => (
                <StepCard
                  key={step.index}
                  step={step}
                  isLast={i === steps.length - 1}
                />
              ))}
            </div>
          </div>
        </section>

        <section className="border-t border-rule">
          <div className="mx-auto max-w-2xl px-6 py-20 md:px-12 md:py-24">
            <h2 className="font-display text-3xl font-semibold leading-tight text-balance text-ink md:text-4xl">
              A few questions people ask first.
            </h2>
            <dl className="mt-10 divide-y divide-rule border-y border-rule">
              {[
                {
                  q: "Is it really free?",
                  a: "Yes. There is no paid tier and no plan to add one. If you'd like to chip in, there's a sponsor link in the footer, but no part of the app is gated behind it.",
                },
                {
                  q: "Do the people I share with need an account?",
                  a: "No. They open your private link, type a name and date, and they're done. Lazy Uncle does the rest.",
                },
                {
                  q: "What if I don't know someone's birth year?",
                  a: "Leave it blank. The reminder still arrives on the right day, every year, just without the age.",
                },
                {
                  q: "Can I see birthdays in my regular calendar?",
                  a: "Yes. Subscribe to the iCal feed Lazy Uncle gives you and birthdays show up in Google, Apple, Outlook, or anything that supports calendar subscriptions.",
                },
                {
                  q: "Can I delete my data?",
                  a: "Yes, all of it. From your settings, with one button. The list, the submissions, the account.",
                },
              ].map((item) => (
                <div
                  key={item.q}
                  className="flex flex-col gap-2 py-6 md:flex-row md:items-baseline md:gap-10"
                >
                  <dt className="font-display text-base font-semibold text-ink md:w-64 md:flex-none md:text-lg">
                    {item.q}
                  </dt>
                  <dd className="font-sans text-base leading-relaxed text-ink-soft">
                    {item.a}
                  </dd>
                </div>
              ))}
            </dl>
          </div>
        </section>

        <section className="border-t border-rule">
          <div className="mx-auto max-w-2xl px-6 py-20 text-center md:px-12 md:py-24">
            <p className="font-display text-2xl font-medium leading-snug text-ink md:text-3xl">
              Ready to never apologize for a forgotten birthday again?
            </p>
            <div className="mt-8 flex flex-col items-center gap-3 sm:flex-row sm:justify-center">
              <Link
                href="/"
                className="inline-flex items-center justify-center rounded-md bg-accent px-6 py-3 font-medium text-white transition hover:bg-accent-deep focus:outline-hidden focus:ring-2 focus:ring-accent/40 focus:ring-offset-2 focus:ring-offset-paper"
              >
                Start your list
              </Link>
              <Link
                href="/features"
                className="inline-flex items-center justify-center rounded-md border border-rule px-6 py-3 font-medium text-ink transition hover:border-accent hover:text-accent-deep focus:outline-hidden focus:ring-2 focus:ring-accent/30 focus:ring-offset-2 focus:ring-offset-paper"
              >
                See the features
              </Link>
            </div>
          </div>
        </section>
      </main>
    </MainLayout>
  );
};

export default HowItWorksPage;
