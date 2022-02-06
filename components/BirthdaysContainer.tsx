import { useQuery } from "@apollo/client";
import { format } from "date-fns";
import Link from "next/link";
import React, { useEffect, useState } from "react";
import { GrFormFilter } from "react-icons/gr";
import { HiOutlineCalendar } from "react-icons/hi";
import { NexusGenObjects } from "../generated/nexus-typegen";
import { GET_ALL_BIRTHDAYS_QUERY } from "../graphql/Birthday";
import getDateFromYmdString from "../shared/getDateFromYmdString";
import getZodiacSignForDateYmdString from "../shared/getZodiacSignForDateYmdString";
import BirthdayFilterField from "./BirthdayFilterField";
import BirthdayRow from "./BirthdayRow";
import CreateBirthdayForm from "./CreateBirthdayForm";
import SortColumnHeader from "./SortColumnHeader";
import UploadCsvBirthdayForm from "./UploadCsvBirthdayForm";

const BirthdaysContainer = ({ userId }: { userId: string }) => {
  const [workingDates, setWorkingDates] = useState<
    NexusGenObjects["Birthday"][]
  >([]);
  const [workingDatesCount, setWorkingDatesCount] = useState(0);
  const [nameFilter, setNameFilter] = useState("");
  const [categoryFilter, setCategoryFilter] = useState("");
  const [parentFilter, setParentFilter] = useState("");
  const [zodiacSignFilter, setZodiacSignFilter] = useState("");
  const {
    data: birthdaysData,
    loading: birthdaysLoading,
    error: birthdaysError,
    refetch: birthdaysRefetch,
  } = useQuery(GET_ALL_BIRTHDAYS_QUERY);
  const [currentHost, setCurrentHost] = useState("");
  const [showFilters, setShowFilters] = useState(false);
  const [sortBy, setSortBy] = useState("date_asc");

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

  return (
    <div>
      <div className="flex justify-between lg:justify-end space-x-2 items-end">
        <div className="text-right mt-2 text-sm text-indigo-300">
          {workingDatesCount}/{birthdaysData?.birthdays?.length} visible
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
              <div className="bg-gray-300 py-2 lg:py-3 px-3 lg:px-6 rounded-t-lg grid lg:grid-cols-5 lg:gap-x-6 gap-y-2 border-t-indigo-400 border-t-4">
                <div className="relative lg:col-span-2">
                  <BirthdayFilterField
                    disabled={!birthdaysData?.length && !workingDates.length}
                    label="Name"
                    value={nameFilter}
                    setValue={setNameFilter}
                  />
                </div>
                <div
                  className={`${showFilters ? "" : "hidden"} lg:block relative`}
                >
                  <BirthdayFilterField
                    disabled={!birthdaysData?.length && !workingDates.length}
                    label="Category"
                    value={categoryFilter}
                    setValue={setCategoryFilter}
                  />
                </div>
                <div
                  className={`${showFilters ? "" : "hidden"} lg:block relative`}
                >
                  <BirthdayFilterField
                    disabled={!birthdaysData?.length && !workingDates.length}
                    label="Parent"
                    value={parentFilter}
                    setValue={setParentFilter}
                  />
                </div>
                <div
                  className={`${showFilters ? "" : "hidden"} lg:block relative`}
                >
                  <BirthdayFilterField
                    disabled={!birthdaysData?.length && !workingDates.length}
                    label="Zodiac Sign"
                    value={zodiacSignFilter}
                    setValue={setZodiacSignFilter}
                  />
                </div>
              </div>
            </div>
            <div className="hidden lg:grid lg:grid-cols-12 bg-indigo-800 px-4 lg:px-8 text-gray-100">
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
              {birthdaysLoading ? (
                <div className="flex items-center justify-center min-h-[300px]">
                  <div className="prose mx-auto animate-pulse">
                    <h2>Loading birthdays...</h2>
                  </div>
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
            <h3 className="text-2xl font-medium mb-4">Add New Birthday</h3>
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
  );
};
export default BirthdaysContainer;
