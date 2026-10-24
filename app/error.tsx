"use client";

import ErrorMessage, {
  secondaryButtonClassName,
} from "../components/ErrorMessage";
import { useEffect } from "react";

// The App Router only renders not-found here (all UI lives in pages/), so
// this is a safety net in case that render throws.
export default function Error({
  error,
  retry,
}: {
  error: unknown;
  retry: () => void;
}) {
  useEffect(() => {
    console.error(error);
  }, [error]);

  const digest =
    typeof error === "object" &&
    error !== null &&
    "digest" in error &&
    typeof error.digest === "string"
      ? error.digest
      : "";

  return (
    <ErrorMessage
      eyebrow="Error"
      heading="Something went wrong."
      body={
        <>
          <p>
            This page hit a snag while loading. Nothing you saved has been lost.
            Try again, and if it keeps happening, head back home and start from
            there.
          </p>
          {digest && (
            <p className="text-sm text-ink-muted">Reference: {digest}</p>
          )}
        </>
      }
      action={
        <button
          type="button"
          className={secondaryButtonClassName}
          onClick={() => retry()}
        >
          Try again
        </button>
      }
    />
  );
}
