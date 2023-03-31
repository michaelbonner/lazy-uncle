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
  // eslint-disable-next-line no-unused-vars
  setValue: (value: string) => void;
  value: string;
}) => {
  return (
    <button
      className={`flex items-center space-x-1 py-3 text-left text-xs font-medium uppercase tracking-wider ${className}`}
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
