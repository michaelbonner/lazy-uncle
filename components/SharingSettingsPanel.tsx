import {
  GET_NOTIFICATION_PREFERENCES_QUERY,
  UPDATE_NOTIFICATION_PREFERENCES_MUTATION,
} from "../graphql/Sharing";
import LoadingSpinner from "./LoadingSpinner";
import PrimaryButton from "./PrimaryButton";
import { useMutation, useQuery } from "@apollo/client/react";
import clsx from "clsx";
import { useState } from "react";
import { HiCog, HiMail, HiMailOpen } from "react-icons/hi";
import { IoSettingsOutline } from "react-icons/io5";

interface NotificationPreference {
  id: string;
  userId: string;
  emailNotifications: boolean;
  summaryNotifications: boolean;
}

const SharingSettingsPanel = () => {
  const [showSettings, setShowSettings] = useState(false);
  const [emailNotifications, setEmailNotifications] = useState(true);
  const [summaryNotifications, setSummaryNotifications] = useState(false);
  const {
    data: preferencesData,
    loading: preferencesLoading,
    error: preferencesError,
    refetch: refetchPreferences,
  } = useQuery(GET_NOTIFICATION_PREFERENCES_QUERY, {
    fetchPolicy: "cache-and-network",
    onCompleted: (data) => {
      if (data?.notificationPreferences) {
        setEmailNotifications(data.notificationPreferences.emailNotifications);
        setSummaryNotifications(data.notificationPreferences.summaryNotifications);
      }
    },
  });

  const [updatePreferences, { loading: updateLoading }] = useMutation(
    UPDATE_NOTIFICATION_PREFERENCES_MUTATION,
    {
      onCompleted: () => {
        refetchPreferences();
      },
      onError: (error) => {
        console.error("Error updating notification preferences:", error);
      },
    },
  );

  const hasChanges = preferencesData?.notificationPreferences
    ? emailNotifications !== preferencesData.notificationPreferences.emailNotifications ||
      summaryNotifications !== preferencesData.notificationPreferences.summaryNotifications
    : false;

  const handleSaveSettings = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await updatePreferences({
        variables: {
          emailNotifications,
          summaryNotifications,
        },
      });
    } catch (error) {
      console.error("Failed to update notification preferences:", error);
    }
  };

  const handleResetSettings = () => {
    if (preferencesData?.notificationPreferences) {
      const preferences = preferencesData.notificationPreferences;
      setEmailNotifications(preferences.emailNotifications);
      setSummaryNotifications(preferences.summaryNotifications);
    }
  };

  const preferences: NotificationPreference | null =
    preferencesData?.notificationPreferences || null;

  return (
    <div className="mt-8 rounded-lg border-t-4 border-b-4 border-t-gray-400 border-b-gray-400 bg-gray-50 text-gray-800">
      <div className="px-4 py-6 md:px-8">
        <div className="mb-6 flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <IoSettingsOutline className="h-6 w-6 text-cyan-600" />
            <h2 className="text-2xl font-medium">Sharing Settings</h2>
          </div>
          <button
            className={clsx(
              "flex items-center space-x-2 rounded-md border border-transparent bg-cyan-600 px-4 py-2 font-medium text-white shadow-xs transition-opacity",
              "hover:bg-cyan-700",
              "focus:ring-2 focus:ring-cyan-500 focus:ring-offset-2 focus:outline-hidden",
            )}
            onClick={() => setShowSettings(!showSettings)}
            type="button"
          >
            <HiCog className="h-4 w-4" />
            <span>{showSettings ? "Hide Settings" : "Show Settings"}</span>
          </button>
        </div>

        {preferencesError && (
          <div className="mb-4 rounded-md border border-red-200 bg-red-50 p-4">
            <p className="text-red-800">
              Error loading preferences: {preferencesError.message}
            </p>
          </div>
        )}

        {showSettings && (
          <div className="rounded-lg border border-gray-200 bg-white p-6">
            <h3 className="mb-6 text-lg font-medium">
              Notification Preferences
            </h3>

            {preferencesLoading ? (
              <div className="flex justify-center py-8">
                <LoadingSpinner spinnerTextColor="text-cyan-600" />
              </div>
            ) : (
              <form onSubmit={handleSaveSettings} className="space-y-6">
                <div className="space-y-4">
                  <div className="flex items-start space-x-3">
                    <div className="flex h-5 items-center">
                      <input
                        id="emailNotifications"
                        type="checkbox"
                        checked={emailNotifications}
                        onChange={(e) =>
                          setEmailNotifications(e.target.checked)
                        }
                        className="h-4 w-4 rounded border-gray-300 text-cyan-600 focus:ring-cyan-500"
                      />
                    </div>
                    <div className="flex-1">
                      <label
                        htmlFor="emailNotifications"
                        className="flex items-center space-x-2 text-sm font-medium text-gray-700"
                      >
                        <HiMail className="h-4 w-4 text-cyan-600" />
                        <span>Email notifications for new submissions</span>
                      </label>
                      <p className="mt-1 text-sm text-gray-500">
                        Receive an email notification whenever someone submits a
                        birthday through your sharing links.
                      </p>
                    </div>
                  </div>

                  <div className="flex items-start space-x-3">
                    <div className="flex h-5 items-center">
                      <input
                        id="summaryNotifications"
                        type="checkbox"
                        checked={summaryNotifications}
                        onChange={(e) =>
                          setSummaryNotifications(e.target.checked)
                        }
                        className="h-4 w-4 rounded border-gray-300 text-cyan-600 focus:ring-cyan-500"
                      />
                    </div>
                    <div className="flex-1">
                      <label
                        htmlFor="summaryNotifications"
                        className="flex items-center space-x-2 text-sm font-medium text-gray-700"
                      >
                        <HiMailOpen className="h-4 w-4 text-cyan-600" />
                        <span>Daily summary notifications</span>
                      </label>
                      <p className="mt-1 text-sm text-gray-500">
                        Receive a daily summary email of all pending submissions
                        instead of individual notifications.
                      </p>
                    </div>
                  </div>
                </div>

                <div className="border-t border-gray-200 pt-6">
                  <h4 className="mb-4 text-base font-medium text-gray-900">
                    Link Settings
                  </h4>
                  <div className="space-y-4">
                    <div className="rounded-md bg-gray-50 p-4">
                      <h5 className="text-sm font-medium text-gray-700">
                        Default Link Expiration
                      </h5>
                      <p className="mt-1 text-sm text-gray-500">
                        New sharing links will expire after 7 days by default.
                        You can customize this when creating each link.
                      </p>
                    </div>
                    <div className="rounded-md bg-gray-50 p-4">
                      <h5 className="text-sm font-medium text-gray-700">
                        Security
                      </h5>
                      <p className="mt-1 text-sm text-gray-500">
                        All sharing links use secure tokens and are
                        automatically cleaned up when expired. Links can be
                        revoked at any time.
                      </p>
                    </div>
                  </div>
                </div>

                {hasChanges && (
                  <div className="flex space-x-3 border-t border-gray-200 pt-6">
                    <PrimaryButton type="submit" disabled={updateLoading}>
                      {updateLoading ? "Saving..." : "Save Changes"}
                    </PrimaryButton>
                    <button
                      type="button"
                      onClick={handleResetSettings}
                      className="rounded-md border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50"
                    >
                      Reset
                    </button>
                  </div>
                )}

                {!hasChanges && preferences && (
                  <div className="border-t border-gray-200 pt-6">
                    <div className="flex items-center space-x-2 text-sm text-green-600">
                      <HiCog className="h-4 w-4" />
                      <span>Settings saved</span>
                    </div>
                  </div>
                )}
              </form>
            )}
          </div>
        )}

        <div className="mt-6 text-sm text-gray-500">
          <p>
            Configure your sharing preferences and notification settings. These
            settings control how you receive updates about birthday submissions
            from your sharing links.
          </p>
        </div>
      </div>
    </div>
  );
};

export default SharingSettingsPanel;
