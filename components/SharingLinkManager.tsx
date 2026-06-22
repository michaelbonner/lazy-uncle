import { type RouterOutputs, trpc } from "../lib/trpc";
import LoadingSpinner from "./LoadingSpinner";
import PrimaryButton from "./PrimaryButton";
import clsx from "clsx";
import { format } from "date-fns";
import { useState } from "react";
import { HiClipboard, HiClipboardCheck, HiTrash } from "react-icons/hi";
import { IoAddCircleOutline, IoShareOutline } from "react-icons/io5";

type SharingLink = RouterOutputs["sharing"]["list"][number];

const SharingLinkManager = () => {
  const [copiedLinkId, setCopiedLinkId] = useState<string | null>(null);
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [description, setDescription] = useState("");
  const [category, setCategory] = useState("");
  const [expirationHours, setExpirationHours] = useState(168); // 7 days default

  const utils = trpc.useUtils();
  const {
    data: sharingLinksData,
    isPending: sharingLinksLoading,
    error: sharingLinksError,
  } = trpc.sharing.list.useQuery();

  const createSharingLink = trpc.sharing.create.useMutation({
    onSuccess: () => {
      setDescription("");
      setCategory("");
      setExpirationHours(168);
      setShowCreateForm(false);
      utils.sharing.list.invalidate();
    },
    onError: (error) => {
      console.error("Error creating sharing link:", error);
    },
  });
  const createLoading = createSharingLink.isPending;

  const revokeSharingLink = trpc.sharing.revoke.useMutation({
    onSuccess: () => {
      utils.sharing.list.invalidate();
    },
    onError: (error) => {
      console.error("Error revoking sharing link:", error);
    },
  });

  const handleCreateLink = async (e: React.FormEvent) => {
    e.preventDefault();
    const trimmedDescription = description.trim() || undefined;
    const trimmedCategory = category.trim() || undefined;
    try {
      await createSharingLink.mutateAsync({
        description: trimmedDescription,
        category: trimmedCategory,
        expirationHours,
      });
    } catch (error) {
      console.error("Failed to create sharing link:", error);
    }
  };

  const handleRevokeLink = async (linkId: string) => {
    if (window.confirm("Are you sure you want to revoke this sharing link?")) {
      try {
        await revokeSharingLink.mutateAsync({ linkId });
      } catch (error) {
        console.error("Failed to revoke sharing link:", error);
      }
    }
  };

  const copyToClipboard = async (token: string, linkId: string) => {
    const url = `${window.location.origin}/share/${token}`;
    try {
      await navigator.clipboard.writeText(url);
      setCopiedLinkId(linkId);
      setTimeout(() => setCopiedLinkId(null), 2000);
    } catch (error) {
      console.error("Failed to copy to clipboard:", error);
      // Fallback for older browsers
      const textArea = document.createElement("textarea");
      textArea.value = url;
      document.body.appendChild(textArea);
      textArea.select();
      document.execCommand("copy");
      document.body.removeChild(textArea);
      setCopiedLinkId(linkId);
      setTimeout(() => setCopiedLinkId(null), 2000);
    }
  };

  const isExpired = (expiresAt: Date | string) => {
    return new Date(expiresAt) < new Date();
  };

  const formatExpirationDate = (expiresAt: Date | string) => {
    const date = new Date(expiresAt);
    const now = new Date();
    const isExpiredLink = date < now;

    if (isExpiredLink) {
      return (
        <span className="font-medium text-rose-800">
          Expired {format(date, "MMM d 'at' p")}
        </span>
      );
    }

    return (
      <span className="text-ink">
        Expires {format(date, "MMM d 'at' p")}
      </span>
    );
  };

  const sharingLinks: SharingLink[] = sharingLinksData ?? [];

  return (
    <div className="mt-8 rounded-lg border border-rule bg-paper-deep text-ink">
      <div className="px-4 py-8 md:px-8 md:py-10">
        <div className="mb-6 flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <IoShareOutline className="h-6 w-6 text-accent" />
            <h2 className="font-display text-2xl font-semibold">
              Birthday sharing links
            </h2>
          </div>
          <button
            className={clsx(
              "js-create-sharing-link flex items-center space-x-2 rounded-md border border-transparent bg-accent px-4 py-2 font-medium text-white transition",
              "hover:bg-accent-deep",
              "focus:outline-hidden focus:ring-2 focus:ring-accent/40 focus:ring-offset-2 focus:ring-offset-paper-deep",
            )}
            onClick={() => setShowCreateForm(!showCreateForm)}
            type="button"
          >
            <IoAddCircleOutline className="h-4 w-4" />
            <span>Create new link</span>
          </button>
        </div>

        {showCreateForm && (
          <div className="mb-6 rounded-lg border border-rule bg-paper p-4">
            <h3 className="mb-4 font-display text-lg font-semibold">
              Create sharing link
            </h3>
            <form onSubmit={handleCreateLink} className="space-y-4">
              <div>
                <label
                  htmlFor="description"
                  className="mb-1 block text-sm font-medium text-ink"
                >
                  Description (optional)
                </label>
                <input
                  type="text"
                  id="description"
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="e.g. Family gathering, work colleagues"
                  className="w-full rounded-md border border-rule bg-paper px-3 py-2 text-sm text-ink placeholder:text-ink-soft focus:border-accent focus:outline-hidden focus:ring-1 focus:ring-accent"
                  maxLength={100}
                />
              </div>
              <div>
                <label
                  htmlFor="category"
                  className="mb-1 block text-sm font-medium text-ink"
                >
                  Category (optional)
                </label>
                <input
                  type="text"
                  id="category"
                  value={category}
                  onChange={(e) => setCategory(e.target.value)}
                  placeholder="e.g. Family, Coworkers"
                  className="w-full rounded-md border border-rule bg-paper px-3 py-2 text-sm text-ink placeholder:text-ink-soft focus:border-accent focus:outline-hidden focus:ring-1 focus:ring-accent"
                  maxLength={50}
                />
                <p className="mt-1 text-xs text-ink-soft">
                  Birthdays submitted through this link will be filed under this
                  category.
                </p>
              </div>
              <div>
                <label
                  htmlFor="expirationHours"
                  className="mb-1 block text-sm font-medium text-ink"
                >
                  Expires in
                </label>
                <select
                  id="expirationHours"
                  value={expirationHours}
                  onChange={(e) => setExpirationHours(Number(e.target.value))}
                  className="w-full rounded-md border border-rule bg-paper px-3 py-2 text-sm text-ink focus:border-accent focus:outline-hidden focus:ring-1 focus:ring-accent"
                >
                  <option value={24}>1 day</option>
                  <option value={72}>3 days</option>
                  <option value={168}>1 week</option>
                  <option value={336}>2 weeks</option>
                  <option value={720}>1 month</option>
                </select>
              </div>
              <div className="flex space-x-3">
                <PrimaryButton type="submit" disabled={createLoading}>
                  {createLoading ? "Creating…" : "Create link"}
                </PrimaryButton>
                <button
                  type="button"
                  onClick={() => {
                    setShowCreateForm(false);
                    setDescription("");
                    setCategory("");
                    setExpirationHours(168);
                  }}
                  className="rounded-md border border-rule bg-paper px-4 py-2 text-sm font-medium text-ink transition hover:bg-paper-deep"
                >
                  Cancel
                </button>
              </div>
            </form>
          </div>
        )}

        {sharingLinksError && (
          <div className="mb-4 rounded-md border border-rose-300 bg-rose-50 p-4">
            <p className="text-rose-900">
              Error loading sharing links: {sharingLinksError.message}
            </p>
          </div>
        )}

        {sharingLinksLoading ? (
          <div className="flex justify-center py-8">
            <LoadingSpinner spinnerTextColor="text-accent" />
          </div>
        ) : sharingLinks.length === 0 ? (
          <div className="py-8 text-center">
            <IoShareOutline className="mx-auto mb-4 h-12 w-12 text-ink-soft" />
            <h3 className="mb-2 font-display text-lg font-semibold text-ink">
              No sharing links yet
            </h3>
            <p className="mb-4 text-ink">
              Create a sharing link to let friends and family contribute
              birthdays to your collection.
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto rounded-lg border border-rule bg-paper">
            <table className="w-full min-w-[960px] text-sm text-ink">
              <thead className="border-b border-rule bg-paper-deep text-left text-xs font-semibold uppercase tracking-wide text-ink">
                <tr>
                  <th className="px-3 py-2.5">Label</th>
                  <th className="px-3 py-2.5">Category</th>
                  <th className="px-3 py-2.5">Link</th>
                  <th className="px-3 py-2.5 text-center">Submissions</th>
                  <th className="px-3 py-2.5">Created</th>
                  <th className="px-3 py-2.5">Status</th>
                  <th className="px-3 py-2.5 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-rule">
                {sharingLinks.map((link) => {
                  const expired = isExpired(link.expiresAt);
                  const url = `${window.location.origin}/share/${link.token}`;
                  return (
                    <tr
                      key={link.id}
                      className={clsx(
                        "transition-colors",
                        expired ? "bg-rose-50" : "hover:bg-paper-deep",
                      )}
                    >
                      <td className="px-3 py-3 align-top font-medium text-ink">
                        {link.description || (
                          <span className="text-ink-soft">—</span>
                        )}
                      </td>
                      <td className="px-3 py-3 align-top">
                        {link.category ? (
                          <span className="inline-flex rounded-full border border-rule bg-paper-deep px-2 py-0.5 text-xs text-ink">
                            {link.category}
                          </span>
                        ) : (
                          <span className="text-ink-soft">—</span>
                        )}
                      </td>
                      <td className="px-3 py-3 align-top">
                        {expired ? (
                          <span className="text-ink-soft italic">
                            link no longer active
                          </span>
                        ) : (
                          <code
                            className="block max-w-[28rem] truncate font-mono text-xs text-ink"
                            title={url}
                          >
                            {url}
                          </code>
                        )}
                      </td>
                      <td className="px-3 py-3 text-center align-top font-semibold text-ink tabular-nums">
                        {link.submissionCount}
                      </td>
                      <td className="px-3 py-3 align-top whitespace-nowrap text-ink">
                        {format(new Date(link.createdAt), "MMM d, yyyy")}
                      </td>
                      <td className="px-3 py-3 align-top whitespace-nowrap">
                        {formatExpirationDate(link.expiresAt)}
                      </td>
                      <td className="px-3 py-3 align-top">
                        <div className="flex items-center justify-end gap-2">
                          {!expired && (
                            <button
                              onClick={() =>
                                copyToClipboard(link.token, link.id)
                              }
                              className={clsx(
                                "flex items-center gap-1 rounded-md px-2.5 py-1.5 text-xs font-medium transition-colors",
                                copiedLinkId === link.id
                                  ? "bg-emerald-100 text-emerald-900"
                                  : "bg-paper-deep text-ink hover:bg-rule",
                              )}
                              title="Copy link to clipboard"
                            >
                              {copiedLinkId === link.id ? (
                                <>
                                  <HiClipboardCheck className="h-4 w-4" />
                                  <span>Copied</span>
                                </>
                              ) : (
                                <>
                                  <HiClipboard className="h-4 w-4" />
                                  <span>Copy</span>
                                </>
                              )}
                            </button>
                          )}
                          <button
                            onClick={() => handleRevokeLink(link.id)}
                            className="flex items-center gap-1 rounded-md bg-rose-100 px-2.5 py-1.5 text-xs font-medium text-rose-900 transition-colors hover:bg-rose-200"
                            title="Revoke this link"
                          >
                            <HiTrash className="h-4 w-4" />
                            <span>Revoke</span>
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}

        <div className="mt-6 text-sm text-ink">
          <p>
            Share these links with friends and family to let them contribute
            birthdays to your collection. You can review and import their
            submissions before they&apos;re added to your birthday list.
          </p>
        </div>
      </div>
    </div>
  );
};

export default SharingLinkManager;
