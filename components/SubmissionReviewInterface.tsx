import type { Birthday } from "../drizzle/schema";
import { GET_ALL_BIRTHDAYS_QUERY } from "../graphql/Birthday";
import {
  GET_PENDING_SUBMISSIONS_QUERY,
  IMPORT_SUBMISSION_MUTATION,
  REJECT_SUBMISSION_MUTATION,
} from "../graphql/Sharing";
import { formatDateForDisplay } from "../shared/getDateFromComponents";
import LoadingSpinner from "./LoadingSpinner";
import { useMutation, useQuery } from "@apollo/client/react";
import clsx from "clsx";
import { format } from "date-fns";
import { useMemo, useState } from "react";
import {
  HiCheck,
  HiCheckCircle,
  HiExclamationCircle,
  HiInformationCircle,
  HiX,
  HiXCircle,
} from "react-icons/hi";
import { IoCalendarOutline, IoPersonOutline } from "react-icons/io5";

interface BirthdaySubmission {
  id: string;
  name: string;
  year?: number | null;
  month: number;
  day: number;
  date?: string | null; // Computed field for backward compatibility
  category?: string;
  notes?: string;
  submitterName?: string;
  submitterEmail?: string;
  relationship?: string;
  status: string;
  createdAt: string;
  sharingLink: {
    id: string;
    description?: string;
  };
}

interface DuplicateMatch {
  id: string;
  name: string;
  year?: number | null;
  month: number;
  day: number;
  date?: string | null; // Computed field for backward compatibility
  category?: string;
  similarity: number;
}

const SubmissionReviewInterface = () => {
  const [selectedSubmissions, setSelectedSubmissions] = useState<Set<string>>(
    new Set(),
  );
  const [processingSubmissions, setProcessingSubmissions] = useState<
    Set<string>
  >(new Set());
  const [showSuccessMessage, setShowSuccessMessage] = useState<string | null>(
    null,
  );
  const [expandedSubmissions, setExpandedSubmissions] = useState<Set<string>>(
    new Set(),
  );

  const {
    data: submissionsData,
    loading: submissionsLoading,
    error: submissionsError,
    refetch: refetchSubmissions,
  } = useQuery(GET_PENDING_SUBMISSIONS_QUERY, {
    fetchPolicy: "cache-and-network",
  });

  const { data: birthdaysData, loading: birthdaysLoading } = useQuery(
    GET_ALL_BIRTHDAYS_QUERY,
    {
      fetchPolicy: "cache-first",
    },
  );

  const [importSubmission] = useMutation(IMPORT_SUBMISSION_MUTATION, {
    onCompleted: () => {
      refetchSubmissions();
    },
    refetchQueries: [{ query: GET_ALL_BIRTHDAYS_QUERY }],
  });

  const [rejectSubmission] = useMutation(REJECT_SUBMISSION_MUTATION, {
    onCompleted: () => {
      refetchSubmissions();
    },
  });

  const submissions = useMemo<BirthdaySubmission[]>(() => {
    return submissionsData?.pendingSubmissions?.submissions || [];
  }, [submissionsData]);

  // Calculate potential duplicates for each submission
  const submissionsWithDuplicates = useMemo(() => {
    if (!birthdaysData?.birthdays || birthdaysLoading) {
      return submissions.map((submission) => ({
        ...submission,
        duplicates: [],
      }));
    }

    return submissions.map((submission) => {
      const duplicates = findPotentialDuplicates(
        submission,
        birthdaysData.birthdays,
      );
      return {
        ...submission,
        duplicates,
      };
    });
  }, [submissions, birthdaysData, birthdaysLoading]);

  const handleImportSubmission = async (submissionId: string) => {
    setProcessingSubmissions((prev) => new Set(prev).add(submissionId));
    try {
      await importSubmission({
        variables: { submissionId },
      });
      setShowSuccessMessage("Birthday imported successfully!");
      setTimeout(() => setShowSuccessMessage(null), 3000);
    } catch (error) {
      console.error("Error importing submission:", error);
    }
    setProcessingSubmissions((prev) => {
      const newSet = new Set(prev);
      newSet.delete(submissionId);
      return newSet;
    });
  };

  const handleRejectSubmission = async (submissionId: string) => {
    setProcessingSubmissions((prev) => new Set(prev).add(submissionId));
    try {
      await rejectSubmission({
        variables: { submissionId },
      });
      setShowSuccessMessage("Submission rejected");
      setTimeout(() => setShowSuccessMessage(null), 3000);
    } catch (error) {
      console.error("Error rejecting submission:", error);
    }
    setProcessingSubmissions((prev) => {
      const newSet = new Set(prev);
      newSet.delete(submissionId);
      return newSet;
    });
  };

  const handleBulkImport = async () => {
    const submissionIds = Array.from(selectedSubmissions);
    setProcessingSubmissions(new Set(submissionIds));

    let imported = 0;
    let failed = 0;

    for (const submissionId of submissionIds) {
      try {
        await importSubmission({
          variables: { submissionId },
        });
        imported++;
      } catch (error) {
        console.error(`Error importing submission ${submissionId}:`, error);
        failed++;
      }
    }

    setProcessingSubmissions(new Set());
    setSelectedSubmissions(new Set());

    if (failed === 0) {
      setShowSuccessMessage(`Successfully imported ${imported} birthdays!`);
    } else {
      setShowSuccessMessage(
        `Imported ${imported} birthdays. ${failed} failed.`,
      );
    }
    setTimeout(() => setShowSuccessMessage(null), 3000);
  };

  const handleBulkReject = async () => {
    const submissionIds = Array.from(selectedSubmissions);
    setProcessingSubmissions(new Set(submissionIds));

    let rejected = 0;
    let failed = 0;

    for (const submissionId of submissionIds) {
      try {
        await rejectSubmission({
          variables: { submissionId },
        });
        rejected++;
      } catch (error) {
        console.error(`Error rejecting submission ${submissionId}:`, error);
        failed++;
      }
    }

    setProcessingSubmissions(new Set());
    setSelectedSubmissions(new Set());

    if (failed === 0) {
      setShowSuccessMessage(`Rejected ${rejected} submissions`);
    } else {
      setShowSuccessMessage(
        `Rejected ${rejected} submissions. ${failed} failed.`,
      );
    }
    setTimeout(() => setShowSuccessMessage(null), 3000);
  };

  const toggleSubmissionSelection = (submissionId: string) => {
    setSelectedSubmissions((prev) => {
      const newSet = new Set(prev);
      if (newSet.has(submissionId)) {
        newSet.delete(submissionId);
      } else {
        newSet.add(submissionId);
      }
      return newSet;
    });
  };

  const toggleAllSubmissions = () => {
    if (selectedSubmissions.size === submissions.length) {
      setSelectedSubmissions(new Set());
    } else {
      setSelectedSubmissions(new Set(submissions.map((s) => s.id)));
    }
  };

  const toggleSubmissionExpansion = (submissionId: string) => {
    setExpandedSubmissions((prev) => {
      const newSet = new Set(prev);
      if (newSet.has(submissionId)) {
        newSet.delete(submissionId);
      } else {
        newSet.add(submissionId);
      }
      return newSet;
    });
  };

  const formatSubmissionDate = (item: { year?: number | null; month: number; day: number; }) => {
    return formatDateForDisplay(item.year ?? null, item.month, item.day);
  };

  if (submissionsLoading) {
    return (
      <div className="mt-8 rounded-lg border border-rule bg-paper-deep">
        <div className="flex justify-center py-8">
          <LoadingSpinner spinnerTextColor="text-accent" />
        </div>
      </div>
    );
  }

  if (submissionsError) {
    return (
      <div className="mt-8 rounded-lg border border-rose-300 bg-rose-50">
        <div className="px-4 py-6 md:px-8">
          <div className="flex items-center space-x-2 text-rose-900">
            <HiXCircle className="h-5 w-5" />
            <span>Error loading submissions: {submissionsError.message}</span>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="mt-8 rounded-lg border border-rule bg-paper-deep text-ink">
      <div className="px-4 py-8 md:px-8 md:py-10">
        <div className="mb-6 flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <IoPersonOutline className="h-6 w-6 text-accent" />
            <h2 className="font-display text-2xl font-semibold">
              Birthday submissions
            </h2>
            {submissions.length > 0 && (
              <span className="inline-flex items-center rounded-full border border-rule bg-paper px-2 py-1 text-sm font-medium text-accent-deep">
                {submissions.length} pending
              </span>
            )}
          </div>
        </div>

        {showSuccessMessage && (
          <div className="mb-4 rounded-md border border-emerald-300 bg-emerald-50 p-4">
            <div className="flex items-center space-x-2">
              <HiCheckCircle className="h-5 w-5 text-emerald-700" />
              <span className="text-emerald-800">{showSuccessMessage}</span>
            </div>
          </div>
        )}

        {submissions.length === 0 ? (
          <div className="py-8 text-center">
            <IoPersonOutline className="mx-auto mb-4 h-12 w-12 text-ink-muted" />
            <h3 className="mb-2 font-display text-lg font-semibold text-ink">
              No pending submissions
            </h3>
            <p className="text-ink-soft">
              When people submit birthdays through your sharing links,
              they&apos;ll appear here for review.
            </p>
          </div>
        ) : (
          <>
            {/* Bulk Actions */}
            <div className="mb-4 flex items-center justify-between rounded-lg border border-rule bg-paper p-4">
              <div className="flex items-center space-x-4">
                <label className="flex items-center space-x-2">
                  <input
                    type="checkbox"
                    checked={
                      selectedSubmissions.size === submissions.length &&
                      submissions.length > 0
                    }
                    onChange={toggleAllSubmissions}
                    className="h-4 w-4 rounded border-rule text-accent focus:ring-accent/40"
                  />
                  <span className="text-sm font-medium text-ink">
                    Select all ({submissions.length})
                  </span>
                </label>
                {selectedSubmissions.size > 0 && (
                  <span className="text-sm text-ink-soft">
                    {selectedSubmissions.size} selected
                  </span>
                )}
              </div>
              {selectedSubmissions.size > 0 && (
                <div className="flex space-x-2">
                  <button
                    onClick={handleBulkImport}
                    disabled={processingSubmissions.size > 0}
                    className={clsx(
                      "flex items-center space-x-1 rounded-md px-3 py-2 text-sm font-medium transition-colors",
                      processingSubmissions.size > 0
                        ? "bg-paper-deep text-ink-muted"
                        : "bg-emerald-100 text-emerald-800 hover:bg-emerald-200",
                    )}
                  >
                    <HiCheck className="h-4 w-4" />
                    <span>Import selected</span>
                  </button>
                  <button
                    onClick={handleBulkReject}
                    disabled={processingSubmissions.size > 0}
                    className={clsx(
                      "flex items-center space-x-1 rounded-md px-3 py-2 text-sm font-medium transition-colors",
                      processingSubmissions.size > 0
                        ? "bg-paper-deep text-ink-muted"
                        : "bg-rose-100 text-rose-800 hover:bg-rose-200",
                    )}
                  >
                    <HiX className="h-4 w-4" />
                    <span>Reject selected</span>
                  </button>
                </div>
              )}
            </div>

            {/* Submissions List */}
            <div className="space-y-4">
              {submissionsWithDuplicates.map((submission) => {
                const isExpanded = expandedSubmissions.has(submission.id);
                const isSelected = selectedSubmissions.has(submission.id);
                const isProcessing = processingSubmissions.has(submission.id);
                const hasDuplicates = submission.duplicates.length > 0;

                return (
                  <div
                    key={submission.id}
                    className={clsx(
                      "rounded-lg border p-4 transition-colors",
                      hasDuplicates
                        ? "border-amber-300 bg-amber-50"
                        : isSelected
                          ? "border-accent bg-paper"
                          : "border-rule bg-paper hover:bg-paper-deep",
                    )}
                  >
                    <div className="flex items-start justify-between">
                      <div className="flex items-start space-x-3">
                        <input
                          type="checkbox"
                          checked={isSelected}
                          onChange={() =>
                            toggleSubmissionSelection(submission.id)
                          }
                          className="mt-1 h-4 w-4 rounded border-rule text-accent focus:ring-accent/40"
                        />
                        <div className="min-w-0 flex-1">
                          <div className="flex items-center space-x-2">
                            <h4 className="text-lg font-medium text-ink">
                              {submission.name}
                            </h4>
                            {hasDuplicates && (
                              <HiExclamationCircle className="h-5 w-5 text-amber-600" />
                            )}
                          </div>
                          <div className="mt-1 flex items-center space-x-4 text-sm text-ink-soft">
                            <div className="flex items-center space-x-1">
                              <IoCalendarOutline className="h-4 w-4" />
                              <span>{formatSubmissionDate(submission)}</span>
                            </div>
                            {submission.category && (
                              <span className="rounded-full border border-rule bg-paper px-2 py-1 text-xs text-ink">
                                {submission.category}
                              </span>
                            )}
                          </div>
                          {submission.submitterName && (
                            <div className="mt-1 text-sm text-ink-soft">
                              Submitted by {submission.submitterName}
                              {submission.relationship &&
                                ` (${submission.relationship})`}
                            </div>
                          )}
                          {submission.sharingLink.description && (
                            <div className="mt-1 text-sm text-ink-soft">
                              via &quot;{submission.sharingLink.description}
                              &quot;
                            </div>
                          )}
                          <div className="mt-1 text-xs text-ink-muted">
                            {format(
                              new Date(submission.createdAt),
                              "MMM d, yyyy 'at' h:mm a",
                            )}
                          </div>

                          {/* Duplicate Warning */}
                          {hasDuplicates && (
                            <div className="mt-2 rounded-md border border-amber-200 bg-amber-50 p-3">
                              <div className="flex items-start space-x-2">
                                <HiExclamationCircle className="mt-0.5 h-4 w-4 text-amber-700" />
                                <div className="text-sm">
                                  <p className="font-medium text-amber-900">
                                    Potential duplicate detected
                                  </p>
                                  <p className="mt-1 text-amber-800">
                                    Similar birthdays already exist in your
                                    list:
                                  </p>
                                  <ul className="mt-2 space-y-1">
                                    {submission.duplicates.map((duplicate) => (
                                      <li
                                        key={duplicate.id}
                                        className="text-amber-800"
                                      >
                                        • {duplicate.name},{" "}
                                        {formatSubmissionDate(duplicate)}
                                        {duplicate.category &&
                                          ` (${duplicate.category})`}
                                      </li>
                                    ))}
                                  </ul>
                                </div>
                              </div>
                            </div>
                          )}

                          {/* Expanded Details */}
                          {isExpanded && (
                            <div className="mt-3 space-y-2 rounded-md bg-paper-deep p-3">
                              {submission.notes && (
                                <div>
                                  <span className="text-sm font-medium text-ink">
                                    Notes:
                                  </span>
                                  <p className="mt-1 text-sm text-ink-soft">
                                    {submission.notes}
                                  </p>
                                </div>
                              )}
                              {submission.submitterEmail && (
                                <div>
                                  <span className="text-sm font-medium text-ink">
                                    Email:
                                  </span>
                                  <p className="mt-1 text-sm text-ink-soft">
                                    {submission.submitterEmail}
                                  </p>
                                </div>
                              )}
                            </div>
                          )}
                        </div>
                      </div>

                      {/* Action Buttons */}
                      <div className="flex items-center space-x-2">
                        {(submission.notes || submission.submitterEmail) && (
                          <button
                            onClick={() =>
                              toggleSubmissionExpansion(submission.id)
                            }
                            className="rounded-md border border-rule bg-paper p-2 text-ink-soft transition hover:bg-paper-deep hover:text-ink"
                            title={isExpanded ? "Show less" : "Show more"}
                          >
                            <HiInformationCircle className="h-4 w-4" />
                          </button>
                        )}
                        <button
                          onClick={() => handleImportSubmission(submission.id)}
                          disabled={isProcessing}
                          className={clsx(
                            "flex items-center space-x-1 rounded-md px-3 py-2 text-sm font-medium transition-colors",
                            isProcessing
                              ? "bg-paper-deep text-ink-muted"
                              : "bg-emerald-100 text-emerald-800 hover:bg-emerald-200",
                          )}
                        >
                          {isProcessing ? (
                            <LoadingSpinner size="sm" />
                          ) : (
                            <HiCheck className="h-4 w-4" />
                          )}
                          <span>Import</span>
                        </button>
                        <button
                          onClick={() => handleRejectSubmission(submission.id)}
                          disabled={isProcessing}
                          className={clsx(
                            "flex items-center space-x-1 rounded-md px-3 py-2 text-sm font-medium transition-colors",
                            isProcessing
                              ? "bg-paper-deep text-ink-muted"
                              : "bg-rose-100 text-rose-800 hover:bg-rose-200",
                          )}
                        >
                          {isProcessing ? (
                            <LoadingSpinner size="sm" />
                          ) : (
                            <HiX className="h-4 w-4" />
                          )}
                          <span>Reject</span>
                        </button>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </>
        )}

        <div className="mt-6 text-sm text-ink-soft">
          <p>
            Review birthday submissions from your sharing links. Import the ones
            you want to add to your birthday list, or reject those you
            don&apos;t need.
          </p>
        </div>
      </div>
    </div>
  );
};

// Helper function to find potential duplicates
function findPotentialDuplicates(
  submission: BirthdaySubmission,
  existingBirthdays: Birthday[],
): DuplicateMatch[] {
  const SIMILARITY_THRESHOLD = 0.7;
  const matches: DuplicateMatch[] = [];

  for (const birthday of existingBirthdays) {
    const similarity = calculateSimilarity(submission, birthday);
    if (similarity >= SIMILARITY_THRESHOLD) {
      matches.push({
        id: birthday.id,
        name: birthday.name,
        year: birthday.year,
        month: birthday.month,
        day: birthday.day,
        date: birthday.date,
        category: birthday.category ?? undefined,
        similarity,
      });
    }
  }

  return matches.sort((a, b) => b.similarity - a.similarity);
}

// Helper function to calculate similarity between submission and existing birthday
function calculateSimilarity(
  submission: BirthdaySubmission,
  existing: { name: string; year?: number | null; month: number; day: number; category?: string | null },
): number {
  let similarity = 0;
  let factors = 0;

  // Name similarity (most important factor)
  const nameSimilarity = calculateStringSimilarity(
    submission.name.toLowerCase(),
    existing.name.toLowerCase(),
  );
  similarity += nameSimilarity * 0.6;
  factors += 0.6;

  // Date similarity using components
  if (
    existing.month === submission.month &&
    existing.day === submission.day
  ) {
    // Exact month/day match
    if (existing.year === submission.year) {
      similarity += 0.4; // Perfect match including year
    } else if (!existing.year || !submission.year) {
      similarity += 0.35; // Match month/day, one or both years missing
    } else {
      similarity += 0.2; // Match month/day, different years (possible duplicate)
    }
  }
  factors += 0.4;

  return similarity / factors;
}

// Helper function to calculate string similarity using Levenshtein distance
function calculateStringSimilarity(str1: string, str2: string): number {
  if (str1 === str2) return 1;
  if (str1.length === 0 || str2.length === 0) return 0;

  const matrix = Array(str2.length + 1)
    .fill(null)
    .map(() => Array(str1.length + 1).fill(null));

  for (let i = 0; i <= str1.length; i++) {
    matrix[0][i] = i;
  }

  for (let j = 0; j <= str2.length; j++) {
    matrix[j][0] = j;
  }

  for (let j = 1; j <= str2.length; j++) {
    for (let i = 1; i <= str1.length; i++) {
      const indicator = str1[i - 1] === str2[j - 1] ? 0 : 1;
      matrix[j][i] = Math.min(
        matrix[j][i - 1] + 1, // deletion
        matrix[j - 1][i] + 1, // insertion
        matrix[j - 1][i - 1] + indicator, // substitution
      );
    }
  }

  const distance = matrix[str2.length][str1.length];
  const maxLength = Math.max(str1.length, str2.length);
  return 1 - distance / maxLength;
}

export default SubmissionReviewInterface;
