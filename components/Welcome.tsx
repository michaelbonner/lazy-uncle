import { MagicLinkForm, OAuthRow } from "./SignInForm";
import Link from "next/link";

const DatePreview = () => (
  <figure className="relative mx-auto w-full max-w-lg lg:mx-0">
    <div
      className="absolute -top-4 right-5 left-5 h-8 rounded-t-xl bg-cream/20"
      aria-hidden
    />
    <div className="relative overflow-hidden rounded-2xl bg-cream text-ink shadow-[0_24px_70px_-35px_rgba(11,32,28,0.65)]">
      <div className="flex items-center justify-between border-b border-rule px-6 py-4 text-sm font-medium text-ink-soft sm:px-9">
        <span>A sample reminder</span>
        <span>May 9</span>
      </div>
      <div className="grid grid-cols-[105px_1fr] gap-5 px-6 py-9 sm:grid-cols-[130px_1fr] sm:gap-8 sm:px-9 sm:py-12">
        <div className="flex flex-col items-center self-start rounded-xl bg-paper-deep px-2 py-5 text-accent-deep">
          <span className="text-sm font-semibold tracking-[0.15em] uppercase">
            May
          </span>
          <span className="font-display text-7xl leading-none tabular-nums sm:text-8xl">
            09
          </span>
          <span className="mt-1 text-sm">Saturday</span>
        </div>
        <div className="min-w-0 self-center">
          <p className="text-sm font-medium text-accent-deep">In 2 days</p>
          <p className="mt-2 font-display text-4xl leading-none sm:text-5xl">
            Avery
          </p>
          <p className="mt-3 text-base/6 text-ink-soft">Turning 9</p>
        </div>
      </div>
      <div className="border-t border-rule px-6 py-6 sm:px-9">
        <p className="text-xs font-semibold tracking-[0.12em] text-ink-muted uppercase">
          A note to yourself
        </p>
        <p className="mt-2 font-display text-xl italic text-ink-soft">
          Loves art kits. Maybe a sketchbook.
        </p>
      </div>
    </div>
    <figcaption className="mt-5 text-center text-sm text-cream/75">
      Your reminder arrives before the day.
    </figcaption>
  </figure>
);

const Welcome = () => (
  <div className="text-ink">
    <section className="relative overflow-hidden bg-evergreen text-cream">
      <div
        className="pointer-events-none absolute inset-0 opacity-[0.07] [background-image:radial-gradient(circle_at_center,currentColor_1px,transparent_1px)] [background-size:22px_22px]"
        aria-hidden
      />
      <div className="relative mx-auto grid max-w-7xl items-center gap-16 px-5 py-20 sm:px-8 sm:py-24 lg:grid-cols-[11fr_9fr] lg:gap-14 lg:px-12 lg:py-32">
        <div>
          <p className="text-sm font-semibold tracking-[0.18em] text-cream/75 uppercase">
            Birthday reminders, without the fuss
          </p>
          <h1 className="mt-6 max-w-3xl font-display text-5xl leading-[1.04] tracking-tight text-balance sm:text-6xl lg:text-[5.2rem]">
            A small place for the big days.
          </h1>
          <p className="mt-7 max-w-xl text-lg/8 text-cream/85 sm:text-xl/9">
            Keep birthdays in one simple list. We&rsquo;ll send a reminder
            before each one, so you have time to show up for the people you
            love.
          </p>
          <div className="mt-10 max-w-md">
            <p className="mb-3 text-sm font-medium text-cream">
              Start with your email
            </p>
            <MagicLinkForm idPrefix="hero" />
            <div className="mt-5">
              <OAuthRow light />
            </div>
            <p className="mt-5 text-sm text-cream/70">
              Free to use. No ads. No credit card.
            </p>
          </div>
        </div>
        <DatePreview />
      </div>
    </section>

    <section className="mx-auto grid max-w-7xl gap-10 px-5 py-20 sm:px-8 md:grid-cols-[2fr_3fr] md:gap-20 md:py-28 lg:px-12">
      <div>
        <p className="text-sm font-semibold tracking-[0.16em] text-accent-deep uppercase">
          The whole idea
        </p>
        <h2 className="mt-4 font-display text-4xl leading-[1.1] text-balance sm:text-5xl">
          Remember the person. We&rsquo;ll remember the date.
        </h2>
      </div>
      <div className="max-w-xl text-lg/8 text-ink-soft">
        <p>
          Birthdays get scattered through calendars, old messages, and someone
          else&rsquo;s memory. Lazy Uncle gives them one home, then stays quiet
          until you need a heads-up.
        </p>
        <Link
          href="/how-it-works"
          className="mt-6 inline-flex items-center gap-2 font-medium text-accent-deep underline underline-offset-4 hover:text-ink focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent"
        >
          How it works <span aria-hidden>↗</span>
        </Link>
      </div>
    </section>

    <section className="border-y border-rule bg-paper-deep">
      <div className="mx-auto max-w-7xl px-5 py-20 sm:px-8 md:py-24 lg:px-12">
        <div className="flex flex-wrap items-end justify-between gap-5">
          <div>
            <p className="text-sm font-semibold tracking-[0.16em] text-accent-deep uppercase">
              Only what matters
            </p>
            <h2 className="mt-4 max-w-2xl font-display text-4xl leading-[1.1] text-balance sm:text-5xl">
              Thoughtful by keeping things simple.
            </h2>
          </div>
          <Link
            href="/features"
            className="font-medium text-accent-deep underline underline-offset-4 hover:text-ink focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent"
          >
            See all features
          </Link>
        </div>
        <dl className="mt-12 grid gap-0 border-t border-rule md:grid-cols-3">
          <div className="border-b border-rule py-7 md:border-r md:pr-8">
            <dt className="font-display text-2xl text-ink">
              Just a name and date
            </dt>
            <dd className="mt-3 max-w-sm text-base/7 text-ink-soft">
              The birth year is optional. Add a note if you want to remember a
              gift idea.
            </dd>
          </div>
          <div className="border-b border-rule py-7 md:border-r md:px-8">
            <dt className="font-display text-2xl text-ink">
              Help from your family
            </dt>
            <dd className="mt-3 max-w-sm text-base/7 text-ink-soft">
              Share a private link. Relatives can add birthdays without an
              account.
            </dd>
          </div>
          <div className="border-b border-rule py-7 md:pl-8">
            <dt className="font-display text-2xl text-ink">A little notice</dt>
            <dd className="mt-3 max-w-sm text-base/7 text-ink-soft">
              Get a calm email ahead of the day, in your time zone.
            </dd>
          </div>
        </dl>
      </div>
    </section>

    <section className="mx-auto flex max-w-7xl flex-col gap-7 px-5 py-20 sm:px-8 md:flex-row md:items-end md:justify-between md:py-28 lg:px-12">
      <div>
        <p className="text-sm font-semibold tracking-[0.16em] text-accent-deep uppercase">
          Ready when you are
        </p>
        <h2 className="mt-4 max-w-2xl font-display text-4xl leading-[1.1] text-balance sm:text-5xl">
          One less thing to keep in your head.
        </h2>
        <p className="mt-5 text-lg text-ink-soft">
          Your list can start with just one birthday.
        </p>
      </div>
      <Link
        href="#hero-magic-link-email"
        className="inline-flex w-fit items-center justify-center rounded-md bg-accent px-6 py-3 font-medium text-cream hover:bg-accent-deep focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent"
      >
        Start your list
      </Link>
    </section>
  </div>
);

export default Welcome;
