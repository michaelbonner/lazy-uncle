import { memo } from "react";
import Shepherd from "shepherd.js";
import "shepherd.js/dist/css/shepherd.css";

const tour = new Shepherd.Tour({
  useModalOverlay: true,
  defaultStepOptions: {
    classes: "shadow-md bg-purple-dark",
    scrollTo: true,
  },
});

const OnboardingWalkthrough = memo(() => {
  if (tour.isActive()) return null;

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
            tour.complete()
            window.scrollTo({
                top: 0,
                behavior: 'smooth'
            })
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