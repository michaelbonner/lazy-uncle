import React from "react";
import { render, screen } from "@testing-library/react";
import { describe, it, expect, vi } from "vitest";
import BirthdayRow from "./BirthdayRow";

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

    expect(screen.getByText("John Doe")).toBeInTheDocument();
    // Should have user icon for manual entries
    expect(screen.getByTitle("Added manually")).toBeInTheDocument();
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

    expect(screen.getByText("Jane Smith")).toBeInTheDocument();
    // Should have share icon for shared entries
    expect(screen.getByTitle("Imported from sharing link")).toBeInTheDocument();
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

    expect(screen.getByText("Bob Wilson")).toBeInTheDocument();
    // Should have document icon for CSV entries
    expect(screen.getByTitle("Imported from CSV")).toBeInTheDocument();
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

    expect(screen.getByText("Alice Johnson")).toBeInTheDocument();
    // Should default to manual (user icon) for null import source
    expect(screen.getByTitle("Added manually")).toBeInTheDocument();
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

    expect(screen.getByText("Charlie Brown")).toBeInTheDocument();
    // Should show both notes indicator and import source
    expect(screen.getByTitle("Imported from sharing link")).toBeInTheDocument();
    // Notes should be indicated by paperclip icon
    expect(screen.getByRole("button")).toBeInTheDocument();
  });
});
