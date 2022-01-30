import { useMutation } from "@apollo/client";
import { Birthday } from "@prisma/client";
import { parse } from "csv-parse/browser/esm/sync";
import { useSession } from "next-auth/react";
import React, { useState } from "react";
import {
  CREATE_BIRTHDAY_MUTATION,
  GET_ALL_BIRTHDAYS_QUERY,
} from "../graphql/Birthday";

const UploadCsvBirthdayForm = () => {
  const { data: session } = useSession();
  const [csv, setCsv] = useState("");
  const [birthdays, setBirthdays] = useState([]);
  const userId = session?.user?.id;

  const [createBirthday, { data, loading, error }] = useMutation(
    CREATE_BIRTHDAY_MUTATION,
    {
      refetchQueries: [GET_ALL_BIRTHDAYS_QUERY, "Birthdays"],
    }
  );

  // handle file upload
  const handleFileUpload = (e: any) => {
    try {
      e.preventDefault();
      const reader = new FileReader();
      reader.onload = async (data: any) => {
        const parsedData = parse(data?.target?.result);
        setBirthdays(parsedData);
      };

      reader.readAsText(e.target.files[0]);
    } catch (error: any) {
      alert(error.message);
    }
  };

  return (
    <form
      className="flex flex-col space-y-6"
      onSubmit={async (e) => {
        e.preventDefault();
        birthdays.forEach(async (birthday: any) => {
          await createBirthday({
            variables: {
              name: birthday[0],
              date: birthday[1],
              category: birthday[2] !== "NULL" ? birthday[2] : null,
              parent: birthday[3] !== "NULL" ? birthday[3] : null,
              userId,
            },
          });
        });

        setCsv("");
      }}
    >
      <div className="grid lg:grid-cols-4 gap-x-4 items-end">
        <div>
          <label className="block mt-4" htmlFor="csv">
            CSV
          </label>
          <input
            className="block w-full border-gray-300"
            id="csv"
            accept=".csv"
            onChange={handleFileUpload}
            type="file"
          />
        </div>

        <div>
          <button
            className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
            type="submit"
          >
            Upload CSV
          </button>
        </div>
      </div>
    </form>
  );
};
export default UploadCsvBirthdayForm;
