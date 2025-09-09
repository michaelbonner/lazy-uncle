import clsx from "clsx";
import { Dispatch, SetStateAction } from "react";
import { HiBackspace, HiSearch } from "react-icons/hi";

const BirthdayFilterField = ({
  datalistOptions = [],
  disabled,
  label,
  setValue,
  value,
}: {
  datalistOptions?: string[];
  disabled: boolean;
  label: string;
  setValue: Dispatch<SetStateAction<string>>;
  value: string;
}) => {
  return (
    <div>
      <input
        className={clsx(
          "block w-full rounded-lg border-0 bg-gray-200 px-4 py-3 text-gray-700",
          "placeholder:text-gray-400",
          "focus:border-gray-400 focus:bg-white focus:outline-hidden",
          `js-filter-${label.toLowerCase()}`,
          datalistOptions.length > 0 && !value && "pr-8",
          datalistOptions.length > 0 && value && "pr-16",
        )}
        disabled={disabled}
        id={value}
        onChange={(e) => setValue(e.target.value)}
        onKeyUp={(e) => {
          if (e.key === "Escape") {
            setValue("");
          }
        }}
        placeholder={`Filter by ${label}`}
        type="text"
        value={value}
        {...(datalistOptions.length > 0 && {
          list: `${label.toLowerCase()}-options`,
        })}
      />
      {datalistOptions.length > 0 && (
        <datalist id={`${label.toLowerCase()}-options`}>
          {datalistOptions.sort().map((option) => (
            <option key={option} value={option}>
              {option}
            </option>
          ))}
        </datalist>
      )}
      {value && (
        <HiBackspace
          className="absolute top-4 right-10 text-xl text-gray-400"
          onClick={() => setValue("")}
        />
      )}
      <HiSearch className="absolute top-4 right-3 text-xl text-gray-400" />
    </div>
  );
};
export default BirthdayFilterField;
