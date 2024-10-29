import { useQuery } from "@apollo/client";
import { GetServerSideProps } from "next";
import { getServerSession } from "next-auth/next";
import dynamic from "next/dynamic";
import Link from "next/link";
import { HiChevronLeft } from "react-icons/hi";
import LoadingSpinner from "../../components/LoadingSpinner";
import MainLayout from "../../components/layout/MainLayout";
import { GET_BIRTHDAY_BY_ID_QUERY } from "../../graphql/Birthday";
import getAgeForHumans from "../../shared/getAgeForHumans";
import getDateFromYmdString from "../../shared/getDateFromYmdString";
import { authOptions } from "../api/auth/[...nextauth]";

const EditBirthdayForm = dynamic(
  () => import("../../components/EditBirthdayForm"),
  { loading: () => <div>Loading form...</div> },
);

const Birthday = ({ id }: { id: string }) => {
  const {
    data: birthdayData,
    loading: birthdayLoading,
    error: birthdayError,
  } = useQuery(GET_BIRTHDAY_BY_ID_QUERY, {
    variables: { birthdayId: id },
  });

  return (
    <MainLayout title={`Birthday`}>
      <>
        {birthdayError && <p>Error loading birthday</p>}
        <div className="px-2 mx-auto mt-8 max-w-7xl md:px-8">
          <Link
            href="/birthdays"
            className="flex items-center space-x-1 text-cyan-100 underline md:px-0"
          >
            <HiChevronLeft className="mt-1 w-6 h-6" />
            <span>Back to all birthdays</span>
          </Link>
          <div className="py-8 px-4 mt-4 text-gray-800 bg-white rounded-xl">
            {birthdayLoading ? (
              <div className="flex justify-center items-center min-h-[300px]">
                <LoadingSpinner spinnerTextColor="text-cyan-40" />
              </div>
            ) : (
              <>
                <div className="justify-between md:flex md:items-center md:px-8">
                  <h1 className="text-2xl font-medium">
                    Edit {birthdayData?.birthday?.name}&apos;s Birthday
                  </h1>
                  <h3 className="flex items-end space-x-1">
                    <span className="text-sm font-light">Age</span>
                    <span>
                      {getAgeForHumans(
                        getDateFromYmdString(birthdayData?.birthday?.date),
                        true,
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
