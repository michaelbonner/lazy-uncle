import { useQuery } from "@apollo/client";
import { format } from "date-fns";
import { Provider } from "next-auth/providers";
import { getProviders, useSession } from "next-auth/react";
import Link from "next/link";
import { useRouter } from "next/router";
import React, { useEffect, useState } from "react";
import { GrFormFilter } from "react-icons/gr";
import { HiBackspace, HiOutlineCalendar } from "react-icons/hi";
import BirthdayFilterField from "../components/BirthdayFilterField";
import CreateBirthdayForm from "../components/CreateBirthdayForm";
import MainLayout from "../components/layout/MainLayout";
import SortColumnHeader from "../components/SortColumnHeader";
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
          <main className="max-w-7xl mx-auto pb-8 px-2 mt-4">
            <div
              className="bg-gray-50 rounded-lg mt-6 lg:mt-2 text-gray-600 flex items-center justify-center border-t-4 border-t-indigo-400 border-b-4 border-b-gray-400"
              style={{ minHeight: `30vh` }}
            >
              <p className="text-2xl font-bold animate-pulse">
                Loading birthdays
              </p>
            </div>
          </main>
        )}
        {sessionStatus !== "loading" && (
          <main className="max-w-7xl mx-auto pb-8 px-2">
            {session?.user ? (
              <div>
                <div className="flex justify-between lg:justify-end space-x-2 items-end">
                  <div className="text-right mt-2 text-sm">
                    {workingDates.length ? workingDates.length - 1 : 0}/
                    {birthdaysData?.birthdays?.length} visible
                  </div>
                  <div className="flex lg:hidden justify-end items-center space-x-4 mt-4">
                    <button
                      className="flex space-x-2 items-center py-2 px-4 border rounded-md bg-indigo-50 text-gray-800 text-sm"
                      onClick={() => {
                        setShowFilters(!showFilters);
                      }}
                    >
                      <GrFormFilter />
                      <span>Toggle Additional Filters</span>
                    </button>
                  </div>
                </div>

                <div className="text-center">
                  {birthdaysError && <p>Error :(</p>}
                  <div className="bg-gray-50 rounded-lg mt-2 lg:mt-0 text-gray-600 border-b-4 border-b-gray-400">
                    <div className="sticky top-0 z-10 pt-2 bg-indigo-700">
                      <div className="bg-gray-700">
                        <div className="bg-gray-300 py-2 lg:py-3 px-3 lg:px-6 rounded-t-lg grid lg:grid-cols-4 lg:gap-x-6 gap-y-2 border-t-indigo-400 border-t-4">
                          <div className="relative lg:col-span-2">
                            <BirthdayFilterField
                              value={nameFilter}
                              setValue={setNameFilter}
                            />
                          </div>
                          <div
                            className={`${
                              showFilters ? "" : "hidden"
                            } lg:block relative`}
                          >
                            <BirthdayFilterField
                              value={categoryFilter}
                              setValue={setCategoryFilter}
                            />
                          </div>
                          <div
                            className={`${
                              showFilters ? "" : "hidden"
                            } lg:block relative`}
                          >
                            <BirthdayFilterField
                              value={parentFilter}
                              setValue={setParentFilter}
                            />
                          </div>
                        </div>
                      </div>
                      <div className="hidden lg:grid lg:grid-cols-6 bg-indigo-800 px-4 lg:px-8 text-gray-100">
                        <SortColumnHeader
                          ascendingString="name_asc"
                          className="col-span-2"
                          descendingString="name_desc"
                          label="Name"
                          setValue={setSortBy}
                          value={sortBy}
                        />
                        <SortColumnHeader
                          ascendingString="date_asc"
                          className="justify-center"
                          descendingString="date_desc"
                          label="Date"
                          setValue={setSortBy}
                          value={sortBy}
                        />
                        <SortColumnHeader
                          ascendingString="age_asc"
                          className="justify-center"
                          descendingString="age_desc"
                          label="Age"
                          setValue={setSortBy}
                          value={sortBy}
                        />
                        <SortColumnHeader
                          ascendingString="category_asc"
                          className="justify-center"
                          descendingString="category_desc"
                          label="Category"
                          setValue={setSortBy}
                          value={sortBy}
                        />
                        <SortColumnHeader
                          ascendingString="parent_asc"
                          className="justify-center"
                          descendingString="parent_desc"
                          label="Parent"
                          setValue={setSortBy}
                          value={sortBy}
                        />
                      </div>
                    </div>
                    {workingDates.length ? (
                      <ul>
                        {workingDates.map(
                          (birthday: NexusGenObjects["Birthday"]) => (
                            <React.Fragment
                              key={`${birthday.id || birthday.name}`}
                            >
                              {birthday.id ? (
                                <li
                                  className={`hidden lg:grid lg:grid-cols-6 border-t text-left lg:text-center px-4 lg:px-8 hover:bg-gray-100`}
                                >
                                  <p className={`text-left col-span-2 text-xl`}>
                                    <Link href={`/birthday/${birthday.id}`}>
                                      <a className="block py-4">
                                        {birthday.name}
                                      </a>
                                    </Link>
                                  </p>
                                  <p className="text-xl text-indigo-600">
                                    <Link href={`/birthday/${birthday.id}`}>
                                      <a className="block py-4">
                                        {format(
                                          getDateFromYmdString(
                                            birthday.date || ""
                                          ),
                                          "M/dd"
                                        )}
                                      </a>
                                    </Link>
                                  </p>
                                  <p className="block py-4">
                                    {birthday.id &&
                                      getAgeForHumans(
                                        getDateFromYmdString(
                                          birthday.date || ""
                                        )
                                      )}
                                  </p>
                                  <p className="text-ellipsis overflow-hidden relative">
                                    <button
                                      className="block py-4 w-full relative"
                                      onClick={() =>
                                        setCategoryFilter(
                                          birthday.category || ""
                                        )
                                      }
                                      type="button"
                                    >
                                      <span>{birthday.category}</span>
                                    </button>
                                    {categoryFilter &&
                                      categoryFilter === birthday.category && (
                                        <button
                                          className="absolute right-10 top-4"
                                          onClick={() => setCategoryFilter("")}
                                        >
                                          <HiBackspace className="text-xl text-gray-400" />
                                        </button>
                                      )}
                                  </p>
                                  <p className="text-ellipsis overflow-hidden relative">
                                    <button
                                      className="block py-4 w-full"
                                      onClick={() =>
                                        setParentFilter(birthday.parent || "")
                                      }
                                      type="button"
                                    >
                                      <span>{birthday.parent}</span>
                                    </button>
                                    {parentFilter &&
                                      parentFilter === birthday.parent && (
                                        <button
                                          className="absolute right-10 top-4"
                                          onClick={() => setParentFilter("")}
                                        >
                                          <HiBackspace className="text-xl text-gray-400" />
                                        </button>
                                      )}
                                  </p>
                                </li>
                              ) : (
                                <li
                                  className={`hidden lg:grid lg:grid-cols-6 border-t text-left lg:text-center px-4 lg:px-8 bg-indigo-50 hover:bg-indigo-100 text-gray-800`}
                                >
                                  <p
                                    className={`text-gray-500 col-span-2 text-lg py-4`}
                                  >
                                    {birthday.name}
                                  </p>
                                  <p className="text-xl text-indigo-600 py-4">
                                    {format(
                                      getDateFromYmdString(birthday.date || ""),
                                      "M/dd"
                                    )}
                                  </p>
                                </li>
                              )}

                              <li
                                className={`block lg:hidden border-t text-left px-4 cursor-pointer py-4
                                ${!birthday.id && "bg-gray-100 text-gray-800"}`}
                              >
                                <Link href={`/birthday/${birthday.id}`}>
                                  <a className="flex justify-between items-center">
                                    <div>
                                      <p className="text-2xl">
                                        {birthday.name}
                                      </p>
                                      {birthday.id && (
                                        <div className="flex justify-start space-x-4 pt-1">
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
                                        </div>
                                      )}
                                    </div>
                                    <p className="text-xl text-indigo-600">
                                      {format(
                                        getDateFromYmdString(
                                          birthday.date || ""
                                        ),
                                        "M/dd"
                                      )}
                                    </p>
                                  </a>
                                </Link>
                              </li>
                            </React.Fragment>
                          )
                        )}
                      </ul>
                    ) : (
                      <div className="py-10 px-8 text-gray-400">
                        {birthdaysLoading ? (
                          <></>
                        ) : (
                          <div className="prose mx-auto">
                            <h2>No birthdays found</h2>
                            <p>
                              Use the form below to add a birthday or two... or
                              38.
                            </p>
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                </div>
                {birthdaysData?.birthdays?.length > 0 && (
                  <div className="flex justify-end mt-8 text-gray-200">
                    <Link
                      href={`webcal://${currentHost}/api/calendar-subscription/${session?.user?.id}`}
                    >
                      <a className="flex items-center space-x-2 underline text-gray-200 hover:text-gray-100 group transition-all">
                        <HiOutlineCalendar className="text-indigo-400 group-hover:text-gray-200 transition-all" />
                        <span>Subscribe to calendar</span>
                      </a>
                    </Link>
                  </div>
                )}
                <div className="bg-gray-50 rounded-lg mt-24 text-gray-800 border-t-indigo-400 border-t-4 border-b-4 border-b-gray-400">
                  <div className="py-12 px-4 lg:px-8 mt-4 grid lg:grid-cols-12 gap-y-12 gap-x-8 items-center">
                    <div className="lg:col-span-6">
                      <h3 className="text-2xl font-medium mb-4">
                        Add New Birthday
                      </h3>
                      <CreateBirthdayForm />
                    </div>
                    <div className="text-center"></div>
                    <div className="lg:pl-8 lg:col-span-5">
                      <h3 className="text-2xl font-medium mb-4">
                        Import Birthdays From CSV
                      </h3>
                      <UploadCsvBirthdayForm />
                    </div>
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
