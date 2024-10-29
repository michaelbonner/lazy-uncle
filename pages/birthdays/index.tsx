import { GetServerSideProps, NextPage } from "next";
import { Session, getServerSession } from "next-auth";
import dynamic from "next/dynamic";
import { useRouter } from "next/router";
import { useEffect } from "react";
import MainLayout from "../../components/layout/MainLayout";
import { authOptions } from "../api/auth/[...nextauth]";

const BirthdaysContainer = dynamic(
  () => import("../../components/BirthdaysContainer"),
  {
    loading: () => (
      <div className="flex justify-center items-center w-full h-full text-center text-gray-800 bg-white rounded-lg border-t-4 border-b-4 min-h-[50vh]">
        <p className="animate-pulse">Loading birthdays...</p>
      </div>
    ),
  },
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
      <main className="px-2 pb-8 mx-auto max-w-7xl">
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
