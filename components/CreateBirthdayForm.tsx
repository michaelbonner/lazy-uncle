import { useMutation } from "@apollo/client";
import { useSession } from "next-auth/react";
import React, { useEffect, useState } from "react";
import { toast } from "react-toastify";
import {
  CREATE_BIRTHDAY_MUTATION,
  GET_ALL_BIRTHDAYS_QUERY,
} from "../graphql/Birthday";

const CreateBirthdayForm = () => {
  const { data: session } = useSession();
  const [name, setName] = useState("");
  const [date, setDate] = useState("");
  const [category, setCategory] = useState("");
  const [parent, setParent] = useState("");
  const userId = session?.user?.id;

  const [createBirthday, { data, loading, error }] = useMutation(
    CREATE_BIRTHDAY_MUTATION,
    {
      refetchQueries: [GET_ALL_BIRTHDAYS_QUERY, "Birthdays"],
    }
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
            userId,
          },
        });
        setName("");
        setDate("");
        setCategory("");
        setParent("");
        toast.success("Birthday created successfully");
      }}
    >
      <div className="grid lg:grid-cols-2 gap-x-4">
        <div>
          <label className="block mt-4 text-sm" htmlFor="name">
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
          <label className="block mt-4 text-sm" htmlFor="date">
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
          <label className="block mt-4 text-sm" htmlFor="category">
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
          <label className="block mt-4 text-sm" htmlFor="parent">
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
          Add Birthday
        </button>
      </div>
    </form>
  );
};
export default CreateBirthdayForm;
