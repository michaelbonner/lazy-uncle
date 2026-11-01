import { type Birthday, trpc } from "../lib/trpc";
import BirthdayDateInput from "./BirthdayDateInput";
import PrimaryButton from "./PrimaryButton";
import clsx from "clsx";
import dynamic from "next/dynamic";
import { useRouter } from "next/router";
import { useState } from "react";
import toast from "react-hot-toast";
import { IoTrashOutline } from "react-icons/io5";

const TextEdit = dynamic(() => import("./TextEdit"), {
  loading: () => (
    <div className="flex h-full min-h-[250px] w-full items-center justify-center rounded-lg border border-rule bg-paper text-center text-ink">
      <p className="animate-pulse">Loading editor...</p>
    </div>
  ),
});

const EditBirthdayForm = ({
  birthday,
  handleClose,
}: {
  birthday: Birthday;
  handleClose?: () => void;
}) => {
  const [name, setName] = useState(birthday.name);

  // NEW: Date component states (initialize from birthday object)
  // Handle both new component fields and legacy date field
  const initYear = birthday.year ?? null;
  const initMonth = birthday.month ?? 1;
  const initDay = birthday.day ?? 1;

  const [year, setYear] = useState<number | null>(initYear);
  const [month, setMonth] = useState<number>(initMonth);
  const [day, setDay] = useState<number>(initDay);

  const [category, setCategory] = useState(birthday.category || "");
  const [parent, setParent] = useState(birthday.parent || "");
  const [notes, setNotes] = useState(birthday.notes || "");
  const [remindersEnabled, setRemindersEnabled] = useState(
    birthday.remindersEnabled ?? true,
  );
  const router = useRouter();

  const { data: preferences } = trpc.notification.preferences.useQuery();
  const birthdayRemindersEnabled = preferences?.birthdayReminders ?? false;

  const utils = trpc.useUtils();
  const editBirthday = trpc.birthday.edit.useMutation({
    onSuccess: async (updatedBirthday) => {
      await Promise.all([
        utils.birthday.list.invalidate(),
        utils.birthday.byId.invalidate({ birthdayId: updatedBirthday.id }),
      ]);
    },
  });
  const { isPending: loading, error } = editBirthday;

  const deleteBirthday = trpc.birthday.delete.useMutation({
    onSuccess: async (deletedBirthday) => {
      await Promise.all([
        utils.birthday.list.invalidate(),
        utils.birthday.byId.invalidate({ birthdayId: deletedBirthday.id }),
      ]);
    },
  });
  const { isPending: deleteLoading, error: deleteError } = deleteBirthday;

  const handleDateChange = (y: number | null, m: number, d: number) => {
    setYear(y);
    setMonth(m);
    setDay(d);
  };

  return (
    <>
      <form
        className="flex flex-col gap-6 text-ink"
        onSubmit={async (e) => {
          e.preventDefault();

          // Validate month and day are set
          if (!month || !day) {
            toast.error("Please select a valid birth month and day");
            return;
          }

          await editBirthday.mutateAsync({
            id: birthday.id,
            name: name?.trim() ?? "",
            year: year,
            month: month,
            day: day,
            category: category.trim(),
            parent: parent.trim(),
            notes: notes.trim(),
            remindersEnabled,
            importSource: birthday.importSource,
          });

          handleClose?.();

          toast.success("Birthday updated");
        }}
      >
        <div className="grid gap-x-5 gap-y-4 md:grid-cols-2">
          <div>
            <label className="mb-2 block text-sm font-medium" htmlFor="name">
              Name
            </label>
            <input
              className="block h-12 w-full rounded-md border-rule bg-white focus:border-accent focus:ring-accent"
              id="name"
              onChange={(e) => setName(e.target.value)}
              required={true}
              type="text"
              value={name || ""}
            />
          </div>
          <div>
            <label className="mb-2 block text-sm font-medium">Birthday</label>
            <BirthdayDateInput
              year={year}
              month={month}
              day={day}
              onChange={handleDateChange}
              required={true}
              maxYear={new Date().getFullYear()}
              includeYearInput={true}
            />
          </div>
          <div>
            <label
              className="mb-2 block text-sm font-medium"
              htmlFor="category"
            >
              Category (optional)
            </label>
            <input
              className="block h-12 w-full rounded-md border-rule bg-white focus:border-accent focus:ring-accent"
              id="category"
              onChange={(e) => setCategory(e.target.value)}
              type="text"
              value={category}
            />
          </div>
          <div>
            <label className="mb-2 block text-sm font-medium" htmlFor="parent">
              Parent (optional)
            </label>
            <input
              className="block h-12 w-full rounded-md border-rule bg-white focus:border-accent focus:ring-accent"
              id="parent"
              onChange={(e) => setParent(e.target.value)}
              type="text"
              value={parent}
            />
          </div>
        </div>
        <div>
          <label className="mb-2 block text-sm font-medium" htmlFor="notes">
            Notes (optional)
          </label>
          <TextEdit
            content={notes}
            setContent={(value: string) => setNotes(value)}
          />
        </div>
        {birthdayRemindersEnabled && (
          <div className="flex items-start space-x-3">
            <div className="flex h-5 items-center">
              <input
                id="remindersEnabled"
                type="checkbox"
                checked={remindersEnabled}
                onChange={(e) => setRemindersEnabled(e.target.checked)}
                className="h-4 w-4 rounded border-rule text-accent focus:ring-accent"
              />
            </div>
            <div className="flex-1">
              <label
                htmlFor="remindersEnabled"
                className="text-sm font-medium text-ink"
              >
                Remind me on their birthday
              </label>
              <p className="mt-1 text-sm text-ink-soft">
                Send me an email on the day of this birthday.
              </p>
            </div>
          </div>
        )}
        {error && (
          <div className="text-sm text-red-500">
            An error occurred while saving the birthday. Please try again.
            <code>{error.message}</code>
          </div>
        )}
        <div className="sticky bottom-2 flex items-center justify-between gap-4 rounded-md border border-rule bg-white/95 p-3 text-right backdrop-blur-sm">
          <div className="text-left">
            {deleteError && (
              <p className="text-sm text-red-700">
                Error deleting birthday: {deleteError.message}
              </p>
            )}
            <button
              className={clsx(
                "inline-flex items-center rounded-md border border-transparent bg-transparent px-4 py-2 text-sm font-medium text-red-700",
                "hover:bg-red-100",
                "focus:ring-2 focus:ring-accent focus:ring-offset-2 focus:outline-hidden",
              )}
              disabled={deleteLoading}
              aria-label={`Delete ${birthday.name}'s birthday`}
              onClick={async () => {
                if (
                  window.confirm(
                    "Are you sure you want to delete this birthday?",
                  )
                ) {
                  await deleteBirthday.mutateAsync({
                    birthdayId: birthday.id,
                  });
                  toast("Birthday deleted");
                  if (handleClose) {
                    handleClose();
                  } else {
                    await router.push("/birthdays");
                  }
                }
              }}
              type="button"
            >
              <IoTrashOutline className="h-5 w-5 text-red-800" />
            </button>
          </div>

          <div className="flex items-center gap-4">
            {handleClose && (
              <button
                className={clsx(
                  "inline-flex items-center rounded-md border border-transparent px-4 py-2 font-medium",
                  "hover:bg-paper-deep",
                  "focus:ring-2 focus:ring-accent focus:ring-offset-2 focus:outline-hidden",
                )}
                onClick={handleClose}
                type="button"
              >
                Cancel
              </button>
            )}
            <PrimaryButton disabled={loading} type="submit">
              Save Birthday
            </PrimaryButton>
          </div>
        </div>
      </form>
    </>
  );
};
export default EditBirthdayForm;
