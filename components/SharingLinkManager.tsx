import {
  CREATE_SHARING_LINK_MUTATION,
  GET_SHARING_LINKS_QUERY,
  REVOKE_SHARING_LINK_MUTATION,
} from "../graphql/Sharing";
import LoadingSpinner from "./LoadingSpinner";
import PrimaryButton from "./PrimaryButton";
import { useMutation, useQuery } from "@apollo/client/react";
import clsx from "clsx";
import { format } from "date-fns";
import { useState } from "react";
import { HiClipboard, HiClipboardCheck, HiTrash } from "react-icons/hi";
import { IoAddCircleOutline, IoShareOutline } from "react-icons/io5";

interface SharingLink {
  id: string;
  token: string;
  createdAt: string;
  expiresAt: string;
  isActive: boolean;
  description?: string;
  submissionCount: number;
}

const SharingLinkManager = () => {
  const [copiedLinkId, setCopiedLinkId] = useState<string | null>(null);
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [description, setDescription] = useState("");
  const [expirationHours, setExpirationHours] = useState(168); // 7 days default

  const {
    data: sharingLinksData,
    loading: sharingLinksLoading,
    error: sharingLinksError,
    refetch: refetchSharingLinks,
  } = useQuery(GET_SHARING_LINKS_QUERY, {
    fetchPolicy: "cache-and-network",
  });

  const [createSharingLink, { loading: createLoading }] = useMutation(
    CREATE_SHARING_LINK_MUTATION,
    {
      onCompleted: () => {
        setDescription("");
        setExpirationHours(168);
        setShowCreateForm(false);
        refetchSharingLinks();
      },
      onError: (error) => {
        console.error("Error creating sharing link:", error);
      },
    },
  );

  const [revokeSharingLink] = useMutation(REVOKE_SHARING_LINK_MUTATION, {
    onCompleted: () => {
      refetchSharingLinks();
    },
    onError: (error) => {
      console.error("Error revoking sharing link:", error);
    },
  });

  const handleCreateLink = async (e: React.FormEvent) => {
    e.preventDefault();
    const trimmedDescription = description.trim() || undefined;
    try {
      await createSharingLink({
        variables: {
          description: trimmedDescription,
          expirationHours,
        },
      });
    } catch (error) {
      console.error("Failed to create sharing link:", error);
    }
  };

  const handleRevokeLink = async (linkId: string) => {
    if (window.confirm("Are you sure you want to revoke this sharing link?")) {
      try {
        await revokeSharingLink({
          variables: { linkId },
        });
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

  const isExpired = (expiresAt: string) => {
    return new Date(expiresAt) < new Date();
  };

  const formatExpirationDate = (expiresAt: string) => {
    const date = new Date(expiresAt);
    const now = new Date();
    const isExpiredLink = date < now;

    if (isExpiredLink) {
      return (
        <span className="font-medium text-rose-700">
          Expired {format(date, "MMMM d 'at' p")}
        </span>
      );
    }

    return (
      <span className="text-ink-soft">
        Expires {format(date, "MMMM d 'at' p")}
      </span>
    );
  };

  const sharingLinks: SharingLink[] = sharingLinksData?.sharingLinks || [];

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
              "flex items-center space-x-2 rounded-md border border-transparent bg-accent px-4 py-2 font-medium text-white transition",
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
                  className="w-full rounded-md border border-rule bg-paper px-3 py-2 text-sm text-ink placeholder:text-ink-muted focus:border-accent focus:outline-hidden focus:ring-1 focus:ring-accent"
                  maxLength={100}
                />
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
            <IoShareOutline className="mx-auto mb-4 h-12 w-12 text-ink-muted" />
            <h3 className="mb-2 font-display text-lg font-semibold text-ink">
              No sharing links yet
            </h3>
            <p className="mb-4 text-ink-soft">
              Create a sharing link to let friends and family contribute
              birthdays to your collection.
            </p>
          </div>
        ) : (
          <div className="space-y-4">
            {sharingLinks.map((link) => (
              <div
                key={link.id}
                className={clsx(
                  "rounded-lg border p-4 transition-colors",
                  isExpired(link.expiresAt)
                    ? "border-rose-300 bg-rose-50"
                    : "border-rule bg-paper hover:bg-paper-deep",
                )}
              >
                <div className="flex items-start justify-between">
                  <div className="min-w-0 flex-1">
                    <div className="mb-2 flex items-center space-x-2">
                      {link.description && (
                        <h4 className="text-sm font-medium text-ink">
                          {link.description}
                        </h4>
                      )}
                      <span className="inline-flex items-center rounded-full bg-paper-deep px-2 py-1 text-xs font-medium text-accent-deep">
                        {link.submissionCount} submission
                        {link.submissionCount !== 1 ? "s" : ""}
                      </span>
                    </div>
                    <div className="mb-2 text-sm text-ink-soft">
                      Created {format(new Date(link.createdAt), "MMM d, yyyy")}
                    </div>
                    <div className="mb-3 text-sm">
                      {formatExpirationDate(link.expiresAt)}
                    </div>
                    {!isExpired(link.expiresAt) && (
                      <div className="flex items-center space-x-2 rounded-md bg-paper-deep p-2">
                        <code className="flex-1 text-sm break-all text-ink">
                          {window.location.origin}/share/{link.token}
                        </code>
                      </div>
                    )}
                  </div>
                  <div className="ml-4 flex items-center space-x-2">
                    {!isExpired(link.expiresAt) && (
                      <button
                        onClick={() => copyToClipboard(link.token, link.id)}
                        className={clsx(
                          "flex items-center space-x-1 rounded-md px-3 py-2 text-sm font-medium transition-colors",
                          copiedLinkId === link.id
                            ? "bg-emerald-100 text-emerald-800"
                            : "bg-paper-deep text-ink hover:bg-paper",
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
                      className="flex items-center space-x-1 rounded-md bg-rose-100 px-3 py-2 text-sm font-medium text-rose-800 transition-colors hover:bg-rose-200"
                      title="Revoke this link"
                    >
                      <HiTrash className="h-4 w-4" />
                      <span>Revoke</span>
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

        <div className="mt-6 text-sm text-ink-soft">
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
