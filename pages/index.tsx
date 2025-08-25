import { NextPage } from "next";
import { useRouter } from "next/router";
import { useEffect } from "react";
import Welcome from "../components/Welcome";
import MainLayout from "../components/layout/MainLayout";
import { authClient } from "../lib/auth-client";

export const Home: NextPage = () => {
  const router = useRouter();
  const { data: session } = authClient.useSession();

  useEffect(() => {
    if (session?.user) {
      router.push("/birthdays");
    }
  }, [router, session]);

  return (
    <MainLayout title="Lazy Uncle">
      <main className="mx-auto max-w-7xl px-2 pb-8">
        {!session?.user?.email && <Welcome />}
      </main>
    </MainLayout>
  );
};

export default Home;
