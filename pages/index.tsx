import { useSession } from "next-auth/react";
import dynamic from "next/dynamic";
import React from "react";
import MainLayout from "../components/layout/MainLayout";
import LoadingSpinner from "../components/LoadingSpinner";
import Welcome from "../components/Welcome";

const BirthdaysContainer = dynamic(
  () => import("../components/BirthdaysContainer")
);

function Home() {
  const { data: session, status: sessionStatus } = useSession();

  console.log("session", session);

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
