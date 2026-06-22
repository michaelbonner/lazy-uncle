import type { Birthday } from "../drizzle/schema";
import { type RouterOutputs, trpc } from "../lib/trpc";
import { formatDateForDisplay } from "../shared/getDateFromComponents";
import LoadingSpinner from "./LoadingSpinner";
import clsx from "clsx";
import { format } from "date-fns";
import React, { useMemo, useState } from "react";
import {
  HiCheck,
  HiCheckCircle,
  HiExclamationCircle,
  HiInformationCircle,
  HiX,
  HiXCircle,
} from "react-icons/hi";
import { IoCalendarOutline, IoPersonOutline } from "react-icons/io5";

type BirthdaySubmission =
  RouterOutputs["submission"]["pending"]["submissions"][number];

const PAGE_SIZE = 10;

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
  const [currentPage, setCurrentPage] = useState(1);

  const utils = trpc.useUtils();
  const {
    data: submissionsData,
    isPending: submissionsLoading,
    error: submissionsError,
  } = trpc.submission.pending.useQuery({
    page: currentPage,
    limit: PAGE_SIZE,
  });

  const { data: birthdaysData, isPending: birthdaysLoading } =
    trpc.birthday.list.useQuery();

  const importSubmission = trpc.submission.import.useMutation({
    onSuccess: () => {
      utils.submission.pending.invalidate();
      utils.birthday.list.invalidate();
    },
  });

  const rejectSubmission = trpc.submission.reject.useMutation({
    onSuccess: () => {
      utils.submission.pending.invalidate();
    },
  });

  const submissions = useMemo<BirthdaySubmission[]>(() => {
    return submissionsData?.submissions ?? [];
  }, [submissionsData]);
  const totalSubmissions = submissionsData?.totalCount ?? submissions.length;
  const totalPages = Math.max(submissionsData?.totalPages ?? 1, 1);
  const hasPreviousPage = submissionsData?.hasPreviousPage ?? false;
  const hasNextPage = submissionsData?.hasNextPage ?? false;

  // Calculate potential duplicates for each submission
  const submissionsWithDuplicates = useMemo(() => {
    if (!birthdaysData || birthdaysLoading) {
      return submissions.map((submission) => ({
        ...submission,
        duplicates: [],
      }));
    }

    return submissions.map((submission) => {
      const duplicates = findPotentialDuplicates(submission, birthdaysData);
      return {
        ...submission,
        duplicates,
      };
    });
  }, [submissions, birthdaysData, birthdaysLoading]);

  const handleImportSubmission = async (submissionId: string) => {
    setProcessingSubmissions((prev) => new Set(prev).add(submissionId));
    try {
      await importSubmission.mutateAsync({ submissionId });
      setCurrentPage(1);
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
      await rejectSubmission.mutateAsync({ submissionId });
      setCurrentPage(1);
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
        await importSubmission.mutateAsync({ submissionId });
        imported++;
      } catch (error) {
        console.error(`Error importing submission ${submissionId}:`, error);
        failed++;
      }
    }

    setProcessingSubmissions(new Set());
    setSelectedSubmissions(new Set());
    setCurrentPage(1);

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
        await rejectSubmission.mutateAsync({ submissionId });
        rejected++;
      } catch (error) {
        console.error(`Error rejecting submission ${submissionId}:`, error);
        failed++;
      }
    }

    setProcessingSubmissions(new Set());
    setSelectedSubmissions(new Set());
    setCurrentPage(1);

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
    const allCurrentPageIds = submissions.map((s) => s.id);
    const allCurrentPageSelected =
      allCurrentPageIds.length > 0 &&
      allCurrentPageIds.every((id) => selectedSubmissions.has(id));

    if (allCurrentPageSelected) {
      setSelectedSubmissions(new Set());
    } else {
      setSelectedSubmissions(new Set(allCurrentPageIds));
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

  const formatSubmissionDate = (item: {
    year?: number | null;
    month: number;
    day: number;
  }) => {
    return formatDateForDisplay(item.year ?? null, item.month, item.day);
  };

  const goToPage = (page: number) => {
    setSelectedSubmissions(new Set());
    setExpandedSubmissions(new Set());
    setCurrentPage(Math.min(Math.max(page, 1), totalPages));
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
            {totalSubmissions > 0 && (
              <span className="inline-flex items-center rounded-full border border-rule bg-paper px-2 py-1 text-sm font-medium text-accent-deep">
                {totalSubmissions} pending
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
                    Select page ({submissions.length})
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

            {/* Submissions Table */}
            <div className="overflow-x-auto rounded-lg border border-rule bg-paper">
              <table className="w-full min-w-[1024px] text-sm text-ink">
                <thead className="border-b border-rule bg-paper-deep text-left text-xs font-semibold uppercase tracking-wide text-ink">
                  <tr>
                    <th className="w-10 px-3 py-2.5"></th>
                    <th className="px-3 py-2.5">Name</th>
                    <th className="px-3 py-2.5">Birthday</th>
                    <th className="px-3 py-2.5">Category</th>
                    <th className="px-3 py-2.5">Submitter</th>
                    <th className="px-3 py-2.5">Source</th>
                    <th className="px-3 py-2.5">Submitted</th>
                    <th className="px-3 py-2.5 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-rule">
                  {submissionsWithDuplicates.map((submission) => {
                    const isExpanded = expandedSubmissions.has(submission.id);
                    const isSelected = selectedSubmissions.has(submission.id);
                    const isProcessing = processingSubmissions.has(
                      submission.id,
                    );
                    const hasDuplicates = submission.duplicates.length > 0;
                    const hasDetails = Boolean(
                      submission.notes || submission.submitterEmail,
                    );
                    const showExpandedRow = isExpanded && hasDetails;
                    const expandable = hasDetails || hasDuplicates;

                    return (
                      <React.Fragment key={submission.id}>
                        <tr
                          className={clsx(
                            "transition-colors",
                            hasDuplicates
                              ? "bg-amber-50 hover:bg-amber-100"
                              : isSelected
                                ? "bg-paper-deep"
                                : "hover:bg-paper-deep",
                          )}
                        >
                          <td className="px-3 py-3 align-top">
                            <input
                              type="checkbox"
                              checked={isSelected}
                              onChange={() =>
                                toggleSubmissionSelection(submission.id)
                              }
                              aria-label={`Select submission for ${submission.name}`}
                              className="h-4 w-4 rounded border-rule text-accent focus:ring-accent/40"
                            />
                          </td>
                          <td className="px-3 py-3 align-top">
                            <div className="flex items-start gap-1.5">
                              <span className="font-medium text-ink">
                                {submission.name}
                              </span>
                              {hasDuplicates && (
                                <HiExclamationCircle
                                  className="mt-0.5 h-4 w-4 shrink-0 text-amber-700"
                                  title={`${submission.duplicates.length} potential duplicate(s)`}
                                />
                              )}
                            </div>
                          </td>
                          <td className="px-3 py-3 align-top whitespace-nowrap text-ink">
                            <div className="flex items-center gap-1.5">
                              <IoCalendarOutline className="h-4 w-4 text-ink-soft" />
                              <span>{formatSubmissionDate(submission)}</span>
                            </div>
                          </td>
                          <td className="px-3 py-3 align-top">
                            {submission.category ? (
                              <span className="inline-flex rounded-full border border-rule bg-paper px-2 py-0.5 text-xs text-ink">
                                {submission.category}
                              </span>
                            ) : (
                              <span className="text-ink-soft">—</span>
                            )}
                          </td>
                          <td className="px-3 py-3 align-top text-ink">
                            {submission.submitterName ? (
                              <>
                                <div>{submission.submitterName}</div>
                                {submission.relationship && (
                                  <div className="text-xs text-ink-soft">
                                    {submission.relationship}
                                  </div>
                                )}
                              </>
                            ) : (
                              <span className="text-ink-soft">Anonymous</span>
                            )}
                          </td>
                          <td className="px-3 py-3 align-top text-ink">
                            {submission.sharingLink.description || (
                              <span className="text-ink-soft">—</span>
                            )}
                          </td>
                          <td className="px-3 py-3 align-top whitespace-nowrap text-ink">
                            {format(
                              new Date(submission.createdAt),
                              "MMM d, h:mm a",
                            )}
                          </td>
                          <td className="px-3 py-3 align-top">
                            <div className="flex items-center justify-end gap-1.5">
                              {expandable && (
                                <button
                                  onClick={() =>
                                    toggleSubmissionExpansion(submission.id)
                                  }
                                  className={clsx(
                                    "rounded-md border border-rule bg-paper p-1.5 text-ink-soft transition hover:bg-paper-deep hover:text-ink",
                                    isExpanded && "bg-paper-deep text-ink",
                                  )}
                                  title={isExpanded ? "Hide details" : "Show details"}
                                  aria-expanded={isExpanded}
                                >
                                  <HiInformationCircle className="h-4 w-4" />
                                </button>
                              )}
                              <button
                                onClick={() =>
                                  handleImportSubmission(submission.id)
                                }
                                disabled={isProcessing}
                                className={clsx(
                                  "flex items-center gap-1 rounded-md px-2.5 py-1.5 text-xs font-medium transition-colors",
                                  isProcessing
                                    ? "bg-paper-deep text-ink-soft"
                                    : "bg-emerald-100 text-emerald-900 hover:bg-emerald-200",
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
                                onClick={() =>
                                  handleRejectSubmission(submission.id)
                                }
                                disabled={isProcessing}
                                className={clsx(
                                  "flex items-center gap-1 rounded-md px-2.5 py-1.5 text-xs font-medium transition-colors",
                                  isProcessing
                                    ? "bg-paper-deep text-ink-soft"
                                    : "bg-rose-100 text-rose-900 hover:bg-rose-200",
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
                          </td>
                        </tr>
                        {(hasDuplicates || showExpandedRow) && (
                          <tr
                            className={clsx(
                              hasDuplicates ? "bg-amber-50" : "bg-paper-deep",
                            )}
                          >
                            <td></td>
                            <td colSpan={7} className="px-3 pb-3 pt-0">
                              <div className="space-y-2">
                                {hasDuplicates && (
                                  <div className="rounded-md border border-amber-200 bg-amber-100/60 p-3">
                                    <div className="flex items-start gap-2">
                                      <HiExclamationCircle className="mt-0.5 h-4 w-4 shrink-0 text-amber-800" />
                                      <div className="text-sm">
                                        <p className="font-medium text-amber-900">
                                          Potential duplicate detected
                                        </p>
                                        <ul className="mt-1 space-y-0.5">
                                          {submission.duplicates.map(
                                            (duplicate) => (
                                              <li
                                                key={duplicate.id}
                                                className="text-amber-900"
                                              >
                                                • {duplicate.name},{" "}
                                                {formatSubmissionDate(duplicate)}
                                                {duplicate.category &&
                                                  ` (${duplicate.category})`}
                                              </li>
                                            ),
                                          )}
                                        </ul>
                                      </div>
                                    </div>
                                  </div>
                                )}
                                {showExpandedRow && (
                                  <div className="rounded-md border border-rule bg-paper p-3">
                                    {submission.notes && (
                                      <div className="mb-2 last:mb-0">
                                        <span className="text-xs font-semibold uppercase tracking-wide text-ink-soft">
                                          Notes
                                        </span>
                                        <p className="mt-0.5 text-sm text-ink">
                                          {submission.notes}
                                        </p>
                                      </div>
                                    )}
                                    {submission.submitterEmail && (
                                      <div>
                                        <span className="text-xs font-semibold uppercase tracking-wide text-ink-soft">
                                          Email
                                        </span>
                                        <p className="mt-0.5 text-sm text-ink">
                                          <a
                                            href={`mailto:${submission.submitterEmail}`}
                                            className="text-accent-deep underline underline-offset-4 hover:text-accent"
                                          >
                                            {submission.submitterEmail}
                                          </a>
                                        </p>
                                      </div>
                                    )}
                                  </div>
                                )}
                              </div>
                            </td>
                          </tr>
                        )}
                      </React.Fragment>
                    );
                  })}
                </tbody>
              </table>
            </div>
            {totalPages > 1 && (
              <div className="mt-4 flex flex-col gap-3 text-sm text-ink-soft sm:flex-row sm:items-center sm:justify-between">
                <span>
                  Page {currentPage} of {totalPages}
                </span>
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => goToPage(currentPage - 1)}
                    disabled={!hasPreviousPage || processingSubmissions.size > 0}
                    className={clsx(
                      "rounded-md border border-rule px-3 py-1.5 font-medium transition-colors",
                      hasPreviousPage && processingSubmissions.size === 0
                        ? "bg-paper text-ink hover:bg-paper-deep"
                        : "bg-paper-deep text-ink-muted",
                    )}
                  >
                    Previous
                  </button>
                  <button
                    type="button"
                    onClick={() => goToPage(currentPage + 1)}
                    disabled={!hasNextPage || processingSubmissions.size > 0}
                    className={clsx(
                      "rounded-md border border-rule px-3 py-1.5 font-medium transition-colors",
                      hasNextPage && processingSubmissions.size === 0
                        ? "bg-paper text-ink hover:bg-paper-deep"
                        : "bg-paper-deep text-ink-muted",
                    )}
                  >
                    Next
                  </button>
                </div>
              </div>
            )}
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
