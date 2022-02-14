import { Session } from "next-auth";
import { Provider } from "next-auth/providers";
import { useSession } from "next-auth/react";
import React from "react";
import BirthdaysContainer from "../components/BirthdaysContainer";
import MainLayout from "../components/layout/MainLayout";
import LoadingSpinner from "../components/LoadingSpinner";
import Welcome from "../components/Welcome";

function Home({ session }: { providers: Provider[]; session: Session }) {
  const { status: sessionStatus } = useSession();

  return (
    <MainLayout title="Lazy Uncle">
      <main className="max-w-7xl mx-auto pb-8 px-2">
        {sessionStatus === "loading" && (
          <div className="flex items-center justify-center">
            <LoadingSpinner />
          </div>
        )}
        {sessionStatus === "authenticated" && (
          <BirthdaysContainer userId={session?.user?.id} />
        )}
        {sessionStatus === "unauthenticated" && <Welcome />}
      </main>
    </MainLayout>
  );
}

export default Home;
