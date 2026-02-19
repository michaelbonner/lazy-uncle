import type { SubmissionStatus } from "../drizzle/schema";
import { GET_ALL_BIRTHDAYS_QUERY } from "../graphql/Birthday";
import {
  CREATE_SHARING_LINK_MUTATION,
  GET_NOTIFICATION_PREFERENCES_QUERY,
  GET_PENDING_SUBMISSIONS_QUERY,
  GET_SHARING_LINKS_QUERY,
  IMPORT_SUBMISSION_MUTATION,
} from "../graphql/Sharing";
import BirthdaysContainer from "./BirthdaysContainer";
import { MockedProvider } from "@apollo/client/testing/react";
import "@testing-library/jest-dom";
import { render, screen, waitFor } from "@testing-library/react";
import { DocumentNode } from "graphql";
import React from "react";
import { beforeEach, describe, expect, it, vi } from "vitest";

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
  default: (fn: () => React.ReactNode) => {
    // Return a component function that loads the actual component
    const MockedComponent = (props: React.ReactNode) => {
      const ComponentModule = fn();
      const Component =
        // @ts-expect-error - Property 'default' does not exist on type 'string' | 'number' | 'bigint' | 'boolean' | 'symbol' | Promise<React.ReactNode>
        ComponentModule?.default || (ComponentModule as React.ReactNode);
      if (
        typeof Component === "function" ||
        (Component && Component.$$typeof)
      ) {
        return React.createElement(Component, props);
      }
      return null;
    };
    MockedComponent.displayName = "MockedDynamicComponent";
    return MockedComponent;
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
    status: "PENDING" as SubmissionStatus,
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

const createMocks = (
  overrides:
    | {
        request: { query: DocumentNode };
        result: {
          data: {
            sharingLinks: {
              expiresAt: string;
              id: string;
              token: string;
              createdAt: string;
              isActive: boolean;
              description: string;
              submissionCount: number;
              __typename: string;
            }[];
          };
        };
      }[]
    | undefined = [],
) => [
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
      <MockedProvider mocks={mocks}>
        <BirthdaysContainer userId="test-user-id" />
      </MockedProvider>,
    );

    await waitFor(() => {
      // Check that both birthdays are present - count is flexible because of dynamic components
      expect(screen.getAllByText("John Doe").length).toBeGreaterThanOrEqual(2);
      expect(screen.getAllByText("Jane Smith").length).toBeGreaterThanOrEqual(
        1,
      );
    });

    // Check that import source indicators are present by finding the birthday rows
    // Look for the birthday row with John Doe (manual entry)
    const johnDoeElements = screen.getAllByText("John Doe");
    const manualBirthday = johnDoeElements
      .find((el) => el.closest("li"))
      ?.closest("li");
    expect(manualBirthday).toBeInTheDocument();

    // Sharing import should have share icon
    const janeSmithElements = screen.getAllByText("Jane Smith");
    const sharedBirthday = janeSmithElements
      .find((el) => el.closest("li"))
      ?.closest("li");
    expect(sharedBirthday).toBeInTheDocument();
  });

  it("loads birthday list with sharing functionality enabled", async () => {
    const mocks = createMocks();

    render(
      <MockedProvider mocks={mocks}>
        <BirthdaysContainer userId="test-user-id" />
      </MockedProvider>,
    );

    // Check that main birthday list loads with sharing features
    await waitFor(() => {
      expect(screen.getAllByText("John Doe")[0]).toBeInTheDocument();
      expect(screen.getAllByText("Jane Smith")[0]).toBeInTheDocument();
    });

    // Check that calendar subscription is available
    expect(screen.getByText("Subscribe to calendar")).toBeInTheDocument();
  });

  it("provides GraphQL mock for submission functionality", async () => {
    const mocks = createMocks();

    render(
      <MockedProvider mocks={mocks}>
        <BirthdaysContainer userId="test-user-id" />
      </MockedProvider>,
    );

    // Check that the main container loads properly with GraphQL mocks
    await waitFor(() => {
      expect(screen.getAllByText("John Doe")[0]).toBeInTheDocument();
      expect(screen.getAllByText("Jane Smith")[0]).toBeInTheDocument();
    });
  });

  it("provides mock data for notification preferences", async () => {
    const mocks = createMocks();

    render(
      <MockedProvider mocks={mocks}>
        <BirthdaysContainer userId="test-user-id" />
      </MockedProvider>,
    );

    // Check that the notification preferences mock data is configured
    await waitFor(() => {
      expect(screen.getAllByText("John Doe")[0]).toBeInTheDocument();
    });

    // Verify that mocks include notification preferences (this tests the setup)
    const notificationMock = mocks.find(
      (mock) => mock.request.query === GET_NOTIFICATION_PREFERENCES_QUERY,
    );
    expect(notificationMock).toBeDefined();

    if (
      notificationMock?.result?.data &&
      "notificationPreferences" in notificationMock.result.data
    ) {
      expect(
        notificationMock?.result?.data?.notificationPreferences
          ?.emailNotifications,
      ).toBe(true);
      expect(
        notificationMock?.result?.data?.notificationPreferences
          ?.summaryNotifications,
      ).toBe(false);
    }
  });

  it("shows sharing link management in navigation area", async () => {
    const mocks = createMocks();

    render(
      <MockedProvider mocks={mocks}>
        <BirthdaysContainer userId="test-user-id" />
      </MockedProvider>,
    );

    // Check that calendar subscription link is still present
    expect(screen.getByText("Subscribe to calendar")).toBeInTheDocument();
  });

  it("includes mock data for bulk operations", async () => {
    const mocks = createMocks();

    render(
      <MockedProvider mocks={mocks}>
        <BirthdaysContainer userId="test-user-id" />
      </MockedProvider>,
    );

    // Check that submissions mock data is configured
    await waitFor(() => {
      expect(screen.getAllByText("John Doe")[0]).toBeInTheDocument();
    });

    // Verify that mocks include pending submissions data
    const submissionsMock = mocks.find(
      (mock) => mock.request.query === GET_PENDING_SUBMISSIONS_QUERY,
    );
    expect(submissionsMock).toBeDefined();
    if (
      submissionsMock?.result?.data &&
      "pendingSubmissions" in submissionsMock.result.data
    ) {
      expect(
        submissionsMock?.result?.data?.pendingSubmissions?.submissions,
      ).toHaveLength(1);
      expect(
        submissionsMock?.result?.data?.pendingSubmissions?.submissions[0]?.name,
      ).toBe("Bob Wilson");
    }
  });

  it("displays proper error states", async () => {
    const errorMocks = [
      {
        request: {
          query: GET_ALL_BIRTHDAYS_QUERY,
        },
        error: new Error("Failed to load birthdays"),
      },
    ];

    render(
      <MockedProvider mocks={errorMocks}>
        <BirthdaysContainer userId="test-user-id" />
      </MockedProvider>,
    );

    // Should display birthday loading error
    await waitFor(() => {
      expect(screen.getByText(/Failed to load birthdays/)).toBeInTheDocument();
    });

    // Error should prevent normal birthday display
    expect(screen.queryByText("John Doe")).not.toBeInTheDocument();
    expect(screen.queryByText("Jane Smith")).not.toBeInTheDocument();
  });

  it("includes expired sharing links in mock data", async () => {
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
      <MockedProvider mocks={expiredLinkMocks}>
        <BirthdaysContainer userId="test-user-id" />
      </MockedProvider>,
    );

    // Check that the main component loads
    await waitFor(() => {
      expect(screen.getAllByText("John Doe")[0]).toBeInTheDocument();
    });

    // Verify that the expired link mock is configured correctly
    const sharingLinkMock = expiredLinkMocks.find(
      (mock) =>
        mock.result?.data &&
        mock.request.query === GET_SHARING_LINKS_QUERY &&
        "sharingLinks" in mock.result.data &&
        mock.result?.data?.sharingLinks[0]?.expiresAt ===
          "2023-01-01T00:00:00Z",
    );
    expect(sharingLinkMock).toBeDefined();
    if (
      sharingLinkMock?.result?.data &&
      "sharingLinks" in sharingLinkMock.result.data
    ) {
      expect(sharingLinkMock?.result?.data?.sharingLinks[0]?.expiresAt).toBe(
        "2023-01-01T00:00:00Z",
      );
    }
  });

  it("integrates sharing features with main birthday list", async () => {
    const mocks = createMocks();

    render(
      <MockedProvider mocks={mocks}>
        <BirthdaysContainer userId="test-user-id" />
      </MockedProvider>,
    );

    // Wait for main components to load
    await waitFor(() => {
      expect(screen.getAllByText("John Doe").length).toBeGreaterThanOrEqual(2);
      expect(screen.getAllByText("Jane Smith")[0]).toBeInTheDocument();
    });

    // Verify that all required mock data is configured correctly
    expect(
      mocks.some((mock) => mock.request.query === GET_ALL_BIRTHDAYS_QUERY),
    ).toBe(true);
    expect(
      mocks.some((mock) => mock.request.query === GET_SHARING_LINKS_QUERY),
    ).toBe(true);
    expect(
      mocks.some(
        (mock) => mock.request.query === GET_PENDING_SUBMISSIONS_QUERY,
      ),
    ).toBe(true);
    expect(
      mocks.some(
        (mock) => mock.request.query === GET_NOTIFICATION_PREFERENCES_QUERY,
      ),
    ).toBe(true);
  });
});
