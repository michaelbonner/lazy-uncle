import { useMutation } from "@apollo/client";
import { useSession } from "next-auth/react";
import { useState } from "react";
import { toast } from "react-toastify";
import {
  CREATE_BIRTHDAY_MUTATION,
  GET_ALL_BIRTHDAYS_QUERY,
} from "../graphql/Birthday";
import PrimaryButton from "./PrimaryButton";
import TextEdit from "./TextEdit";

const CreateBirthdayForm = ({ onSubmit }: { onSubmit: () => void }) => {
  const { data: session } = useSession();
  const [name, setName] = useState("");
  const [date, setDate] = useState("");
  const [category, setCategory] = useState("");
  const [parent, setParent] = useState("");
  const [notes, setNotes] = useState("");
  const userId = session?.user?.id;

  const [createBirthday, { loading, error }] = useMutation(
    CREATE_BIRTHDAY_MUTATION
  );

  return (
    <form
      className="flex flex-col space-y-6"
      onSubmit={async (e) => {
        e.preventDefault();
        await createBirthday({
          variables: {
            name: name.trim(),
            date,
            category: category.trim(),
            parent: parent.trim(),
            notes: notes.trim(),
            userId,
          },
          refetchQueries: [
            {
              query: GET_ALL_BIRTHDAYS_QUERY,
            },
          ],
        });
        setName("");
        setDate("");
        setCategory("");
        setParent("");
        setNotes("");
        toast.success("Birthday created successfully");
        onSubmit();
      }}
    >
      <div className="grid gap-x-4 md:grid-cols-2">
        <div>
          <label className="mt-4 block text-sm" htmlFor="name">
            Name
          </label>
          <input
            className="block h-12 w-full rounded border-gray-300"
            id="name"
            onChange={(e) => setName(e.target.value)}
            required={true}
            type="text"
            value={name}
          />
        </div>
        <div>
          <label className="mt-4 block text-sm" htmlFor="date">
            Birthday
          </label>
          <input
            className="block h-12 w-full rounded border-gray-300"
            id="date"
            onChange={(e) => setDate(e.target.value)}
            max={new Date().toISOString().split("T")[0]}
            required={true}
            type="date"
            value={date}
          />
        </div>
        <div>
          <label className="mt-4 block text-sm" htmlFor="category">
            Category (optional)
          </label>
          <input
            className="block h-12 w-full rounded border-gray-300"
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
            className="block h-12 w-full rounded border-gray-300"
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
      <div className="text-right">
        {error && (
          <div className="text-sm text-red-500">
            An error occurred while creating the birthday. Please try again.
            <code>{error.message}</code>
          </div>
        )}
        <PrimaryButton disabled={loading} type="submit">
          Add Birthday
        </PrimaryButton>
      </div>
    </form>
  );
};
export default CreateBirthdayForm;
