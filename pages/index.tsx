import { useQuery } from "@apollo/client";
import { Birthday } from "@prisma/client";
import type { NextPage } from "next";
import Head from "next/head";
import Image from "next/image";
import GetAllBirthdaysQuery from "../graphql/queries/birthdays/GetAllBirthdaysQuery";

const Home: NextPage = () => {
  const { data, loading, error } = useQuery(GetAllBirthdaysQuery);

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
        <div>
          {loading && <p>Loading...</p>}
          {error && <p>Error :(</p>}
          {data && (
            <ul>
              {data.birthdays.map((birthday: Birthday) => (
                <li key={birthday.id}>
                  <p>{birthday.name}</p>
                  <p>{birthday.date}</p>
                </li>
              ))}
            </ul>
          )}
        </div>
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
  return {
    props: {},
  };
}

export default Home;
