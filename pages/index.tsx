import { useQuery } from "@apollo/client";
import { format } from "date-fns";
import { Provider } from "next-auth/providers";
import { getProviders, useSession } from "next-auth/react";
import Link from "next/link";
import { useRouter } from "next/router";
import React, { useEffect, useState } from "react";
import { GrFormCalendar, GrFormFilter } from "react-icons/gr";
import {
  HiOutlineSortAscending,
  HiOutlineSortDescending,
  HiSearch,
} from "react-icons/hi";
import CreateBirthdayForm from "../components/CreateBirthdayForm";
import MainLayout from "../components/layout/MainLayout";
import UploadCsvBirthdayForm from "../components/UploadCsvBirthdayForm";
import Welcome from "../components/Welcome";
import { NexusGenObjects } from "../generated/nexus-typegen";
import { GET_ALL_BIRTHDAYS_QUERY } from "../graphql/Birthday";
import getAgeForHumans from "../shared/getAgeForHumans";
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
  const [currentHost, setCurrentHost] = useState("");
  const [showFilters, setShowFilters] = useState(false);
  const [sortBy, setSortBy] = useState("date_asc");
  const router = useRouter();

  useEffect(() => {
    if (window.location.host) {
      setCurrentHost(window.location.host);
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
        const unsortedDates = [...dates];
        if (sortBy.substring(0, 4) === "date" && unsortedDates.length > 4) {
          unsortedDates.push({
            name: "Today",
            date: format(new Date(), "yyyy-MM-dd"),
          });
        }
        setWorkingDates(
          unsortedDates.sort(
            (
              a: NexusGenObjects["Birthday"],
              b: NexusGenObjects["Birthday"]
            ) => {
              if (sortBy === "date_asc") {
                const aDate = format(
                  getDateFromYmdString(a.date || ""),
                  "MM-dd"
                );
                const bDate = format(
                  getDateFromYmdString(b.date || ""),
                  "MM-dd"
                );
                return aDate > bDate ? 1 : -1;
              }
              if (sortBy === "date_desc") {
                const aDate = format(
                  getDateFromYmdString(a.date || ""),
                  "MM-dd"
                );
                const bDate = format(
                  getDateFromYmdString(b.date || ""),
                  "MM-dd"
                );
                return aDate > bDate ? -1 : 1;
              }
              if (sortBy === "name_asc") {
                return (a.name || "") > (b.name || "") ? 1 : -1;
              }
              if (sortBy === "name_desc") {
                return (a.name || "") > (b.name || "") ? -1 : 1;
              }
              if (sortBy === "age_asc") {
                return (a.date || "") > (b.date || "") ? 1 : -1;
              }
              if (sortBy === "age_desc") {
                return (a.date || "") > (b.date || "") ? -1 : 1;
              }
              if (sortBy === "category_asc") {
                return (a.category || "") > (b.category || "") ? 1 : -1;
              }
              if (sortBy === "category_desc") {
                return (a.category || "") > (b.category || "") ? -1 : 1;
              }
              if (sortBy === "parent_asc") {
                return (a.parent || "") > (b.parent || "") ? 1 : -1;
              }
              if (sortBy === "parent_desc") {
                return (a.parent || "") > (b.parent || "") ? -1 : 1;
              }

              return 1;
            }
          )
        );
      } else {
        setWorkingDates([]);
      }
    }
  }, [birthdaysData, categoryFilter, nameFilter, parentFilter, sortBy]);

  return (
    <MainLayout title="Lazy Uncle">
      <>
        {sessionStatus === "loading" && (
          <p className="py-12 text-center">Loading...</p>
        )}
        {sessionStatus !== "loading" && (
          <main className="max-w-7xl px-2 mx-auto pb-8">
            {session?.user ? (
              <div>
                <div className="flex lg:hidden justify-end items-center space-x-4">
                  <div>
                    {workingDates.length ? workingDates.length - 1 : 0}/
                    {birthdaysData?.birthdays?.length} visible
                  </div>
                  <button
                    className="flex space-x-2 items-center py-2 px-4 border rounded-lg bg-white"
                    onClick={() => {
                      setShowFilters(!showFilters);
                    }}
                  >
                    <GrFormFilter />
                    <span>Toggle Filters</span>
                  </button>
                </div>
                <form
                  className={`${
                    showFilters ? "grid" : "hidden lg:grid"
                  } grid-cols-2 lg:grid-cols-3 gap-4 mt-4 max-w-3xl ml-auto px-4 bg-slate-50 lg:bg-transparent py-4 lg:py-0 rounded`}
                  onSubmit={() => {}}
                >
                  <div className="hidden lg:block">
                    <label
                      className="block text-slate-700"
                      htmlFor="nameFilter"
                    >
                      Name
                    </label>
                    <input
                      className="block w-full border-slate-300"
                      id="nameFilter"
                      onChange={(e) => setNameFilter(e.target.value)}
                      type="text"
                      value={nameFilter}
                    />
                  </div>
                  <div>
                    <label
                      className="block text-slate-700"
                      htmlFor="categoryFilter"
                    >
                      Category
                    </label>
                    <input
                      className="block w-full border-slate-300"
                      id="categoryFilter"
                      onChange={(e) => setCategoryFilter(e.target.value)}
                      type="text"
                      value={categoryFilter}
                    />
                  </div>
                  <div>
                    <label
                      className="block text-slate-700"
                      htmlFor="parentFilter"
                    >
                      Parent
                    </label>
                    <input
                      className="block w-full border-slate-300"
                      id="parentFilter"
                      onChange={(e) => setParentFilter(e.target.value)}
                      type="text"
                      value={parentFilter}
                    />
                  </div>
                </form>
                <div className="text-center">
                  {birthdaysLoading && <p>Loading...</p>}
                  {birthdaysError && <p>Error :(</p>}
                  {workingDates && (
                    <div className="bg-white rounded-lg shadow-lg mt-8 text-slate-600">
                      <div className="sticky bg-slate-200 top-0 lg:hidden">
                        <div className="bg-slate-300 py-2 px-3 rounded-t-lg relative">
                          <input
                            className="block w-full py-3 px-4 rounded text-slate-700 focus:outline-none bg-slate-200 focus:bg-white border-0 focus:border-slate-400 placeholder:text-slate-300"
                            id="nameFilter"
                            onChange={(e) => setNameFilter(e.target.value)}
                            placeholder="Filter by name"
                            type="text"
                            value={nameFilter}
                          />
                          <HiSearch className="text-xl text-slate-400 absolute right-6 top-6" />
                        </div>
                      </div>
                      <div className="hidden lg:grid lg:grid-cols-6 bg-white rounded-t-lg px-4 lg:px-8">
                        <button
                          className="flex space-x-1 items-center py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider col-span-2"
                          type="button"
                          onClick={() => {
                            if (sortBy === "name_asc") {
                              setSortBy("name_desc");
                            } else {
                              setSortBy("name_asc");
                            }
                          }}
                        >
                          <span>Name</span>
                          {sortBy === "name_asc" && <HiOutlineSortDescending />}
                          {sortBy === "name_desc" && <HiOutlineSortAscending />}
                        </button>
                        <button
                          className="flex space-x-1 justify-center items-center py-3 text-xs font-medium text-slate-500 uppercase tracking-wider"
                          type="button"
                          onClick={() => {
                            if (sortBy === "date_asc") {
                              setSortBy("date_desc");
                            } else {
                              setSortBy("date_asc");
                            }
                          }}
                        >
                          <span>Birthday</span>
                          {sortBy === "date_asc" && <HiOutlineSortDescending />}
                          {sortBy === "date_desc" && <HiOutlineSortAscending />}
                        </button>
                        <button
                          className="flex space-x-1 justify-center items-center py-3 text-xs font-medium text-slate-500 uppercase tracking-wider"
                          type="button"
                          onClick={() => {
                            if (sortBy === "age_asc") {
                              setSortBy("age_desc");
                            } else {
                              setSortBy("age_asc");
                            }
                          }}
                        >
                          <span>Age</span>
                          {sortBy === "age_asc" && <HiOutlineSortDescending />}
                          {sortBy === "age_desc" && <HiOutlineSortAscending />}
                        </button>
                        <button
                          className="flex space-x-1 justify-center items-center py-3 text-xs font-medium text-slate-500 uppercase tracking-wider"
                          type="button"
                          onClick={() => {
                            if (sortBy === "category_asc") {
                              setSortBy("category_desc");
                            } else {
                              setSortBy("category_asc");
                            }
                          }}
                        >
                          <span>Category</span>
                          {sortBy === "category_asc" && (
                            <HiOutlineSortDescending />
                          )}
                          {sortBy === "category_desc" && (
                            <HiOutlineSortAscending />
                          )}
                        </button>
                        <button
                          className="flex space-x-1 justify-center items-center py-3 text-xs font-medium text-slate-500 uppercase tracking-wider"
                          type="button"
                          onClick={() => {
                            if (sortBy === "parent_asc") {
                              setSortBy("parent_desc");
                            } else {
                              setSortBy("parent_asc");
                            }
                          }}
                        >
                          <span>Parent</span>
                          {sortBy === "parent_asc" && (
                            <HiOutlineSortDescending />
                          )}
                          {sortBy === "parent_desc" && (
                            <HiOutlineSortAscending />
                          )}
                        </button>
                      </div>
                      {workingDates.length ? (
                        <ul className="border-b">
                          {workingDates.map(
                            (birthday: NexusGenObjects["Birthday"]) => (
                              <React.Fragment
                                key={`${birthday.id || birthday.name}`}
                              >
                                <li
                                  className={`hidden lg:grid lg:grid-cols-6 border-t text-left lg:text-center px-4 lg:px-8 cursor-pointer
                                ${
                                  !birthday.id
                                    ? "bg-blue-100 hover:bg-blue-200 text-blue-800 py-2"
                                    : "py-4 hover:bg-slate-100"
                                }`}
                                  onClick={() => {
                                    if (birthday.id) {
                                      router.push(`/birthday/${birthday.id}`);
                                    }
                                  }}
                                >
                                  <p className="text-lg col-span-2 text-left">
                                    {birthday.name}
                                  </p>
                                  <p className="text-xl text-blue-600">
                                    {format(
                                      getDateFromYmdString(birthday.date || ""),
                                      "M/dd"
                                    )}
                                  </p>
                                  <p>
                                    {birthday.id &&
                                      getAgeForHumans(
                                        getDateFromYmdString(
                                          birthday.date || ""
                                        )
                                      )}
                                  </p>
                                  <p className="text-ellipsis overflow-hidden">
                                    {birthday.category}
                                  </p>
                                  <p className="text-ellipsis overflow-hidden">
                                    {birthday.parent}
                                  </p>
                                </li>
                                <li
                                  className={`block lg:hidden border-t text-left px-4 cursor-pointer
                                ${
                                  !birthday.id
                                    ? "bg-blue-100 hover:bg-blue-200 text-blue-800 py-2"
                                    : "py-4 hover:bg-slate-100"
                                }`}
                                  onClick={() => {
                                    if (birthday.id) {
                                      router.push(`/birthday/${birthday.id}`);
                                    }
                                  }}
                                >
                                  <div className="flex justify-between items-center">
                                    <div>
                                      <p className="text-2xl">
                                        {birthday.name}
                                      </p>
                                      <div className="flex justify-start space-x-4 pt-1">
                                        {birthday.id && (
                                          <>
                                            {getAgeForHumans(
                                              getDateFromYmdString(
                                                birthday.date || ""
                                              )
                                            ) && (
                                              <p>
                                                <span className="font-light text-sm">
                                                  Age
                                                </span>{" "}
                                                <span className="font-medium">
                                                  {getAgeForHumans(
                                                    getDateFromYmdString(
                                                      birthday.date || ""
                                                    )
                                                  )}
                                                </span>
                                              </p>
                                            )}
                                            {birthday.parent && (
                                              <p className="text-ellipsis overflow-hidden">
                                                <span className="font-light text-sm">
                                                  Parent{" "}
                                                </span>
                                                <span className="font-medium">
                                                  {birthday.parent}
                                                </span>
                                              </p>
                                            )}
                                          </>
                                        )}
                                      </div>
                                    </div>
                                    <p className="text-xl text-blue-600">
                                      {format(
                                        getDateFromYmdString(
                                          birthday.date || ""
                                        ),
                                        "M/dd"
                                      )}
                                    </p>
                                  </div>
                                </li>
                              </React.Fragment>
                            )
                          )}
                        </ul>
                      ) : (
                        <div className="py-10 px-8 text-slate-400 italic text-center">
                          {birthdaysLoading
                            ? "Loading..."
                            : "No birthdays found"}
                        </div>
                      )}
                    </div>
                  )}
                </div>
                {birthdaysData?.birthdays?.length > 0 && (
                  <div className="flex justify-end mt-8">
                    <Link
                      href={`webcal://${currentHost}/api/calendar-subscription/${session?.user?.id}`}
                    >
                      <a className="flex items-center space-x-1 underline text-blue-600">
                        <GrFormCalendar className="text-blue-600" />
                        <span>Subscribe to calendar</span>
                      </a>
                    </Link>
                  </div>
                )}
                <hr className="h-px bg-slate-900 my-12 mx-8" />
                <div className="bg-white rounded-lg shadow-lg mt-12">
                  <div className="border py-8 px-4 lg:px-8 mt-4">
                    <h3 className="text-2xl mb-4">Add new birthday</h3>
                    <CreateBirthdayForm />
                    <hr className="h-px bg-slate-900 my-12 mx-8" />
                    <h3 className="text-2xl mb-4">Import from CSV</h3>
                    <UploadCsvBirthdayForm />
                  </div>
                </div>
              </div>
            ) : (
              <Welcome providers={providers} />
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
