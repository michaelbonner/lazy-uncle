import MainLayout from "../components/layout/MainLayout";
import { NextPage } from "next";
import Link from "next/link";
import {
  HiOutlineCake,
  HiOutlineLink,
  HiOutlineMail,
  HiOutlineUserAdd,
} from "react-icons/hi";

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
      "Use Google, GitHub, or a sign-in link sent to your email. Your private list is ready right away.",
    ],
    icon: HiOutlineUserAdd,
  },
  {
    index: "02",
    eyebrow: "Add the people you love",
    title: "Name, date, optional note. That's the form.",
    body: [
      "Add a name and a month and day. The year is optional. A short note can help you remember what they're into when it's time to celebrate.",
      "Already have a spreadsheet? Import the dates from a CSV.",
    ],
    icon: HiOutlineCake,
  },
  {
    index: "03",
    eyebrow: "Share a private link",
    title: "Let the people who remember do the remembering.",
    body: [
      "Send a private link to someone who knows the dates. They can add birthdays from their phone without an account.",
      "You review each submission before it joins your list. Links expire after a week by default.",
    ],
    icon: HiOutlineLink,
  },
  {
    index: "04",
    eyebrow: "Be reminded",
    title: "One calm email, a few days before each birthday.",
    body: [
      "A reminder arrives ahead of the birthday, in your time zone, with the details you saved. Choose individual reminders or a daily summary.",
      "You can also subscribe to a calendar feed.",
    ],
    icon: HiOutlineMail,
  },
];

const StepCard = ({ step, isLast }: { step: Step; isLast: boolean }) => {
  const Icon = step.icon;
  return (
    <div className="relative grid gap-6 lg:grid-cols-12 lg:gap-16">
      <div className="lg:col-span-3">
        <div className="flex items-baseline gap-4">
          <span className="font-display text-6xl text-accent-deep md:text-7xl">
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
        <h2 className="font-display text-4xl leading-[1.12] text-balance text-ink md:text-5xl">
          {step.title}
        </h2>
        <div className="mt-6 max-w-2xl space-y-4 font-sans text-lg/8 text-ink-soft">
          {step.body.map((p, i) => (
            <p key={i}>{p}</p>
          ))}
        </div>
        {!isLast && (
          <div aria-hidden className="mt-14 h-px w-full bg-rule lg:mt-20" />
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
        <section className="bg-evergreen text-cream">
          <div className="mx-auto grid max-w-7xl gap-8 px-5 py-20 sm:px-8 md:grid-cols-[3fr_2fr] md:items-end md:gap-16 md:py-28 lg:px-12">
            <p className="font-sans text-sm font-semibold uppercase tracking-[0.16em] text-cream/70 md:col-span-2">
              How it works
            </p>
            <h1 className="font-display text-5xl leading-[1.06] text-balance sm:text-6xl">
              Start a list. Get on with your life.
            </h1>
            <p className="max-w-xl font-sans text-lg/8 text-cream/85 md:text-xl/9">
              Add a few dates now. A reminder will arrive when one is coming up.
              You can always ask family to fill in the gaps.
            </p>
          </div>
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
