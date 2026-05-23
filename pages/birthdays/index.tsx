import MainLayout from "../../components/layout/MainLayout";
import SignInDialog from "../../components/SignInDialog";
import { authClient } from "../../lib/auth-client";
import { NextPage } from "next";
import dynamic from "next/dynamic";
import { useState } from "react";

const BirthdaysContainer = dynamic(
  () => import("../../components/BirthdaysContainer"),
  {
    loading: () => (
      <div className="flex h-full min-h-[50vh] w-full items-center justify-center rounded-lg border border-rule bg-paper-deep text-center text-ink-soft">
        <p className="animate-pulse">Loading birthdays...</p>
      </div>
    ),
  },
);

export const BirthdaysPage: NextPage = () => {
  const { data: session, isPending } = authClient.useSession();
  const [isSignInOpen, setIsSignInOpen] = useState(true);

  if (isPending) {
    return (
      <MainLayout title="Lazy Uncle">
        <main className="mx-auto max-w-7xl px-2 pb-8" />
      </MainLayout>
    );
  }

  if (!session) {
    return (
      <MainLayout title="Lazy Uncle">
        <main className="mx-auto max-w-7xl px-6 py-20 text-center">
          <h1 className="font-display text-3xl font-semibold text-ink md:text-4xl">
            Sign in to see your birthdays
          </h1>
          <p className="mt-4 text-ink-soft">
            Your list is private to your account.
          </p>
          <button
            type="button"
            onClick={() => setIsSignInOpen(true)}
            className="mt-8 inline-flex items-center justify-center rounded-md bg-accent px-6 py-3 font-medium text-white transition hover:bg-accent-deep focus:outline-hidden focus:ring-2 focus:ring-accent/40 focus:ring-offset-2 focus:ring-offset-paper"
          >
            Sign in
          </button>
          <SignInDialog
            isOpen={isSignInOpen}
            handleClose={() => setIsSignInOpen(false)}
          />
        </main>
      </MainLayout>
    );
  }

  return (
    <MainLayout title="Lazy Uncle">
      <main className="mx-auto max-w-7xl px-2 pb-8">
        <BirthdaysContainer userId={session?.user?.id} />
      </main>
    </MainLayout>
  );
};

export default BirthdaysPage;
