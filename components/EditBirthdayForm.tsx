import { useMutation } from "@apollo/client";
import { Birthday } from "@prisma/client";
import React, { useState } from "react";
import { toast } from "react-toastify";
import {
  EDIT_BIRTHDAY_MUTATION,
  GET_BIRTHDAY_BY_ID_QUERY,
} from "../graphql/Birthday";
import PrimaryButton from "./PrimaryButton";

const EditBirthdayForm = ({ birthday }: { birthday: Birthday }) => {
  const [name, setName] = useState(birthday.name);
  const [date, setDate] = useState(birthday.date);
  const [category, setCategory] = useState(birthday.category || "");
  const [parent, setParent] = useState(birthday.parent || "");
  const [notes, setNotes] = useState(birthday.notes || "");

  const [editBirthday, { loading, error }] = useMutation(
    EDIT_BIRTHDAY_MUTATION,
    {
      refetchQueries: [GET_BIRTHDAY_BY_ID_QUERY, "BirthdayById"],
    }
  );

  return (
    <form
      className="flex flex-col space-y-6"
      onSubmit={async (e) => {
        e.preventDefault();
        await editBirthday({
          variables: {
            id: birthday.id,
            name: name.trim(),
            date,
            category: category.trim(),
            parent: parent.trim(),
            notes: notes.trim(),
          },
        });

        toast.success("Birthday updated successfully");
      }}
    >
      <div className="grid lg:grid-cols-2 gap-x-4">
        <div>
          <label className="block mt-4" htmlFor="name">
            Name
          </label>
          <input
            className="block w-full border-gray-300 rounded h-12"
            id="name"
            onChange={(e) => setName(e.target.value)}
            type="text"
            value={name}
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
            type="date"
            value={date}
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
        <label className="block" htmlFor="parent">
          Notes (optional)
        </label>
        <textarea
          className="block w-full border-gray-300 rounded h-12"
          id="parent"
          onChange={(e) => setNotes(e.target.value)}
          value={notes}
        />
      </div>
      {error && (
        <div className="text-red-500 text-sm">
          An error occurred while saving the birthday. Please try again.
          <code>{error.message}</code>
        </div>
      )}
      <div className="text-right">
        <PrimaryButton disabled={loading} type="submit">
          Save Birthday
        </PrimaryButton>
      </div>
    </form>
  );
};
export default EditBirthdayForm;
