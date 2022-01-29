import type { NextPage } from "next";
import Head from "next/head";
import Image from "next/image";
import { PrismaClient } from "@prisma/client";

const Home: NextPage = () => {
  return (
    <div>
      <Head>
        <title>Lazy Uncle</title>
        <meta
          name="description"
          content="An easy way to keep track of birthdays"
        />
        <link rel="icon" href="/favicon.ico" />
      </Head>

      <main>
        <h1>Welcome to Lazy Uncle</h1>
      </main>

      <footer>
        <a href="/" target="_blank" rel="noopener noreferrer">
          Powered by{" "}
          <span>
            <Image
              src="/lazy-uncle.svg"
              alt="Lazy Uncle"
              width={280}
              height={100}
            />
          </span>
        </a>
      </footer>
    </div>
  );
};

export async function getServerSideProps() {
  // const prisma = new PrismaClient();

  // async function main() {
  //   await prisma.$connect();

  //   await prisma.user.create({
  //     data: {
  //       name: "Rich",
  //       email: "hello@prisma.com",
  //       birthdays: {
  //         create: {
  //           name: "My first birthday",
  //           date: new Date().toLocaleDateString(),
  //         },
  //       },
  //     },
  //   });

  //   const allUsers = await prisma.user.findMany({
  //     include: {
  //       birthdays: true,
  //     },
  //   });
  //   console.log("allUsers", allUsers);
  // }

  // main()
  //   .catch((e) => {
  //     throw e;
  //   })
  //   .finally(async () => {
  //     await prisma.$disconnect();
  //   });

  return {
    props: {},
  };
}

export default Home;
