import { driver, type Driver } from "driver.js";
import { memo, useEffect } from "react";

let tour: Driver | null = null;

const startTour = () => {
  if (tour) return;
  if (localStorage.getItem("lazy-uncle:onboardingWalkthroughCompleted")) return;

  tour = driver({
    showProgress: true,
    allowClose: true,
    doneBtnText: "Done",
    nextBtnText: "Next",
    prevBtnText: "Back",
    steps: [
      {
        element: ".js-add-birthday-button",
        popover: {
          description: "Add a birthday to get started!",
          side: "bottom",
        },
      },
      {
        element: ".js-filter-name",
        popover: {
          description: "Search for a birthday by name",
          side: "bottom",
        },
      },
      {
        element: ".js-clear-filters",
        popover: {
          description: "Clear all applied filters at once",
          side: "bottom",
        },
      },
      {
        element: ".js-subscribe-to-calendar",
        popover: {
          description: "Subscribe to a calendar to get reminders",
          side: "top",
        },
      },
      {
        element: ".js-create-sharing-link",
        popover: {
          description:
            "Send a sharing link so friends and family can add their own birthdays",
          side: "top",
        },
      },
      {
        element: ".js-settings-panel",
        popover: {
          description:
            "Configure notification preferences and other settings here",
          side: "top",
        },
      },
    ],
    onDestroyed: () => {
      localStorage.setItem(
        "lazy-uncle:onboardingWalkthroughCompleted",
        `${Date.now()}`,
      );
      window.scrollTo({ top: 0, behavior: "smooth" });
    },
  });

  setTimeout(() => tour?.drive(), 2000);
};

const OnboardingWalkthrough = memo(() => {
  useEffect(() => {
    startTour();
  }, []);

  return null;
});

OnboardingWalkthrough.displayName = "OnboardingWalkthrough";
export default OnboardingWalkthrough;
