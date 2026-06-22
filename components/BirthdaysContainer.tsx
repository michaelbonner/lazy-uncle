import { type Birthday, trpc } from "../lib/trpc";
import { authClient } from "../lib/auth-client";
// import the auth client
import { SearchContext } from "../providers/SearchProvider";
import { getDaysUntilNextBirthday } from "../shared/getDaysUntilNextBirthday";
import { getZodiacSignFromComponents } from "../shared/getZodiacSignForDateYmdString";
import BirthdayFilterField from "./BirthdayFilterField";
import BirthdayRow from "./BirthdayRow";
import LoadingSpinner from "./LoadingSpinner";
import SortColumnHeader from "./SortColumnHeader";
import clsx from "clsx";
import dynamic from "next/dynamic";
import Link from "next/link";
import {
  useContext,
  useDeferredValue,
  useEffect,
  useMemo,
  useState,
} from "react";
import { BsFillCaretDownFill } from "react-icons/bs";
import { GrFormFilter, GrRefresh } from "react-icons/gr";
import { HiOutlineCalendar, HiXCircle } from "react-icons/hi";
import { IoAddCircleOutline } from "react-icons/io5";

const currentHost = typeof window !== "undefined" ? window.location.host : "";

const AddBirthdayDialog = dynamic(() => import("./AddBirthdayDialog"), {
  ssr: false,
});
const UploadCsvBirthdayForm = dynamic(() => import("./UploadCsvBirthdayForm"), {
  ssr: false,
});
const OnboardingWalkthrough = dynamic(() => import("./OnboardingWalkthrough"), {
  ssr: false,
});
const SharingLinkManager = dynamic(() => import("./SharingLinkManager"), {
  ssr: false,
});
const SubmissionReviewInterface = dynamic(
  () => import("./SubmissionReviewInterface"),
  {
    ssr: false,
  },
);
const SharingSettingsPanel = dynamic(() => import("./SharingSettingsPanel"), {
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
    data: birthdays,
    isPending: birthdaysLoading,
    error: birthdaysError,
    refetch: birthdaysRefetch,
  } = trpc.birthday.list.useQuery();
  const { isPending } = authClient.useSession();
  const [isAddBirthdayDialogVisible, setIsAddBirthdayDialogVisible] =
    useState(false);

  // Deferring the name filter keeps the input responsive on slow devices —
  // typing updates the input immediately while the filtered list rebuilds
  // at a lower priority.
  const deferredNameFilter = useDeferredValue(nameFilter);
  const deferredCategoryFilter = useDeferredValue(categoryFilter);
  const deferredParentFilter = useDeferredValue(parentFilter);
  const deferredZodiacSignFilter = useDeferredValue(zodiacSignFilter);

  const workingDates: Birthday[] = useMemo(() => {
    if (!birthdays?.length) {
      return [];
    }

    // Pre-compute lowercase filter strings once
    const nameFilterLower = deferredNameFilter.toLowerCase();
    const categoryFilterLower = deferredCategoryFilter.toLowerCase();
    const parentFilterLower = deferredParentFilter.toLowerCase();
    const zodiacSignFilterLower = deferredZodiacSignFilter.toLowerCase();

    // Single pass filtering - much faster than chained filters
    const dates = birthdays.filter(
      (birthday: Birthday) => {
        // Skip filtering for items without id
        if (!birthday.id) {
          return true;
        }

        // Name filter
        if (
          deferredNameFilter &&
          !birthday?.name?.toLowerCase().includes(nameFilterLower)
        ) {
          return false;
        }

        // Category filter
        if (
          deferredCategoryFilter &&
          !birthday?.category?.toLowerCase().includes(categoryFilterLower)
        ) {
          return false;
        }

        // Parent filter
        if (
          deferredParentFilter &&
          !birthday?.parent?.toLowerCase().includes(parentFilterLower)
        ) {
          return false;
        }

        // Zodiac sign filter - only compute when filter is active
        if (deferredZodiacSignFilter && birthday?.month && birthday?.day) {
          const birthdayZodiacSign = getZodiacSignFromComponents(
            birthday.month,
            birthday.day,
          );
          if (
            !birthdayZodiacSign.toLowerCase().includes(zodiacSignFilterLower)
          ) {
            return false;
          }
        }

        return true;
      },
    );

    if (dates.length < 1) return [];

    const unsortedDates = [...dates];
    if (sortBy.substring(0, 4) === "date" && unsortedDates.length > 4) {
      const today = new Date();
      unsortedDates.push({
        name: "Today",
        month: today.getMonth() + 1, // getMonth() returns 0-11, we need 1-12
        day: today.getDate(),
        year: null,
      } as unknown as Birthday);
    }

    // Precompute the sort key for each row once, then sort by index — avoids
    // recomputing date/zodiac strings inside every comparator invocation.
    const sortField = sortBy.replace(/_(asc|desc)$/, "");
    const sortDirection = sortBy.endsWith("_desc") ? -1 : 1;

    const sortKeys: (string | number | null)[] = unsortedDates.map(
      (b: Birthday) => {
        switch (sortField) {
          case "date":
            if (!b.month || !b.day) return "";
            return `${String(b.month).padStart(2, "0")}-${String(b.day).padStart(2, "0")}`;
          case "name":
            return b.name || "";
          case "age":
            return b.year ?? null;
          case "category":
            return b.category || "";
          case "parent":
            return b.parent || "";
          case "sign":
            return b.month && b.day
              ? getZodiacSignFromComponents(b.month, b.day)
              : "";
          default:
            return "";
        }
      },
    );

    const indices = unsortedDates.map((_, i) => i);
    indices.sort((ai, bi) => {
      const ak = sortKeys[ai];
      const bk = sortKeys[bi];
      if (sortField === "age") {
        // Match original behavior: rows missing a year always sort last,
        // regardless of asc/desc.
        if (ak === null && bk === null) return 0;
        if (ak === null) return 1;
        if (bk === null) return -1;
        if (ak === bk) return 0;
        return ((ak as number) > (bk as number) ? 1 : -1) * sortDirection;
      }
      if (ak === bk) return 0;
      return ((ak as string) > (bk as string) ? 1 : -1) * sortDirection;
    });

    return indices.map((i) => unsortedDates[i]);
  }, [
    birthdays,
    deferredCategoryFilter,
    deferredNameFilter,
    deferredParentFilter,
    sortBy,
    deferredZodiacSignFilter,
  ]);

  // Memoize datalist option arrays so they aren't rebuilt (and re-sorted
  // inside <BirthdayFilterField>) on every render. The name field intentionally
  // omits its datalist — on iOS Safari, a datalist with hundreds of names
  // re-filters on every keystroke and makes typing noticeably laggy.
  const categoryOptions = useMemo(
    () =>
      Array.from(
        new Set(workingDates.map((b) => b.category || "")),
      ).sort(),
    [workingDates],
  );
  const parentOptions = useMemo(
    () =>
      Array.from(
        new Set(workingDates.map((b) => b.parent || "")),
      ).sort(),
    [workingDates],
  );
  const zodiacOptions = useMemo(
    () =>
      Array.from(
        new Set(
          workingDates.map((b) =>
            b.month && b.day ? getZodiacSignFromComponents(b.month, b.day) : "",
          ),
        ),
      ).sort(),
    [workingDates],
  );

  const workingDatesCount = useMemo(() => {
    return workingDates.filter((date) => date.name !== "Today").length;
  }, [workingDates]);

  const birthdaysCount = useMemo<number>(() => {
    return birthdays?.length || 0;
  }, [birthdays]);

  const upcomingBirthdays: Birthday[] = useMemo<Birthday[]>(() => {
    if (!birthdays || birthdays.length < 1) {
      return [];
    }

    const upcoming = birthdays.filter((birthday: Birthday) => {
      return getDaysUntilNextBirthday(birthday) <= 7;
    });

    return upcoming.sort((a: Birthday, b: Birthday) => {
      const aDaysUntilNextBirthday = getDaysUntilNextBirthday(a);
      const bDaysUntilNextBirthday = getDaysUntilNextBirthday(b);
      return aDaysUntilNextBirthday > bDaysUntilNextBirthday ? 1 : -1;
    });
  }, [birthdays]);

  const handleRefresh = async () => {
    await birthdaysRefetch();
  };

  useEffect(() => {
    const refetchQuery = () => birthdaysRefetch();
    window.addEventListener("focus", refetchQuery);
    return () => window.removeEventListener("focus", refetchQuery);
  });

  const getDaysLabel = (daysUntil: number) => {
    if (daysUntil === 0) {
      return <span className="font-bold">Today</span>;
    }
    if (daysUntil === 1) {
      return <span className="font-bold">Tomorrow</span>;
    }
    return (
      <span>
        <span className="font-light">in </span>
        {daysUntil} days
      </span>
    );
  };

  return (
    <div>
      {!birthdaysLoading && !birthdaysCount && <OnboardingWalkthrough />}
      {upcomingBirthdays?.length > 0 && (
        <div className="my-4 items-center gap-x-8 rounded-lg border border-rule bg-paper-deep px-6 py-4 text-ink md:flex">
          <h2 className="font-display text-xl font-semibold">
            Upcoming birthdays
          </h2>
          <div className="mt-3 flex flex-wrap items-center gap-x-6 gap-y-2 text-ink-soft md:mt-0">
            {upcomingBirthdays.map((birthday: Birthday) => {
              const daysUntil = getDaysUntilNextBirthday(birthday);
              return (
                <button
                  key={birthday.id}
                  className="rounded-sm transition hover:text-ink focus:outline-hidden focus:ring-2 focus:ring-accent/30"
                  onClick={() => {
                    const birthDayLiElementMobile: HTMLLIElement | null =
                      document.querySelector(`#birthday-${birthday.id}`);
                    const birthDayLiElementDesktop: HTMLLIElement | null =
                      document.querySelector(
                        `#desktop-birthday-${birthday.id}`,
                      );

                    if (birthDayLiElementMobile || birthDayLiElementDesktop) {
                      if (birthDayLiElementDesktop?.offsetTop) {
                        window.scrollTo({
                          top: birthDayLiElementDesktop?.offsetTop - 124,
                          behavior: "smooth",
                        });
                        return;
                      }

                      window.scrollTo({
                        top: (birthDayLiElementMobile?.offsetTop || 76) - 76,
                        behavior: "smooth",
                      });
                    }
                  }}
                  type="button"
                >
                  <span className="font-light">{birthday.name}</span>{" "}
                  {getDaysLabel(daysUntil)}
                </button>
              );
            })}
          </div>
        </div>
      )}
      <div className="flex items-end justify-between space-x-2 md:justify-end">
        <div className="items-center pl-2 md:flex md:space-x-4 md:pl-0">
          <button
            className={clsx(
              isFiltered
                ? "text-accent-deep hover:text-ink"
                : "text-ink-muted",
              "js-clear-filters flex items-center space-x-1 transition",
            )}
            disabled={!isFiltered}
            onClick={() => clearFilters()}
          >
            <HiXCircle />
            <span>Clear filters</span>
          </button>
          <div className="text-sm text-ink-muted md:text-right">
            {workingDatesCount}/{birthdays?.length} visible
          </div>
        </div>
        <div className="mt-4 flex items-center justify-end space-x-4 md:hidden">
          <button
            className="flex items-center space-x-2 rounded-md border border-rule bg-paper-deep px-4 py-2 text-sm text-ink transition hover:bg-paper"
            onClick={() => {
              setShowFilters(!showFilters);
            }}
          >
            <GrFormFilter />
            <span>Toggle additional filters</span>
          </button>
        </div>
      </div>

      <AddBirthdayDialog
        isOpen={isAddBirthdayDialogVisible}
        handleClose={() => setIsAddBirthdayDialogVisible(false)}
      />

      <div className="text-center">
        {birthdaysError && (
          <p className="pt-3 text-ink-soft">{birthdaysError.message}</p>
        )}
        <div className="mt-4 overflow-hidden rounded-lg border border-rule bg-paper text-ink md:mt-2">
          <div className="sticky top-0 z-10 bg-paper">
            <div className="border-b border-rule bg-paper-deep">
              <div className="grid gap-x-2 gap-y-2 px-3 py-3 md:px-6 md:py-4 lg:flex">
                <div className="flex w-full gap-2">
                  <button
                    className={clsx(
                      "js-add-birthday-button flex h-12 w-12 items-center justify-center rounded-md bg-accent p-3 text-white transition",
                      "hover:bg-accent-deep",
                      "focus:outline-hidden focus:ring-2 focus:ring-accent/40 focus:ring-offset-2 focus:ring-offset-paper-deep",
                    )}
                    title="Add birthday"
                    onClick={() =>
                      setIsAddBirthdayDialogVisible(!isAddBirthdayDialogVisible)
                    }
                    type="button"
                  >
                    <IoAddCircleOutline className="h-5 w-5" />
                  </button>
                  <div className="relative w-full min-w-[220px] grow">
                    <BirthdayFilterField
                      disabled={
                        !birthdays?.length &&
                        !workingDates.length
                      }
                      label="Name"
                      value={nameFilter}
                      setValue={setNameFilter}
                    />
                  </div>
                  <div className="flex md:hidden">
                    <button
                      className="ml-2 flex w-full items-center justify-center rounded-md border border-rule bg-paper text-ink transition hover:bg-paper-deep"
                      onClick={handleRefresh}
                      title="Refresh"
                    >
                      <GrRefresh
                        className={clsx(
                          birthdaysLoading && "animate-spin",
                          "w-10",
                        )}
                      />
                    </button>
                  </div>
                </div>
                <div
                  className={clsx(
                    !showFilters && "hidden",
                    "relative w-full min-w-[220px]",
                    "md:block md:w-auto",
                  )}
                >
                  <BirthdayFilterField
                    disabled={
                      !birthdays?.length && !workingDates.length
                    }
                    label="Category"
                    value={categoryFilter}
                    setValue={setCategoryFilter}
                    datalistOptions={categoryOptions}
                  />
                </div>
                <div
                  className={clsx(
                    !showFilters && "hidden",
                    "relative w-full min-w-[220px]",
                    "md:block md:w-auto",
                  )}
                >
                  <BirthdayFilterField
                    disabled={
                      !birthdays?.length && !workingDates.length
                    }
                    label="Parent"
                    value={parentFilter}
                    setValue={setParentFilter}
                    datalistOptions={parentOptions}
                  />
                </div>
                <div
                  className={clsx(
                    !showFilters && "hidden",
                    "relative w-full min-w-[220px]",
                    "md:block md:w-auto",
                  )}
                >
                  <BirthdayFilterField
                    disabled={
                      !birthdays?.length && !workingDates.length
                    }
                    label="Zodiac Sign"
                    value={zodiacSignFilter}
                    setValue={setZodiacSignFilter}
                    datalistOptions={zodiacOptions}
                  />
                </div>
              </div>
            </div>
            <div className="hidden border-b border-rule bg-paper px-4 text-ink md:grid md:grid-cols-12 md:px-8">
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
                  className={clsx(
                    "flex w-full items-center justify-center gap-2 py-2 text-sm text-accent-deep transition",
                    "hover:bg-paper-deep hover:text-ink",
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
              {workingDates.map((birthday: Birthday) => {
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
            <div className="px-8 py-10 text-ink-muted">
              {isPending || birthdaysLoading ? (
                <div className="flex min-h-[300px] items-center justify-center">
                  <LoadingSpinner spinnerTextColor="text-accent" />
                </div>
              ) : (
                <div className="prose prose-stone mx-auto">
                  <h2 className="font-display text-ink">No birthdays found</h2>
                  <p className="text-ink-soft">
                    Use the form below to add a birthday or two, or thirty-eight.
                  </p>
                </div>
              )}
            </div>
          )}
          <div className={clsx("border-t border-rule px-4 py-3", "lg:px-8")}>
            <button
              className={clsx(
                "flex w-full items-center justify-center gap-2 rounded-md border border-rule bg-paper-deep px-4 py-2 text-ink transition",
                "hover:bg-paper",
                "focus:outline-hidden focus:ring-2 focus:ring-accent/30",
              )}
              onClick={() =>
                setIsAddBirthdayDialogVisible(!isAddBirthdayDialogVisible)
              }
              type="button"
            >
              <IoAddCircleOutline />
              <span>Add a birthday</span>
            </button>
          </div>
        </div>
      </div>
      <div className="mt-8 flex items-center justify-between text-ink-soft">
        <div className="flex items-center space-x-6">
          <Link
            href={`webcal://${currentHost}/api/calendar-subscription/${userId}`}
            className="js-subscribe-to-calendar group flex items-center space-x-2 text-ink-soft underline underline-offset-4 transition hover:text-ink"
          >
            <HiOutlineCalendar className="text-accent transition group-hover:text-ink" />
            <span>Subscribe to calendar</span>
          </Link>
        </div>
      </div>
      <SharingLinkManager />
      <SubmissionReviewInterface />
      <SharingSettingsPanel />
      <div className="mt-8 rounded-lg border border-rule bg-paper-deep text-ink">
        <div className="px-4 py-10 md:px-8 md:py-12">
          <div className="max-w-2xl">
            <h3 className="mb-4 font-display text-2xl font-semibold">
              Import birthdays from CSV
            </h3>
            <UploadCsvBirthdayForm />
          </div>
        </div>
      </div>
    </div>
  );
};
export default BirthdaysContainer;
