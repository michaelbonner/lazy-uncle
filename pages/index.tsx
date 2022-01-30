import { useQuery } from "@apollo/client";
import { format } from "date-fns";
import { Provider } from "next-auth/providers";
import { getProviders, signIn, useSession } from "next-auth/react";
import Link from "next/link";
import { useEffect, useState } from "react";
import { GrGithub, GrGoogle } from "react-icons/gr";
import CreateBirthdayForm from "../components/CreateBirthdayForm";
import MainLayout from "../components/layout/MainLayout";
import UploadCsvBirthdayForm from "../components/UploadCsvBirthdayForm";
import { NexusGenObjects } from "../generated/nexus-typegen";
import { GET_ALL_BIRTHDAYS_QUERY } from "../graphql/Birthday";
import getAgeInYears from "../shared/getAgeInYears";
import getDateFromYmdString from "../shared/getDateFromYmdString";

function Home({ providers }: { providers: Provider[] }) {
  const { data: session, status: sessionStatus } = useSession();
  const [workingDates, setWorkingDates] = useState<
    NexusGenObjects["Birthday"][]
  >([]);
  const [nameFilter, setNameFilter] = useState("");
  const [categoryFilter, setCategoryFilter] = useState("");
  const [parentFilter, setParentFilter] = useState("");
  const {
    data: birthdaysData,
    loading: birthdaysLoading,
    error: birthdaysError,
  } = useQuery(GET_ALL_BIRTHDAYS_QUERY, {
    variables: { userId: session?.user?.id },
  });
  const [currentHref, setCurrentHref] = useState("");

  useEffect(() => {
    if (window.location.href) {
      setCurrentHref(window.location.href);
    }
  }, []);

  useEffect(() => {
    if (birthdaysData?.birthdays?.length > 0) {
      const dates = birthdaysData.birthdays
        .filter((birthday: NexusGenObjects["Birthday"]) => {
          return (
            birthday?.name?.toLowerCase().includes(nameFilter.toLowerCase()) ||
            !birthday.id
          );
        })
        .filter((birthday: NexusGenObjects["Birthday"]) => {
          if (!categoryFilter) {
            return true;
          }
          return (
            birthday?.category
              ?.toLowerCase()
              .includes(categoryFilter.toLowerCase()) || !birthday.id
          );
        })
        .filter((birthday: NexusGenObjects["Birthday"]) => {
          if (!parentFilter) {
            return true;
          }
          return (
            birthday?.parent
              ?.toLowerCase()
              .includes(parentFilter.toLowerCase()) || !birthday.id
          );
        });
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
  }, [birthdaysData, categoryFilter, nameFilter, parentFilter]);

  return (
    <MainLayout title="Lazy Uncle">
      <>
        {sessionStatus === "loading" && (
          <p className="py-12 text-center">Loading...</p>
        )}
        {sessionStatus !== "loading" && (
          <main className="max-w-7xl px-4 mx-auto pb-8">
            {session?.user ? (
              <div>
                <form
                  className="flex items-center justify-end space-x-2"
                  onSubmit={() => {}}
                >
                  <div>
                    <label className="block" htmlFor="nameFilter">
                      Filter by name
                    </label>
                    <input
                      className="block w-full max-w-sm border-gray-300"
                      id="nameFilter"
                      onChange={(e) => setNameFilter(e.target.value)}
                      type="text"
                      value={nameFilter}
                    />
                  </div>
                  <div>
                    <label className="block" htmlFor="categoryFilter">
                      Filter by category
                    </label>
                    <input
                      className="block w-full max-w-sm border-gray-300"
                      id="categoryFilter"
                      onChange={(e) => setCategoryFilter(e.target.value)}
                      type="text"
                      value={categoryFilter}
                    />
                  </div>
                  <div>
                    <label className="block" htmlFor="parentFilter">
                      Filter by parent
                    </label>
                    <input
                      className="block w-full max-w-sm border-gray-300"
                      id="parentFilter"
                      onChange={(e) => setParentFilter(e.target.value)}
                      type="text"
                      value={parentFilter}
                    />
                  </div>
                </form>
                <div className="text-right">
                  {workingDates.length ? workingDates.length - 1 : 0}/
                  {birthdaysData?.birthdays?.length} shown
                </div>
                <div>
                  {birthdaysLoading && <p>Loading...</p>}
                  {birthdaysError && <p>Error :(</p>}
                  {workingDates && (
                    <div className="bg-white rounded-lg shadow-lg mt-8 text-gray-600">
                      <div className="hidden lg:grid lg:grid-cols-7 bg-white rounded-t-lg">
                        <p className="py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider col-span-3 pl-4 lg:pl-8">
                          Name
                        </p>
                        <p className="py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Birthday
                        </p>
                        <p className="py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Age
                        </p>
                        <p className="py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Category
                        </p>
                        <p className="py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Parent
                        </p>
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
                                } border-t grid grid-cols-7`}
                              >
                                <p className="pl-4 lg:pl-8 text-lg col-span-3">
                                  <Link href={`/birthday/${birthday.id}`}>
                                    <a>{birthday.name}</a>
                                  </Link>
                                </p>
                                <p className="text-sm">
                                  <Link href={`/birthday/${birthday.id}`}>
                                    <a>
                                      {format(
                                        getDateFromYmdString(
                                          birthday.date || ""
                                        ),
                                        "M/dd"
                                      )}
                                    </a>
                                  </Link>
                                </p>
                                <p className="text-sm">
                                  <Link href={`/birthday/${birthday.id}`}>
                                    <a>
                                      {birthday.id &&
                                        getAgeInYears(
                                          getDateFromYmdString(
                                            birthday.date || ""
                                          )
                                        ) < 30 && (
                                          <span>
                                            {getAgeInYears(
                                              getDateFromYmdString(
                                                birthday.date || ""
                                              )
                                            )}
                                          </span>
                                        )}
                                    </a>
                                  </Link>
                                </p>
                                <p className="text-ellipsis overflow-hidden">
                                  <Link href={`/birthday/${birthday.id}`}>
                                    <a>{birthday.category}</a>
                                  </Link>
                                </p>
                                <p className="text-ellipsis overflow-hidden pr-4">
                                  <Link href={`/birthday/${birthday.id}`}>
                                    <a>{birthday.parent}</a>
                                  </Link>
                                </p>
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
                {birthdaysData?.birthdays?.length > 0 && (
                  <div className="flex justify-end mt-8">
                    <a
                      href={`webcal://${currentHref}/api/calendar-subscription/${session?.user?.id}`}
                      className="underline text-blue-600"
                    >
                      Subscribe to calendar
                    </a>
                  </div>
                )}
                <hr className="h-px bg-gray-900 my-12 mx-8" />
                <div className="bg-white rounded-lg shadow-lg mt-12">
                  <div className="border py-8 px-4 lg:px-8 mt-4">
                    <h3 className="text-2xl mb-4">Add new birthday</h3>
                    <CreateBirthdayForm />
                    <h3 className="text-2xl mb-4">Import from CSV</h3>
                    <UploadCsvBirthdayForm />
                  </div>
                </div>
              </div>
            ) : (
              <div className="flex justify-center mt-8 text-center">
                <div className="flex flex-col gap-y-6">
                  <div className="text-lg mb-2">
                    <p>
                      Welcome to Lazy Uncle. I built this app to keep track of
                      my nieces&apos; and nephews&apos; birthdays.
                    </p>
                    <p>
                      You can use it for free as well. Let me know if you have
                      any problems.
                    </p>
                  </div>
                  <div className="flex flex-col items-center justify-center space-y-2 my-12">
                    {Object.values(providers).map((provider) => {
                      console.log("provider", provider);
                      return (
                        <button
                          key={provider.name}
                          className={`
                            inline-flex space-x-2 items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500
                            ${
                              provider.id === "google" &&
                              `bg-blue-600 hover:bg-blue-700`
                            }
                            ${
                              provider.id === "github" &&
                              `bg-gray-600 hover:bg-gray-700`
                            }
                            `}
                          onClick={() => signIn(provider.id)}
                        >
                          {provider.id === "github" && <GrGithub />}
                          {provider.id === "google" && <GrGoogle />}
                          <span>Sign in with {provider.name}</span>
                        </button>
                      );
                    })}
                  </div>
                </div>
              </div>
            )}
          </main>
        )}
      </>
    </MainLayout>
  );
}

export async function getServerSideProps() {
  const providers = await getProviders();
  return {
    props: { providers },
  };
}

export default Home;
