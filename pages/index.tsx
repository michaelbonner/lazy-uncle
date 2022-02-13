import { GetServerSideProps } from "next";
import { Session } from "next-auth";
import { Provider } from "next-auth/providers";
import { getProviders, getSession, useSession } from "next-auth/react";
import React from "react";
import BirthdaysContainer from "../components/BirthdaysContainer";
import MainLayout from "../components/layout/MainLayout";
import Welcome from "../components/Welcome";

function Home({
  providers,
  session,
}: {
  providers: Provider[];
  session: Session;
}) {
  const { status: sessionStatus } = useSession();

  return (
    <MainLayout title="Lazy Uncle">
      <main className="max-w-7xl mx-auto pb-8 px-2">
        {session?.user || sessionStatus === "authenticated" ? (
          <BirthdaysContainer userId={session?.user?.id} />
        ) : (
          <Welcome providers={providers} />
        )}
      </main>
    </MainLayout>
  );
}

export const getServerSideProps: GetServerSideProps = async (context) => {
  const providers = await getProviders();
  const session = await getSession(context);
  return {
    props: { providers, session },
  };
};

export default Home;
