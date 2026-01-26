import BirthdaySubmissionForm from "../../components/BirthdaySubmissionForm";
import LoadingSpinner from "../../components/LoadingSpinner";
import PublicLayout from "../../components/layout/PublicLayout";
import { VALIDATE_SHARING_LINK_QUERY } from "../../graphql/Sharing";
import { useQuery } from "@apollo/client/react";
import { GetServerSideProps } from "next";
import Link from "next/link";
import { useRouter } from "next/router";
import { useEffect } from "react";

interface SharingPageProps {
  token: string;
}

interface SharingLinkInfo {
  id: string;
  token: string;
  description: string | null;
  expiresAt: string;
  ownerName: string | null;
}

interface SharingLinkValidation {
  isValid: boolean;
  error: string | null;
  message: string | null;
  sharingLink: SharingLinkInfo | null;
}

const SharingPage = ({ token }: SharingPageProps) => {
  const router = useRouter();

  const { data, loading, error } = useQuery<{
    validateSharingLink: SharingLinkValidation;
  }>(VALIDATE_SHARING_LINK_QUERY, {
    variables: { token },
    errorPolicy: "all",
  });

  const validation = data?.validateSharingLink;

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
        <div className="mx-auto max-w-2xl text-center">
          <div className="mb-6">
            <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-red-100">
              <svg
                className="h-8 w-8 text-red-600"
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
          <h1 className="mb-4 text-2xl font-bold text-gray-900">
            Something went wrong
          </h1>
          <p className="mb-6 text-gray-700">
            We encountered an error while loading this sharing link. Please try
            again or contact the person who shared this link with you.
          </p>
          <button
            onClick={handleClose}
            className="inline-flex items-center rounded-md bg-cyan-600 px-4 py-2 text-sm font-medium text-white hover:bg-cyan-700 focus:ring-2 focus:ring-cyan-500 focus:ring-offset-2 focus:outline-none"
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
        <div className="mx-auto max-w-2xl text-center">
          <div className="mb-6">
            <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-yellow-100">
              <svg
                className="h-8 w-8 text-yellow-600"
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
          <h1 className="mb-4 text-2xl font-bold text-gray-900">
            {getErrorTitle()}
          </h1>
          <p className="mb-6 text-gray-600">{getErrorDescription()}</p>
          <div className="space-y-4">
            <button
              onClick={handleClose}
              className="inline-flex items-center rounded-md bg-cyan-600 px-4 py-2 text-sm font-medium text-white hover:bg-cyan-700 focus:ring-2 focus:ring-cyan-500 focus:ring-offset-2 focus:outline-none"
            >
              Go to Lazy Uncle
            </button>
            <div className="text-sm text-gray-500">
              <p>
                Want to create your own birthday list?{" "}
                <Link
                  href="/"
                  className="font-medium text-cyan-600 hover:text-cyan-500"
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
  const isExpiringSoon = expiresAt.getTime() - Date.now() < 24 * 60 * 60 * 1000; // 24 hours

  return (
    <PublicLayout
      title={`Add Birthday${
        sharingLink.ownerName ? ` for ${sharingLink.ownerName}` : ""
      } | Lazy Uncle`}
      description={`Help ${
        sharingLink.ownerName || "someone"
      } keep track of important birthdays by adding birthday information.`}
    >
      <div className="mx-auto max-w-4xl">
        {/* Header Section */}
        <div className="mb-8 text-center">
          <h1 className="mb-2 text-3xl font-bold text-white">
            Add a Birthday
            {sharingLink.ownerName && (
              <span className="block text-2xl font-normal text-white">
                for {sharingLink.ownerName}
              </span>
            )}
          </h1>
          {sharingLink.description && (
            <p className="mb-4 text-lg white">{sharingLink.description}</p>
          )}
          <p className="text-white max-w-2xl mx-auto">
            Help keep track of important birthdays by adding the details below.
            Your submission will be reviewed before being added to the birthday
            list.
          </p>
          {isExpiringSoon && (
            <div className="mt-4 rounded-md bg-yellow-50 p-4">
              <div className="flex">
                <div className="shrink-0">
                  <svg
                    className="h-5 w-5 text-yellow-400"
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
                  <p className="text-sm text-yellow-800">
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

        {/* Form Section */}
        <div className="rounded-lg bg-white p-8 lg:py-12 shadow-sm ring-1 ring-gray-200">
          <BirthdaySubmissionForm
            token={token}
            onSuccess={() => {}}
            onCancel={handleClose}
          />
        </div>

        {/* Info Section */}
        <div className="mt-8 text-center text-sm text-white">
          <p>
            Powered by{" "}
            <Link href="/" className="font-medium">
              Lazy Uncle
            </Link>{" "}
            - The easy way to keep track of birthdays
          </p>
          <p className="mt-2">
            Want to create your own birthday list?{" "}
            <Link href="/" className="font-medium">
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
