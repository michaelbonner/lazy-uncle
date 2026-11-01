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
  const inputId = `birthday-filter-${label.toLowerCase().replace(/\s+/g, "-")}`;
  return (
    <div className="relative">
      <label htmlFor={inputId} className="sr-only">
        Filter by {label.toLowerCase()}
      </label>
      <input
        className={clsx(
          "block w-full rounded-md border border-rule bg-paper px-4 py-3 text-base text-ink",
          "placeholder:text-ink-muted",
          "focus:border-accent focus:bg-paper focus:outline-hidden focus:ring-2 focus:ring-accent/30",
          `js-filter-${label.toLowerCase()}`,
          datalistOptions.length > 0 && !value && "pr-8",
          datalistOptions.length > 0 && value && "pr-16",
        )}
        disabled={disabled}
        id={inputId}
        name={inputId}
        onChange={(e) => setValue(e.target.value)}
        onKeyUp={(e) => {
          if (e.key === "Escape") {
            setValue("");
          }
        }}
        placeholder={`Filter by ${label.toLowerCase()}`}
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
        <button
          aria-label={`Clear ${label.toLowerCase()} filter`}
          className="absolute top-1/2 right-10 -translate-y-1/2 rounded-sm p-1 text-ink-muted hover:text-ink focus-visible:outline-2 focus-visible:outline-accent"
          onClick={() => setValue("")}
          type="button"
        >
          <HiBackspace aria-hidden className="size-4" />
        </button>
      )}
      <HiSearch
        aria-hidden
        className="pointer-events-none absolute top-1/2 right-3 size-4 -translate-y-1/2 text-ink-muted"
      />
    </div>
  );
};
export default BirthdayFilterField;
