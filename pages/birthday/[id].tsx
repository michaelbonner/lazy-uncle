import { useMutation, useQuery } from "@apollo/client";
import { NextPageContext } from "next";
import { useSession } from "next-auth/react";
import Link from "next/link";
import { useRouter } from "next/router";
import React from "react";
import { toast } from "react-toastify";
import EditBirthdayForm from "../../components/EditBirthdayForm";
import MainLayout from "../../components/layout/MainLayout";
import {
  DELETE_BIRTHDAY_MUTATION,
  GET_ALL_BIRTHDAYS_QUERY,
  GET_BIRTHDAY_BY_ID_QUERY,
} from "../../graphql/Birthday";
import getAgeForHumans from "../../shared/getAgeForHumans";
import getDateFromYmdString from "../../shared/getDateFromYmdString";

const Birthday = ({ id }: { id: string }) => {
  const { data: session, status: sessionStatus } = useSession();
  const router = useRouter();
  const {
    data: birthdayData,
    loading: birthdayLoading,
    error: birthdayError,
  } = useQuery(GET_BIRTHDAY_BY_ID_QUERY, {
    variables: { birthdayId: id },
  });

  const [
    deleteBirthday,
    { data: deleteData, loading: deleteLoading, error: deleteError },
  ] = useMutation(DELETE_BIRTHDAY_MUTATION, {
    refetchQueries: [GET_ALL_BIRTHDAYS_QUERY, "Birthdays"],
  });

  return (
    <MainLayout title={`Birthday`}>
      <>
        {birthdayError && <p>Error loading birthday</p>}
        {birthdayLoading ? (
          <div className="px-4 lg:px-8 max-w-7xl mx-auto mt-8 text-center py-36">
            <p>Loading...</p>
          </div>
        ) : (
          <div className="px-4 lg:px-8 max-w-7xl mx-auto mt-8">
            <Link href="/">
              <a className="underline text-blue100">Back to all birthdays</a>
            </Link>
            <div className="bg-white rounded-xl shadow-lg mt-12 text-blue-800 px-8 py-8">
              <div className="flex justify-between">
                <h1 className="text-2xl font-medium mb-4">
                  Edit {birthdayData?.birthday?.name}&apos;s Birthday
                </h1>
                <h3 className="flex space-x-1 items-end">
                  <span className="font-light text-sm">Age</span>
                  <span>
                    {getAgeForHumans(
                      getDateFromYmdString(birthdayData?.birthday?.date),
                      true
                    )}
                  </span>
                </h3>
              </div>
              <div className="mt-6 lg:px-24">
                <EditBirthdayForm birthday={birthdayData?.birthday} />
              </div>
            </div>

            <div className="flex justify-end mt-8 mb-12">
              <button
                className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-blue-100 bg-transparent hover:bg-red-700 hover:border-red-800 hover:shadow focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
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
        )}
      </>
    </MainLayout>
  );
};

export async function getServerSideProps(context: NextPageContext) {
  const { id } = context.query;

  return { props: { id } };
}

export default Birthday;
