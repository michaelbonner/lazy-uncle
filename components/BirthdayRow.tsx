import { format } from "date-fns";
import Link from "next/link";
import React from "react";
import { HiBackspace, HiOutlinePaperClip } from "react-icons/hi";
import { NexusGenObjects } from "../generated/nexus-typegen";
import getAgeForHumans from "../shared/getAgeForHumans";
import getDateFromYmdString from "../shared/getDateFromYmdString";
import getZodiacSignForDateYmdString from "../shared/getZodiacSignForDateYmdString";
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
  const birthDate = getDateFromYmdString(birthday.date || "");
  const zodiacSign = getZodiacSignForDateYmdString(birthday.date || "");
  const notesTextOnly = birthday?.notes?.replace(/<\/?[^>]+(>|$)/g, "");

  return (
    <>
      {birthday.id ? (
        <li
          className={`hidden lg:grid lg:grid-cols-12 items-center border-t text-left lg:text-center px-4 lg:px-8 hover:bg-gray-100`}
        >
          <p className={`text-left col-span-3 text-xl`}>
            <Link href={`/birthday/${birthday.id}`}>
              <a className="flex space-x-2 items-center py-3">
                <span>{birthday.name}</span>{" "}
                {notesTextOnly && (
                  <HiOutlinePaperClip className="text-sm text-gray-400" />
                )}
              </a>
            </Link>
          </p>
          <p className="text-xl text-indigo-600 col-span-2">
            <Link href={`/birthday/${birthday.id}`}>
              <a className="block py-3">{format(birthDate, "M/dd")}</a>
            </Link>
          </p>
          <p className="block py-3 col-span-2">
            {birthday.id &&
              getAgeForHumans(getDateFromYmdString(birthday.date || ""))}
          </p>
          <p className="text-ellipsis overflow-hidden relative col-span-2 h-full">
            {birthday.category && (
              <button
                className="block w-full h-full hover:bg-gray-200 rounded"
                onClick={() =>
                  setCategoryFilter(
                    categoryFilter === birthday.category
                      ? ""
                      : birthday.category || ""
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
          <p className="text-ellipsis overflow-hidden relative col-span-2 h-full">
            {birthday.parent && (
              <button
                className="block w-full h-full hover:bg-gray-200 rounded"
                onClick={() =>
                  setParentFilter(
                    parentFilter === birthday.parent
                      ? ""
                      : birthday.parent || ""
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
          <p className="text-ellipsis overflow-hidden relative h-full">
            <button
              className="flex flex-col items-center justify-center w-full h-full hover:bg-gray-200 rounded"
              onClick={() =>
                setZodiacSignFilter(
                  zodiacSignFilter === zodiacSign ? "" : zodiacSign || ""
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
          className={`hidden lg:grid lg:grid-cols-12 border-t text-left lg:text-center px-4 lg:px-8 bg-indigo-50 hover:bg-indigo-100 text-gray-800`}
        >
          <p className={`text-gray-500 col-span-3 text-lg py-3`}>
            {birthday.name}
          </p>
          <p className="text-xl text-indigo-600 col-span-2 py-3">
            {format(getDateFromYmdString(birthday.date || ""), "M/dd")}
          </p>
        </li>
      )}

      <li
        className={`block lg:hidden border-t text-left px-4 py-4
                        ${!birthday.id && "bg-gray-100 text-gray-800"}`}
      >
        <Link href={`/birthday/${birthday.id}`}>
          <a className="flex justify-between items-center">
            <div>
              <p className="text-2xl flex items-center space-x-2">
                <span>{birthday.name}</span>
                {notesTextOnly && (
                  <HiOutlinePaperClip className="text-sm text-gray-400" />
                )}
              </p>
              {birthday.id && (
                <div className="flex justify-start space-x-4 pt-1">
                  {getAgeForHumans(
                    getDateFromYmdString(birthday.date || "")
                  ) && (
                    <p>
                      <span className="font-light text-sm">Age</span>{" "}
                      <span className="font-medium">
                        {getAgeForHumans(
                          getDateFromYmdString(birthday.date || "")
                        )}
                      </span>
                    </p>
                  )}
                  {birthday.parent && (
                    <p className="text-ellipsis overflow-hidden">
                      <span className="font-light text-sm">Parent </span>
                      <span className="font-medium">{birthday.parent}</span>
                    </p>
                  )}
                </div>
              )}
              <p className="flex space-x-2 items-center mt-1">
                <ZodiacSignCharacter name={zodiacSign} />
                <span className="text-xs">{zodiacSign}</span>
              </p>
            </div>
            <p className="text-xl text-indigo-600">
              {format(birthDate, "M/dd")}
            </p>
          </a>
        </Link>
      </li>
    </>
  );
};
export default BirthdayRow;