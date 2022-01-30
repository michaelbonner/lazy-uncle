import { useMutation } from "@apollo/client";
import { useSession } from "next-auth/react";
import React, { useEffect, useState } from "react";
import {
  CREATE_BIRTHDAY_MUTATION,
  GET_ALL_BIRTHDAYS_QUERY,
} from "../graphql/Birthday";

const CreateBirthdayForm = () => {
  const { data: session } = useSession();
  const [name, setName] = useState("");
  const [date, setDate] = useState("");
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
            name,
            date,
            userId,
          },
        });
        setName("");
        setDate("");
      }}
    >
      <div className="grid lg:grid-cols-2 gap-x-8">
        <div>
          <label className="block" htmlFor="name">
            Name
          </label>
          <input
            className="block w-full border-gray-300"
            id="name"
            onChange={(e) => setName(e.target.value)}
            type="text"
            value={name}
          />
        </div>
        <div>
          <label className="block" htmlFor="date">
            Birthday
          </label>
          <input
            className="block w-full border-gray-300"
            id="date"
            onChange={(e) => setDate(e.target.value)}
            type="date"
            value={date}
          />
        </div>
      </div>
      <div className="text-right">
        <button
          className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
          type="submit"
        >
          Add Birthday
        </button>
      </div>
    </form>
  );
};
export default CreateBirthdayForm;
