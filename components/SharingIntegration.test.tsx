import BirthdayRow from "./BirthdayRow";
import type { Birthday } from "../lib/trpc";
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

  const birthdayFixture = (overrides: Partial<Birthday>): Birthday => ({
    id: "birthday-id",
    name: "Test Birthday",
    date: "1990-01-01",
    year: 1990,
    month: 1,
    day: 1,
    category: null,
    parent: null,
    notes: null,
    remindersEnabled: true,
    importSource: "manual",
    userId: "test-user-id",
    createdAt: new Date("2024-01-01T00:00:00Z"),
    ...overrides,
  });

  it("displays import source indicators for manual birthdays", () => {
    const manualBirthday = birthdayFixture({
      id: "birthday-1",
      name: "John Doe",
      date: "1990-01-15",
      year: 1990,
      month: 1,
      day: 15,
      category: "Friend",
      importSource: "manual",
    });

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
    const sharedBirthday = birthdayFixture({
      id: "birthday-2",
      name: "Jane Smith",
      date: "1985-06-20",
      year: 1985,
      month: 6,
      day: 20,
      category: "Family",
      importSource: "sharing",
    });

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
    const csvBirthday = birthdayFixture({
      id: "birthday-3",
      name: "Bob Wilson",
      date: "1992-03-10",
      year: 1992,
      month: 3,
      day: 10,
      category: "Work",
      importSource: "csv",
    });

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
    const legacyBirthday = birthdayFixture({
      id: "birthday-4",
      name: "Alice Johnson",
      date: "1988-12-25",
      year: 1988,
      month: 12,
      day: 25,
      importSource: null,
    });

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
    const birthdayWithNotes = birthdayFixture({
      id: "birthday-5",
      name: "Charlie Brown",
      date: "1995-07-04",
      year: 1995,
      month: 7,
      day: 4,
      category: "Friend",
      notes: "Met at college",
      importSource: "sharing",
    });

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
