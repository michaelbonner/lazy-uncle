import { useMutation, useQuery } from "@apollo/client";
import { format } from "date-fns";
import type { NextPage } from "next";
import Head from "next/head";
import Image from "next/image";
import { useEffect, useState } from "react";
import CreateBirthdayForm from "../components/CreateBirthdayForm";
import { NexusGenObjects } from "../generated/nexus-typegen";
import {
  DELETE_BIRTHDAY_MUTATION,
  GET_ALL_BIRTHDAYS_QUERY,
} from "../graphql/Birthday";
import getAgeInYears from "../shared/getAgeInYears";
import getDateFromYmdString from "../shared/getDateFromYmdString";

const Home: NextPage = () => {
  const [workingDates, setWorkingDates] = useState<
    NexusGenObjects["Birthday"][]
  >([]);
  const [filter, setFilter] = useState("");
  const { data, loading, error } = useQuery(GET_ALL_BIRTHDAYS_QUERY);

  useEffect(() => {
    if (data?.birthdays?.length > 0) {
      const dates = data.birthdays.filter(
        (birthday: NexusGenObjects["Birthday"]) => {
          return (
            birthday?.name?.toLowerCase().includes(filter.toLowerCase()) ||
            !birthday.id
          );
        }
      );
      if (dates.length > 0) {
        setWorkingDates(
          [
            ...dates,
            {
              name: "Today",
              date: format(new Date(), "yyyy-MM-dd"),
            },
          ].sort(
            (
              a: NexusGenObjects["Birthday"],
              b: NexusGenObjects["Birthday"]
            ) => {
              const aDate = format(getDateFromYmdString(a.date || ""), "MM-dd");
              const bDate = format(getDateFromYmdString(b.date || ""), "MM-dd");
              return aDate > bDate ? 1 : -1;
            }
          )
        );
      } else {
        setWorkingDates([]);
      }
    }
  }, [data, filter]);

  const [
    deleteBirthday,
    { data: deleteData, loading: deleteLoading, error: deleteError },
  ] = useMutation(DELETE_BIRTHDAY_MUTATION, {
    refetchQueries: [GET_ALL_BIRTHDAYS_QUERY, "Birthdays"],
  });

  return (
    <div className="bg-gray-100 min-h-screen">
      <Head>
        <title>Lazy Uncle</title>
        <meta
          name="description"
          content="An easy way to keep track of birthdays"
        />
        <link rel="icon" href="/favicon.ico" />
      </Head>

      <header>
        <h1 className="text-4xl font-semibold px-4 lg:px-8 pt-4">
          <Image
            alt="Lazy Uncle"
            height={80}
            src="/lazy-uncle.svg"
            width={200}
          />
        </h1>
      </header>

      <main className="max-w-7xl px-4 mx-auto">
        <form
          className="flex items-center justify-end space-x-2"
          onSubmit={() => {}}
        >
          <label className="block" htmlFor="filter">
            Filter
          </label>
          <input
            className="block w-full max-w-sm border-gray-300"
            id="filter"
            onChange={(e) => setFilter(e.target.value)}
            type="text"
            value={filter}
          />
        </form>
        <div>
          {loading && <p>Loading...</p>}
          {error && <p>Error :(</p>}
          {data && (
            <div className="bg-white rounded-lg shadow-lg mt-8">
              {workingDates.length ? (
                <ul className="border-b">
                  {workingDates.map((birthday: NexusGenObjects["Birthday"]) => (
                    <li
                      key={birthday.id}
                      className={`${
                        !birthday.id ? "bg-blue-100 text-blue-800 py-2" : "py-4"
                      } border-t px-4 lg:px-8 grid grid-cols-6`}
                    >
                      <p className="text-2xl col-span-3">{birthday.name}</p>
                      <p>
                        {format(
                          getDateFromYmdString(birthday.date || ""),
                          "M/dd"
                        )}
                      </p>
                      <p>
                        {birthday.id &&
                          getAgeInYears(
                            getDateFromYmdString(birthday.date || "")
                          ) < 30 && (
                            <span>
                              Age{" "}
                              {getAgeInYears(
                                getDateFromYmdString(birthday.date || "")
                              )}
                            </span>
                          )}
                      </p>
                      <div className="text-right">
                        {birthday.id && (
                          <button
                            className="text-red-500"
                            onClick={() => {
                              if (
                                window.confirm(
                                  "Are you sure you want to delete this?"
                                )
                              ) {
                                deleteBirthday({
                                  variables: {
                                    birthdayId: birthday.id,
                                  },
                                });
                              }
                            }}
                          >
                            x
                          </button>
                        )}
                      </div>
                    </li>
                  ))}
                </ul>
              ) : (
                <div className="py-4 px-8 text-center">No birthdays found.</div>
              )}
            </div>
          )}
        </div>
        <div className="bg-white rounded-lg shadow-lg mt-12">
          <div className="border py-8 px-4 lg:px-8 mt-8">
            <h3 className="text-2xl mb-4">Add new birthday</h3>
            <CreateBirthdayForm />
          </div>
        </div>
      </main>

      <footer className="bg-gray-100 px-4 lg:px-8 py-6">
        &copy; {new Date().getFullYear()}
        {` `}
        <a className="text-blue-600 underline" href="https://michaelbonner.dev">
          Michael Bonner
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
