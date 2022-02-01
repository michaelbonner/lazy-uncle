import { useMutation } from "@apollo/client";
import { Birthday } from "@prisma/client";
import React, { useState } from "react";
import { toast } from "react-toastify";
import {
  EDIT_BIRTHDAY_MUTATION,
  GET_BIRTHDAY_BY_ID_QUERY,
} from "../graphql/Birthday";

const EditBirthdayForm = ({ birthday }: { birthday: Birthday }) => {
  const [name, setName] = useState(birthday.name);
  const [date, setDate] = useState(birthday.date);
  const [category, setCategory] = useState(birthday.category || "");
  const [parent, setParent] = useState(birthday.parent || "");

  const [editBirthday, { data, loading, error }] = useMutation(
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
          },
        });

        toast.success("Birthday updated successfully");
      }}
    >
      <div className="grid lg:grid-cols-4 gap-x-4">
        <div>
          <label className="block mt-4" htmlFor="name">
            Name
          </label>
          <input
            className="block w-full border-slate-300"
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
            className="block w-full border-slate-300"
            id="date"
            onChange={(e) => setDate(e.target.value)}
            type="date"
            value={date}
          />
        </div>
        <div>
          <label className="block mt-4" htmlFor="category">
            Category (optional)
          </label>
          <input
            className="block w-full border-slate-300"
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
            className="block w-full border-slate-300"
            id="parent"
            onChange={(e) => setParent(e.target.value)}
            type="text"
            value={parent}
          />
        </div>
      </div>
      <div className="text-right">
        <button
          className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
          type="submit"
        >
          Save Birthday
        </button>
      </div>
    </form>
  );
};
export default EditBirthdayForm;
