import BirthdaysContainer from "./BirthdaysContainer";
import "@testing-library/jest-dom";
import { render, screen, waitFor } from "@testing-library/react";
import React from "react";
import { beforeEach, describe, expect, it, vi } from "vitest";

// superjson deserializes date fields back into `Date` objects on the client,
// so fixtures use `Date` instances (and month/day/year components) rather than
// the ISO strings the old Apollo mocks used.

// Mock fixtures returned by the fake trpc hooks.
const mockBirthdays = [
  {
    id: "birthday-1",
    name: "John Doe",
    year: 1990,
    month: 1,
    day: 15,
    date: "1990-01-15",
    category: "Friend",
    parent: null,
    notes: null,
    remindersEnabled: true,
    importSource: "manual",
    userId: "test-user-id",
    createdAt: new Date("2024-01-01T00:00:00Z"),
  },
  {
    id: "birthday-2",
    name: "Jane Smith",
    year: 1985,
    month: 6,
    day: 20,
    date: "1985-06-20",
    category: "Family",
    parent: null,
    notes: null,
    remindersEnabled: true,
    importSource: "sharing",
    userId: "test-user-id",
    createdAt: new Date("2024-01-01T00:00:00Z"),
  },
];

const mockSharingLinks = [
  {
    id: "link-1",
    token: "test-token-123",
    createdAt: new Date("2024-01-01T00:00:00Z"),
    expiresAt: new Date("2099-12-31T23:59:59Z"),
    isActive: true,
    description: "Family gathering",
    category: null,
    submissionCount: 2,
  },
];

const mockPendingSubmissions = {
  submissions: [
    {
      id: "submission-1",
      name: "Bob Wilson",
      year: 1992,
      month: 3,
      day: 10,
      date: "1992-03-10",
      category: "Friend",
      notes: "Met at college",
      submitterName: "Alice Johnson",
      submitterEmail: "alice@example.com",
      relationship: "Friend",
      status: "PENDING",
      createdAt: new Date("2024-01-15T10:00:00Z"),
      sharingLink: {
        id: "link-1",
        description: "Family gathering",
      },
    },
  ],
  totalCount: 1,
  hasNextPage: false,
  hasPreviousPage: false,
  currentPage: 1,
  totalPages: 1,
};

const mockNotificationPreferences = {
  id: "pref-1",
  userId: "test-user-id",
  emailNotifications: true,
  summaryNotifications: false,
  birthdayReminders: false,
};

// Controllable query results. Tests mutate these (e.g. to simulate an error)
// before rendering, and `resetQueryState` restores defaults in beforeEach.
type QueryState = { data: unknown; isPending: boolean; error: Error | null };

const queryState: Record<string, QueryState> = {
  birthdayList: { data: undefined, isPending: false, error: null },
  sharingList: { data: undefined, isPending: false, error: null },
  submissionPending: { data: undefined, isPending: false, error: null },
  notificationPreferences: { data: undefined, isPending: false, error: null },
};

function resetQueryState() {
  queryState.birthdayList = {
    data: mockBirthdays,
    isPending: false,
    error: null,
  };
  queryState.sharingList = {
    data: mockSharingLinks,
    isPending: false,
    error: null,
  };
  queryState.submissionPending = {
    data: mockPendingSubmissions,
    isPending: false,
    error: null,
  };
  queryState.notificationPreferences = {
    data: mockNotificationPreferences,
    isPending: false,
    error: null,
  };
}

const refetch = vi.fn();

// A reusable fake mutation object matching the tRPC react-query shape.
const makeMutation = () => ({
  mutate: vi.fn(),
  mutateAsync: vi.fn().mockResolvedValue(undefined),
  isPending: false,
  error: null,
});

// invalidate mocks exposed via trpc.useUtils()
const invalidateMocks = {
  birthdayList: vi.fn(),
  sharingList: vi.fn(),
  submissionPending: vi.fn(),
  notificationPreferences: vi.fn(),
};

// Mock the tRPC client used throughout the rendered component tree
// (BirthdaysContainer + its dynamically-imported children).
vi.mock("../lib/trpc", () => {
  const utils = {
    birthday: { list: { invalidate: (...a: unknown[]) => invalidateMocks.birthdayList(...a) } },
    sharing: { list: { invalidate: (...a: unknown[]) => invalidateMocks.sharingList(...a) } },
    submission: {
      pending: { invalidate: (...a: unknown[]) => invalidateMocks.submissionPending(...a) },
    },
    notification: {
      preferences: {
        invalidate: (...a: unknown[]) => invalidateMocks.notificationPreferences(...a),
      },
    },
  };
  return {
    trpc: {
      useUtils: () => utils,
      birthday: {
        list: {
          useQuery: () => ({
            data: queryState.birthdayList.data,
            isPending: queryState.birthdayList.isPending,
            error: queryState.birthdayList.error,
            refetch,
          }),
        },
        create: { useMutation: () => makeMutation() },
      },
      sharing: {
        list: {
          useQuery: () => ({
            data: queryState.sharingList.data,
            isPending: queryState.sharingList.isPending,
            error: queryState.sharingList.error,
            refetch,
          }),
        },
        create: { useMutation: () => makeMutation() },
        revoke: { useMutation: () => makeMutation() },
      },
      submission: {
        pending: {
          useQuery: () => ({
            data: queryState.submissionPending.data,
            isPending: queryState.submissionPending.isPending,
            error: queryState.submissionPending.error,
            refetch,
          }),
        },
        import: { useMutation: () => makeMutation() },
        reject: { useMutation: () => makeMutation() },
      },
      notification: {
        preferences: {
          useQuery: () => ({
            data: queryState.notificationPreferences.data,
            isPending: queryState.notificationPreferences.isPending,
            error: queryState.notificationPreferences.error,
            refetch,
          }),
        },
        update: { useMutation: () => makeMutation() },
      },
    },
  };
});

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

// Mock dynamic imports so the real child components render.
// next/dynamic is given a loader that returns a Promise (the import), so the
// mock resolves it in an effect and renders the resolved component once ready.
vi.mock("next/dynamic", () => ({
  default: (fn: () => Promise<{ default: React.ComponentType }>) => {
    const MockedComponent = (props: Record<string, unknown>) => {
      const [Loaded, setLoaded] =
        React.useState<React.ComponentType | null>(null);
      React.useEffect(() => {
        let active = true;
        Promise.resolve(fn()).then((mod) => {
          const Component =
            // @ts-expect-error - dynamic import shape varies
            mod?.default || mod;
          if (active && typeof Component === "function") {
            setLoaded(() => Component);
          }
        });
        return () => {
          active = false;
        };
      }, []);
      if (!Loaded) return null;
      return React.createElement(Loaded, props);
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

describe("Sharing Workflow Integration Tests", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    resetQueryState();
  });

  it("displays import source indicators for birthdays", async () => {
    render(<BirthdaysContainer userId="test-user-id" />);

    await waitFor(() => {
      // Names render in both mobile and desktop birthday rows.
      expect(screen.getAllByText("John Doe").length).toBeGreaterThanOrEqual(1);
      expect(screen.getAllByText("Jane Smith").length).toBeGreaterThanOrEqual(
        1,
      );
    });

    // Birthdays render inside <li> rows (manual + sharing imports alike).
    const johnDoeElements = screen.getAllByText("John Doe");
    const manualBirthday = johnDoeElements
      .find((el) => el.closest("li"))
      ?.closest("li");
    expect(manualBirthday).toBeInTheDocument();

    const janeSmithElements = screen.getAllByText("Jane Smith");
    const sharedBirthday = janeSmithElements
      .find((el) => el.closest("li"))
      ?.closest("li");
    expect(sharedBirthday).toBeInTheDocument();
  });

  it("loads birthday list with sharing functionality enabled", async () => {
    render(<BirthdaysContainer userId="test-user-id" />);

    await waitFor(() => {
      expect(screen.getAllByText("John Doe")[0]).toBeInTheDocument();
      expect(screen.getAllByText("Jane Smith")[0]).toBeInTheDocument();
    });

    // Calendar subscription remains available.
    expect(screen.getByText("Subscribe to calendar")).toBeInTheDocument();
  });

  it("renders the birthday list backed by the tRPC query", async () => {
    render(<BirthdaysContainer userId="test-user-id" />);

    await waitFor(() => {
      expect(screen.getAllByText("John Doe")[0]).toBeInTheDocument();
      expect(screen.getAllByText("Jane Smith")[0]).toBeInTheDocument();
    });
  });

  it("renders the sharing links section from sharing.list", async () => {
    render(<BirthdaysContainer userId="test-user-id" />);

    // SharingLinkManager is dynamically imported, so wait for it to render
    // its section heading and the link's label.
    expect(
      await screen.findByText("Birthday sharing links"),
    ).toBeInTheDocument();
    // "Family gathering" appears both as the link's label and as the source
    // description on the pending submission, so assert at least one is present.
    expect(screen.getAllByText("Family gathering").length).toBeGreaterThanOrEqual(
      1,
    );
  });

  it("renders the submission review section with pending submissions", async () => {
    render(<BirthdaysContainer userId="test-user-id" />);

    // The pending submission "Bob Wilson" should surface in the review UI.
    expect(
      await screen.findByText("Birthday submissions"),
    ).toBeInTheDocument();
    expect(screen.getByText("Bob Wilson")).toBeInTheDocument();
  });

  it("renders the notification settings panel", async () => {
    render(<BirthdaysContainer userId="test-user-id" />);

    // SharingSettingsPanel renders the notification preferences form.
    expect(
      await screen.findByText("Notification preferences"),
    ).toBeInTheDocument();
  });

  it("shows sharing link management in navigation area", async () => {
    render(<BirthdaysContainer userId="test-user-id" />);

    expect(screen.getByText("Subscribe to calendar")).toBeInTheDocument();
  });

  it("displays proper error states", async () => {
    queryState.birthdayList = {
      data: undefined,
      isPending: false,
      error: new Error("Failed to load birthdays"),
    };

    render(<BirthdaysContainer userId="test-user-id" />);

    // Should display birthday loading error.
    await waitFor(() => {
      expect(screen.getByText(/Failed to load birthdays/)).toBeInTheDocument();
    });

    // Error should prevent normal birthday display.
    expect(screen.queryByText("John Doe")).not.toBeInTheDocument();
    expect(screen.queryByText("Jane Smith")).not.toBeInTheDocument();
  });

  it("renders expired sharing links with an expired indicator", async () => {
    queryState.sharingList = {
      data: [
        {
          ...mockSharingLinks[0],
          expiresAt: new Date("2023-01-01T00:00:00Z"), // Expired date
        },
      ],
      isPending: false,
      error: null,
    };

    render(<BirthdaysContainer userId="test-user-id" />);

    // SharingLinkManager marks expired links as no longer active.
    expect(
      await screen.findByText("link no longer active"),
    ).toBeInTheDocument();
  });

  it("integrates sharing features with main birthday list", async () => {
    render(<BirthdaysContainer userId="test-user-id" />);

    await waitFor(() => {
      expect(screen.getAllByText("John Doe")[0]).toBeInTheDocument();
      expect(screen.getAllByText("Jane Smith")[0]).toBeInTheDocument();
    });

    // All of the major tRPC-backed sections coexist on the page.
    expect(
      await screen.findByText("Birthday sharing links"),
    ).toBeInTheDocument();
    expect(screen.getByText("Birthday submissions")).toBeInTheDocument();
    expect(screen.getByText("Notification preferences")).toBeInTheDocument();
    expect(screen.getByText("Subscribe to calendar")).toBeInTheDocument();
  });
});
