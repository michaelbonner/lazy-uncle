import type { Birthday } from "../drizzle/schema";
import { trpc } from "../lib/trpc";
import PrimaryButton from "./PrimaryButton";
import { parse as csvParse } from "csv-parse/browser/esm/sync";
import { format, isValid } from "date-fns";
import { useState } from "react";
import { toast } from "react-hot-toast";

const UploadCsvBirthdayForm = () => {
  const [birthdays, setBirthdays] = useState<
    Pick<Birthday, "name" | "date" | "category" | "parent" | "notes">[]
  >([]);

  const utils = trpc.useUtils();
  const createBirthday = trpc.birthday.create.useMutation();
  const { isPending: loading, error } = createBirthday;

  // handle file upload
  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0] || new Blob();
    try {
      e.preventDefault();
      const reader = new FileReader();
      reader.onload = async (data: ProgressEvent<FileReader>) => {
        const parsedData = csvParse(data?.target?.result as string);
        const parsedBirthdays = parsedData
          .filter((row: string[]) => {
            if (!isValid(new Date(row[1]))) {
              return false;
            }
            return true;
          })
          .filter((row: string[]) => {
            return row[0] !== "";
          })
          .map((row: string[]) => {
            return {
              name: row[0],
              date: format(new Date(row[1]), "yyyy-MM-dd"),
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

      reader.readAsText(file);
    } catch (error: unknown) {
      alert((error as Error).message);
    }
  };

  return (
    <form
      className="flex flex-col gap-6"
      onSubmit={async (e) => {
        e.preventDefault();

        let createdCount = 0;
        for (const birthday of birthdays) {
          const { name, date, category, parent, notes } = birthday;
          // CSV dates are stored as "yyyy-MM-dd"; split into components for the API.
          const dateParts = (date ?? "").split("-").map((part) => Number(part));
          const [year, month, day] = dateParts;

          if (
            dateParts.length !== 3 ||
            [year, month, day].some((part) => Number.isNaN(part)) ||
            !month ||
            !day
          ) {
            toast.error(`Invalid date for ${name}; skipping`);
            continue;
          }

          await createBirthday.mutateAsync({
            name,
            year: year || null,
            month,
            day,
            category,
            parent,
            notes,
            importSource: "csv",
          });
          createdCount++;
          (e.target as HTMLFormElement).reset();
        }
        await utils.birthday.list.invalidate();
        toast.success(`${createdCount} birthdays created successfully`);
      }}
    >
      <div className="grid gap-4">
        <div>
          <div>
            <label
              className="mb-2 block text-sm font-medium text-ink"
              htmlFor="csv"
            >
              Upload file
            </label>
            <input
              className="block w-full cursor-pointer rounded-md border border-rule bg-white text-sm text-ink file:mr-4 file:border-0 file:border-r file:border-rule file:bg-paper-deep file:px-4 file:py-3 file:font-medium file:text-ink focus:outline-2 focus:outline-accent"
              id="csv"
              accept=".csv"
              onChange={handleFileUpload}
              required
              type="file"
            />
            <p className="mt-3 text-sm text-ink-soft">
              Rows of name, date (yyyy-mm-dd), category, parent, notes
            </p>
            <p className="mt-4 text-sm font-medium text-ink">Example row</p>
            <p className="mt-2 overflow-x-auto rounded-md border border-rule bg-white px-4 py-3 text-sm text-ink-soft">
              <code>Mike,2020-01-02,NULL,NULL,Likes the Utah Mammoth</code>
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
