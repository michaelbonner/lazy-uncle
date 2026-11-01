import LoadingSpinner from "../../components/LoadingSpinner";
import MainLayout from "../../components/layout/MainLayout";
import { auth } from "../../lib/auth";
import { trpc } from "../../lib/trpc";
import getAgeForHumans from "../../shared/getAgeForHumans";
import getDateFromYmdString from "../../shared/getDateFromYmdString";
import { GetServerSideProps } from "next";
import dynamic from "next/dynamic";
import Link from "next/link";
import { HiChevronLeft } from "react-icons/hi";

const EditBirthdayForm = dynamic(
  () => import("../../components/EditBirthdayForm"),
  { loading: () => <div>Loading form...</div> },
);

const Birthday = ({ id }: { id: string }) => {
  const {
    data: birthdayData,
    isPending: birthdayLoading,
    error: birthdayError,
  } = trpc.birthday.byId.useQuery({ birthdayId: id });

  return (
    <MainLayout title="Edit birthday | Lazy Uncle">
      <main className="mx-auto max-w-5xl px-5 pb-16 sm:px-8">
        <div className="py-9 sm:py-12">
          <Link
            href="/birthdays"
            className="inline-flex items-center gap-1 text-sm text-ink-soft hover:text-accent-deep focus-visible:outline-2 focus-visible:outline-accent"
          >
            <HiChevronLeft aria-hidden className="size-5" />
            <span>Back to birthdays</span>
          </Link>
          <p className="mt-8 text-sm font-medium tracking-[0.12em] text-accent-deep uppercase">
            Your people
          </p>
          <div className="mt-2 flex flex-wrap items-end justify-between gap-3">
            <h1 className="font-display text-4xl text-ink sm:text-5xl">
              {birthdayData ? `Edit ${birthdayData.name}` : "Edit birthday"}
            </h1>
            {birthdayData?.date && (
              <p className="text-sm text-ink-soft">
                {getAgeForHumans(getDateFromYmdString(birthdayData.date), true)}
              </p>
            )}
          </div>
        </div>
        {birthdayError && (
          <p role="alert" className="mb-5 text-rose-800">
            Error loading birthday: {birthdayError.message}
          </p>
        )}
        <section className="rounded-xl border border-rule/70 bg-white p-5 sm:p-8">
          {birthdayLoading ? (
            <div className="flex min-h-[300px] items-center justify-center">
              <LoadingSpinner spinnerTextColor="text-accent" />
            </div>
          ) : (
            birthdayData && <EditBirthdayForm birthday={birthdayData} />
          )}
        </section>
      </main>
    </MainLayout>
  );
};

export const getServerSideProps: GetServerSideProps = async (context) => {
  const { id } = context.query;
  const session = await auth.api.getSession({
    headers: new Headers({
      cookie: context.req.headers.cookie || "",
    }),
  });

  if (!session?.user) {
    context.res.statusCode = 302;
    context.res.setHeader("Location", `/`);
    return { props: {} };
  }

  return { props: { id, session: JSON.parse(JSON.stringify(session)) } };
};

export default Birthday;
