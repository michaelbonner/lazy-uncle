import { HiBackspace, HiSearch } from "react-icons/hi";
import classNames from "../shared/classNames";

const BirthdayFilterField = ({
  disabled,
  label,
  setValue,
  value,
}: {
  disabled: boolean;
  label: string;
  // eslint-disable-next-line no-unused-vars
  setValue: (value: string) => void;
  value: string;
}) => {
  return (
    <div>
      <input
        className={classNames(
          "block w-full rounded-lg border-0 bg-gray-200 px-4 py-3 text-gray-700",
          "placeholder:text-gray-400",
          "focus:border-gray-400 focus:bg-white focus:outline-none",
          `js-filter-${label.toLowerCase()}`,
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
      />
      {value && (
        <HiBackspace
          className="absolute right-10 top-4 text-xl text-gray-400"
          onClick={() => setValue("")}
        />
      )}
      <HiSearch className="absolute right-3 top-4 text-xl text-gray-400" />
    </div>
  );
};
export default BirthdayFilterField;
