import BirthdayDateInput from "./BirthdayDateInput";
import PrimaryButton from "./PrimaryButton";
import { gql } from "@apollo/client";
import { useMutation } from "@apollo/client/react";
import clsx from "clsx";
import { useState } from "react";
import toast from "react-hot-toast";

const SUBMIT_BIRTHDAY_MUTATION = gql`
  mutation SubmitBirthday(
    $token: String!
    $name: String!
    $year: Int
    $month: Int!
    $day: Int!
    $category: String
    $notes: String
    $submitterName: String
    $submitterEmail: String
    $relationship: String
  ) {
    submitBirthday(
      token: $token
      name: $name
      year: $year
      month: $month
      day: $day
      category: $category
      notes: $notes
      submitterName: $submitterName
      submitterEmail: $submitterEmail
      relationship: $relationship
    ) {
      id
      name
      year
      month
      day
      date
      status
      __typename
    }
  }
`;

interface BirthdayEntry {
  id: string;
  name: string;
  year: number | null;
  month: number;
  day: number;
  category: string;
  relationship: string;
  notes: string;
}

interface BirthdaySubmissionFormProps {
  token: string;
  onSuccess?: () => void;
  onCancel?: () => void;
}

const createEmptyEntry = (): BirthdayEntry => ({
  id: Math.random().toString(36).slice(2),
  name: "",
  year: new Date().getFullYear(),
  month: 1,
  day: 1,
  category: "",
  relationship: "",
  notes: "",
});

const BirthdaySubmissionForm = ({
  token,
  onSuccess,
  onCancel,
}: BirthdaySubmissionFormProps) => {
  const [entries, setEntries] = useState<BirthdayEntry[]>([createEmptyEntry()]);
  const [submitterName, setSubmitterName] = useState("");
  const [submitterEmail, setSubmitterEmail] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submittedNames, setSubmittedNames] = useState<string[]>([]);

  const [submitBirthday] = useMutation(SUBMIT_BIRTHDAY_MUTATION);

  const updateEntry = (id: string, updates: Partial<BirthdayEntry>) => {
    setEntries((prev) =>
      prev.map((e) => (e.id === id ? { ...e, ...updates } : e)),
    );
  };

  const addEntry = () => {
    setEntries((prev) => [...prev, createEmptyEntry()]);
  };

  const removeEntry = (id: string) => {
    setEntries((prev) => prev.filter((e) => e.id !== id));
  };

  const validateEntries = () => {
    const errors: string[] = [];
    const currentYear = new Date().getFullYear();

    entries.forEach((entry, i) => {
      const label =
        entries.length > 1
          ? entry.name.trim() || `Entry ${i + 1}`
          : "Birthday";

      if (!entry.name.trim()) {
        errors.push(`${label}: Name is required`);
      } else if (entry.name.length > 100) {
        errors.push(`${label}: Name must be 100 characters or less`);
      }

      if (!entry.month || !entry.day) {
        errors.push(`${label}: Birthday is required`);
      } else {
        if (entry.month < 1 || entry.month > 12) {
          errors.push(`${label}: Please enter a valid month`);
        }
        if (entry.day < 1 || entry.day > 31) {
          errors.push(`${label}: Please enter a valid day`);
        }
        if (entry.year !== null) {
          if (entry.year < 1900 || entry.year > currentYear + 1) {
            errors.push(
              `${label}: Please enter a year between 1900 and next year`,
            );
          }
        }
      }

      if (entry.category.length > 50) {
        errors.push(`${label}: Category must be 50 characters or less`);
      }
      if (entry.notes.length > 500) {
        errors.push(`${label}: Notes must be 500 characters or less`);
      }
      if (entry.relationship.length > 50) {
        errors.push(`${label}: Relationship must be 50 characters or less`);
      }
    });

    if (submitterName.length > 100) {
      errors.push("Your name must be 100 characters or less");
    }

    if (submitterEmail.trim()) {
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(submitterEmail.trim())) {
        errors.push("Please enter a valid email address");
      }
    }

    return errors;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    const validationErrors = validateEntries();
    if (validationErrors.length > 0) {
      validationErrors.forEach((err) => toast.error(err));
      return;
    }

    const trimmedSubmitterName = submitterName.trim() || null;
    const trimmedSubmitterEmail = submitterEmail.trim() || null;

    setIsSubmitting(true);
    try {
      await Promise.all(
        entries.map((entry) =>
          submitBirthday({
            variables: {
              token,
              name: entry.name.trim(),
              year: entry.year,
              month: entry.month,
              day: entry.day,
              category: entry.category.trim() || null,
              notes: entry.notes.trim() || null,
              relationship: entry.relationship.trim() || null,
              submitterName: trimmedSubmitterName,
              submitterEmail: trimmedSubmitterEmail,
            },
          }),
        ),
      );

      setSubmittedNames(entries.map((e) => e.name.trim()));

      if (onSuccess) {
        onSuccess();
      }
    } catch (err) {
      console.error("Submission error:", err);
      toast.error("Something went wrong. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  };

  if (submittedNames.length > 0) {
    return (
      <div className="py-8 text-center">
        <div className="mb-4">
          <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-green-100">
            <svg
              className="h-8 w-8 text-green-600"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M5 13l4 4L19 7"
              />
            </svg>
          </div>
        </div>
        <h2 className="mb-2 text-xl font-semibold text-gray-900">Thank you!</h2>
        <p className="mb-2 text-gray-600">
          {submittedNames.length === 1
            ? "Your birthday submission has been sent successfully."
            : `${submittedNames.length} birthday submissions have been sent successfully.`}{" "}
          The recipient will review them and decide whether to add them to their
          birthday list.
        </p>
        {submittedNames.length > 1 && (
          <ul className="mb-4 inline-block text-left text-sm text-gray-500">
            {submittedNames.map((n, i) => (
              <li key={i} className="flex items-center gap-1.5">
                <span className="text-green-500">✓</span> {n}
              </li>
            ))}
          </ul>
        )}
        {onCancel && (
          <div>
            <button
              onClick={onCancel}
              className={clsx(
                "inline-flex items-center rounded-md border border-transparent px-4 py-2 font-medium text-gray-700",
                "hover:bg-gray-100",
                "focus:ring-2 focus:ring-gray-500 focus:ring-offset-2 focus:outline-hidden",
              )}
            >
              Close
            </button>
          </div>
        )}
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-2xl">
      <div className="mb-6">
        <h1 className="mb-2 text-2xl font-bold text-gray-900">
          Add Birthdays
        </h1>
        <p className="text-gray-600">
          Help someone keep track of important birthdays by adding the details
          below.
        </p>
      </div>

      <form onSubmit={handleSubmit} className="flex flex-col space-y-4">
        {entries.map((entry, index) => (
          <div
            key={entry.id}
            className="rounded-md border border-gray-200 p-4"
          >
            <div className="mb-3 flex items-center justify-between">
              <h3 className="text-sm font-semibold text-gray-700">
                {entries.length > 1
                  ? entry.name.trim() || `Birthday ${index + 1}`
                  : "Birthday"}
              </h3>
              {entries.length > 1 && (
                <button
                  type="button"
                  onClick={() => removeEntry(entry.id)}
                  className="text-sm text-gray-400 hover:text-red-500"
                  aria-label="Remove entry"
                >
                  Remove
                </button>
              )}
            </div>

            <div className="grid gap-x-4 md:grid-cols-2">
              <div>
                <label
                  className="block text-sm font-medium"
                  htmlFor={`name-${entry.id}`}
                >
                  Name *
                </label>
                <input
                  className="mt-1 block h-12 w-full rounded-sm border-gray-300 text-gray-900"
                  id={`name-${entry.id}`}
                  onChange={(e) =>
                    updateEntry(entry.id, { name: e.target.value })
                  }
                  type="text"
                  value={entry.name}
                  placeholder="Enter the person's name"
                  maxLength={100}
                />
              </div>
              <div>
                <label className="block text-sm font-medium">Birthday *</label>
                <div className="mt-1">
                  <BirthdayDateInput
                    idPrefix={`entry-${entry.id}`}
                    year={entry.year}
                    month={entry.month}
                    day={entry.day}
                    onChange={(year, month, day) =>
                      updateEntry(entry.id, { year, month, day })
                    }
                    required={false}
                    maxYear={new Date().getFullYear()}
                  />
                </div>
              </div>
              <div>
                <label
                  className="mt-3 block text-sm font-medium"
                  htmlFor={`category-${entry.id}`}
                >
                  Category (optional)
                </label>
                <input
                  className="mt-1 block h-12 w-full rounded-sm border-gray-300 text-gray-900"
                  id={`category-${entry.id}`}
                  onChange={(e) =>
                    updateEntry(entry.id, { category: e.target.value })
                  }
                  type="text"
                  value={entry.category}
                  placeholder="e.g., Family, Friend, Colleague"
                  maxLength={50}
                />
              </div>
              <div>
                <label
                  className="mt-3 block text-sm font-medium"
                  htmlFor={`relationship-${entry.id}`}
                >
                  Relationship (optional)
                </label>
                <input
                  className="mt-1 block h-12 w-full rounded-sm border-gray-300 text-gray-900"
                  id={`relationship-${entry.id}`}
                  onChange={(e) =>
                    updateEntry(entry.id, { relationship: e.target.value })
                  }
                  type="text"
                  value={entry.relationship}
                  placeholder="e.g., Sister, Best friend, Coworker"
                  maxLength={50}
                />
              </div>
            </div>

            <div className="mt-3">
              <label
                className="block text-sm font-medium"
                htmlFor={`notes-${entry.id}`}
              >
                Notes (optional)
              </label>
              <textarea
                className="mt-1 block w-full rounded-sm border-gray-300 text-gray-900"
                id={`notes-${entry.id}`}
                onChange={(e) =>
                  updateEntry(entry.id, { notes: e.target.value })
                }
                value={entry.notes}
                placeholder="Any additional information or special notes"
                rows={2}
                maxLength={500}
              />
              <p className="mt-0.5 text-xs text-gray-500">
                {entry.notes.length}/500 characters
              </p>
            </div>
          </div>
        ))}

        <button
          type="button"
          onClick={addEntry}
          className={clsx(
            "flex w-full items-center justify-center gap-2 rounded-md border border-dashed border-gray-300 py-3 text-sm font-medium text-gray-600",
            "hover:border-gray-400 hover:text-gray-800",
            "focus:ring-2 focus:ring-gray-400 focus:ring-offset-2 focus:outline-hidden",
          )}
        >
          <svg
            className="h-4 w-4"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M12 4v16m8-8H4"
            />
          </svg>
          Add another birthday
        </button>

        <div className="border-t pt-4">
          <h3 className="mb-2 text-lg font-medium text-gray-900">
            Your Information (optional)
          </h3>
          <p className="mb-3 text-xs text-gray-500">
            This helps the recipient know who submitted the birthdays.
          </p>
          <div className="grid gap-x-4 md:grid-cols-2">
            <div>
              <label
                className="block text-sm font-medium"
                htmlFor="submitterName"
              >
                Your Name
              </label>
              <input
                className="mt-1 block h-12 w-full rounded-sm border-gray-300 text-gray-900"
                id="submitterName"
                onChange={(e) => setSubmitterName(e.target.value)}
                type="text"
                value={submitterName}
                placeholder="Your name"
                maxLength={100}
              />
            </div>
            <div>
              <label
                className="block text-sm font-medium"
                htmlFor="submitterEmail"
              >
                Your Email
              </label>
              <input
                className="mt-1 block h-12 w-full rounded-sm border-gray-300 text-gray-900"
                id="submitterEmail"
                onChange={(e) => setSubmitterEmail(e.target.value)}
                type="email"
                value={submitterEmail}
                placeholder="your.email@example.com"
              />
            </div>
          </div>
        </div>

        <div className="flex items-center justify-end gap-4 pt-2">
          {onCancel && (
            <button
              className={clsx(
                "inline-flex items-center rounded-md border border-transparent px-4 py-2 font-medium text-gray-700",
                "hover:bg-gray-100",
                "focus:ring-2 focus:ring-gray-500 focus:ring-offset-2 focus:outline-hidden",
              )}
              onClick={onCancel}
              type="button"
            >
              Cancel
            </button>
          )}
          <PrimaryButton disabled={isSubmitting} type="submit">
            {isSubmitting
              ? "Submitting..."
              : entries.length === 1
                ? "Submit Birthday"
                : `Submit ${entries.length} Birthdays`}
          </PrimaryButton>
        </div>
      </form>
    </div>
  );
};

export default BirthdaySubmissionForm;
