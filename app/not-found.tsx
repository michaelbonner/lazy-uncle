import NotFoundMessage from "../components/NotFoundMessage";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Page not found | Lazy Uncle",
};

export default function NotFound() {
  return <NotFoundMessage />;
}
