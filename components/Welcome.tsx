import { authClient } from "../lib/auth-client";
import clsx from "clsx";
import { useState } from "react";
import { toast } from "react-hot-toast";
import { GrGithub, GrGoogle, GrMail } from "react-icons/gr";

const MagicLinkForm = ({ idPrefix }: { idPrefix: string }) => {
  const [email, setEmail] = useState("");
  const [isSending, setIsSending] = useState(false);

  const onSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const trimmed = email.trim();
    if (!trimmed) return;

    setIsSending(true);
    const { error } = await authClient.signIn.magicLink({
      email: trimmed,
      callbackURL: "/birthdays",
    });
    setIsSending(false);

    if (error) {
      console.error(error);
      toast.error(
        "We couldn't send your link right now. Check your email address, or try Google or GitHub instead.",
      );
      return;
    }

    toast.success("Check your inbox for a sign-in link.");
    setEmail("");
  };

  const inputId = `${idPrefix}-magic-link-email`;

  return (
    <form
      onSubmit={onSubmit}
      className="flex w-full flex-col gap-2 sm:flex-row sm:items-stretch"
    >
      <label htmlFor={inputId} className="sr-only">
        Email address
      </label>
      <input
        id={inputId}
        type="email"
        required
        autoComplete="email"
        value={email}
        onChange={(event) => setEmail(event.target.value)}
        placeholder="you@example.com"
        className={clsx(
          "w-full flex-1 rounded-md border border-rule bg-white/60 px-4 py-3",
          "text-base text-ink placeholder:text-ink-muted",
          "focus:border-accent focus:bg-white focus:outline-hidden focus:ring-2 focus:ring-accent/30",
        )}
      />
      <button
        type="submit"
        disabled={isSending}
        className={clsx(
          "inline-flex items-center justify-center rounded-md px-6 py-3 font-medium transition",
          "bg-accent text-white hover:bg-accent-deep",
          "focus:outline-hidden focus:ring-2 focus:ring-accent/40 focus:ring-offset-2 focus:ring-offset-paper",
          "disabled:cursor-not-allowed disabled:opacity-60",
          "sm:w-auto sm:whitespace-nowrap",
        )}
      >
        {isSending ? "Sending…" : "Email me a link"}
      </button>
    </form>
  );
};

const OAuthRow = () => {
  const onSignIn = async (provider: "google" | "github") => {
    const { error } = await authClient.signIn.social({
      provider,
      callbackURL: "/birthdays",
    });
    if (error) {
      console.error(error);
      toast.error("Sign-in didn't go through. Please try again.");
    }
  };

  return (
    <p className="text-sm text-ink-soft">
      <span>Or continue with </span>
      <button
        type="button"
        onClick={() => onSignIn("google")}
        className="inline-flex items-center gap-1 underline decoration-rule decoration-1 underline-offset-4 transition hover:text-ink hover:decoration-accent focus:outline-hidden focus:ring-2 focus:ring-accent/30 focus:ring-offset-2 focus:ring-offset-paper rounded-sm"
      >
        <GrGoogle className="h-4 w-4" aria-hidden />
        <span>Google</span>
      </button>
      <span> · </span>
      <button
        type="button"
        onClick={() => onSignIn("github")}
        className="inline-flex items-center gap-1 underline decoration-rule decoration-1 underline-offset-4 transition hover:text-ink hover:decoration-accent focus:outline-hidden focus:ring-2 focus:ring-accent/30 focus:ring-offset-2 focus:ring-offset-paper rounded-sm"
      >
        <GrGithub className="h-4 w-4" aria-hidden />
        <span>GitHub</span>
      </button>
      <span>.</span>
    </p>
  );
};

const HeroBirthday = () => {
  return (
    <figure className="rise rise-delay-2 relative mx-auto w-full max-w-md lg:mx-0 lg:max-w-none">
      <div className="rounded-xl border border-rule px-7 py-8 md:px-9 md:py-10">
        <figcaption className="flex items-center justify-between border-b border-rule pb-4">
          <span className="inline-flex items-center gap-2 font-sans text-sm text-ink-soft">
            <GrMail className="h-4 w-4" aria-hidden />
            Sample reminder
          </span>
          <span className="font-sans text-sm text-ink-muted">in 2 days</span>
        </figcaption>
        <p className="mt-6 font-display text-5xl font-semibold leading-[1.05] text-balance text-ink md:text-6xl lg:text-7xl">
          Avery
        </p>
        <p className="mt-3 font-sans text-base text-ink-soft md:text-lg">
          turns 9 on Saturday, May 9.
        </p>
        <p className="mt-6 font-display text-base italic text-ink-soft md:text-lg">
          Loves art kits. Maybe a sketchbook.
        </p>
        <p className="mt-8 font-sans text-sm text-ink-muted">
          Arrives at 9:00 a.m. local time, by email.
        </p>
      </div>
    </figure>
  );
};

const Welcome = () => {
  return (
    <div className="font-sans text-ink">
      <section className="mx-auto max-w-6xl px-6 pt-10 pb-20 md:px-12 md:pt-16 md:pb-28">
        <div className="grid gap-14 lg:grid-cols-12 lg:gap-16">
          <div className="lg:col-span-7">
            <h1 className="rise font-display text-4xl font-semibold leading-[1.08] text-balance text-ink md:text-5xl lg:text-[3.5rem]">
              Keep every birthday in one calm, beautiful place.
            </h1>
            <p className="rise rise-delay-1 mt-6 max-w-xl font-sans text-lg leading-relaxed text-ink-soft md:text-xl">
              Lazy Uncle quietly remembers birthdays for you. Add the people you
              love, share a link with the relatives who&rsquo;d otherwise text
              the wrong date, and get a gentle nudge a few days before each
              one.
            </p>
            <div className="rise rise-delay-2 mt-8 flex flex-col gap-3">
              <MagicLinkForm idPrefix="hero" />
              <OAuthRow />
              <p className="mt-1 text-sm text-ink-muted">
                No credit card. No ads. Your list starts instantly.
              </p>
            </div>
          </div>
          <div className="lg:col-span-5">
            <HeroBirthday />
          </div>
        </div>
      </section>

      <section className="border-t border-rule bg-paper-deep">
        <div className="mx-auto max-w-2xl px-6 py-20 md:px-12 md:py-28">
          <h2 className="font-display text-3xl font-semibold leading-tight text-balance text-ink md:text-4xl">
            Built only for this. Nothing else.
          </h2>
          <div className="mt-8 space-y-6 font-sans text-lg leading-relaxed text-ink-soft">
            <p>
              Most apps treat birthdays as an afterthought: a calendar entry
              that demands a year you don&rsquo;t know, a contact field nobody
              fills in, a notification when it&rsquo;s already too late. Lazy
              Uncle is the one place to keep them, and the one place to be
              reminded.
            </p>
            <p>
              Add the people you love in a few seconds. Share a private link
              with whoever actually keeps track in your family, a sibling, a
              partner, the in-laws, and dates start arriving without anyone
              needing an account. A few days before each birthday, you get a
              quiet email. That&rsquo;s the whole thing.
            </p>
          </div>
          <dl className="mt-12 divide-y divide-rule border-y border-rule">
            {[
              {
                term: "No year required",
                detail:
                  "Some birthdays you only remember by month and day. That’s fine here.",
              },
              {
                term: "Sharing without sign-ups",
                detail:
                  "Send one private link. Family adds dates from their phone, no account needed.",
              },
              {
                term: "Reminders in your time zone",
                detail:
                  "A calm email a few days before. Never at midnight, never twice.",
              },
            ].map((item) => (
              <div
                key={item.term}
                className="flex flex-col gap-2 py-5 md:flex-row md:items-baseline md:gap-8"
              >
                <dt className="font-display text-base font-semibold text-ink md:w-64 md:flex-none md:text-lg">
                  {item.term}
                </dt>
                <dd className="text-base text-ink-soft">{item.detail}</dd>
              </div>
            ))}
          </dl>
        </div>
      </section>

      <section className="border-t border-rule">
        <div className="mx-auto max-w-2xl px-6 py-20 text-center md:px-12 md:py-24">
          <p className="font-display text-2xl font-medium leading-snug text-ink md:text-3xl">
            Make birthdays feel thoughtful again.
          </p>
          <div className="mx-auto mt-8 max-w-md">
            <MagicLinkForm idPrefix="footer" />
          </div>
        </div>
      </section>

      <style jsx>{`
        .rise {
          animation: rise 700ms cubic-bezier(0.22, 1, 0.36, 1) both;
        }
        .rise-delay-1 {
          animation-delay: 90ms;
        }
        .rise-delay-2 {
          animation-delay: 180ms;
        }
        @keyframes rise {
          from {
            opacity: 0;
            transform: translateY(10px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }
        @media (prefers-reduced-motion: reduce) {
          .rise,
          .rise-delay-1,
          .rise-delay-2 {
            animation: none;
            opacity: 1;
            transform: none;
          }
        }
      `}</style>
    </div>
  );
};

export default Welcome;
