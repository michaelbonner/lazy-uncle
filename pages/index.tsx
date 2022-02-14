import { Session } from "next-auth";
import { Provider } from "next-auth/providers";
import { useSession } from "next-auth/react";
import React from "react";
import BirthdaysContainer from "../components/BirthdaysContainer";
import MainLayout from "../components/layout/MainLayout";
import Welcome from "../components/Welcome";

function Home({ session }: { providers: Provider[]; session: Session }) {
  const { status: sessionStatus } = useSession();

  return (
    <MainLayout title="Lazy Uncle">
      <main className="max-w-7xl mx-auto pb-8 px-2">
        {sessionStatus === "loading" && (
          <div className="flex items-center justify-center">
            <div className="circle w-16 h-16 mx-auto">
              <svg
                className="circle__svg"
                viewBox="0 0 100 100"
                xmlns="http://www.w3.org/2000/svg"
              >
                <circle
                  className="circle__svg-circle fill-transparent stroke-current text-teal-50"
                  cx="50"
                  cy="50"
                  r="45"
                />
              </svg>
            </div>
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
