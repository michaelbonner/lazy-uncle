import { useMutation } from "@apollo/client";
import { useState } from "react";
import { IoTrashOutline } from "react-icons/io5";
import { toast } from "react-toastify";
import classNames from "../functions/classNames";
import { NexusGenObjects } from "../generated/nexus-typegen";
import {
  DELETE_BIRTHDAY_MUTATION,
  EDIT_BIRTHDAY_MUTATION,
  GET_ALL_BIRTHDAYS_QUERY,
} from "../graphql/Birthday";
import PrimaryButton from "./PrimaryButton";
import TextEdit from "./TextEdit";

const EditBirthdayForm = ({
  birthday,
  handleClose,
}: {
  birthday: NexusGenObjects["Birthday"];
  handleClose?: () => void;
}) => {
  const [name, setName] = useState(birthday.name);
  const [date, setDate] = useState(birthday.date);
  const [category, setCategory] = useState(birthday.category || "");
  const [parent, setParent] = useState(birthday.parent || "");
  const [notes, setNotes] = useState(birthday.notes || "");

  const [editBirthday, { loading, error }] = useMutation(
    EDIT_BIRTHDAY_MUTATION
  );

  const [deleteBirthday, { loading: deleteLoading, error: deleteError }] =
    useMutation(DELETE_BIRTHDAY_MUTATION);

  return (
    <>
      <form
        className="flex flex-col space-y-6"
        onSubmit={async (e) => {
          e.preventDefault();
          await editBirthday({
            variables: {
              id: birthday.id,
              name: name?.trim(),
              date,
              category: category.trim(),
              parent: parent.trim(),
              notes: notes.trim(),
            },
          });

          handleClose && handleClose();

          toast.success("Birthday updated successfully");
        }}
      >
        <div className="grid gap-x-4 md:grid-cols-2">
          <div>
            <label className="mt-4 block" htmlFor="name">
              Name
            </label>
            <input
              className="block h-12 w-full rounded border-gray-300"
              id="name"
              onChange={(e) => setName(e.target.value)}
              required={true}
              type="text"
              value={name || ""}
            />
          </div>
          <div>
            <label className="mt-4 block" htmlFor="date">
              Birthday
            </label>
            <input
              className="block h-12 w-full rounded border-gray-300"
              id="date"
              onChange={(e) => setDate(e.target.value)}
              max={new Date().toISOString().split("T")[0]}
              required={true}
              type="date"
              value={date || ""}
            />
          </div>
          <div>
            <label className="mt-4 block" htmlFor="category">
              Category (optional)
            </label>
            <input
              className="block h-12 w-full rounded border-gray-300"
              id="category"
              onChange={(e) => setCategory(e.target.value)}
              type="text"
              value={category}
            />
          </div>
          <div>
            <label className="mt-4 block" htmlFor="parent">
              Parent (optional)
            </label>
            <input
              className="block h-12 w-full rounded border-gray-300"
              id="parent"
              onChange={(e) => setParent(e.target.value)}
              type="text"
              value={parent}
            />
          </div>
        </div>
        <div>
          <label className="block" htmlFor="notes">
            Notes (optional)
          </label>
          <TextEdit
            content={notes}
            setContent={(value: string) => setNotes(value)}
          />
        </div>
        {error && (
          <div className="text-sm text-red-500">
            An error occurred while saving the birthday. Please try again.
            <code>{error.message}</code>
          </div>
        )}
        <div className="sticky bottom-2 flex items-center justify-between gap-4 text-right">
          <div className="text-left">
            {deleteError && (
              <p className="text-sm text-red-700">
                Error deleting birthday: {deleteError.message}
              </p>
            )}
            <button
              className={classNames(
                "inline-flex items-center rounded-md border border-transparent bg-transparent px-4 py-2 text-sm font-medium text-red-700",
                "hover:bg-red-100",
                "focus:outline-none focus:ring-2 focus:ring-cyan-500 focus:ring-offset-2"
              )}
              disabled={deleteLoading}
              onClick={() => {
                if (
                  window.confirm(
                    "Are you sure you want to delete this birthday?"
                  )
                ) {
                  deleteBirthday({
                    variables: {
                      birthdayId: birthday?.id,
                    },
                    refetchQueries: [
                      {
                        query: GET_ALL_BIRTHDAYS_QUERY,
                      },
                    ],
                  });
                  toast.info("Birthday deleted successfully!");
                  handleClose && handleClose();
                }
              }}
              type="button"
            >
              <IoTrashOutline className="h-5 w-5 text-red-800" />
            </button>
          </div>

          <div className="flex items-center gap-4">
            {handleClose && (
              <button
                className={classNames(
                  "inline-flex items-center rounded-md border border-transparent px-4 py-2 font-medium",
                  "hover:bg-gray-100",
                  "focus:outline-none focus:ring-2 focus:ring-gray-500 focus:ring-offset-2"
                )}
                onClick={handleClose}
                type="button"
              >
                Cancel
              </button>
            )}
            <PrimaryButton disabled={loading} type="submit">
              Save Birthday
            </PrimaryButton>
          </div>
        </div>
      </form>
    </>
  );
};
export default EditBirthdayForm;
