import type { NextPage } from "next";
import Head from "next/head";
import Image from "next/image";

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

export default Home;
