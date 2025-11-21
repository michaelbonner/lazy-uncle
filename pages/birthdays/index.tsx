import MainLayout from "../../components/layout/MainLayout";
import { authClient } from "../../lib/auth-client";
import { NextPage } from "next";
import dynamic from "next/dynamic";
import { useRouter } from "next/router";
import { useEffect } from "react";

const BirthdaysContainer = dynamic(
  () => import("../../components/BirthdaysContainer"),
  {
    loading: () => (
      <div className="flex h-full min-h-[50vh] w-full items-center justify-center rounded-lg border-t-4 border-b-4 bg-white text-center text-gray-800">
        <p className="animate-pulse">Loading birthdays...</p>
      </div>
    ),
  },
);

export const BirthdaysPage: NextPage = () => {
  const router = useRouter();

  const { data: session, isPending } = authClient.useSession();

  useEffect(() => {
    if (isPending) {
      return;
    }

    if (!session) {
      router.push("/");
    }
  }, [router, session, isPending]);

  if (!session) {
    return null;
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
