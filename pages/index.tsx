import { useQuery } from "@apollo/client";
import type { NextPage } from "next";
import Head from "next/head";
import Image from "next/image";
import { NexusGenObjects } from "../generated/nexus-typegen";
import CreateBirthdayForm from "../components/CreateBirthdayForm";
import { GET_ALL_BIRTHDAYS_QUERY } from "../graphql/Birthday";

const Home: NextPage = () => {
  const { data, loading, error } = useQuery(GET_ALL_BIRTHDAYS_QUERY);

  return (
    <div className="flex flex-col min-h-screen justify-between">
      <Head>
        <title>Lazy Uncle</title>
        <meta
          name="description"
          content="An easy way to keep track of birthdays"
        />
        <link rel="icon" href="/favicon.ico" />
      </Head>

      <header>
        <h1 className="text-4xl font-semibold px-8 py-4">
          <Image
            alt="Lazy Uncle"
            height={80}
            src="/lazy-uncle.svg"
            width={200}
          />
        </h1>
      </header>

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
        <div className="border py-4 px-8 mt-8">
          <h3 className="text-xl">Add new birthday</h3>
          <CreateBirthdayForm />
        </div>
      </main>

      <footer className="bg-gray-100 px-8 py-6">
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
