import { FC, useState } from "react";

interface BirthdayDateInputProps {
  year: number | null;
  month: number;
  day: number;
  onChange: (year: number | null, month: number, day: number) => void;
  required?: boolean;
  maxYear?: number;
  includeYearInput?: boolean; // Whether to show year input (default true)
}

const BirthdayDateInput: FC<BirthdayDateInputProps> = ({
  year,
  month,
  day,
  onChange,
  required = true,
  maxYear,
  includeYearInput = true,
}) => {
  // Track whether user wants to include year or not
  const [yearDisabled, setYearDisabled] = useState<boolean>(year === null);

  // For date picker mode (when year is enabled)
  const [dateValue, setDateValue] = useState<string>("");

  // For month/day mode (when year is disabled)
  const [localMonth, setLocalMonth] = useState<string>(month?.toString() || "");
  const [localDay, setLocalDay] = useState<string>(day?.toString() || "");
  const [prevYear, setPrevYear] = useState(year);
  const [prevMonth, setPrevMonth] = useState(month);
  const [prevDay, setPrevDay] = useState(day);

  const currentYear = new Date().getFullYear();
  const maxYearValue = maxYear || currentYear;

  if (year !== prevYear || month !== prevMonth || day !== prevDay) {
    setPrevYear(year);
    setPrevMonth(month);
    setPrevDay(day);
    setYearDisabled(year === null);

    if (year !== null && month && day) {
      const formattedDate = `${year}-${String(month).padStart(2, "0")}-${String(day).padStart(2, "0")}`;
      setDateValue(formattedDate);
    } else {
      setDateValue("");
    }

    setLocalMonth(month?.toString() || "");
    setLocalDay(day?.toString() || "");
  }

  const handleYearToggle = (disabled: boolean) => {
    setYearDisabled(disabled);

    if (disabled) {
      if (dateValue) {
        const dateParts = dateValue.split("-");
        if (dateParts.length === 3) {
          const parsedMonth = parseInt(dateParts[1], 10);
          const parsedDay = parseInt(dateParts[2], 10);
          setLocalMonth(String(parsedMonth));
          setLocalDay(String(parsedDay));
          if (
            parsedMonth >= 1 &&
            parsedMonth <= 12 &&
            parsedDay >= 1 &&
            parsedDay <= 31
          ) {
            onChange(null, parsedMonth, parsedDay);
          }
        }
      }
    } else {
      if (localMonth && localDay) {
        const defaultYear = currentYear;
        const formattedDate = `${defaultYear}-${String(localMonth).padStart(2, "0")}-${String(localDay).padStart(2, "0")}`;
        setDateValue(formattedDate);
        const parsedMonth = parseInt(localMonth, 10);
        const parsedDay = parseInt(localDay, 10);
        if (
          parsedMonth >= 1 &&
          parsedMonth <= 12 &&
          parsedDay >= 1 &&
          parsedDay <= 31
        ) {
          onChange(defaultYear, parsedMonth, parsedDay);
        }
      } else {
        setDateValue("");
      }
    }
  };

  const getDaysInMonth = (m: number): number => {
    const thirtyDayMonths = [4, 6, 9, 11];
    if (thirtyDayMonths.includes(m)) return 30;
    if (m === 2) return 29; // Allow Feb 29 when no year specified
    return 31;
  };

  const monthOptions = Array.from({ length: 12 }, (_, i) => ({
    value: i + 1,
    label: new Date(2000, i, 1).toLocaleString("default", { month: "long" }),
  }));

  const parsedMonth = parseInt(localMonth, 10);
  const maxDays = getDaysInMonth(parsedMonth || 1);
  const dayOptions = Array.from({ length: maxDays }, (_, i) => i + 1);

  return (
    <div className="flex flex-col space-y-2">
      {!yearDisabled ? (
        // Date Picker Mode (includes year)
        <div>
          <input
            type="date"
            id="birthday-date"
            className="block h-12 w-full rounded-sm border-gray-300 text-gray-900"
            value={dateValue}
            onChange={(e) => {
              const value = e.target.value;
              setDateValue(value);
              if (!yearDisabled && value) {
                const dateParts = value.split("-");
                if (dateParts.length === 3) {
                  const parsedYear = parseInt(dateParts[0], 10);
                  const parsedMonth = parseInt(dateParts[1], 10);
                  const parsedDay = parseInt(dateParts[2], 10);
                  if (
                    parsedMonth >= 1 &&
                    parsedMonth <= 12 &&
                    parsedDay >= 1 &&
                    parsedDay <= 31
                  ) {
                    onChange(parsedYear, parsedMonth, parsedDay);
                  }
                }
              }
            }}
            required={required}
            max={`${maxYearValue}-12-31`}
            min="1900-01-01"
          />
        </div>
      ) : (
        // Month/Day Dropdowns (no year)
        <div className="grid grid-cols-2 gap-4">
          {/* Month Dropdown */}
          <div>
            <select
              id="month"
              className="block h-12 w-full rounded-sm border-gray-300 text-gray-900"
              value={localMonth}
              onChange={(e) => {
                const newMonth = e.target.value;
                setLocalMonth(newMonth);
                if (yearDisabled) {
                  const parsedMonth = parseInt(newMonth, 10);
                  const parsedDay = parseInt(localDay, 10);
                  if (
                    parsedMonth >= 1 &&
                    parsedMonth <= 12 &&
                    parsedDay >= 1 &&
                    parsedDay <= 31
                  ) {
                    onChange(null, parsedMonth, parsedDay);
                  }
                }
              }}
              required={required}
            >
              <option value="">Month{required && " *"}</option>
              {monthOptions.map((opt) => (
                <option key={opt.value} value={opt.value}>
                  {opt.label}
                </option>
              ))}
            </select>
          </div>

          {/* Day Dropdown */}
          <div>
            <select
              id="day"
              className="block h-12 w-full rounded-sm border-gray-300 text-gray-900"
              value={localDay}
              onChange={(e) => {
                const newDay = e.target.value;
                setLocalDay(newDay);
                if (yearDisabled) {
                  const parsedMonth = parseInt(localMonth, 10);
                  const parsedDay = parseInt(newDay, 10);
                  if (
                    parsedMonth >= 1 &&
                    parsedMonth <= 12 &&
                    parsedDay >= 1 &&
                    parsedDay <= 31
                  ) {
                    onChange(null, parsedMonth, parsedDay);
                  }
                }
              }}
              required={required}
              disabled={!localMonth}
            >
              <option value="">Day{required && " *"}</option>
              {dayOptions.map((d) => (
                <option key={d} value={d}>
                  {d}
                </option>
              ))}
            </select>
          </div>
        </div>
      )}

      {/* Disable Year Toggle - positioned below the input */}
      {includeYearInput && (
        <div className="flex items-center space-x-2">
          <input
            type="checkbox"
            id="disable-year"
            checked={yearDisabled}
            onChange={(e) => handleYearToggle(e.target.checked)}
            className="h-4 w-4 rounded border-gray-300"
          />
          <label
            htmlFor="disable-year"
            className="text-sm text-gray-600 cursor-pointer"
          >
            Don&apos;t know the year
          </label>
        </div>
      )}
    </div>
  );
};

export default BirthdayDateInput;
