import { useMutation } from "@apollo/client";
import { parse as csvParse } from "csv-parse/browser/esm/sync";
import { format, isValid, parse } from "date-fns";
import { useSession } from "next-auth/react";
import React, { useState } from "react";
import {
  CREATE_BIRTHDAY_MUTATION,
  GET_ALL_BIRTHDAYS_QUERY,
} from "../graphql/Birthday";
import PrimaryButton from "./PrimaryButton";

const UploadCsvBirthdayForm = () => {
  const { data: session } = useSession();
  const [birthdays, setBirthdays] = useState([]);
  const userId = session?.user?.id;

  const [createBirthday, { loading, error }] = useMutation(
    CREATE_BIRTHDAY_MUTATION
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
              notes: row[4] !== "NULL" ? row[4] : null,
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
          const { name, date, category, parent, notes } = birthday;
          await createBirthday({
            variables: {
              name,
              date,
              category,
              parent,
              notes,
              userId,
            },
            refetchQueries: [
              {
                query: GET_ALL_BIRTHDAYS_QUERY,
              },
            ],
          });
        });
      }}
    >
      <div>
        <div>
          <label className="block mt-4" htmlFor="csv">
            <p>Rows of name, date (yyyy-mm-dd), category, parent, notes</p>
            <p>Example:</p>
            <p className="bg-white border border-dashed py-2 px-4">
              <code>Mike,2020-01-02,NULL,NULL,Likes the Browns</code>
            </p>
          </label>
          <input
            className=" my-4 block w-full px-3 py-1.5 text-base font-normal text-gray-700 bg-white bg-clip-padding border border-solid border-gray-300 rounded transition ease-in-out m-0 focus:text-gray-700 focus:bg-white focus:border-teal-600 focus:outline-none"
            id="csv"
            accept=".csv"
            onChange={handleFileUpload}
            type="file"
          />
        </div>

        {error && (
          <div className="text-red-500 text-sm">
            An error occurred while creating the birthday. Please try again.
            <code>{error.message}</code>
          </div>
        )}

        <div className="mt-4 md:mt-0 flex justify-end">
          <PrimaryButton disabled={loading} type="submit">
            Upload CSV
          </PrimaryButton>
        </div>
      </div>
    </form>
  );
};
export default UploadCsvBirthdayForm;
