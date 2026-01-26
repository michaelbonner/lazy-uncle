import {
  CREATE_BIRTHDAY_MUTATION,
  GET_ALL_BIRTHDAYS_QUERY,
} from "../graphql/Birthday";
import { authClient } from "../lib/auth-client";
// import the auth client
import BirthdayDateInput from "./BirthdayDateInput";
import PrimaryButton from "./PrimaryButton";
import { useMutation } from "@apollo/client/react";
import clsx from "clsx";
import dynamic from "next/dynamic";
import { useState } from "react";
import toast from "react-hot-toast";

const TextEdit = dynamic(() => import("./TextEdit"), {
  loading: () => (
    <div className="flex h-full min-h-[250px] w-full items-center justify-center rounded-lg border-t-4 border-b-4 bg-white text-center text-gray-800">
      <p className="animate-pulse">Loading editor...</p>
    </div>
  ),
});

const CreateBirthdayForm = ({ onSubmit }: { onSubmit: () => void }) => {
  const { data: session } = authClient.useSession();
  const [name, setName] = useState("");

  // NEW: Date component states
  const [year, setYear] = useState<number | null>(null);
  const [month, setMonth] = useState<number>(1);
  const [day, setDay] = useState<number>(1);

  const [category, setCategory] = useState("");
  const [parent, setParent] = useState("");
  const [notes, setNotes] = useState("");
  const userId = session?.user?.id;

  const [createBirthday, { loading, error }] = useMutation(
    CREATE_BIRTHDAY_MUTATION,
  );

  const handleDateChange = (y: number | null, m: number, d: number) => {
    setYear(y);
    setMonth(m);
    setDay(d);
  };

  return (
    <form
      className="flex flex-col space-y-6"
      onSubmit={async (e) => {
        e.preventDefault();

        // Validate month and day are set
        if (!month || !day) {
          toast.error("Please select a valid birth month and day");
          return;
        }

        await createBirthday({
          variables: {
            name: name.trim(),
            year: year,
            month: month,
            day: day,
            category: category.trim(),
            parent: parent.trim(),
            notes: notes.trim(),
            userId,
            importSource: "manual",
          },
          refetchQueries: [
            {
              query: GET_ALL_BIRTHDAYS_QUERY,
            },
          ],
        });

        // Reset form
        setName("");
        setYear(null);
        setMonth(1);
        setDay(1);
        setCategory("");
        setParent("");
        setNotes("");
        toast.success("Birthday created");
        onSubmit();
      }}
    >
      <div className="grid gap-x-4 md:grid-cols-2">
        <div>
          <label className="mt-4 block text-sm" htmlFor="name">
            Name
          </label>
          <input
            className="block h-12 w-full rounded-sm border-gray-300"
            id="name"
            onChange={(e) => setName(e.target.value)}
            required={true}
            type="text"
            value={name}
          />
        </div>
        <div>
          <label className="mt-4 block text-sm">Birthday</label>
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
          <label className="mt-4 block text-sm" htmlFor="category">
            Category (optional)
          </label>
          <input
            className="block h-12 w-full rounded-sm border-gray-300"
            id="category"
            onChange={(e) => setCategory(e.target.value)}
            type="text"
            value={category}
          />
        </div>
        <div>
          <label className="mt-4 block text-sm" htmlFor="parent">
            Parent (optional)
          </label>
          <input
            className="block h-12 w-full rounded-sm border-gray-300"
            id="parent"
            onChange={(e) => setParent(e.target.value)}
            type="text"
            value={parent}
          />
        </div>
      </div>
      <div>
        <label className="block" htmlFor="notes">
          Notes (optional)
        </label>
        <TextEdit
          content={notes}
          setContent={(value: string) => setNotes(value)}
        />
      </div>
      {error && (
        <div className="text-sm text-red-500">
          An error occurred while creating the birthday. Please try again.
          <code>{error.message}</code>
        </div>
      )}
      <div className="flex items-center justify-end gap-4 text-right">
        {onSubmit && (
          <button
            className={clsx(
              "inline-flex items-center rounded-md border border-transparent px-4 py-2 font-medium",
              "hover:bg-gray-100",
              "focus:ring-2 focus:ring-gray-500 focus:ring-offset-2 focus:outline-hidden",
            )}
            onClick={onSubmit}
            type="button"
          >
            Cancel
          </button>
        )}
        <PrimaryButton disabled={loading} type="submit">
          Add Birthday
        </PrimaryButton>
      </div>
    </form>
  );
};
export default CreateBirthdayForm;
