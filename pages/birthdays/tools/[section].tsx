import BirthdayAreaNav from "../../../components/BirthdayAreaNav";
import MainLayout from "../../../components/layout/MainLayout";
import { auth } from "../../../lib/auth";
import type { GetServerSideProps, NextPage } from "next";
import dynamic from "next/dynamic";
import Head from "next/head";

const SharingLinkManager = dynamic(
  () => import("../../../components/SharingLinkManager"),
  { ssr: false },
);
const SubmissionReviewInterface = dynamic(
  () => import("../../../components/SubmissionReviewInterface"),
  { ssr: false },
);
const SharingSettingsPanel = dynamic(
  () => import("../../../components/SharingSettingsPanel"),
  { ssr: false },
);
const UploadCsvBirthdayForm = dynamic(
  () => import("../../../components/UploadCsvBirthdayForm"),
  { ssr: false },
);

const sections = ["sharing", "settings", "import"] as const;
type ToolSection = (typeof sections)[number];

const pageDetails: Record<ToolSection, { title: string; description: string }> =
  {
    sharing: {
      title: "Share birthdays",
      description: "Review birthdays people sent you and invite more through a private link.",
    },
    settings: {
      title: "Notification settings",
      description:
        "Choose which birthday and sharing updates reach your inbox.",
    },
    import: {
      title: "Import birthdays",
      description: "Bring birthdays over from a CSV file.",
    },
  };

const ToolPage: NextPage<{ section: ToolSection }> = ({ section }) => {
  const { title, description } = pageDetails[section];

  return (
    <MainLayout title={`${title} | Lazy Uncle`} description={description}>
      <main className="mx-auto max-w-7xl px-5 pb-16 sm:px-8 lg:px-12">
        <Head>
          <meta name="robots" content="noindex, nofollow" />
        </Head>
        <div className="py-9 sm:py-12">
          <p className="text-sm font-medium tracking-[0.12em] text-accent-deep uppercase">
            Your people
          </p>
          <h1 className="mt-2 font-display text-4xl text-ink sm:text-5xl">
            {title}
          </h1>
          <p className="mt-3 max-w-2xl text-base text-ink-soft">
            {description}
          </p>
        </div>
        <BirthdayAreaNav currentPath={`/birthdays/tools/${section}`} />
        {section === "sharing" && (
          <div className="space-y-10">
            <SubmissionReviewInterface />
            <div className="border-t border-rule pt-10">
              <SharingLinkManager />
            </div>
          </div>
        )}
        {section === "settings" && <SharingSettingsPanel />}
        {section === "import" && (
          <section className="max-w-3xl overflow-hidden rounded-xl border border-rule/70 bg-white">
            <div className="border-b border-rule/70 px-5 py-5 sm:px-7">
              <h2 className="font-display text-2xl text-ink">
                Upload a CSV file
              </h2>
              <p className="mt-1 text-sm text-ink-soft">
                Choose a file to add several birthdays at once.
              </p>
            </div>
            <div className="px-5 py-6 sm:px-7">
              <UploadCsvBirthdayForm />
            </div>
          </section>
        )}
      </main>
    </MainLayout>
  );
};

export const getServerSideProps: GetServerSideProps<{
  section: ToolSection;
}> = async (context) => {
  const isReviewRoute = context.params?.section === "review";
  const section = sections.find((value) => value === context.params?.section);
  if (!section && !isReviewRoute) return { notFound: true };

  const session = await auth.api.getSession({
    headers: new Headers({ cookie: context.req.headers.cookie || "" }),
  });
  if (!session?.user) {
    return {
      redirect: { destination: "/", permanent: false },
    };
  }

  if (isReviewRoute) {
    return {
      redirect: { destination: "/birthdays/tools/sharing", permanent: true },
    };
  }

  if (!section) return { notFound: true };
  return { props: { section } };
};

export default ToolPage;
