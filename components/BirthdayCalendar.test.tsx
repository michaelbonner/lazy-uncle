import type { Birthday } from "../lib/trpc";
import BirthdayCalendar from "./BirthdayCalendar";
import { act, fireEvent, render, screen, within } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";

vi.mock("./EditBirthdayDialog", () => ({
  default: ({ birthday }: { birthday: Birthday }) => (
    <div>Editing {birthday.name}</div>
  ),
}));

const birthdayFixture = (overrides: Partial<Birthday>): Birthday => ({
  id: "birthday-id",
  name: "Test Birthday",
  date: "--02-29",
  year: null,
  month: 2,
  day: 29,
  category: null,
  parent: null,
  notes: null,
  remindersEnabled: true,
  importSource: "manual",
  userId: "test-user-id",
  createdAt: new Date("2024-01-01T00:00:00Z"),
  ...overrides,
});

afterEach(() => {
  vi.useRealTimers();
  vi.unstubAllGlobals();
});

describe("BirthdayCalendar", () => {
  it("shows filtered birthdays on their recurring date and opens the editor", () => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date(2028, 0, 15, 12));
    render(
      <BirthdayCalendar
        birthdays={[
          birthdayFixture({ id: "one", name: "Alex" }),
          birthdayFixture({ id: "two", name: "Sam", month: 3, day: 1 }),
        ]}
      />,
    );

    fireEvent.click(screen.getByRole("button", { name: "Next month" }));
    expect(
      screen.getByRole("heading", { name: "February 2028" }),
    ).toBeInTheDocument();
    fireEvent.click(
      screen.getByRole("button", { name: /February 29, 2028, 1 birthday/ }),
    );
    expect(screen.getByRole("button", { name: "Alex" })).toBeInTheDocument();
    expect(screen.queryByText("Sam")).not.toBeInTheDocument();
    fireEvent.click(screen.getByRole("button", { name: "Alex" }));
    expect(screen.getByText("Editing Alex")).toBeInTheDocument();
  });

  it("shows February 29 birthdays on March 1 in a non-leap year", () => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date(2027, 1, 1, 12));
    render(<BirthdayCalendar birthdays={[birthdayFixture({})]} />);

    expect(screen.getByText("0 birthdays this month")).toBeInTheDocument();
    expect(
      screen.queryByRole("button", { name: /February 29, 2027/ }),
    ).not.toBeInTheDocument();
    fireEvent.click(screen.getByRole("button", { name: "Next month" }));
    fireEvent.click(
      screen.getByRole("button", { name: /March 1, 2027, 1 birthday/ }),
    );
    expect(
      screen.getByRole("button", { name: "Test Birthday" }),
    ).toBeInTheDocument();
  });

  it("opens selected dates in a dismissible mobile sheet and can edit a birthday", async () => {
    vi.useFakeTimers({ toFake: ["Date"] });
    vi.setSystemTime(new Date(2028, 0, 15, 12));
    vi.stubGlobal("innerWidth", 390);
    render(
      <BirthdayCalendar
        birthdays={[birthdayFixture({ name: "Alex", month: 1, day: 20 })]}
      />,
    );

    await act(async () => {
      fireEvent.click(
        screen.getByRole("button", { name: /January 19, 2028, 0 birthdays/ }),
      );
    });
    expect(
      within(screen.getByRole("dialog")).getByText("No birthdays on this day."),
    ).toBeInTheDocument();
    await act(async () => {
      fireEvent.click(
        screen.getByRole("button", { name: "Close selected date" }),
      );
    });
    expect(screen.queryByRole("dialog")).not.toBeInTheDocument();

    await act(async () => {
      fireEvent.click(
        screen.getByRole("button", { name: /January 20, 2028, 1 birthday/ }),
      );
    });
    const sheet = await screen.findByRole("dialog", { name: "January 20" });
    await act(async () => {
      fireEvent.click(within(sheet).getByRole("button", { name: "Alex" }));
    });
    expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
    expect(screen.getByText("Editing Alex")).toBeInTheDocument();
  });
});
