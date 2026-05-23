import { authClient } from "../lib/auth-client";
import clsx from "clsx";
import { useState } from "react";
import { toast } from "react-hot-toast";
import { GrGithub, GrGoogle } from "react-icons/gr";

export const MagicLinkForm = ({ idPrefix }: { idPrefix: string }) => {
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

export const OAuthRow = () => {
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
