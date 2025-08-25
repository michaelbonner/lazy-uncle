import { GetServerSidePropsContext, NextPage } from "next";
import Welcome from "../components/Welcome";
import MainLayout from "../components/layout/MainLayout";
import { auth } from "../lib/auth";

export const HomePage: NextPage = () => {
  return (
    <MainLayout title="Lazy Uncle">
      <main className="mx-auto max-w-7xl px-2 pb-8">
        <Welcome />
      </main>
    </MainLayout>
  );
};

export const getServerSideProps = async (
  context: GetServerSidePropsContext,
) => {
  const session = await auth.api.getSession({
    headers: new Headers({
      cookie: context.req.headers.cookie || "",
    }),
  });

  if (session?.user) {
    return {
      redirect: {
        destination: "/birthdays",
        permanent: false,
      },
    };
  }

  return {
    props: {},
  };
};

export default HomePage;
