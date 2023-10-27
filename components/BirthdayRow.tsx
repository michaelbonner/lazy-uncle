import { format } from "date-fns";
import React, { useEffect, useState } from "react";
import { GiBalloons } from "react-icons/gi";
import { HiBackspace, HiOutlinePaperClip } from "react-icons/hi";
import classNames from "../functions/classNames";
import { NexusGenObjects } from "../generated/nexus-typegen";
import getAgeForHumans from "../shared/getAgeForHumans";
import getDateFromYmdString from "../shared/getDateFromYmdString";
import { getDaysUntilNextBirthday } from "../shared/getDaysUntilNextBirthday";
import getZodiacSignForDateYmdString from "../shared/getZodiacSignForDateYmdString";
import EditBirthdayDialog from "./EditBirthdayDialog";
import ZodiacSignCharacter from "./ZodiacSignCharacter";

interface Props {
  birthday: NexusGenObjects["Birthday"];
  categoryFilter: string;
  // eslint-disable-next-line no-unused-vars
  setCategoryFilter: (text: string) => void;
  parentFilter: string;
  // eslint-disable-next-line no-unused-vars
  setParentFilter: (text: string) => void;
  zodiacSignFilter: string;
  // eslint-disable-next-line no-unused-vars
  setZodiacSignFilter: (text: string) => void;
}

const BirthdayRow: React.FC<Props> = ({
  birthday,
  categoryFilter,
  setCategoryFilter,
  parentFilter,
  setParentFilter,
  zodiacSignFilter,
  setZodiacSignFilter,
}) => {
  const [isEditBirthdayDialogOpen, setIsEditBirthdayDialogOpen] =
    useState(false);
  const [isEditBirthdayDialogMounted, setIsEditBirthdayDialogMounted] =
    useState(false);
  const birthDate = getDateFromYmdString(birthday.date || "");
  const zodiacSign = getZodiacSignForDateYmdString(birthday.date || "");
  const notesTextOnly = birthday?.notes?.replace(/<\/?[^>]+(>|$)/g, "");
  const todaysDateMonthAndDay = format(new Date(), "MM-dd");
  const birthDateMonthAndDay = format(birthDate, "MM-dd");
  const age = getAgeForHumans(getDateFromYmdString(birthday.date || ""));
  const actualAge = getAgeForHumans(
    getDateFromYmdString(birthday.date || ""),
    true,
  );

  const daysFromNow = getDaysUntilNextBirthday(birthday);

  useEffect(() => {
    if (isEditBirthdayDialogOpen) {
      setIsEditBirthdayDialogMounted(true);
    } else {
      setTimeout(() => setIsEditBirthdayDialogMounted(false), 200);
    }
  }, [isEditBirthdayDialogOpen]);

  return (
    <>
      {birthday.id ? (
        <li
          className={`hidden items-center border-t px-4 text-left hover:bg-gray-100 md:grid md:grid-cols-12 md:px-8 md:text-center`}
        >
          <button
            onClick={() => {
              setIsEditBirthdayDialogOpen(true);
            }}
            className={`col-span-3 flex items-center justify-between gap-2 text-left text-xl md:justify-start`}
          >
            <span className="flex items-center space-x-2 py-3">
              {daysFromNow === 0 && (
                <span title={`Today is ${birthday.name}'s birthday!`}>
                  <GiBalloons className="right-0 top-0 text-lg text-rose-500" />
                </span>
              )}
              <span>{birthday.name}</span>{" "}
              {notesTextOnly && (
                <HiOutlinePaperClip className="text-sm text-gray-400" />
              )}
            </span>
            {daysFromNow > 0 && daysFromNow < 14 && (
              <span className="text-xs text-gray-600">
                <span className="text-orange-500">{daysFromNow}</span> days away
              </span>
            )}
          </button>
          <p className="col-span-2 text-xl text-cyan-600">
            <button
              onClick={() => {
                setIsEditBirthdayDialogOpen(true);
              }}
              className="block py-3"
            >
              {format(birthDate, "MMM d")}
            </button>
          </p>
          <p className="col-span-2 block py-3">
            {birthday.id && age ? (
              <span title={actualAge}>{age}</span>
            ) : (
              <span className="sr-only">{actualAge}</span>
            )}
          </p>
          <p className="relative col-span-2 h-full overflow-hidden text-ellipsis">
            {birthday.category && (
              <button
                className="block h-full w-full rounded hover:bg-gray-200"
                onClick={() =>
                  setCategoryFilter(
                    categoryFilter === birthday.category
                      ? ""
                      : birthday.category || "",
                  )
                }
                type="button"
              >
                <span>{birthday.category}</span>
              </button>
            )}
            {categoryFilter && categoryFilter === birthday.category && (
              <button
                className="absolute right-10 top-4"
                onClick={() => setCategoryFilter("")}
              >
                <HiBackspace className="text-xl text-gray-400" />
              </button>
            )}
          </p>
          <p className="relative col-span-2 h-full overflow-hidden text-ellipsis">
            {birthday.parent && (
              <button
                className="block h-full w-full rounded hover:bg-gray-200"
                onClick={() =>
                  setParentFilter(
                    parentFilter === birthday.parent
                      ? ""
                      : birthday.parent || "",
                  )
                }
                type="button"
              >
                <span>{birthday.parent}</span>
              </button>
            )}
            {parentFilter && parentFilter === birthday.parent && (
              <button
                className="absolute right-10 top-4"
                onClick={() => setParentFilter("")}
              >
                <HiBackspace className="text-xl text-gray-400" />
              </button>
            )}
          </p>
          <p className="relative h-full overflow-hidden text-ellipsis">
            <button
              className="flex h-full w-full flex-col items-center justify-center rounded hover:bg-gray-200"
              onClick={() =>
                setZodiacSignFilter(
                  zodiacSignFilter === zodiacSign ? "" : zodiacSign || "",
                )
              }
              type="button"
            >
              <ZodiacSignCharacter name={zodiacSign} />
              <span className="text-xs">{zodiacSign}</span>
            </button>
            {zodiacSignFilter && zodiacSignFilter === zodiacSign && (
              <button
                className="absolute right-0 top-4"
                onClick={() => setZodiacSignFilter("")}
              >
                <HiBackspace className="text-xl text-gray-400" />
              </button>
            )}
          </p>
        </li>
      ) : (
        <li
          className={`hidden border-t bg-gray-200 px-4 text-left text-gray-800 md:grid md:grid-cols-12 md:px-8 md:text-center`}
          id="desktop-today"
        >
          <p className={`col-span-3 py-2 text-lg text-gray-500`}>
            {birthday.name}
          </p>
          <p className="col-span-2 py-2 text-xl text-cyan-600">
            {format(getDateFromYmdString(birthday.date || ""), "MMM d")}
          </p>
        </li>
      )}

      <li
        className={classNames(
          "block border-t px-4 py-4 text-left md:hidden",
          !birthday.id && "bg-gray-100 text-gray-800",
        )}
        id={birthday.id ? `birthday-${birthday.id}` : "mobile-today"}
      >
        {birthday.id ? (
          <button
            onClick={() => {
              setIsEditBirthdayDialogOpen(true);
            }}
            className="flex w-full items-center justify-between"
          >
            <div>
              <p className="flex items-center space-x-2 text-2xl">
                {todaysDateMonthAndDay === birthDateMonthAndDay && (
                  <span title={`Today is ${birthday.name}'s birthday!`}>
                    <GiBalloons className="right-0 top-0 text-lg text-rose-500" />
                  </span>
                )}
                <span>{birthday.name}</span>
                {notesTextOnly && (
                  <HiOutlinePaperClip className="text-sm text-gray-400" />
                )}
              </p>
              <div className="flex justify-start space-x-4 pt-1">
                {getAgeForHumans(getDateFromYmdString(birthday.date || "")) ? (
                  <p>
                    <span className="text-sm font-light">Age</span>{" "}
                    <span className="font-medium">
                      {getAgeForHumans(
                        getDateFromYmdString(birthday.date || ""),
                      )}
                    </span>
                  </p>
                ) : (
                  <span className="sr-only">
                    {getAgeForHumans(
                      getDateFromYmdString(birthday.date || ""),
                      true,
                    )}
                  </span>
                )}
                {birthday.parent && (
                  <p className="overflow-hidden text-ellipsis">
                    <span className="text-sm font-light">Parent </span>
                    <span className="font-medium">{birthday.parent}</span>
                  </p>
                )}
              </div>
              <p className="mt-1 flex items-center space-x-2">
                <ZodiacSignCharacter name={zodiacSign} />
                <span className="text-xs">{zodiacSign}</span>
              </p>
            </div>
            <p className="text-xl text-cyan-600">
              {format(birthDate, "MMM d")}
            </p>
          </button>
        ) : (
          <div>
            <p className="flex items-center space-x-2 text-2xl">
              <span>{birthday.name}</span>
            </p>
          </div>
        )}

        {isEditBirthdayDialogMounted && (
          <EditBirthdayDialog
            birthday={birthday}
            isOpen={isEditBirthdayDialogOpen}
            handleClose={() => setIsEditBirthdayDialogOpen(false)}
          />
        )}
      </li>
    </>
  );
};
export default BirthdayRow;
