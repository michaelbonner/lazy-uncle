import type { Birthday } from "../lib/trpc";
import EditBirthdayDialog from "./EditBirthdayDialog";
import { Dialog, DialogPanel, DialogTitle } from "@headlessui/react";
import clsx from "clsx";
import { addMonths, format, getDaysInMonth, startOfMonth } from "date-fns";
import { useEffect, useMemo, useState } from "react";
import { HiChevronLeft, HiChevronRight, HiX } from "react-icons/hi";

const weekdays = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

function SelectedBirthdays({
  birthdays,
  onEdit,
}: {
  birthdays: Birthday[];
  onEdit: (birthday: Birthday) => void;
}) {
  if (birthdays.length === 0) {
    return (
      <p className="mt-2 text-sm text-ink-soft">No birthdays on this day.</p>
    );
  }

  return (
    <ul className="mt-3 grid gap-2">
      {birthdays.map((birthday) => (
        <li key={birthday.id}>
          <button
            className="w-full rounded-md border border-rule px-4 py-3 text-left hover:bg-paper-deep focus-visible:outline-2 focus-visible:outline-accent"
            onClick={() => onEdit(birthday)}
            type="button"
          >
            <span className="block font-medium text-ink">{birthday.name}</span>
            {birthday.category && (
              <span className="block text-sm text-ink-soft">
                {birthday.category}
              </span>
            )}
          </button>
        </li>
      ))}
    </ul>
  );
}

export default function BirthdayCalendar({
  birthdays,
}: {
  birthdays: Birthday[];
}) {
  const [month, setMonth] = useState(() => startOfMonth(new Date()));
  const [selectedDay, setSelectedDay] = useState<number | null>(() =>
    new Date().getDate(),
  );
  const [editingBirthday, setEditingBirthday] = useState<Birthday | null>(null);
  const [isMobileSheetOpen, setIsMobileSheetOpen] = useState(false);
  const today = new Date();
  const daysInMonth = getDaysInMonth(month);
  const leadingDays = month.getDay();
  const monthBirthdays = useMemo(() => {
    const byDay = new Map<number, Birthday[]>();
    for (const birthday of birthdays) {
      // Match the existing upcoming-birthday calculation: February 29 falls
      // on March 1 when the displayed year is not a leap year.
      const occurrence = new Date(
        month.getFullYear(),
        birthday.month - 1,
        birthday.day,
      );
      if (occurrence.getMonth() !== month.getMonth()) continue;
      const day = occurrence.getDate();
      const onDay = byDay.get(day) ?? [];
      onDay.push(birthday);
      byDay.set(day, onDay);
    }
    for (const onDay of byDay.values()) {
      onDay.sort((a, b) => a.name.localeCompare(b.name));
    }
    return byDay;
  }, [birthdays, month]);
  const selectedBirthdays = selectedDay
    ? (monthBirthdays.get(selectedDay) ?? [])
    : [];
  const isCurrentMonth =
    month.getFullYear() === today.getFullYear() &&
    month.getMonth() === today.getMonth();

  useEffect(() => {
    const closeSheetOnDesktop = () => {
      if (window.innerWidth >= 1024) setIsMobileSheetOpen(false);
    };
    window.addEventListener("resize", closeSheetOnDesktop);
    return () => window.removeEventListener("resize", closeSheetOnDesktop);
  }, []);

  const selectDay = (day: number) => {
    setSelectedDay(day);
    if (window.innerWidth < 1024) setIsMobileSheetOpen(true);
  };

  const changeMonth = (offset: number) => {
    const nextMonth = addMonths(month, offset);
    setMonth(nextMonth);
    setIsMobileSheetOpen(false);
    const now = new Date();
    setSelectedDay(
      nextMonth.getFullYear() === now.getFullYear() &&
        nextMonth.getMonth() === now.getMonth()
        ? now.getDate()
        : null,
    );
  };

  return (
    <div className="text-left lg:grid lg:grid-cols-3">
      <div className="min-w-0 lg:col-span-2 lg:border-r lg:border-rule">
        <div className="flex flex-wrap items-center justify-between gap-3 border-b border-rule px-4 py-4 sm:px-6">
          <div>
            <h2 className="font-display text-2xl text-ink" aria-live="polite">
              {format(month, "MMMM yyyy")}
            </h2>
            <p className="text-sm text-ink-soft">
              {Array.from(monthBirthdays.values()).reduce(
                (count, onDay) => count + onDay.length,
                0,
              )}{" "}
              birthdays this month
            </p>
          </div>
          <div className="flex items-center gap-2">
            <button
              aria-label="Previous month"
              className="flex size-10 items-center justify-center rounded-md border border-rule hover:bg-paper-deep focus-visible:outline-2 focus-visible:outline-accent"
              onClick={() => changeMonth(-1)}
              type="button"
            >
              <HiChevronLeft aria-hidden />
            </button>
            <button
              className="rounded-md border border-rule px-3 py-2 text-sm hover:bg-paper-deep focus-visible:outline-2 focus-visible:outline-accent"
              onClick={() => {
                setMonth(startOfMonth(new Date()));
                selectDay(new Date().getDate());
              }}
              type="button"
            >
              Today
            </button>
            <button
              aria-label="Next month"
              className="flex size-10 items-center justify-center rounded-md border border-rule hover:bg-paper-deep focus-visible:outline-2 focus-visible:outline-accent"
              onClick={() => changeMonth(1)}
              type="button"
            >
              <HiChevronRight aria-hidden />
            </button>
          </div>
        </div>
        <div className="grid grid-cols-7 border-b border-rule bg-paper-deep/60 text-center text-xs font-semibold text-ink-soft sm:text-sm">
          {weekdays.map((weekday) => (
            <div className="py-2" key={weekday}>
              {weekday}
            </div>
          ))}
        </div>
        <div
          className="grid grid-cols-7 gap-px bg-rule"
          aria-label={format(month, "MMMM yyyy")}
        >
          {Array.from({ length: leadingDays }, (_, index) => (
            <div
              className="min-h-16 bg-paper-deep/40 sm:min-h-28"
              key={`empty-${index}`}
            />
          ))}
          {Array.from({ length: daysInMonth }, (_, index) => {
            const day = index + 1;
            const onDay = monthBirthdays.get(day) ?? [];
            const isToday = isCurrentMonth && today.getDate() === day;
            return (
              <button
                aria-label={`${format(new Date(month.getFullYear(), month.getMonth(), day), "MMMM d, yyyy")}, ${onDay.length} ${onDay.length === 1 ? "birthday" : "birthdays"}`}
                aria-pressed={selectedDay === day}
                className={clsx(
                  "min-h-16 min-w-0 bg-paper p-1 text-left align-top hover:bg-paper-deep focus-visible:z-10 focus-visible:outline-2 focus-visible:outline-accent sm:min-h-28 sm:p-2",
                  selectedDay === day &&
                    "bg-paper-deep outline-2 outline-accent -outline-offset-2",
                )}
                key={day}
                onClick={() => selectDay(day)}
                type="button"
              >
                <span
                  className={clsx(
                    "flex size-6 items-center justify-center rounded-full text-sm tabular-nums sm:size-7",
                    isToday && "bg-accent font-semibold text-white",
                  )}
                >
                  {day}
                </span>
                {onDay.length > 0 && (
                  <>
                    <span className="mt-1 block text-center text-xs font-semibold text-accent-deep sm:hidden">
                      {onDay.length}
                    </span>
                    <span className="mt-1 hidden space-y-0.5 sm:block">
                      {onDay.slice(0, 2).map((birthday) => (
                        <span
                          className="block truncate rounded bg-accent/10 px-1.5 py-0.5 text-xs text-accent-deep"
                          key={birthday.id}
                        >
                          {birthday.name}
                        </span>
                      ))}
                      {onDay.length > 2 && (
                        <span className="block px-1 text-xs text-ink-soft">
                          +{onDay.length - 2} more
                        </span>
                      )}
                    </span>
                  </>
                )}
              </button>
            );
          })}
        </div>
      </div>
      <aside
        aria-label="Selected date"
        aria-live="polite"
        className="hidden px-5 py-6 lg:col-span-1 lg:block"
      >
        <h3 className="font-display text-xl text-ink">
          {selectedDay
            ? format(
                new Date(month.getFullYear(), month.getMonth(), selectedDay),
                "MMMM d",
              )
            : "Select a day"}
        </h3>
        {selectedDay && (
          <p className="mt-1 text-sm text-ink-soft">
            {selectedBirthdays.length}{" "}
            {selectedBirthdays.length === 1 ? "birthday" : "birthdays"}
          </p>
        )}
        {selectedDay && (
          <SelectedBirthdays
            birthdays={selectedBirthdays}
            onEdit={setEditingBirthday}
          />
        )}
      </aside>
      <Dialog
        className="relative z-20 lg:hidden"
        onClose={setIsMobileSheetOpen}
        open={isMobileSheetOpen}
      >
        <div className="fixed inset-0 bg-ink/30" aria-hidden="true" />
        <div className="fixed inset-0 flex items-end">
          <DialogPanel className="max-h-[85dvh] w-full overflow-y-auto rounded-t-2xl bg-paper px-5 pt-3 pb-[max(1.25rem,env(safe-area-inset-bottom))] shadow-[0_-16px_48px_-24px_oklch(0.22_0.018_60_/_0.35)]">
            <div
              className="mx-auto mb-4 h-1 w-10 rounded-full bg-rule"
              aria-hidden="true"
            />
            <div className="flex items-start justify-between gap-4">
              <div>
                <DialogTitle className="font-display text-xl text-ink">
                  {selectedDay &&
                    format(
                      new Date(
                        month.getFullYear(),
                        month.getMonth(),
                        selectedDay,
                      ),
                      "MMMM d",
                    )}
                </DialogTitle>
                <p className="mt-1 text-sm text-ink-soft">
                  {selectedBirthdays.length}{" "}
                  {selectedBirthdays.length === 1 ? "birthday" : "birthdays"}
                </p>
              </div>
              <button
                aria-label="Close selected date"
                className="flex size-10 shrink-0 items-center justify-center rounded-md text-ink-soft hover:bg-paper-deep focus-visible:outline-2 focus-visible:outline-accent"
                onClick={() => setIsMobileSheetOpen(false)}
                type="button"
              >
                <HiX aria-hidden className="size-5" />
              </button>
            </div>
            <SelectedBirthdays
              birthdays={selectedBirthdays}
              onEdit={(birthday) => {
                setIsMobileSheetOpen(false);
                setEditingBirthday(birthday);
              }}
            />
          </DialogPanel>
        </div>
      </Dialog>
      {editingBirthday && (
        <EditBirthdayDialog
          birthday={editingBirthday}
          isOpen
          handleClose={() => setEditingBirthday(null)}
        />
      )}
    </div>
  );
}
