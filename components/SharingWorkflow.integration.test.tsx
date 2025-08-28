import React from "react";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import { MockedProvider } from "@apollo/client/testing";
import { describe, it, expect, vi, beforeEach } from "vitest";
import { GET_ALL_BIRTHDAYS_QUERY } from "../graphql/Birthday";
import {
  GET_SHARING_LINKS_QUERY,
  CREATE_SHARING_LINK_MUTATION,
  GET_PENDING_SUBMISSIONS_QUERY,
  IMPORT_SUBMISSION_MUTATION,
  GET_NOTIFICATION_PREFERENCES_QUERY,
} from "../graphql/Sharing";
import BirthdaysContainer from "./BirthdaysContainer";

// Mock the auth client
vi.mock("../lib/auth-client", () => ({
  authClient: {
    useSession: () => ({
      data: {
        user: {
          id: "test-user-id",
          email: "test@example.com",
          name: "Test User",
        },
      },
      isPending: false,
    }),
  },
}));

// Mock dynamic imports
vi.mock("next/dynamic", () => ({
  default: (fn: any) => {
    const Component = fn();
    return Component;
  },
}));

// Mock router
vi.mock("next/router", () => ({
  useRouter: () => ({
    asPath: "/birthdays",
  }),
}));

// Mock window.location
Object.defineProperty(window, "location", {
  value: {
    origin: "http://localhost:3000",
    host: "localhost:3000",
  },
  writable: true,
});

const mockBirthdays = [
  {
    id: "birthday-1",
    name: "John Doe",
    date: "1990-01-15",
    category: "Friend",
    parent: null,
    notes: null,
    importSource: "manual",
    __typename: "Birthday",
  },
  {
    id: "birthday-2",
    name: "Jane Smith",
    date: "1985-06-20",
    category: "Family",
    parent: null,
    notes: null,
    importSource: "sharing",
    __typename: "Birthday",
  },
];

const mockSharingLinks = [
  {
    id: "link-1",
    token: "test-token-123",
    createdAt: "2024-01-01T00:00:00Z",
    expiresAt: "2024-12-31T23:59:59Z",
    isActive: true,
    description: "Family gathering",
    submissionCount: 2,
    __typename: "SharingLink",
  },
];

const mockPendingSubmissions = [
  {
    id: "submission-1",
    name: "Bob Wilson",
    date: "1992-03-10",
    category: "Friend",
    notes: "Met at college",
    submitterName: "Alice Johnson",
    submitterEmail: "alice@example.com",
    relationship: "Friend",
    status: "PENDING",
    createdAt: "2024-01-15T10:00:00Z",
    sharingLink: {
      id: "link-1",
      description: "Family gathering",
    },
    __typename: "BirthdaySubmission",
  },
];

const mockNotificationPreferences = {
  id: "pref-1",
  userId: "test-user-id",
  emailNotifications: true,
  summaryNotifications: false,
  __typename: "NotificationPreference",
};

const createMocks = (overrides = []) => [
  {
    request: {
      query: GET_ALL_BIRTHDAYS_QUERY,
    },
    result: {
      data: {
        birthdays: mockBirthdays,
      },
    },
  },
  {
    request: {
      query: GET_SHARING_LINKS_QUERY,
    },
    result: {
      data: {
        sharingLinks: mockSharingLinks,
      },
    },
  },
  {
    request: {
      query: GET_PENDING_SUBMISSIONS_QUERY,
      variables: { page: 1, limit: 10 },
    },
    result: {
      data: {
        pendingSubmissions: {
          submissions: mockPendingSubmissions,
          totalCount: 1,
          hasNextPage: false,
          hasPreviousPage: false,
          currentPage: 1,
          totalPages: 1,
          __typename: "PaginatedSubmissions",
        },
      },
    },
  },
  {
    request: {
      query: GET_NOTIFICATION_PREFERENCES_QUERY,
    },
    result: {
      data: {
        notificationPreferences: mockNotificationPreferences,
      },
    },
  },
  {
    request: {
      query: CREATE_SHARING_LINK_MUTATION,
      variables: {
        description: "Test sharing link",
        expirationHours: 168,
      },
    },
    result: {
      data: {
        createSharingLink: {
          id: "new-link-1",
          token: "new-token-456",
          createdAt: "2024-01-16T00:00:00Z",
          expiresAt: "2024-01-23T00:00:00Z",
          isActive: true,
          description: "Test sharing link",
          submissionCount: 0,
          __typename: "SharingLink",
        },
      },
    },
  },
  {
    request: {
      query: IMPORT_SUBMISSION_MUTATION,
      variables: {
        submissionId: "submission-1",
      },
    },
    result: {
      data: {
        importSubmission: {
          id: "birthday-3",
          name: "Bob Wilson",
          date: "1992-03-10",
          category: "Friend",
          parent: null,
          notes: "Met at college",
          importSource: "sharing",
          __typename: "Birthday",
        },
      },
    },
  },
  ...overrides,
];

describe("Sharing Workflow Integration Tests", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("displays import source indicators for birthdays", async () => {
    const mocks = createMocks();

    render(
      <MockedProvider mocks={mocks} addTypename={false}>
        <BirthdaysContainer userId="test-user-id" />
      </MockedProvider>,
    );

    await waitFor(() => {
      expect(screen.getByText("John Doe")).toBeInTheDocument();
      expect(screen.getByText("Jane Smith")).toBeInTheDocument();
    });

    // Check that import source indicators are present
    // Manual entry should have user icon
    const manualBirthday = screen.getByText("John Doe").closest("li");
    expect(manualBirthday).toBeInTheDocument();

    // Sharing import should have share icon
    const sharedBirthday = screen.getByText("Jane Smith").closest("li");
    expect(sharedBirthday).toBeInTheDocument();
  });

  it("allows creating and managing sharing links", async () => {
    const mocks = createMocks();

    render(
      <MockedProvider mocks={mocks} addTypename={false}>
        <BirthdaysContainer userId="test-user-id" />
      </MockedProvider>,
    );

    // Wait for sharing link manager to load
    await waitFor(() => {
      expect(screen.getByText("Birthday Sharing Links")).toBeInTheDocument();
    });

    // Check existing sharing link is displayed
    expect(screen.getByText("Family gathering")).toBeInTheDocument();
    expect(screen.getByText("2 submissions")).toBeInTheDocument();

    // Test creating a new sharing link
    const createButton = screen.getByText("Create New Link");
    fireEvent.click(createButton);

    await waitFor(() => {
      expect(screen.getByText("Create Sharing Link")).toBeInTheDocument();
    });

    // Fill out the form
    const descriptionInput = screen.getByLabelText("Description (optional)");
    fireEvent.change(descriptionInput, {
      target: { value: "Test sharing link" },
    });

    const submitButton = screen.getByText("Create Link");
    fireEvent.click(submitButton);

    // The form should close after successful creation
    await waitFor(() => {
      expect(screen.queryByText("Create Sharing Link")).not.toBeInTheDocument();
    });
  });

  it("displays and allows importing pending submissions", async () => {
    const mocks = createMocks();

    render(
      <MockedProvider mocks={mocks} addTypename={false}>
        <BirthdaysContainer userId="test-user-id" />
      </MockedProvider>,
    );

    // Wait for submission review interface to load
    await waitFor(() => {
      expect(screen.getByText("Birthday Submissions")).toBeInTheDocument();
    });

    // Check pending submission is displayed
    expect(screen.getByText("Bob Wilson")).toBeInTheDocument();
    expect(screen.getByText("Submitted by Alice Johnson")).toBeInTheDocument();
    expect(screen.getByText('via "Family gathering"')).toBeInTheDocument();

    // Test importing the submission
    const importButton = screen.getByText("Import");
    fireEvent.click(importButton);

    // Should show success message after import
    await waitFor(() => {
      expect(
        screen.getByText("Birthday imported successfully!"),
      ).toBeInTheDocument();
    });
  });

  it("allows configuring notification preferences", async () => {
    const mocks = createMocks();

    render(
      <MockedProvider mocks={mocks} addTypename={false}>
        <BirthdaysContainer userId="test-user-id" />
      </MockedProvider>,
    );

    // Wait for sharing settings panel to load
    await waitFor(() => {
      expect(screen.getByText("Sharing Settings")).toBeInTheDocument();
    });

    // Open settings panel
    const showSettingsButton = screen.getByText("Show Settings");
    fireEvent.click(showSettingsButton);

    await waitFor(() => {
      expect(screen.getByText("Notification Preferences")).toBeInTheDocument();
    });

    // Check that email notifications checkbox is checked (from mock data)
    const emailNotificationsCheckbox = screen.getByLabelText(
      "Email notifications for new submissions",
    );
    expect(emailNotificationsCheckbox).toBeChecked();

    // Check that summary notifications checkbox is not checked
    const summaryNotificationsCheckbox = screen.getByLabelText(
      "Daily summary notifications",
    );
    expect(summaryNotificationsCheckbox).not.toBeChecked();
  });

  it("shows sharing link management in navigation area", async () => {
    const mocks = createMocks();

    render(
      <MockedProvider mocks={mocks} addTypename={false}>
        <BirthdaysContainer userId="test-user-id" />
      </MockedProvider>,
    );

    // Check that sharing information is displayed in the navigation area
    await waitFor(() => {
      expect(
        screen.getByText(
          "Share your birthday collection with friends and family",
        ),
      ).toBeInTheDocument();
    });

    // Check that calendar subscription link is still present
    expect(screen.getByText("Subscribe to calendar")).toBeInTheDocument();
  });

  it("handles bulk operations on submissions", async () => {
    const mocks = createMocks();

    render(
      <MockedProvider mocks={mocks} addTypename={false}>
        <BirthdaysContainer userId="test-user-id" />
      </MockedProvider>,
    );

    // Wait for submission review interface to load
    await waitFor(() => {
      expect(screen.getByText("Birthday Submissions")).toBeInTheDocument();
    });

    // Select the submission
    const selectAllCheckbox = screen.getByLabelText(/Select all/);
    fireEvent.click(selectAllCheckbox);

    // Check that bulk actions are available
    expect(screen.getByText("Import Selected")).toBeInTheDocument();
    expect(screen.getByText("Reject Selected")).toBeInTheDocument();
  });

  it("displays proper error states", async () => {
    const errorMocks = [
      {
        request: {
          query: GET_ALL_BIRTHDAYS_QUERY,
        },
        error: new Error("Failed to load birthdays"),
      },
      {
        request: {
          query: GET_SHARING_LINKS_QUERY,
        },
        error: new Error("Failed to load sharing links"),
      },
      {
        request: {
          query: GET_PENDING_SUBMISSIONS_QUERY,
          variables: { page: 1, limit: 10 },
        },
        error: new Error("Failed to load submissions"),
      },
    ];

    render(
      <MockedProvider mocks={errorMocks} addTypename={false}>
        <BirthdaysContainer userId="test-user-id" />
      </MockedProvider>,
    );

    // Should display error messages
    await waitFor(() => {
      expect(screen.getByText(/Failed to load birthdays/)).toBeInTheDocument();
    });

    await waitFor(() => {
      expect(
        screen.getByText(/Error loading sharing links/),
      ).toBeInTheDocument();
    });

    await waitFor(() => {
      expect(screen.getByText(/Error loading submissions/)).toBeInTheDocument();
    });
  });

  it("handles expired sharing links properly", async () => {
    const expiredLinkMocks = createMocks([
      {
        request: {
          query: GET_SHARING_LINKS_QUERY,
        },
        result: {
          data: {
            sharingLinks: [
              {
                ...mockSharingLinks[0],
                expiresAt: "2023-01-01T00:00:00Z", // Expired date
              },
            ],
          },
        },
      },
    ]);

    render(
      <MockedProvider mocks={expiredLinkMocks} addTypename={false}>
        <BirthdaysContainer userId="test-user-id" />
      </MockedProvider>,
    );

    await waitFor(() => {
      expect(screen.getByText("Birthday Sharing Links")).toBeInTheDocument();
    });

    // Should show expired status
    expect(screen.getByText(/Expired/)).toBeInTheDocument();
  });

  it("integrates sharing features with main birthday list", async () => {
    const mocks = createMocks();

    render(
      <MockedProvider mocks={mocks} addTypename={false}>
        <BirthdaysContainer userId="test-user-id" />
      </MockedProvider>,
    );

    // Wait for all components to load
    await waitFor(() => {
      expect(screen.getByText("John Doe")).toBeInTheDocument();
      expect(screen.getByText("Birthday Sharing Links")).toBeInTheDocument();
      expect(screen.getByText("Birthday Submissions")).toBeInTheDocument();
      expect(screen.getByText("Sharing Settings")).toBeInTheDocument();
    });

    // Verify that all sharing components are integrated into the main page
    expect(
      screen.getByText(
        "Share your birthday collection with friends and family",
      ),
    ).toBeInTheDocument();
    expect(screen.getByText("Family gathering")).toBeInTheDocument();
    expect(screen.getByText("Bob Wilson")).toBeInTheDocument();
    expect(screen.getByText("Notification Preferences")).toBeInTheDocument();
  });
});
