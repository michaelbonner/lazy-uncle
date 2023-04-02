import { useMutation, useQuery } from "@apollo/client";
import { GetServerSideProps } from "next";
import { getServerSession } from "next-auth/next";
import dynamic from "next/dynamic";
import Link from "next/link";
import { useRouter } from "next/router";
import { HiChevronLeft } from "react-icons/hi";
import { toast } from "react-toastify";
import LoadingSpinner from "../../components/LoadingSpinner";
import MainLayout from "../../components/layout/MainLayout";
import {
  DELETE_BIRTHDAY_MUTATION,
  GET_ALL_BIRTHDAYS_QUERY,
  GET_BIRTHDAY_BY_ID_QUERY,
} from "../../graphql/Birthday";
import getAgeForHumans from "../../shared/getAgeForHumans";
import getDateFromYmdString from "../../shared/getDateFromYmdString";
import { authOptions } from "../api/auth/[...nextauth]";

const EditBirthdayForm = dynamic(
  () => import("../../components/EditBirthdayForm"),
  { loading: () => <div>Loading form...</div> }
);

const Birthday = ({ id }: { id: string }) => {
  const router = useRouter();
  const {
    data: birthdayData,
    loading: birthdayLoading,
    error: birthdayError,
  } = useQuery(GET_BIRTHDAY_BY_ID_QUERY, {
    variables: { birthdayId: id },
  });

  const [deleteBirthday, { loading: deleteLoading, error: deleteError }] =
    useMutation(DELETE_BIRTHDAY_MUTATION);

  return (
    <MainLayout title={`Birthday`}>
      <>
        {birthdayError && <p>Error loading birthday</p>}
        <div className="mx-auto mt-8 max-w-7xl px-2 md:px-8">
          <Link
            href="/"
            className="flex items-center space-x-1 text-cyan-100 underline md:px-0"
          >
            <HiChevronLeft className="mt-1 h-6 w-6" />
            <span>Back to all birthdays</span>
          </Link>
          <div className="mt-4 rounded-xl bg-white px-4 py-8 text-gray-800">
            {birthdayLoading ? (
              <div className="flex min-h-[300px] items-center justify-center">
                <LoadingSpinner spinnerTextColor="text-cyan-40" />
              </div>
            ) : (
              <>
                <div className="justify-between md:flex md:items-center">
                  <h1 className="text-2xl font-medium">
                    Edit {birthdayData?.birthday?.name}&apos;s Birthday
                  </h1>
                  <h3 className="flex items-end space-x-1">
                    <span className="text-sm font-light">Age</span>
                    <span>
                      {getAgeForHumans(
                        getDateFromYmdString(birthdayData?.birthday?.date),
                        true
                      )}
                    </span>
                  </h3>
                </div>
                <div className="mt-6 md:px-24">
                  <EditBirthdayForm birthday={birthdayData?.birthday} />
                </div>
              </>
            )}
          </div>

          <div className="mb-12 mt-8 flex justify-end">
            {deleteError && (
              <p className="text-sm text-red-600">
                Error deleting birthday: {deleteError.message}
              </p>
            )}
            <button
              className="inline-flex items-center rounded-md border border-transparent bg-transparent px-4 py-2 text-sm font-medium text-gray-100 hover:border-red-800 hover:bg-red-700 hover:shadow focus:outline-none focus:ring-2 focus:ring-cyan-500 focus:ring-offset-2"
              disabled={deleteLoading}
              onClick={() => {
                if (
                  window.confirm(
                    "Are you sure you want to delete this birthday?"
                  )
                ) {
                  deleteBirthday({
                    variables: {
                      birthdayId: birthdayData?.birthday?.id,
                    },
                    refetchQueries: [
                      {
                        query: GET_ALL_BIRTHDAYS_QUERY,
                      },
                    ],
                  });
                  toast.info("Birthday deleted successfully!");
                  router.push("/");
                }
              }}
            >
              Delete Birthday
            </button>
          </div>
        </div>
      </>
    </MainLayout>
  );
};

export const getServerSideProps: GetServerSideProps = async (context) => {
  const { id } = context.query;
  const session = await getServerSession(context.req, context.res, authOptions);

  if (!session?.user) {
    context.res.statusCode = 302;
    context.res.setHeader("Location", `/`);
    return { props: {} };
  }

  delete session?.user?.createdAt;
  delete session?.user?.emailVerified;

  return { props: { id, session } };
};

export default Birthday;
