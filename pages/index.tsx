import { useQuery } from "@apollo/client";
import type { NextPage } from "next";
import Head from "next/head";
import Image from "next/image";
import GetAllBirthdaysQuery from "../graphql/queries/birthdays/GetAllBirthdaysQuery";
import { NexusGenObjects } from "../generated/nexus-typegen";

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

      <main className="max-w-7xl px-auto py-6 px-8">
        <h1>Welcome to Lazy Uncle</h1>
        <div>
          {loading && <p>Loading...</p>}
          {error && <p>Error :(</p>}
          {data && (
            <ul>
              {data.birthdays.map((birthday: NexusGenObjects["Birthday"]) => (
                <li key={birthday.id}>
                  <p>{birthday.name}</p>
                  <p>{birthday.date}</p>
                </li>
              ))}
            </ul>
          )}
        </div>
      </main>

      <footer className="px-8 py-6">
        <a href="/" target="_blank" rel="noopener noreferrer">
          &copy; {new Date().getFullYear()} Lazy Uncle
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
