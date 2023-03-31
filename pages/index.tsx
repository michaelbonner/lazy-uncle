import { useSession } from "next-auth/react";
import dynamic from "next/dynamic";
import LoadingSpinner from "../components/LoadingSpinner";
import Welcome from "../components/Welcome";
import MainLayout from "../components/layout/MainLayout";

const BirthdaysContainer = dynamic(
  () => import("../components/BirthdaysContainer")
);

function Home() {
  const { data: session, status: sessionStatus } = useSession();

  return (
    <MainLayout title="Lazy Uncle">
      <main className="mx-auto max-w-7xl px-2 pb-8">
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
