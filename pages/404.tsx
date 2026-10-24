import ErrorPageContent from "../components/ErrorPageContent";
import NotFoundMessage from "../components/NotFoundMessage";

// Rendered for Pages Router 404s (e.g. getServerSideProps returning
// `notFound`). Unmatched URLs are answered by app/not-found.tsx.
const NotFoundPage = () => (
  <ErrorPageContent title="Page not found">
    <NotFoundMessage />
  </ErrorPageContent>
);

export default NotFoundPage;
