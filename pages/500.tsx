import ErrorMessage, {
  secondaryButtonClassName,
} from "../components/ErrorMessage";
import ErrorPageContent from "../components/ErrorPageContent";

const ServerErrorPage = () => (
  <ErrorPageContent title="Something went wrong">
    <ErrorMessage
      eyebrow="500"
      heading="Something went wrong on our end."
      body={
        <p>
          It&rsquo;s not you, it&rsquo;s us. Nothing you saved has been lost.
          Give it a moment and try again.
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

export default ServerErrorPage;
