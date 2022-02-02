import React from "react";
import { HiBackspace, HiSearch } from "react-icons/hi";

const BirthdayFilterField = ({
  setValue,
  value,
}: {
  // eslint-disable-next-line no-unused-vars
  setValue: (value: string) => void;
  value: string;
}) => {
  return (
    <div>
      <input
        className="block w-full py-3 px-4 rounded-lg text-gray-700 focus:outline-none bg-gray-200 focus:bg-white border-0 focus:border-gray-400 placeholder:text-gray-400"
        id={value}
        onChange={(e) => setValue(e.target.value)}
        onKeyUp={(e) => {
          if (e.key === "Escape") {
            setValue("");
          }
        }}
        placeholder="Filter by name"
        type="text"
        value={value}
      />
      {value && (
        <HiBackspace
          className="text-xl text-gray-400 absolute right-10 top-4"
          onClick={() => setValue("")}
        />
      )}
      <HiSearch className="text-xl text-gray-400 absolute right-3 top-4" />
    </div>
  );
};
export default BirthdayFilterField;
