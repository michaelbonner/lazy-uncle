import { useQuery } from "@apollo/client";
import { format } from "date-fns";
import { useSession } from "next-auth/react";
import dynamic from "next/dynamic";
import Link from "next/link";
import { useContext, useEffect, useMemo, useState } from "react";
import { BsFillCaretDownFill } from "react-icons/bs";
import { GrFormFilter, GrRefresh } from "react-icons/gr";
import { HiOutlineCalendar, HiXCircle } from "react-icons/hi";
import classNames from "../functions/classNames";
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

const AddBirthdayDialog = dynamic(() => import("./AddBirthdayDialog"), {
  ssr: false,
});
const UploadCsvBirthdayForm = dynamic(() => import("./UploadCsvBirthdayForm"), {
  ssr: false,
});
const OnboardingWalkthrough = dynamic(() => import("./OnboardingWalkthrough"), {
  ssr: false,
});

const BirthdaysContainer = ({ userId }: { userId: string }) => {
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
  } = useQuery(GET_ALL_BIRTHDAYS_QUERY, {
    fetchPolicy: "cache-and-network",
  });
  const [currentHost, setCurrentHost] = useState("");
  const { status: sessionStatus } = useSession();
  const [isAddBirthdayDialogVisible, setIsAddBirthdayDialogVisible] =
    useState(false);

  const workingDates: NexusGenObjects["Birthday"][] = useMemo(() => {
    if (!birthdaysData?.birthdays?.length) {
      return [];
    }

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

    if (dates.length < 1) return [];

    const unsortedDates = [...dates];
    if (sortBy.substring(0, 4) === "date" && unsortedDates.length > 4) {
      unsortedDates.push({
        name: "Today",
        date: format(new Date(), "yyyy-MM-dd"),
      });
    }
    return unsortedDates.sort(
      (a: NexusGenObjects["Birthday"], b: NexusGenObjects["Birthday"]) => {
        if (sortBy === "date_asc") {
          const aDate = format(getDateFromYmdString(a.date || ""), "MM-dd");
          const bDate = format(getDateFromYmdString(b.date || ""), "MM-dd");
          return aDate > bDate ? 1 : -1;
        }
        if (sortBy === "date_desc") {
          const aDate = format(getDateFromYmdString(a.date || ""), "MM-dd");
          const bDate = format(getDateFromYmdString(b.date || ""), "MM-dd");
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
    );
  }, [
    birthdaysData,
    categoryFilter,
    nameFilter,
    parentFilter,
    sortBy,
    zodiacSignFilter,
  ]);

  const workingDatesCount = useMemo(() => {
    return workingDates.filter((date) => date.name !== "Today").length;
  }, [workingDates]);

  const birthdaysCount = useMemo(() => {
    return birthdaysData?.birthdays?.length || 0;
  }, [birthdaysData]);

  const upcomingBirthdays: NexusGenObjects["Birthday"][] = useMemo(() => {
    if (birthdaysData?.birthdays?.length < 1) {
      return [];
    }

    const upcoming = birthdaysData?.birthdays?.filter(
      (birthday: NexusGenObjects["Birthday"]) => {
        return (
          getDaysUntilNextBirthday(birthday) <= 7 ||
          getDaysUntilNextBirthday(birthday) > 364
        );
      }
    );

    return upcoming?.sort(
      (a: NexusGenObjects["Birthday"], b: NexusGenObjects["Birthday"]) => {
        const aDaysUntilNextBirthday = getDaysUntilNextBirthday(a);
        const bDaysUntilNextBirthday = getDaysUntilNextBirthday(b);
        return aDaysUntilNextBirthday > bDaysUntilNextBirthday ? 1 : -1;
      }
    );
  }, [birthdaysData]);

  const handleRefresh = async () => {
    await birthdaysRefetch();
  };

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

  return (
    <div>
      {!birthdaysLoading && !birthdaysCount && <OnboardingWalkthrough />}
      {upcomingBirthdays?.length > 0 && (
        <div className="my-4 items-center gap-x-8 rounded-lg border-b-4 border-t-4 border-gray-300 bg-gray-100 px-8 py-4 text-cyan-800 shadow-lg md:flex">
          <h2 className="text-2xl font-medium">Upcoming Birthdays</h2>
          <div className="mt-3 flex flex-wrap items-center gap-x-6 gap-y-2 md:mt-0">
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
      <div className="flex items-end justify-between space-x-2 md:justify-end">
        <div className="items-center pl-2 md:flex md:space-x-4 md:pl-0">
          <button
            className={`${
              isFiltered ? "text-cyan-50" : "text-cyan-500"
            } js-clear-filters flex items-center space-x-1`}
            disabled={!isFiltered}
            onClick={() => clearFilters()}
          >
            <HiXCircle />
            <span>Clear Filters</span>
          </button>
          <div className="text-sm text-cyan-300 md:text-right">
            {workingDatesCount}/{birthdaysData?.birthdays?.length} visible
          </div>
        </div>
        <div className="mt-4 flex items-center justify-end space-x-4 md:hidden">
          <button
            className="flex items-center space-x-2 rounded-md border bg-cyan-50 px-4 py-2 text-sm text-gray-800"
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
        <div className="mt-2 rounded-lg border-b-4 border-b-gray-400 bg-gray-50 text-gray-600 md:mt-0">
          <div className="sticky top-0 z-10 bg-cyan-600 pt-2">
            <div className="bg-cyan-600">
              <div className="flex gap-x-2 gap-y-2 rounded-t-lg border-t-4 border-t-gray-400 bg-gray-300 px-3 py-2 md:px-6 md:py-3">
                <button
                  className="js-add-birthday-button flex items-center justify-center rounded-md bg-gray-200 px-4"
                  onClick={() =>
                    setIsAddBirthdayDialogVisible(!isAddBirthdayDialogVisible)
                  }
                >
                  +
                </button>
                <div className="grow-1 relative w-full min-w-[220px]">
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
                    className="ml-2 flex w-full items-center justify-center rounded-md bg-gray-200"
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
                  } relative min-w-[220px] md:block`}
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
                  } relative min-w-[220px] md:block`}
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
                  } relative min-w-[220px] md:block`}
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
            <div className="hidden bg-cyan-800 px-4 text-gray-100 md:grid md:grid-cols-12 md:px-8">
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
                className="col-span-2 justify-center"
                descendingString="date_desc"
                label="Date"
                setValue={setSortBy}
                value={sortBy}
              />
              <SortColumnHeader
                ascendingString="age_asc"
                className="col-span-2 justify-center"
                descendingString="age_desc"
                label="Age"
                setValue={setSortBy}
                value={sortBy}
              />
              <SortColumnHeader
                ascendingString="category_asc"
                className="col-span-2 justify-center"
                descendingString="category_desc"
                label="Category"
                setValue={setSortBy}
                value={sortBy}
              />
              <SortColumnHeader
                ascendingString="parent_asc"
                className="col-span-2 justify-center"
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
          {workingDatesCount ? (
            <ul>
              <li>
                <button
                  className={classNames(
                    "flex w-full items-center justify-center gap-2 py-2 text-cyan-700",
                    "hover:bg-gray-100"
                  )}
                  onClick={() => {
                    const desktopTodayElement: HTMLElement | null =
                      document.querySelector("#desktop-today");
                    const mobileTodayElement: HTMLElement | null =
                      document.querySelector("#mobile-today");

                    if (desktopTodayElement || mobileTodayElement) {
                      if (desktopTodayElement?.offsetTop) {
                        window.scrollTo({
                          top: desktopTodayElement?.offsetTop - 124,
                          behavior: "smooth",
                        });
                      }

                      if (mobileTodayElement?.offsetTop) {
                        window.scrollTo({
                          top: mobileTodayElement?.offsetTop - 76,
                          behavior: "smooth",
                        });
                      }
                    }
                  }}
                  type="button"
                >
                  <span>Jump to today</span>
                  <BsFillCaretDownFill />
                </button>
              </li>
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
            <div className="px-8 py-10 text-gray-400">
              {sessionStatus === "loading" || birthdaysLoading ? (
                <div className="flex min-h-[300px] items-center justify-center">
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
      <div className="mt-8 flex justify-end text-gray-200">
        <Link
          href={`webcal://${currentHost}/api/calendar-subscription/${userId}`}
          className="js-subscribe-to-calendar group flex items-center space-x-2 text-gray-200 underline transition-all hover:text-gray-100"
        >
          <HiOutlineCalendar className="text-cyan-400 transition-all group-hover:text-gray-200" />
          <span>Subscribe to calendar</span>
        </Link>
      </div>
      <div className="mt-24 rounded-lg border-b-4 border-t-4 border-b-gray-400 border-t-gray-400 bg-gray-50 text-gray-800">
        <div className="mt-4 px-4 py-12 md:px-8">
          <div className="max-w-2xl">
            <h3 className="mb-4 text-2xl font-medium">
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
