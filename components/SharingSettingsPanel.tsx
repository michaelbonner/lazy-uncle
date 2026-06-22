import { trpc } from "../lib/trpc";
import LoadingSpinner from "./LoadingSpinner";
import PrimaryButton from "./PrimaryButton";
import { useState } from "react";
import { HiCog, HiMail, HiMailOpen } from "react-icons/hi";
import { IoSettingsOutline } from "react-icons/io5";
import { MdCake } from "react-icons/md";

interface NotificationPreference {
  id: string;
  userId: string;
  emailNotifications: boolean;
  summaryNotifications: boolean;
  birthdayReminders: boolean;
}

type NotificationPreferenceDraft = Pick<
  NotificationPreference,
  "emailNotifications" | "summaryNotifications" | "birthdayReminders"
>;

const defaultPreferences: NotificationPreferenceDraft = {
  emailNotifications: true,
  summaryNotifications: false,
  birthdayReminders: false,
};

const SharingSettingsPanel = () => {
  const [draftPreferences, setDraftPreferences] =
    useState<NotificationPreferenceDraft | null>(null);
  const utils = trpc.useUtils();
  const {
    data: preferencesData,
    isPending: preferencesLoading,
    error: preferencesError,
  } = trpc.notification.preferences.useQuery();

  const formPreferences =
    draftPreferences ?? preferencesData ?? defaultPreferences;

  const updatePreferences = trpc.notification.update.useMutation({
    onSuccess: () => {
      utils.notification.preferences.invalidate();
    },
    onError: (error) => {
      console.error("Error updating notification preferences:", error);
    },
  });
  const updateLoading = updatePreferences.isPending;

  const hasChanges =
    preferencesData === undefined
      ? false // Still loading — hide Save
      : preferencesData
        ? formPreferences.emailNotifications !==
            preferencesData.emailNotifications ||
          formPreferences.summaryNotifications !==
            preferencesData.summaryNotifications ||
          formPreferences.birthdayReminders !== preferencesData.birthdayReminders
        : true; // No preferences row yet — always show Save

  const updateDraftPreference = (
    key: keyof NotificationPreferenceDraft,
    value: boolean,
  ) => {
    setDraftPreferences({ ...formPreferences, [key]: value });
  };

  const handleSaveSettings = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await updatePreferences.mutateAsync({
        emailNotifications: formPreferences.emailNotifications,
        summaryNotifications: formPreferences.summaryNotifications,
        birthdayReminders: formPreferences.birthdayReminders,
      });
      setDraftPreferences(null);
    } catch (error) {
      console.error("Failed to update notification preferences:", error);
    }
  };

  const handleResetSettings = () => {
    setDraftPreferences(null);
  };

  const preferences: NotificationPreference | null = preferencesData ?? null;

  return (
    <div className="js-settings-panel mt-8 rounded-lg border border-rule bg-paper-deep text-ink">
      <div className="px-4 py-8 md:px-8 md:py-10">
        <div className="mb-6 flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <IoSettingsOutline className="h-6 w-6 text-accent" />
            <h2 className="font-display text-2xl font-semibold">Settings</h2>
          </div>
        </div>

        {preferencesError && (
          <div className="mb-4 rounded-md border border-rose-300 bg-rose-50 p-4">
            <p className="text-rose-900">
              Error loading preferences: {preferencesError.message}
            </p>
          </div>
        )}

        <div className="rounded-lg border border-rule bg-paper p-6">
          <h3 className="mb-6 font-display text-lg font-semibold">
            Notification preferences
          </h3>

          {preferencesLoading ? (
            <div className="flex justify-center py-8">
              <LoadingSpinner spinnerTextColor="text-accent" />
            </div>
          ) : (
            <form onSubmit={handleSaveSettings} className="space-y-6">
              <div className="space-y-4">
                <div className="flex items-start space-x-3">
                  <div className="flex h-5 items-center">
                    <input
                      id="emailNotifications"
                      type="checkbox"
                      checked={formPreferences.emailNotifications}
                      onChange={(e) =>
                        updateDraftPreference(
                          "emailNotifications",
                          e.target.checked,
                        )
                      }
                      className="h-4 w-4 rounded border-rule text-accent focus:ring-accent/40"
                    />
                  </div>
                  <div className="flex-1">
                    <label
                      htmlFor="emailNotifications"
                      className="flex items-center space-x-2 text-sm font-medium text-ink"
                    >
                      <HiMail className="h-4 w-4 text-accent" />
                      <span>Email notifications for new submissions</span>
                    </label>
                    <p className="mt-1 text-sm text-ink-soft">
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
                      checked={formPreferences.summaryNotifications}
                      onChange={(e) =>
                        updateDraftPreference(
                          "summaryNotifications",
                          e.target.checked,
                        )
                      }
                      className="h-4 w-4 rounded border-rule text-accent focus:ring-accent/40"
                    />
                  </div>
                  <div className="flex-1">
                    <label
                      htmlFor="summaryNotifications"
                      className="flex items-center space-x-2 text-sm font-medium text-ink"
                    >
                      <HiMailOpen className="h-4 w-4 text-accent" />
                      <span>Daily summary notifications</span>
                    </label>
                    <p className="mt-1 text-sm text-ink-soft">
                      Receive a daily summary email of all pending submissions
                      instead of individual notifications.
                    </p>
                  </div>
                </div>

                <div className="flex items-start space-x-3">
                  <div className="flex h-5 items-center">
                    <input
                      id="birthdayReminders"
                      type="checkbox"
                      checked={formPreferences.birthdayReminders}
                      onChange={(e) =>
                        updateDraftPreference(
                          "birthdayReminders",
                          e.target.checked,
                        )
                      }
                      className="h-4 w-4 rounded border-rule text-accent focus:ring-accent/40"
                    />
                  </div>
                  <div className="flex-1">
                    <label
                      htmlFor="birthdayReminders"
                      className="flex items-center space-x-2 text-sm font-medium text-ink"
                    >
                      <MdCake className="h-4 w-4 text-accent" />
                      <span>Birthday reminder emails</span>
                    </label>
                    <p className="mt-1 text-sm text-ink-soft">
                      Get an email on the day of each birthday. Individual
                      birthdays can be opted out in the birthday settings.
                    </p>
                  </div>
                </div>
              </div>

              {hasChanges && (
                <div className="flex space-x-3 border-t border-rule pt-6">
                  <PrimaryButton type="submit" disabled={updateLoading}>
                    {updateLoading ? "Saving…" : "Save changes"}
                  </PrimaryButton>
                  <button
                    type="button"
                    onClick={handleResetSettings}
                    className="rounded-md border border-rule bg-paper px-4 py-2 text-sm font-medium text-ink transition hover:bg-paper-deep"
                  >
                    Reset
                  </button>
                </div>
              )}

              {!hasChanges && preferences && (
                <div className="border-t border-rule pt-6">
                  <div className="flex items-center space-x-2 text-sm text-emerald-700">
                    <HiCog className="h-4 w-4" />
                    <span>Settings saved</span>
                  </div>
                </div>
              )}
            </form>
          )}
        </div>

        <div className="mt-6 text-sm text-ink-soft">
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
