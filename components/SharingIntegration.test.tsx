import BirthdayRow from "./BirthdayRow";
import { render, screen } from "@testing-library/react";
import React from "react";
import { describe, expect, it, vi } from "vitest";

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
    const Component = fn();
    return Component;
  },
}));

describe("Sharing Integration Tests", () => {
  const mockSetters = {
    setCategoryFilter: vi.fn(),
    setParentFilter: vi.fn(),
    setZodiacSignFilter: vi.fn(),
  };

  it("displays import source indicators for manual birthdays", () => {
    const manualBirthday = {
      id: "birthday-1",
      name: "John Doe",
      date: "1990-01-15",
      category: "Friend",
      parent: null,
      notes: null,
      importSource: "manual",
    };

    render(
      <BirthdayRow
        birthday={manualBirthday}
        categoryFilter=""
        parentFilter=""
        zodiacSignFilter=""
        {...mockSetters}
      />,
    );

    expect(screen.getAllByText("John Doe")).toHaveLength(2); // Desktop and mobile versions
    // Manual entries don't show any import source icon
    expect(screen.queryByTitle("Added manually")).not.toBeInTheDocument();
  });

  it("displays import source indicators for sharing birthdays", () => {
    const sharedBirthday = {
      id: "birthday-2",
      name: "Jane Smith",
      date: "1985-06-20",
      category: "Family",
      parent: null,
      notes: null,
      importSource: "sharing",
    };

    render(
      <BirthdayRow
        birthday={sharedBirthday}
        categoryFilter=""
        parentFilter=""
        zodiacSignFilter=""
        {...mockSetters}
      />,
    );

    expect(screen.getAllByText("Jane Smith")).toHaveLength(2); // Desktop and mobile versions
    // Should have share icon for shared entries (both desktop and mobile)
    expect(screen.getAllByTitle("Imported from sharing link")).toHaveLength(2);
  });

  it("displays import source indicators for CSV birthdays", () => {
    const csvBirthday = {
      id: "birthday-3",
      name: "Bob Wilson",
      date: "1992-03-10",
      category: "Work",
      parent: null,
      notes: null,
      importSource: "csv",
    };

    render(
      <BirthdayRow
        birthday={csvBirthday}
        categoryFilter=""
        parentFilter=""
        zodiacSignFilter=""
        {...mockSetters}
      />,
    );

    expect(screen.getAllByText("Bob Wilson")).toHaveLength(2); // Desktop and mobile versions
    // Should have document icon for CSV entries (both desktop and mobile)
    expect(screen.getAllByTitle("Imported from CSV")).toHaveLength(2);
  });

  it("handles birthdays without import source", () => {
    const legacyBirthday = {
      id: "birthday-4",
      name: "Alice Johnson",
      date: "1988-12-25",
      category: null,
      parent: null,
      notes: null,
      importSource: null,
    };

    render(
      <BirthdayRow
        birthday={legacyBirthday}
        categoryFilter=""
        parentFilter=""
        zodiacSignFilter=""
        {...mockSetters}
      />,
    );

    expect(screen.getAllByText("Alice Johnson")).toHaveLength(2); // Desktop and mobile versions
    // Null import source doesn't show any import source icon
    expect(screen.queryByTitle("Added manually")).not.toBeInTheDocument();
  });

  it("displays birthday with notes and import source", () => {
    const birthdayWithNotes = {
      id: "birthday-5",
      name: "Charlie Brown",
      date: "1995-07-04",
      category: "Friend",
      parent: null,
      notes: "Met at college",
      importSource: "sharing",
    };

    render(
      <BirthdayRow
        birthday={birthdayWithNotes}
        categoryFilter=""
        parentFilter=""
        zodiacSignFilter=""
        {...mockSetters}
      />,
    );

    expect(screen.getAllByText("Charlie Brown")).toHaveLength(2); // Desktop and mobile versions
    // Should show both notes indicator and import source
    expect(screen.getAllByTitle("Imported from sharing link")).toHaveLength(2);
    // Notes should be indicated by paperclip icon - check that it exists
    expect(screen.getAllByRole("button")).toHaveLength(5); // Desktop and mobile versions with all buttons
  });
});
