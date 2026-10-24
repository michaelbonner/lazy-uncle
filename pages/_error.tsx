import ErrorMessage, {
  secondaryButtonClassName,
} from "../components/ErrorMessage";
import ErrorPageContent from "../components/ErrorPageContent";
import NotFoundMessage from "../components/NotFoundMessage";
import type { NextPageContext } from "next";

// pages/404 and pages/500 are static and cover not-found and server errors.
// This page is what Next renders for errors thrown while rendering in the
// browser (and any other status code), which would otherwise show the
// unstyled "Application error: a client-side exception has occurred".
const ErrorPage = ({ statusCode }: { statusCode?: number }) => {
  if (statusCode === 404) {
    return (
      <ErrorPageContent title="Page not found">
        <NotFoundMessage />
      </ErrorPageContent>
    );
  }

  return (
    <ErrorPageContent title="Something went wrong">
      <ErrorMessage
        eyebrow={statusCode ? String(statusCode) : "Error"}
        heading="Something went wrong."
        body={
          <p>
            This page hit a snag while loading. Nothing you saved has been lost.
            Try again, and if it keeps happening, head back home and start from
            there.
          </p>
        }
        action={
          <button
            type="button"
            className={secondaryButtonClassName}
            onClick={() => window.location.reload()}
          >
            Try again
          </button>
        }
      />
    </ErrorPageContent>
  );
};

ErrorPage.getInitialProps = ({ res, err }: NextPageContext) => {
  const statusCode = res ? res.statusCode : err ? err.statusCode : 404;
  return { statusCode };
};

export default ErrorPage;
