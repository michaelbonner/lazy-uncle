import { useMutation } from "@apollo/client";
import React, { useState } from "react";
import { toast } from "react-toastify";
import { NexusGenObjects } from "../generated/nexus-typegen";
import { EDIT_BIRTHDAY_MUTATION } from "../graphql/Birthday";
import PrimaryButton from "./PrimaryButton";
import TextEdit from "./TextEdit";

const EditBirthdayForm = ({
  birthday,
  handleClose,
}: {
  birthday: NexusGenObjects["Birthday"];
  handleClose?: () => void;
}) => {
  const [name, setName] = useState(birthday.name);
  const [date, setDate] = useState(birthday.date);
  const [category, setCategory] = useState(birthday.category || "");
  const [parent, setParent] = useState(birthday.parent || "");
  const [notes, setNotes] = useState(birthday.notes || "");

  const [editBirthday, { loading, error }] = useMutation(
    EDIT_BIRTHDAY_MUTATION
  );

  return (
    <form
      className="flex flex-col space-y-6"
      onSubmit={async (e) => {
        e.preventDefault();
        await editBirthday({
          variables: {
            id: birthday.id,
            name: name?.trim(),
            date,
            category: category.trim(),
            parent: parent.trim(),
            notes: notes.trim(),
          },
        });

        handleClose && handleClose();

        toast.success("Birthday updated successfully");
      }}
    >
      <div className="grid md:grid-cols-2 gap-x-4">
        <div>
          <label className="block mt-4" htmlFor="name">
            Name
          </label>
          <input
            className="block w-full border-gray-300 rounded h-12"
            id="name"
            onChange={(e) => setName(e.target.value)}
            required={true}
            type="text"
            value={name || ""}
          />
        </div>
        <div>
          <label className="block mt-4" htmlFor="date">
            Birthday
          </label>
          <input
            className="block w-full border-gray-300 rounded h-12"
            id="date"
            onChange={(e) => setDate(e.target.value)}
            max={new Date().toISOString().split("T")[0]}
            required={true}
            type="date"
            value={date || ""}
          />
        </div>
        <div>
          <label className="block mt-4" htmlFor="category">
            Category (optional)
          </label>
          <input
            className="block w-full border-gray-300 rounded h-12"
            id="category"
            onChange={(e) => setCategory(e.target.value)}
            type="text"
            value={category}
          />
        </div>
        <div>
          <label className="block mt-4" htmlFor="parent">
            Parent (optional)
          </label>
          <input
            className="block w-full border-gray-300 rounded h-12"
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
        <div className="text-red-500 text-sm">
          An error occurred while saving the birthday. Please try again.
          <code>{error.message}</code>
        </div>
      )}
      <div className="text-right sticky bottom-2 flex justify-end items-center gap-4">
        {handleClose && (
          <button
            className="inline-flex items-center px-4 py-2 border border-transparent font-medium rounded-md shadow-sm hover:bg-gray-100 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-cyan-500"
            onClick={handleClose}
            type="button"
          >
            Cancel
          </button>
        )}
        <PrimaryButton disabled={loading} type="submit">
          Save Birthday Details
        </PrimaryButton>
      </div>
    </form>
  );
};
export default EditBirthdayForm;
