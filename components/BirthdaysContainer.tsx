import { useQuery } from "@apollo/client";
import { format } from "date-fns";
import { useSession } from "next-auth/react";
import dynamic from "next/dynamic";
import Link from "next/link";
import { useContext, useEffect, useState } from "react";
import { GrFormFilter, GrRefresh } from "react-icons/gr";
import { HiOutlineCalendar, HiXCircle } from "react-icons/hi";
import { NexusGenObjects } from "../generated/nexus-typegen";
import { GET_ALL_BIRTHDAYS_QUERY } from "../graphql/Birthday";
import { SearchContext } from "../providers/SearchProvider";
import getDateFromYmdString from "../shared/getDateFromYmdString";
import { getDaysUntilNextBirthday } from "../shared/getDaysUntilNextBirthday";
import getZodiacSignForDateYmdString from "../shared/getZodiacSignForDateYmdString";
import BirthdayFilterField from "./BirthdayFilterField";
import BirthdayRow from "./BirthdayRow";
import LoadingSpinner from "./LoadingSpinner";
import SortColumnHeader from "./SortColumnHeader";

const AddBirthdayDialog = dynamic(() => import("./AddBirthdayDialog"));
const UploadCsvBirthdayForm = dynamic(() => import("./UploadCsvBirthdayForm"));

const BirthdaysContainer = ({ userId }: { userId: string }) => {
  const [workingDates, setWorkingDates] = useState<
    NexusGenObjects["Birthday"][]
  >([]);
  const [workingDatesCount, setWorkingDatesCount] = useState(0);
  const {
    isFiltered,
    clearFilters,
    nameFilter,
    setNameFilter,
    categoryFilter,
    setCategoryFilter,
    parentFilter,
    setParentFilter,
    zodiacSignFilter,
    setZodiacSignFilter,
    sortBy,
    setSortBy,
    showFilters,
    setShowFilters,
  } = useContext(SearchContext);
  const {
    data: birthdaysData,
    loading: birthdaysLoading,
    error: birthdaysError,
    refetch: birthdaysRefetch,
  } = useQuery(GET_ALL_BIRTHDAYS_QUERY);
  const [currentHost, setCurrentHost] = useState("");
  const { status: sessionStatus } = useSession();
  const [upcomingBirthdays, setUpcomingBirthdays] = useState<
    NexusGenObjects["Birthday"][]
  >([]);
  const [isAddBirthdayDialogVisible, setIsAddBirthdayDialogVisible] =
    useState(false);

  useEffect(() => {
    if (window.location.host) {
      setCurrentHost(window.location.host);
    }
  }, []);

  useEffect(() => {
    const refetchQuery = () => birthdaysRefetch();
    window.addEventListener("focus", refetchQuery);
    return () => window.removeEventListener("focus", refetchQuery);
  });

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
        })
        .filter((birthday: NexusGenObjects["Birthday"]) => {
          if (!zodiacSignFilter) {
            return true;
          }
          const birthdayZodiacSign = getZodiacSignForDateYmdString(
            birthday?.date || ""
          );
          return (
            birthdayZodiacSign
              .toLowerCase()
              .includes(zodiacSignFilter.toLowerCase()) || !birthday.id
          );
        });
      if (dates.length > 0) {
        const unsortedDates = [...dates];
        setWorkingDatesCount(unsortedDates.length);
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
              if (sortBy === "sign_asc") {
                const aZodiacSign = getZodiacSignForDateYmdString(a.date || "");
                const bZodiacSign = getZodiacSignForDateYmdString(b.date || "");
                return (aZodiacSign || "") > (bZodiacSign || "") ? 1 : -1;
              }
              if (sortBy === "sign_desc") {
                const aZodiacSign = getZodiacSignForDateYmdString(a.date || "");
                const bZodiacSign = getZodiacSignForDateYmdString(b.date || "");
                return (aZodiacSign || "") > (bZodiacSign || "") ? -1 : 1;
              }

              return 1;
            }
          )
        );
      } else {
        setWorkingDates([]);
      }
    }
  }, [
    birthdaysData,
    categoryFilter,
    nameFilter,
    parentFilter,
    sortBy,
    zodiacSignFilter,
  ]);

  useEffect(() => {
    if (birthdaysData?.birthdays?.length < 1) {
      return;
    }

    const upcoming = birthdaysData?.birthdays?.filter(
      (birthday: NexusGenObjects["Birthday"]) => {
        return (
          getDaysUntilNextBirthday(birthday) <= 7 ||
          getDaysUntilNextBirthday(birthday) > 364
        );
      }
    );

    setUpcomingBirthdays(
      upcoming?.sort(
        (a: NexusGenObjects["Birthday"], b: NexusGenObjects["Birthday"]) => {
          const aDaysUntilNextBirthday = getDaysUntilNextBirthday(a);
          const bDaysUntilNextBirthday = getDaysUntilNextBirthday(b);
          return aDaysUntilNextBirthday > bDaysUntilNextBirthday ? 1 : -1;
        }
      )
    );
  }, [birthdaysData]);

  const handleRefresh = async () => {
    await birthdaysRefetch();
  };

  return (
    <div>
      {upcomingBirthdays?.length > 0 && (
        <div className="md:flex gap-x-8 items-center border-t-4 border-b-4 border-gray-300 bg-gray-100 text-cyan-800 py-4 px-8 rounded-lg shadow-lg my-4">
          <h2 className="text-2xl font-medium">Upcoming Birthdays</h2>
          <div className="mt-3 md:mt-0 flex gap-x-6 gap-y-2 items-center flex-wrap">
            {upcomingBirthdays.map((birthday: NexusGenObjects["Birthday"]) => {
              const daysLabel =
                getDaysUntilNextBirthday(birthday) === 0 ? (
                  <span className="font-bold">Today</span>
                ) : (
                  <span>
                    <span className="font-light">in </span>
                    {getDaysUntilNextBirthday(birthday)} days
                  </span>
                );
              return (
                <div key={birthday.id}>
                  <span className="font-light">{birthday.name}</span>{" "}
                  {daysLabel}
                </div>
              );
            })}
          </div>
        </div>
      )}
      <div className="flex justify-between md:justify-end space-x-2 items-end">
        <div className="pl-2 md:pl-0 md:flex md:space-x-4 items-center">
          <button
            className={`${
              isFiltered ? "text-cyan-50" : "text-cyan-500"
            } flex items-center space-x-1`}
            disabled={!isFiltered}
            onClick={() => clearFilters()}
          >
            <HiXCircle />
            <span>Clear Filters</span>
          </button>
          <div className="md:text-right text-sm text-cyan-300">
            {workingDatesCount}/{birthdaysData?.birthdays?.length} visible
          </div>
        </div>
        <div className="flex md:hidden justify-end items-center space-x-4 mt-4">
          <button
            className="flex space-x-2 items-center py-2 px-4 border rounded-md bg-cyan-50 text-gray-800 text-sm"
            onClick={() => {
              setShowFilters(!showFilters);
            }}
          >
            <GrFormFilter />
            <span>Toggle Additional Filters</span>
          </button>
        </div>
      </div>

      <AddBirthdayDialog
        isOpen={isAddBirthdayDialogVisible}
        handleClose={() => setIsAddBirthdayDialogVisible(false)}
      />

      <div className="text-center">
        {birthdaysError && <p className="pt-3">{birthdaysError.message}</p>}
        <div className="bg-gray-50 rounded-lg mt-2 md:mt-0 text-gray-600 border-b-4 border-b-gray-400">
          <div className="sticky top-0 z-10 pt-2 bg-cyan-600">
            <div className="bg-cyan-600">
              <div className="bg-gray-300 py-2 md:py-3 px-3 md:px-6 rounded-t-lg flex gap-x-2 gap-y-2 border-t-gray-400 border-t-4">
                <button
                  className="bg-gray-200 flex items-center justify-center rounded-md px-4"
                  onClick={() =>
                    setIsAddBirthdayDialogVisible(!isAddBirthdayDialogVisible)
                  }
                >
                  +
                </button>
                <div className="relative grow-1 w-full min-w-[220px]">
                  <BirthdayFilterField
                    disabled={
                      !birthdaysData?.birthdays?.length && !workingDates.length
                    }
                    label="Name"
                    value={nameFilter}
                    setValue={setNameFilter}
                  />
                </div>
                <div className="flex md:hidden">
                  <button
                    className="bg-gray-200 ml-2 w-full flex items-center justify-center rounded-md"
                    onClick={handleRefresh}
                  >
                    <GrRefresh
                      className={`${birthdaysLoading && "animate-spin"} w-10`}
                    />
                  </button>
                </div>
                <div
                  className={`${
                    showFilters ? "" : "hidden"
                  } min-w-[220px] md:block relative`}
                >
                  <BirthdayFilterField
                    disabled={
                      !birthdaysData?.birthdays?.length && !workingDates.length
                    }
                    label="Category"
                    value={categoryFilter}
                    setValue={setCategoryFilter}
                  />
                </div>
                <div
                  className={`${
                    showFilters ? "" : "hidden"
                  } min-w-[220px] md:block relative`}
                >
                  <BirthdayFilterField
                    disabled={
                      !birthdaysData?.birthdays?.length && !workingDates.length
                    }
                    label="Parent"
                    value={parentFilter}
                    setValue={setParentFilter}
                  />
                </div>
                <div
                  className={`${
                    showFilters ? "" : "hidden"
                  } min-w-[220px] md:block relative`}
                >
                  <BirthdayFilterField
                    disabled={
                      !birthdaysData?.birthdays?.length && !workingDates.length
                    }
                    label="Zodiac Sign"
                    value={zodiacSignFilter}
                    setValue={setZodiacSignFilter}
                  />
                </div>
              </div>
            </div>
            <div className="hidden md:grid md:grid-cols-12 bg-cyan-800 px-4 md:px-8 text-gray-100">
              <SortColumnHeader
                ascendingString="name_asc"
                className="col-span-3"
                descendingString="name_desc"
                label="Name"
                setValue={setSortBy}
                value={sortBy}
              />
              <SortColumnHeader
                ascendingString="date_asc"
                className="justify-center col-span-2"
                descendingString="date_desc"
                label="Date"
                setValue={setSortBy}
                value={sortBy}
              />
              <SortColumnHeader
                ascendingString="age_asc"
                className="justify-center col-span-2"
                descendingString="age_desc"
                label="Age"
                setValue={setSortBy}
                value={sortBy}
              />
              <SortColumnHeader
                ascendingString="category_asc"
                className="justify-center col-span-2"
                descendingString="category_desc"
                label="Category"
                setValue={setSortBy}
                value={sortBy}
              />
              <SortColumnHeader
                ascendingString="parent_asc"
                className="justify-center col-span-2"
                descendingString="parent_desc"
                label="Parent"
                setValue={setSortBy}
                value={sortBy}
              />
              <SortColumnHeader
                ascendingString="sign_asc"
                className="justify-center"
                descendingString="sign_desc"
                label="Sign"
                setValue={setSortBy}
                value={sortBy}
              />
            </div>
          </div>
          {workingDates.length ? (
            <ul>
              {workingDates.map((birthday: NexusGenObjects["Birthday"]) => {
                return (
                  <BirthdayRow
                    birthday={birthday}
                    categoryFilter={categoryFilter}
                    key={`${birthday.id || birthday.name}`}
                    parentFilter={parentFilter}
                    setCategoryFilter={setCategoryFilter}
                    setParentFilter={setParentFilter}
                    setZodiacSignFilter={setZodiacSignFilter}
                    zodiacSignFilter={zodiacSignFilter}
                  />
                );
              })}
            </ul>
          ) : (
            <div className="py-10 px-8 text-gray-400">
              {sessionStatus === "loading" || birthdaysLoading ? (
                <div className="flex items-center justify-center min-h-[300px]">
                  <LoadingSpinner spinnerTextColor="text-cyan-40" />
                </div>
              ) : (
                <div className="prose mx-auto">
                  <h2>No birthdays found</h2>
                  <p>Use the form below to add a birthday or two... or 38.</p>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
      {birthdaysData?.birthdays?.length > 0 && (
        <div className="flex justify-end mt-8 text-gray-200">
          <Link
            href={`webcal://${currentHost}/api/calendar-subscription/${userId}`}
            className="flex items-center space-x-2 underline text-gray-200 hover:text-gray-100 group transition-all"
          >
            <HiOutlineCalendar className="text-cyan-400 group-hover:text-gray-200 transition-all" />
            <span>Subscribe to calendar</span>
          </Link>
        </div>
      )}
      <div className="bg-gray-50 rounded-lg mt-24 text-gray-800 border-t-gray-400 border-t-4 border-b-4 border-b-gray-400">
        <div className="py-12 px-4 md:px-8 mt-4">
          <div className="max-w-2xl">
            <h3 className="text-2xl font-medium mb-4">
              Import Birthdays From CSV
            </h3>
            <UploadCsvBirthdayForm />
          </div>
        </div>
      </div>
    </div>
  );
};
export default BirthdaysContainer;
