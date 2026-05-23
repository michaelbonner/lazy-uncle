import { SUBMIT_BIRTHDAY_MUTATION } from "../graphql/Sharing";
import BirthdayDateInput from "./BirthdayDateInput";
import PrimaryButton from "./PrimaryButton";
import { useMutation } from "@apollo/client/react";
import clsx from "clsx";
import { useState } from "react";
import toast from "react-hot-toast";

interface BirthdayEntry {
  id: string;
  name: string;
  year: number | null;
  month: number;
  day: number;
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

      if (entry.notes.length > 500) {
        errors.push(`${label}: Notes must be 500 characters or less`);
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
              notes: entry.notes.trim() || null,
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
          <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-emerald-100">
            <svg
              className="h-8 w-8 text-emerald-700"
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
        <h2 className="mb-2 font-display text-xl font-semibold text-ink">
          Thank you!
        </h2>
        <p className="mb-2 text-ink">
          {submittedNames.length === 1
            ? "Your birthday submission has been sent successfully."
            : `${submittedNames.length} birthday submissions have been sent successfully.`}{" "}
          The recipient will review them and decide whether to add them to their
          birthday list.
        </p>
        {submittedNames.length > 1 && (
          <ul className="mb-4 inline-block text-left text-sm text-ink-soft">
            {submittedNames.map((n, i) => (
              <li key={i} className="flex items-center gap-1.5">
                <span className="text-emerald-600">✓</span> {n}
              </li>
            ))}
          </ul>
        )}
        {onCancel && (
          <div>
            <button
              onClick={onCancel}
              className={clsx(
                "inline-flex items-center rounded-md border border-rule bg-paper px-4 py-2 font-medium text-ink transition",
                "hover:bg-paper-deep",
                "focus:outline-hidden focus:ring-2 focus:ring-accent/40 focus:ring-offset-2",
              )}
            >
              Close
            </button>
          </div>
        )}
      </div>
    );
  }

  const inputClass =
    "block h-11 w-full rounded-md border border-rule bg-paper px-3 text-sm text-ink placeholder:text-ink-soft focus:border-accent focus:outline-hidden focus:ring-1 focus:ring-accent";

  return (
    <form onSubmit={handleSubmit} className="flex flex-col space-y-6">
      <div className="overflow-x-auto">
        <div className="min-w-[600px] space-y-2 lg:min-w-0">
          <div className="grid grid-cols-[1.5fr_2fr_2.5fr_2.5rem] gap-x-3 px-2 text-xs font-semibold uppercase tracking-wide text-ink">
            <div>Name *</div>
            <div>Birthday *</div>
            <div>Notes</div>
            <div className="sr-only">Remove</div>
          </div>
          {entries.map((entry, index) => (
            <div
              key={entry.id}
              className="grid grid-cols-[1.5fr_2fr_2.5fr_2.5rem] items-start gap-x-3 gap-y-2 rounded-md border border-rule bg-paper-deep p-2"
            >
              <div>
                <label className="sr-only" htmlFor={`name-${entry.id}`}>
                  Name
                </label>
                <input
                  className={inputClass}
                  id={`name-${entry.id}`}
                  onChange={(e) =>
                    updateEntry(entry.id, { name: e.target.value })
                  }
                  type="text"
                  value={entry.name}
                  placeholder="Full name"
                  maxLength={100}
                />
              </div>
              <div>
                <label className="sr-only">Birthday</label>
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
              <div>
                <label className="sr-only" htmlFor={`notes-${entry.id}`}>
                  Notes
                </label>
                <input
                  className={inputClass}
                  id={`notes-${entry.id}`}
                  onChange={(e) =>
                    updateEntry(entry.id, { notes: e.target.value })
                  }
                  type="text"
                  value={entry.notes}
                  placeholder="Anything to remember"
                  maxLength={500}
                />
              </div>
              <div className="flex h-11 items-center justify-center">
                {entries.length > 1 ? (
                  <button
                    type="button"
                    onClick={() => removeEntry(entry.id)}
                    className="flex h-8 w-8 items-center justify-center rounded-md text-ink-soft transition hover:bg-rose-100 hover:text-rose-700"
                    aria-label={`Remove birthday ${index + 1}`}
                    title="Remove"
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
                        d="M6 18L18 6M6 6l12 12"
                      />
                    </svg>
                  </button>
                ) : null}
              </div>
            </div>
          ))}
        </div>
      </div>

      <button
        type="button"
        onClick={addEntry}
        className={clsx(
          "flex w-full items-center justify-center gap-2 rounded-md border border-dashed border-rule py-3 text-sm font-medium text-ink-soft transition",
          "hover:border-accent hover:bg-paper-deep hover:text-ink",
          "focus:outline-hidden focus:ring-2 focus:ring-accent/40 focus:ring-offset-2",
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

      <div className="border-t border-rule pt-6">
        <h3 className="mb-1 font-display text-lg font-semibold text-ink">
          Your information (optional)
        </h3>
        <p className="mb-3 text-xs text-ink-soft">
          This helps the recipient know who submitted the birthdays.
        </p>
        <div className="grid gap-x-4 gap-y-3 md:grid-cols-2">
          <div>
            <label
              className="mb-1 block text-sm font-medium text-ink"
              htmlFor="submitterName"
            >
              Your name
            </label>
            <input
              className={inputClass}
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
              className="mb-1 block text-sm font-medium text-ink"
              htmlFor="submitterEmail"
            >
              Your email
            </label>
            <input
              className={inputClass}
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
              "inline-flex items-center rounded-md border border-rule bg-paper px-4 py-2 font-medium text-ink transition",
              "hover:bg-paper-deep",
              "focus:outline-hidden focus:ring-2 focus:ring-accent/40 focus:ring-offset-2",
            )}
            onClick={onCancel}
            type="button"
          >
            Cancel
          </button>
        )}
        <PrimaryButton disabled={isSubmitting} type="submit">
          {isSubmitting
            ? "Submitting…"
            : entries.length === 1
              ? "Submit birthday"
              : `Submit ${entries.length} birthdays`}
        </PrimaryButton>
      </div>
    </form>
  );
};

export default BirthdaySubmissionForm;
