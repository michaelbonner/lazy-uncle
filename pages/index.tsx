import { GetServerSideProps, NextPage } from "next";
import { Session, getServerSession } from "next-auth";
import { useRouter } from "next/router";
import { useEffect } from "react";
import Welcome from "../components/Welcome";
import MainLayout from "../components/layout/MainLayout";
import { authOptions } from "./api/auth/[...nextauth]";

type HomeProps = {
  session: Session;
};

export const Home: NextPage<HomeProps> = ({ session }) => {
  const router = useRouter();

  useEffect(() => {
    if (session) {
      router.push("/birthdays");
    }
  }, [router, session]);

  return (
    <MainLayout title="Lazy Uncle">
      <main className="mx-auto max-w-7xl px-2 pb-8">
        {!session?.user?.id && <Welcome />}
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
