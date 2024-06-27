import { memo } from "react";
import Shepherd from "shepherd.js";

const tour = new Shepherd.Tour({
  useModalOverlay: true,
  defaultStepOptions: {
    scrollTo: true,
  },
});

const OnboardingWalkthrough = memo(() => {
  if (tour.isActive()) return null;

  // don't make people see it more than once
  if (localStorage.getItem("lazy-uncle:onboardingWalkthroughCompleted"))
    return null;

  const exitTour = () => {
    localStorage.setItem(
      "lazy-uncle:onboardingWalkthroughCompleted",
      `${new Date().getTime()}`,
    );
    tour.complete();
  };

  tour.addStep({
    id: "add-birthday",
    text: "Add a birthday to get started!",
    attachTo: {
      element: ".js-add-birthday-button",
      on: "bottom",
    },
    classes: "shepherd-add-birthday",
    buttons: [
      {
        text: "Exit",
        action: exitTour,
        classes: "shepherd-button-secondary",
      },
      {
        text: "Next",
        action: tour.next,
      },
    ],
  });

  tour.addStep({
    id: "filter-by-name",
    text: "Search for a birthday by name",
    attachTo: {
      element: ".js-filter-name",
      on: "bottom",
    },
    classes: "shepherd-filter-by-name",
    buttons: [
      {
        text: "Exit",
        action: exitTour,
        classes: "shepherd-button-secondary",
      },
      {
        text: "Next",
        action: tour.next,
      },
    ],
  });

  tour.addStep({
    id: "shepherd-clear-filters",
    text: "Clear all applied filters at once",
    attachTo: {
      element: ".js-clear-filters",
      on: "bottom",
    },
    classes: "shepherd-clear-filters",
    buttons: [
      {
        text: "Exit",
        action: exitTour,
        classes: "shepherd-button-secondary",
      },
      {
        text: "Next",
        action: tour.next,
      },
    ],
  });

  tour.addStep({
    id: "shepherd-subscribe-to-calendar",
    text: "Subscribe to a calendar to get reminders",
    attachTo: {
      element: ".js-subscribe-to-calendar",
      on: "top",
    },
    classes: "shepherd-subscribe-to-calendar",
    buttons: [
      {
        text: "Done",
        action: () => {
          exitTour();
          window.scrollTo({
            top: 0,
            behavior: "smooth",
          });
        },
      },
    ],
  });

  setTimeout(() => {
    tour.start();
  }, 2000);

  return null;
});

OnboardingWalkthrough.displayName = "OnboardingWalkthrough";
export default OnboardingWalkthrough;
