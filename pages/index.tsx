import Welcome from "../components/Welcome";
import MainLayout from "../components/layout/MainLayout";
import { auth } from "../lib/auth";
import { GetServerSidePropsContext, NextPage } from "next";

export const HomePage: NextPage = () => {
  return (
    <MainLayout
      title="Lazy Uncle: Simple Free Birthday Reminder App"
      description="Keep track of birthdays easily with Lazy Uncle. Free app to manage reminders for family and friends. Sign in with GitHub or Google to get started."
    >
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
