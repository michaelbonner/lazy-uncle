import {
  HiOutlineSortAscending,
  HiOutlineSortDescending,
} from "react-icons/hi";

const SortColumnHeader = ({
  ascendingString,
  className = "",
  descendingString,
  label,
  setValue,
  value,
}: {
  ascendingString: string;
  className?: string;
  descendingString: string;
  label: string;
  setValue: (value: string) => void;
  value: string;
}) => {
  const isActive = value === ascendingString || value === descendingString;
  return (
    <button
      className={`flex items-center gap-1 py-3 text-left text-sm font-medium transition ${isActive ? "text-ink" : "text-ink-muted hover:text-ink"} ${className}`}
      type="button"
      onClick={() => {
        if (value === ascendingString) {
          setValue(descendingString);
        } else {
          setValue(ascendingString);
        }
      }}
    >
      <span>{label}</span>
      {value === ascendingString && <HiOutlineSortDescending />}
      {value === descendingString && <HiOutlineSortAscending />}
    </button>
  );
};
export default SortColumnHeader;
