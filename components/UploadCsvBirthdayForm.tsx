import { useMutation } from "@apollo/client";
import { Birthday } from "@prisma/client";
import { parse as csvParse } from "csv-parse/browser/esm/sync";
import { format, isValid, parse } from "date-fns";
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
        const parsedData = csvParse(data?.target?.result);
        const parsedBirthdays = parsedData
          .filter((row: any) => {
            if (!isValid(parse(row[1], "yyyy-MM-dd", new Date()))) {
              return false;
            }
            return true;
          })
          .filter((row: any) => {
            return row[0] !== "";
          })
          .map((row: any) => {
            return {
              name: row[0],
              date: format(
                parse(row[1], "yyyy-MM-dd", new Date()),
                "yyyy-MM-dd"
              ),
              category: row[2] !== "NULL" ? row[2] : null,
              parent: row[3] !== "NULL" ? row[3] : null,
            };
          });

        if (parsedBirthdays.length > 0) {
          setBirthdays(parsedBirthdays);
        } else {
          alert("No birthdays found in the file");
        }
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
          const { name, date, category, parent } = birthday;
          await createBirthday({
            variables: {
              name,
              date,
              category,
              parent,
              userId,
            },
          });
        });

        setCsv("");
      }}
    >
      <div>
        <div>
          <label className="block mt-4" htmlFor="csv">
            <p>CSV</p>
            <p>Rows of name, date (yyyy-mm-dd), category, parent</p>
            <p>Example:</p>
            <p>Mike,2020-01-02,NULL,NULL</p>
          </label>
          <input
            className="block w-full border-slate-300 mt-2"
            id="csv"
            accept=".csv"
            onChange={handleFileUpload}
            type="file"
          />
        </div>

        <div className="mt-4 lg:mt-0 flex justify-end">
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
