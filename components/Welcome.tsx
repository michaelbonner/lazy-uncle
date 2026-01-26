import { authClient } from "../lib/auth-client";
import clsx from "clsx";
import { Fjalla_One } from "next/font/google";
import { toast } from "react-hot-toast";
import { GrGithub, GrGoogle } from "react-icons/gr";

const features = [
  {
    title: "One tap reminders",
    description:
      "A clean calendar view with every birthday you care about, plus automatic reminder emails when you want them.",
  },
  {
    title: "Family-friendly sharing",
    description:
      "Generate a private link so relatives can add birthdays without needing your login.",
  },
  {
    title: "Notes that travel with them",
    description:
      "Capture gift ideas, sizes, and traditions so you never start from scratch.",
  },
  {
    title: "Safe, simple imports",
    description: "Upload a CSV and keep a tidy, searchable list in seconds.",
  },
  {
    title: "Timezone-proof alerts",
    description:
      "Reminders land at the right local time, even if family lives across the world.",
  },
  {
    title: "Privacy-first by default",
    description:
      "No ads, no noise. Your data stays yours and only goes where you send it.",
  },
];

const steps = [
  {
    title: "Sign in and start a list",
    description:
      "Use Google or GitHub, then add birthdays for the people you love.",
  },
  {
    title: "Invite trusted family",
    description:
      "Share a link so others can contribute, update, or confirm dates.",
  },
  {
    title: "Get calm reminders",
    description:
      "Relax knowing Lazy Uncle will keep you ahead of every celebration.",
  },
];

const Welcome = () => {
  const providers = [
    {
      id: "google",
      name: "Google",
    },
    {
      id: "github",
      name: "GitHub",
    },
  ];

  const signIn = async (provider: string) => {
    const { error } = await authClient.signIn.social({
      provider,
      callbackURL: "/birthdays",
    });

    if (error) {
      console.error(error);
      toast.error("An error occurred while signing in. Please try again.");
    }
  };

  return (
    <div className={clsx("relative isolate overflow-hidden text-gray-100")}>
      <div className="mx-auto mt-6 max-w-6xl px-4 pb-12 pt-6 md:mt-10 md:pt-10">
        <section className="relative overflow-hidden rounded-3xl border border-white/10 bg-linear-to-b from-slate-900/80 via-slate-950/85 to-slate-950/95 p-6 shadow-[0_25px_80px_rgba(15,23,42,0.55)] md:p-12">
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_top,rgba(45,212,191,0.18),transparent_60%)]" />
          <div className="relative grid gap-12 lg:grid-cols-[1.1fr_0.9fr]">
            <div className="animate-hero">
              <p className="text-xs uppercase tracking-[0.4em] text-cyan-200">
                Birthday tracking, minus the effort
              </p>
              <h1
                className={clsx(
                  "mt-5 text-4xl font-black leading-tight text-white md:text-5xl",
                )}
              >
                Keep every birthday in one calm, beautiful place.
              </h1>
              <p className="mt-5 max-w-xl text-lg text-cyan-50/90 font-light">
                Lazy Uncle is the lightweight birthday reminder app built for
                families who do not want another cluttered dashboard. Add dates,
                drop notes, invite the people you trust, and get gentle nudges
                right on time.
              </p>
              <div className="mt-6 flex flex-wrap gap-2">
                {[
                  "Free forever",
                  "No ads",
                  "Private sharing",
                  "Fast setup",
                ].map((pill) => (
                  <span
                    key={pill}
                    className="rounded-full border border-cyan-200/30 bg-cyan-100/10 px-4 py-1 text-xs font-medium uppercase tracking-widest text-cyan-50/80"
                  >
                    {pill}
                  </span>
                ))}
              </div>
              <div className="mt-8 flex flex-col gap-3">
                <div className="flex flex-1 flex-col gap-3 sm:flex-row sm:items-center">
                  {providers &&
                    Object.values(providers).map((provider) => {
                      return (
                        <button
                          key={provider.name}
                          className={clsx(
                            "inline-flex w-full items-center justify-center space-x-2 rounded-md border border-white/10 px-6 py-3 font-medium shadow-xs transition",
                            "bg-white/90 text-slate-900",
                            "hover:-translate-y-0.5 hover:bg-white focus:outline-hidden focus:ring-2 focus:ring-cyan-200/80",
                            "sm:w-auto",
                          )}
                          onClick={() => signIn(provider.id)}
                        >
                          {provider.id === "google" && (
                            <GrGoogle className="h-5 w-5" />
                          )}
                          {provider.id === "github" && (
                            <GrGithub className="h-6 w-6" />
                          )}
                          <span>Sign in with {provider.name}</span>
                        </button>
                      );
                    })}
                </div>
                <span className="text-sm text-cyan-50/70">
                  No credit card. Your list starts instantly.
                </span>
              </div>
            </div>
            <div className="relative flex flex-col gap-4">
              <div className="absolute -right-10 top-8 hidden h-48 w-48 rounded-full border border-cyan-200/20 bg-cyan-300/10 blur-2xl lg:block" />
              <div
                className="card-stack animate-card"
                style={{ animationDelay: "120ms" }}
              >
                <div className="flex items-center justify-between">
                  <span className="text-xs uppercase tracking-[0.3em] text-cyan-200">
                    Upcoming
                  </span>
                  <span className="rounded-full bg-cyan-200/20 px-2 py-1 text-xs text-cyan-50">
                    3 this month
                  </span>
                </div>
                <div className="mt-4 space-y-3 text-sm">
                  <div className="flex items-center justify-between rounded-xl bg-white/5 px-4 py-3">
                    <div>
                      <p className="font-medium text-white">Avery</p>
                      <p className="text-xs text-cyan-100/70">
                        Sept 14 · Loves art kits
                      </p>
                    </div>
                    <span className="text-cyan-200">2 days</span>
                  </div>
                  <div className="flex items-center justify-between rounded-xl bg-white/5 px-4 py-3">
                    <div>
                      <p className="font-medium text-white">Isaac</p>
                      <p className="text-xs text-cyan-100/70">
                        Sept 21 · Size M hoodie
                      </p>
                    </div>
                    <span className="text-cyan-200">9 days</span>
                  </div>
                </div>
              </div>
              <div
                className="card-stack animate-card"
                style={{ animationDelay: "240ms" }}
              >
                <p className="text-xs uppercase tracking-[0.3em] text-amber-200">
                  Reminder
                </p>
                <p className="mt-3 text-lg font-semibold text-white">
                  Sam turns 12 tomorrow.
                </p>
                <p className="mt-1 text-sm text-cyan-100/70">
                  You asked for a 2 day heads up. Gift notes are ready.
                </p>
                <div className="mt-4 flex items-center gap-2 text-xs text-amber-100/80">
                  <span className="rounded-full bg-amber-100/10 px-3 py-1">
                    9:00 AM local
                  </span>
                  <span className="rounded-full bg-amber-100/10 px-3 py-1">
                    Email + mobile
                  </span>
                </div>
              </div>
              <div
                className="card-stack animate-card"
                style={{ animationDelay: "360ms" }}
              >
                <p className="text-xs uppercase tracking-[0.3em] text-lime-200">
                  Shared link
                </p>
                <p className="mt-3 text-sm text-cyan-50/80">
                  Invite family to add birthdays without a login.
                </p>
                <div className="mt-3 flex items-center justify-between rounded-full bg-white/5 px-4 py-2 text-xs text-cyan-100/70">
                  <span>lazyuncle.net/share/family</span>
                  <span className="rounded-full bg-lime-200/20 px-2 py-1 text-lime-100">
                    Active
                  </span>
                </div>
              </div>
            </div>
          </div>
        </section>

        <section className="mt-12 grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {features.map((feature, index) => (
            <article
              key={feature.title}
              className="animate-feature rounded-2xl border border-white/10 bg-white/5 p-6 shadow-[0_12px_30px_rgba(15,23,42,0.25)]"
              style={{ animationDelay: `${120 * (index + 1)}ms` }}
            >
              <h3 className="text-lg font-semibold text-white">
                {feature.title}
              </h3>
              <p className="mt-3 text-sm text-cyan-50/80">
                {feature.description}
              </p>
            </article>
          ))}
        </section>

        <section className="mt-12 rounded-3xl border border-white/10 bg-linear-to-r from-cyan-950/70 via-slate-950/80 to-slate-900/80 p-6 shadow-[0_20px_60px_rgba(8,145,178,0.2)] md:p-10">
          <div className="flex flex-col gap-10 md:flex-row md:items-start md:justify-between">
            <div className="max-w-xl">
              <p className="text-xs uppercase tracking-[0.4em] text-cyan-200">
                How it works
              </p>
              <h2
                className={clsx(
                  "mt-4 text-3xl font-semibold text-white md:text-4xl",
                )}
              >
                Three quick steps to never miss a birthday again.
              </h2>
              <p className="mt-3 text-sm text-cyan-50/80">
                Lazy Uncle keeps the workflow tight and friendly. The goal is
                simple: fewer forgotten birthdays, more joyful ones.
              </p>
            </div>
            <div className="flex flex-1 flex-col gap-4">
              {steps.map((step, index) => (
                <div
                  key={step.title}
                  className="flex gap-4 rounded-2xl border border-white/10 bg-white/5 p-4"
                >
                  <div className="flex h-10 w-10 items-center justify-center rounded-full bg-cyan-200/20 text-sm font-semibold text-cyan-50">
                    0{index + 1}
                  </div>
                  <div>
                    <h3 className="text-base font-semibold text-white">
                      {step.title}
                    </h3>
                    <p className="mt-1 text-sm text-cyan-50/70">
                      {step.description}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>

        <section className="mt-12 rounded-3xl border border-white/10 bg-white/5 p-6 text-center md:p-10">
          <h2 className={clsx("text-3xl font-semibold text-white md:text-4xl")}>
            Make birthdays feel thoughtful again.
          </h2>
          <p className="mx-auto mt-3 max-w-2xl text-sm text-cyan-50/80 md:text-base">
            Lazy Uncle was built for real families who want a single, peaceful
            home for birthdays. Everything you need, nothing you do not.
          </p>
          <div className="mt-6 flex flex-col items-center justify-center gap-3 sm:flex-row">
            {providers &&
              Object.values(providers).map((provider) => {
                return (
                  <button
                    key={provider.name}
                    className={clsx(
                      "inline-flex w-full items-center justify-center space-x-2 rounded-md border border-white/10 px-6 py-3 font-medium shadow-xs transition",
                      "bg-white/90 text-slate-900",
                      "hover:-translate-y-0.5 hover:bg-white focus:outline-hidden focus:ring-2 focus:ring-cyan-200/80",
                      "sm:w-auto",
                    )}
                    onClick={() => signIn(provider.id)}
                  >
                    {provider.id === "google" && (
                      <GrGoogle className="h-5 w-5" />
                    )}
                    {provider.id === "github" && (
                      <GrGithub className="h-6 w-6" />
                    )}
                    <span>Sign in with {provider.name}</span>
                  </button>
                );
              })}
          </div>
          <p className="mt-4 text-xs uppercase tracking-[0.3em] text-cyan-200/80">
            Free forever. No hidden upgrades.
          </p>
        </section>
      </div>

      <style jsx>{`
        .animate-hero {
          animation: heroRise 800ms ease-out both;
        }

        .animate-card {
          animation: cardLift 900ms ease-out both;
        }

        .animate-feature {
          animation: featureFade 700ms ease-out both;
        }

        .card-stack {
          border-radius: 1.5rem;
          border: 1px solid rgba(255, 255, 255, 0.1);
          background: rgba(15, 23, 42, 0.55);
          padding: 1.5rem;
          box-shadow: 0 20px 50px rgba(15, 23, 42, 0.35);
          backdrop-filter: blur(12px);
        }

        @keyframes heroRise {
          from {
            opacity: 0;
            transform: translateY(18px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }

        @keyframes cardLift {
          from {
            opacity: 0;
            transform: translateY(14px) scale(0.98);
          }
          to {
            opacity: 1;
            transform: translateY(0) scale(1);
          }
        }

        @keyframes featureFade {
          from {
            opacity: 0;
            transform: translateY(12px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }
      `}</style>
    </div>
  );
};
export default Welcome;
