import ErrorMessage from "./ErrorMessage";
import Link from "next/link";

// Used by both pages/404.tsx and app/not-found.tsx. In this hybrid app the
// App Router's not-found page is what actually answers unmatched URLs.
const NotFoundMessage = () => (
  <ErrorMessage
    eyebrow="404"
    heading="We couldn't find that page."
    body={
      <>
        <p>
          The link may be old, mistyped, or pointing at something that has since
          been moved. Your birthdays are safe, this page just isn&rsquo;t here.
        </p>
        <p>
          If someone sent you a sharing link, it may have expired. Ask them for
          a fresh one, or{" "}
          <Link
            href="/contact"
            className="underline underline-offset-4 transition hover:text-ink"
          >
            get in touch
          </Link>{" "}
          if you think this is a mistake.
        </p>
      </>
    }
  />
);

export default NotFoundMessage;
