import { useMutation } from "@apollo/client";
import { useSession } from "next-auth/react";
import React, { useState } from "react";
import { toast } from "react-toastify";
import {
  CREATE_BIRTHDAY_MUTATION,
  GET_ALL_BIRTHDAYS_QUERY,
} from "../graphql/Birthday";
import PrimaryButton from "./PrimaryButton";

const CreateBirthdayForm = () => {
  const { data: session } = useSession();
  const [name, setName] = useState("");
  const [date, setDate] = useState("");
  const [category, setCategory] = useState("");
  const [parent, setParent] = useState("");
  const userId = session?.user?.id;

  const [createBirthday, { loading, error }] = useMutation(
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
            className="block w-full border-gray-300 rounded h-12"
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
            className="block w-full border-gray-300 rounded h-12"
            id="date"
            onChange={(e) => setDate(e.target.value)}
            max={new Date().toISOString().split("T")[0]}
            type="date"
            value={date}
          />
        </div>
        <div>
          <label className="block mt-4 text-sm" htmlFor="category">
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
          <label className="block mt-4 text-sm" htmlFor="parent">
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
      <div className="text-right">
        {error && (
          <div className="text-red-500 text-sm">
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
