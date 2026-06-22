import BirthdaySubmissionForm from "../../components/BirthdaySubmissionForm";
import LoadingSpinner from "../../components/LoadingSpinner";
import PublicLayout from "../../components/layout/PublicLayout";
import { trpc } from "../../lib/trpc";
import { GetServerSideProps } from "next";
import Link from "next/link";
import { useRouter } from "next/router";
import { useEffect } from "react";

interface SharingPageProps {
  token: string;
}

function isLinkExpiringSoon(expiresAt: Date | string): boolean {
  return new Date(expiresAt).getTime() - Date.now() < 24 * 60 * 60 * 1000;
}

const SharingPage = ({ token }: SharingPageProps) => {
  const router = useRouter();

  const {
    data: validation,
    isPending: loading,
    error,
  } = trpc.sharing.validate.useQuery({ token });

  useEffect(() => {
    // Track page view for analytics
    // @ts-expect-error - gtag is not typed
    if (typeof window !== "undefined" && window.gtag) {
      // @ts-expect-error - gtag is not typed
      window.gtag("event", "page_view", {
        page_title: "Birthday Sharing Link",
        page_location: window.location.href,
      });
    }
  }, []);

  const handleClose = () => {
    router.push("/");
  };

  if (loading) {
    return (
      <PublicLayout title="Loading... | Lazy Uncle">
        <div className="flex min-h-96 items-center justify-center">
          <LoadingSpinner />
        </div>
      </PublicLayout>
    );
  }

  if (error || !validation) {
    return (
      <PublicLayout title="Error | Lazy Uncle">
        <div className="mx-auto max-w-2xl rounded-lg border border-rule bg-paper p-8 text-center text-ink shadow-sm">
          <div className="mb-6">
            <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-rose-100">
              <svg
                className="h-8 w-8 text-rose-700"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z"
                />
              </svg>
            </div>
          </div>
          <h1 className="mb-4 font-display text-2xl font-semibold text-ink">
            Something went wrong
          </h1>
          <p className="mb-6 text-ink">
            We encountered an error while loading this sharing link. Please try
            again or contact the person who shared this link with you.
          </p>
          <button
            onClick={handleClose}
            className="inline-flex items-center rounded-md bg-accent px-4 py-2 text-sm font-medium text-white transition hover:bg-accent-deep focus:outline-hidden focus:ring-2 focus:ring-accent/40 focus:ring-offset-2"
          >
            Go to Lazy Uncle
          </button>
        </div>
      </PublicLayout>
    );
  }

  if (!validation.isValid) {
    const getErrorTitle = () => {
      switch (validation.error) {
        case "EXPIRED_LINK":
          return "Link Expired";
        case "INACTIVE_LINK":
          return "Link Deactivated";
        case "INVALID_TOKEN":
          return "Invalid Link";
        default:
          return "Link Not Available";
      }
    };

    const getErrorDescription = () => {
      switch (validation.error) {
        case "EXPIRED_LINK":
          return "This sharing link has expired. Please ask for a new link to submit birthdays.";
        case "INACTIVE_LINK":
          return "This sharing link has been deactivated by the owner. Please ask for a new link to submit birthdays.";
        case "INVALID_TOKEN":
          return "This sharing link is not valid. Please check the link and try again, or ask for a new link.";
        default:
          return validation.message || "This sharing link is not available.";
      }
    };

    return (
      <PublicLayout title={`${getErrorTitle()} | Lazy Uncle`}>
        <div className="mx-auto max-w-2xl rounded-lg border border-rule bg-paper p-8 text-center text-ink shadow-sm">
          <div className="mb-6">
            <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-amber-100">
              <svg
                className="h-8 w-8 text-amber-700"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                />
              </svg>
            </div>
          </div>
          <h1 className="mb-4 font-display text-2xl font-semibold text-ink">
            {getErrorTitle()}
          </h1>
          <p className="mb-6 text-ink">{getErrorDescription()}</p>
          <div className="space-y-4">
            <button
              onClick={handleClose}
              className="inline-flex items-center rounded-md bg-accent px-4 py-2 text-sm font-medium text-white transition hover:bg-accent-deep focus:outline-hidden focus:ring-2 focus:ring-accent/40 focus:ring-offset-2"
            >
              Go to Lazy Uncle
            </button>
            <div className="text-sm text-ink-soft">
              <p>
                Want to create your own birthday list?{" "}
                <Link
                  href="/"
                  className="font-medium text-accent-deep underline underline-offset-4 hover:text-accent"
                >
                  Sign up for free
                </Link>
              </p>
            </div>
          </div>
        </div>
      </PublicLayout>
    );
  }

  const sharingLink = validation.sharingLink!;
  const expiresAt = new Date(sharingLink.expiresAt);
  const isExpiringSoon = isLinkExpiringSoon(sharingLink.expiresAt);

  return (
    <PublicLayout
      title={`Add Birthday${
        sharingLink.ownerName ? ` for ${sharingLink.ownerName}` : ""
      } | Lazy Uncle`}
      description={`Help ${
        sharingLink.ownerName || "someone"
      } keep track of important birthdays by adding birthday information.`}
    >
      <div className="mx-auto max-w-6xl">
        <div className="mb-8 text-center">
          <h1 className="mb-2 font-display text-3xl font-semibold text-ink">
            Add a birthday
            {sharingLink.ownerName && (
              <span className="block text-2xl font-normal text-ink-soft">
                for {sharingLink.ownerName}
              </span>
            )}
          </h1>
          {sharingLink.description && (
            <p className="mb-4 text-lg text-ink-soft">
              {sharingLink.description}
            </p>
          )}
          <p className="mx-auto max-w-2xl text-ink">
            Help keep track of important birthdays by adding the details below.
            Your submission will be reviewed before being added to the birthday
            list.
          </p>
          {isExpiringSoon && (
            <div className="mt-4 rounded-md border border-amber-200 bg-amber-50 p-4 text-left">
              <div className="flex">
                <div className="shrink-0">
                  <svg
                    className="h-5 w-5 text-amber-600"
                    viewBox="0 0 20 20"
                    fill="currentColor"
                  >
                    <path
                      fillRule="evenodd"
                      d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z"
                      clipRule="evenodd"
                    />
                  </svg>
                </div>
                <div className="ml-3">
                  <p className="text-sm text-amber-900">
                    This sharing link expires on{" "}
                    {expiresAt.toLocaleDateString(undefined, {
                      weekday: "long",
                      year: "numeric",
                      month: "long",
                      day: "numeric",
                      hour: "numeric",
                      minute: "2-digit",
                    })}
                    .
                  </p>
                </div>
              </div>
            </div>
          )}
        </div>

        <div className="rounded-lg border border-rule bg-paper p-4 shadow-sm md:p-6 lg:p-8">
          <BirthdaySubmissionForm
            token={token}
            onSuccess={() => {}}
            onCancel={handleClose}
          />
        </div>

        <div className="mt-8 text-center text-sm text-ink-soft">
          <p>
            Powered by{" "}
            <Link
              href="/"
              className="font-medium text-accent-deep underline underline-offset-4 hover:text-accent"
            >
              Lazy Uncle
            </Link>{" "}
            — the easy way to keep track of birthdays
          </p>
          <p className="mt-2">
            Want to create your own birthday list?{" "}
            <Link
              href="/"
              className="font-medium text-accent-deep underline underline-offset-4 hover:text-accent"
            >
              Sign up for free
            </Link>
          </p>
        </div>
      </div>
    </PublicLayout>
  );
};

export const getServerSideProps: GetServerSideProps = async (context) => {
  const { token } = context.params!;

  if (!token || typeof token !== "string") {
    return {
      notFound: true,
    };
  }

  return {
    props: {
      token,
    },
  };
};

export default SharingPage;
