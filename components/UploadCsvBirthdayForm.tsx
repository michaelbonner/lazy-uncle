import { useMutation } from "@apollo/client";
import { parse as csvParse } from "csv-parse/browser/esm/sync";
import { format, isValid, parse } from "date-fns";
import { useSession } from "next-auth/react";
import { useState } from "react";
import { toast } from "react-hot-toast";
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
            if (!isValid(new Date(row[1]))) {
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

        for await (const birthday of birthdays) {
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
          (e.target as HTMLFormElement).reset();
        }
        toast.success(`${birthdays.length} birthdays created successfully`);
      }}
    >
      <div className="grid gap-4">
        <div>
          <div>
            <label
              className="mb-2 block text-sm font-medium text-gray-900"
              htmlFor="csv"
            >
              Upload file
            </label>
            <input
              className="block w-full cursor-pointer rounded-none border-0 border-gray-300 bg-gray-50 text-sm text-gray-900 focus:outline-none"
              id="csv"
              accept=".csv"
              onChange={handleFileUpload}
              required
              type="file"
            />
            <p className="mt-1 text-sm text-gray-500">
              Rows of name, date (yyyy-mm-dd), category, parent, notes
            </p>
            <p className="mt-1 text-sm text-gray-500">Example:</p>
            <p className="mt-1 border border-dashed bg-white px-4 py-2 text-sm text-gray-500">
              <code>Mike,2020-01-02,NULL,NULL,Likes the Browns</code>
            </p>
          </div>

          {error && (
            <div className="text-sm text-red-500">
              An error occurred while creating the birthday. Please try again.
              <code>{error.message}</code>
            </div>
          )}
        </div>

        <div className="mt-4 flex justify-end md:mt-0">
          <PrimaryButton disabled={loading} type="submit">
            Upload CSV
          </PrimaryButton>
        </div>
      </div>
    </form>
  );
};
export default UploadCsvBirthdayForm;
