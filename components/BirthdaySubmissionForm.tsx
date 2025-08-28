import { useMutation } from "@apollo/client";
import { useState } from "react";
import toast from "react-hot-toast";
import classNames from "../shared/classNames";
import PrimaryButton from "./PrimaryButton";
import { gql } from "@apollo/client";

const SUBMIT_BIRTHDAY_MUTATION = gql`
  mutation SubmitBirthday(
    $token: String!
    $name: String!
    $date: String!
    $category: String
    $notes: String
    $submitterName: String
    $submitterEmail: String
    $relationship: String
  ) {
    submitBirthday(
      token: $token
      name: $name
      date: $date
      category: $category
      notes: $notes
      submitterName: $submitterName
      submitterEmail: $submitterEmail
      relationship: $relationship
    ) {
      id
      name
      date
      status
      __typename
    }
  }
`;

interface BirthdaySubmissionFormProps {
  token: string;
  onSuccess?: () => void;
  onCancel?: () => void;
}

const BirthdaySubmissionForm = ({
  token,
  onSuccess,
  onCancel,
}: BirthdaySubmissionFormProps) => {
  const [name, setName] = useState("");
  const [date, setDate] = useState("");
  const [category, setCategory] = useState("");
  const [notes, setNotes] = useState("");
  const [submitterName, setSubmitterName] = useState("");
  const [submitterEmail, setSubmitterEmail] = useState("");
  const [relationship, setRelationship] = useState("");
  const [isSubmitted, setIsSubmitted] = useState(false);

  const [submitBirthday, { loading, error }] = useMutation(
    SUBMIT_BIRTHDAY_MUTATION,
  );

  const validateForm = () => {
    const errors: string[] = [];

    if (!name.trim()) {
      errors.push("Name is required");
    }

    if (!date) {
      errors.push("Birthday is required");
    } else {
      // Validate date format and range
      const dateRegex = /^\d{4}-\d{2}-\d{2}$/;
      if (!dateRegex.test(date)) {
        errors.push("Please enter a valid date");
      } else {
        const parsedDate = new Date(date);
        const currentYear = new Date().getFullYear();
        const dateYear = parsedDate.getFullYear();

        if (dateYear < 1900 || dateYear > currentYear + 1) {
          errors.push("Please enter a date between 1900 and next year");
        }
      }
    }

    if (submitterEmail && submitterEmail.trim()) {
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(submitterEmail.trim())) {
        errors.push("Please enter a valid email address");
      }
    }

    if (name.length > 100) {
      errors.push("Name must be 100 characters or less");
    }

    if (category.length > 50) {
      errors.push("Category must be 50 characters or less");
    }

    if (notes.length > 500) {
      errors.push("Notes must be 500 characters or less");
    }

    if (submitterName.length > 100) {
      errors.push("Your name must be 100 characters or less");
    }

    if (relationship.length > 50) {
      errors.push("Relationship must be 50 characters or less");
    }

    return errors;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    const validationErrors = validateForm();
    if (validationErrors.length > 0) {
      validationErrors.forEach((error) => toast.error(error));
      return;
    }

    try {
      await submitBirthday({
        variables: {
          token,
          name: name.trim(),
          date,
          category: category.trim() || null,
          notes: notes.trim() || null,
          submitterName: submitterName.trim() || null,
          submitterEmail: submitterEmail.trim() || null,
          relationship: relationship.trim() || null,
        },
      });

      setIsSubmitted(true);
      toast.success("Birthday submitted successfully!");

      if (onSuccess) {
        onSuccess();
      }
    } catch (err) {
      console.error("Submission error:", err);
      // Error handling is done through the error state from useMutation
    }
  };

  if (isSubmitted) {
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
        <p className="mb-6 text-gray-600">
          Your birthday submission has been sent successfully. The recipient
          will review it and decide whether to add it to their birthday list.
        </p>
        {onCancel && (
          <button
            onClick={onCancel}
            className={classNames(
              "inline-flex items-center rounded-md border border-transparent px-4 py-2 font-medium",
              "hover:bg-gray-100",
              "focus:ring-2 focus:ring-gray-500 focus:ring-offset-2 focus:outline-hidden",
            )}
          >
            Close
          </button>
        )}
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-2xl">
      <div className="mb-6">
        <h1 className="mb-2 text-2xl font-bold text-gray-900">
          Add a Birthday
        </h1>
        <p className="text-gray-600">
          Help someone keep track of important birthdays by adding the details
          below.
        </p>
      </div>

      <form onSubmit={handleSubmit} className="flex flex-col space-y-6">
        <div className="grid gap-x-4 md:grid-cols-2">
          <div>
            <label className="mt-4 block text-sm font-medium" htmlFor="name">
              Name *
            </label>
            <input
              className="block h-12 w-full rounded-sm border-gray-300"
              id="name"
              onChange={(e) => setName(e.target.value)}
              required
              type="text"
              value={name}
              placeholder="Enter the person's name"
              maxLength={100}
            />
          </div>
          <div>
            <label className="mt-4 block text-sm font-medium" htmlFor="date">
              Birthday *
            </label>
            <input
              className="block h-12 w-full rounded-sm border-gray-300"
              id="date"
              onChange={(e) => setDate(e.target.value)}
              required
              type="date"
              value={date}
              max={new Date().toISOString().split("T")[0]}
            />
          </div>
          <div>
            <label
              className="mt-4 block text-sm font-medium"
              htmlFor="category"
            >
              Category (optional)
            </label>
            <input
              className="block h-12 w-full rounded-sm border-gray-300"
              id="category"
              onChange={(e) => setCategory(e.target.value)}
              type="text"
              value={category}
              placeholder="e.g., Family, Friend, Colleague"
              maxLength={50}
            />
          </div>
          <div>
            <label
              className="mt-4 block text-sm font-medium"
              htmlFor="relationship"
            >
              Relationship (optional)
            </label>
            <input
              className="block h-12 w-full rounded-sm border-gray-300"
              id="relationship"
              onChange={(e) => setRelationship(e.target.value)}
              type="text"
              value={relationship}
              placeholder="e.g., Sister, Best friend, Coworker"
              maxLength={50}
            />
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium" htmlFor="notes">
            Notes (optional)
          </label>
          <textarea
            className="mt-1 block w-full rounded-sm border-gray-300"
            id="notes"
            onChange={(e) => setNotes(e.target.value)}
            value={notes}
            placeholder="Any additional information or special notes"
            rows={3}
            maxLength={500}
          />
          <p className="mt-1 text-xs text-gray-500">
            {notes.length}/500 characters
          </p>
        </div>

        <div className="border-t pt-6">
          <h3 className="mb-4 text-lg font-medium text-gray-900">
            Your Information (optional)
          </h3>
          <div className="grid gap-x-4 md:grid-cols-2">
            <div>
              <label
                className="block text-sm font-medium"
                htmlFor="submitterName"
              >
                Your Name
              </label>
              <input
                className="mt-1 block h-12 w-full rounded-sm border-gray-300"
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
                className="mt-1 block h-12 w-full rounded-sm border-gray-300"
                id="submitterEmail"
                onChange={(e) => setSubmitterEmail(e.target.value)}
                type="email"
                value={submitterEmail}
                placeholder="your.email@example.com"
              />
            </div>
          </div>
          <p className="mt-2 text-xs text-gray-500">
            This information helps the recipient know who submitted the
            birthday.
          </p>
        </div>

        {error && (
          <div className="rounded-md border border-red-200 bg-red-50 p-4">
            <div className="flex">
              <div className="flex-shrink-0">
                <svg
                  className="h-5 w-5 text-red-400"
                  viewBox="0 0 20 20"
                  fill="currentColor"
                >
                  <path
                    fillRule="evenodd"
                    d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z"
                    clipRule="evenodd"
                  />
                </svg>
              </div>
              <div className="ml-3">
                <h3 className="text-sm font-medium text-red-800">
                  Submission Error
                </h3>
                <div className="mt-2 text-sm text-red-700">
                  {error.message.includes("expired") ? (
                    <p>
                      This sharing link has expired or is no longer valid.
                      Please ask for a new link.
                    </p>
                  ) : error.message.includes("Rate limit") ? (
                    <p>
                      Too many submissions have been made recently. Please try
                      again later.
                    </p>
                  ) : (
                    <p>
                      {error.message ||
                        "An error occurred while submitting the birthday. Please try again."}
                    </p>
                  )}
                </div>
              </div>
            </div>
          </div>
        )}

        <div className="flex items-center justify-end gap-4 pt-4">
          {onCancel && (
            <button
              className={classNames(
                "inline-flex items-center rounded-md border border-transparent px-4 py-2 font-medium",
                "hover:bg-gray-100",
                "focus:ring-2 focus:ring-gray-500 focus:ring-offset-2 focus:outline-hidden",
              )}
              onClick={onCancel}
              type="button"
            >
              Cancel
            </button>
          )}
          <PrimaryButton disabled={loading} type="submit">
            {loading ? "Submitting..." : "Submit Birthday"}
          </PrimaryButton>
        </div>
      </form>
    </div>
  );
};

export default BirthdaySubmissionForm;
