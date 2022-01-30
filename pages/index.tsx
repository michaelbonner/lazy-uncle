import { useMutation, useQuery } from "@apollo/client";
import { format } from "date-fns";
import type { NextPage } from "next";
import { signIn, useSession } from "next-auth/react";
import { useEffect, useState } from "react";
import CreateBirthdayForm from "../components/CreateBirthdayForm";
import MainLayout from "../components/layout/MainLayout";
import { NexusGenObjects } from "../generated/nexus-typegen";
import {
  DELETE_BIRTHDAY_MUTATION,
  GET_ALL_BIRTHDAYS_QUERY,
} from "../graphql/Birthday";
import getAgeInYears from "../shared/getAgeInYears";
import getDateFromYmdString from "../shared/getDateFromYmdString";

const Home: NextPage = () => {
  const { data: session, status: sessionStatus } = useSession();
  const [workingDates, setWorkingDates] = useState<
    NexusGenObjects["Birthday"][]
  >([]);
  const [filter, setFilter] = useState("");
  const {
    data: birthdaysData,
    loading: birthdaysLoading,
    error: birthdaysError,
  } = useQuery(GET_ALL_BIRTHDAYS_QUERY, {
    variables: { userId: session?.user?.id },
  });

  useEffect(() => {
    if (birthdaysData?.birthdays?.length > 0) {
      const dates = birthdaysData.birthdays.filter(
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
  }, [birthdaysData, filter]);

  const [
    deleteBirthday,
    { data: deleteData, loading: deleteLoading, error: deleteError },
  ] = useMutation(DELETE_BIRTHDAY_MUTATION, {
    refetchQueries: [GET_ALL_BIRTHDAYS_QUERY, "Birthdays"],
  });

  return (
    <MainLayout title="Home">
      <>
        {sessionStatus === "loading" && (
          <p className="py-12 text-center">Loading...</p>
        )}
        {sessionStatus !== "loading" && (
          <main className="max-w-7xl px-4 mx-auto">
            {session?.user ? (
              <div>
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
                  {birthdaysLoading && <p>Loading...</p>}
                  {birthdaysError && <p>Error :(</p>}
                  {workingDates && (
                    <div className="bg-white rounded-lg shadow-lg mt-8 text-gray-600">
                      <div className="grid grid-cols-6 bg-white rounded-t-lg">
                        <p className="py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider col-span-3 pl-4 lg:pl-8">
                          Name
                        </p>
                        <p className="py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Birthday
                        </p>
                        <p className="py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Age
                        </p>
                        <p className="py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider pr-4 lg:pr-8"></p>
                      </div>
                      {workingDates.length ? (
                        <ul className="border-b">
                          {workingDates.map(
                            (birthday: NexusGenObjects["Birthday"]) => (
                              <li
                                key={birthday.id || birthday.name}
                                className={`${
                                  !birthday.id
                                    ? "bg-blue-100 hover:bg-blue-200 text-blue-800 py-2"
                                    : "py-4 hover:bg-gray-100"
                                } border-t grid grid-cols-6`}
                              >
                                <p className="pl-4 lg:pl-8 text-xl col-span-3">
                                  {birthday.name}
                                </p>
                                <p className="text-sm">
                                  {format(
                                    getDateFromYmdString(birthday.date || ""),
                                    "M/dd"
                                  )}
                                </p>
                                <p className="text-sm">
                                  {birthday.id &&
                                    getAgeInYears(
                                      getDateFromYmdString(birthday.date || "")
                                    ) < 30 && (
                                      <span>
                                        {getAgeInYears(
                                          getDateFromYmdString(
                                            birthday.date || ""
                                          )
                                        )}
                                      </span>
                                    )}
                                </p>
                                <div className="text-right pr-4 lg:pr-8">
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
                            )
                          )}
                        </ul>
                      ) : (
                        <div className="py-10 px-8 text-gray-400 italic text-center">
                          No birthdays found.
                        </div>
                      )}
                    </div>
                  )}
                </div>
                <hr className="h-px bg-gray-900 my-12 mx-8" />
                <div className="bg-white rounded-lg shadow-lg mt-12">
                  <div className="border py-8 px-4 lg:px-8 mt-8">
                    <h3 className="text-2xl mb-4">Add new birthday</h3>
                    <CreateBirthdayForm />
                  </div>
                </div>
              </div>
            ) : (
              <div className="flex justify-center mt-8 text-center">
                <div className="flex-auto">
                  <div className="text-lg mb-2">You are not logged in!</div>
                  <button
                    className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
                    onClick={() => signIn()}
                  >
                    Sign in
                  </button>
                </div>
              </div>
            )}
          </main>
        )}
      </>
    </MainLayout>
  );
};

export async function getServerSideProps() {
  return {
    props: {},
  };
}

export default Home;
