import { Provider } from "next-auth/providers";
import { getProviders, useSession } from "next-auth/react";
import React from "react";
import BirthdaysContainer from "../components/BirthdaysContainer";
import MainLayout from "../components/layout/MainLayout";
import Welcome from "../components/Welcome";

function Home({ providers }: { providers: Provider[] }) {
  const { data: session, status: sessionStatus } = useSession();

  return (
    <MainLayout title="Lazy Uncle">
      <>
        {sessionStatus === "loading" && (
          <main className="max-w-7xl mx-auto pb-8 px-2 mt-4">
            <div
              className="bg-gray-50 rounded-lg mt-6 lg:mt-2 text-gray-600 flex items-center justify-center border-t-4 border-t-indigo-400 border-b-4 border-b-gray-400"
              style={{ minHeight: `30vh` }}
            >
              <p className="text-2xl font-bold animate-pulse">
                Loading birthdays
              </p>
            </div>
          </main>
        )}
        {sessionStatus !== "loading" && (
          <main className="max-w-7xl mx-auto pb-8 px-2">
            {session?.user ? (
              <BirthdaysContainer userId={session?.user?.id} />
            ) : (
              <Welcome providers={providers} />
            )}
          </main>
        )}
      </>
    </MainLayout>
  );
}

export async function getServerSideProps() {
  const providers = await getProviders();
  return {
    props: { providers },
  };
}

export default Home;
