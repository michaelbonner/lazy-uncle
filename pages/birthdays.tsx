import { GetServerSideProps, NextPage } from "next";
import { Session, getServerSession } from "next-auth";
import dynamic from "next/dynamic";
import { useRouter } from "next/router";
import { useEffect } from "react";
import MainLayout from "../components/layout/MainLayout";
import { authOptions } from "./api/auth/[...nextauth]";

const BirthdaysContainer = dynamic(
  () => import("../components/BirthdaysContainer"),
  {
    loading: () => (
      <div className="flex h-full min-h-[50vh] w-full items-center justify-center rounded-lg border-b-4 border-t-4 bg-white text-center text-gray-800">
        <p className="animate-pulse">Loading birthdays...</p>
      </div>
    ),
  }
);

type HomeProps = {
  session: Session;
};

export const Home: NextPage<HomeProps> = ({ session }) => {
  const router = useRouter();

  useEffect(() => {
    if (!session) {
      router.push("/");
    }
  }, [router, session]);

  return (
    <MainLayout title="Lazy Uncle">
      <main className="mx-auto max-w-7xl px-2 pb-8">
        <BirthdaysContainer userId={session?.user?.id} />
      </main>
    </MainLayout>
  );
};

export const getServerSideProps: GetServerSideProps = async (context) => {
  const session = await getServerSession(context.req, context.res, authOptions);

  delete session?.user?.emailVerified;
  delete session?.user?.createdAt;

  return {
    props: {
      session,
    },
  };
};

export default Home;
