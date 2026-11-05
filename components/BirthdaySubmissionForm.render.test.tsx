import BirthdaySubmissionForm from "./BirthdaySubmissionForm";
import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";

const mutateAsync = vi.fn();

vi.mock("../lib/trpc", () => ({
  trpc: {
    submission: {
      submit: { useMutation: () => ({ mutateAsync }) },
    },
  },
}));

vi.mock("react-hot-toast", () => ({
  default: { error: vi.fn(), success: vi.fn() },
  toast: { error: vi.fn(), success: vi.fn() },
}));

describe("BirthdaySubmissionForm rendering", () => {
  beforeEach(() => {
    mutateAsync.mockReset();
    mutateAsync.mockResolvedValue({ success: true });
  });

  it("starts with an empty, labeled birthday so no date is submitted by accident", () => {
    render(<BirthdaySubmissionForm token="test-token" />);

    expect(screen.getByRole("group", { name: "Birthday *" })).toBeTruthy();
    const dateInput = screen.getByLabelText<HTMLInputElement>("Date");
    expect(dateInput.type).toBe("date");
    expect(dateInput.value).toBe("");
  });

  it("does not submit until a birthday is chosen", () => {
    render(<BirthdaySubmissionForm token="test-token" />);

    fireEvent.change(screen.getByLabelText("Name *"), {
      target: { value: "Grandpa Joe" },
    });
    fireEvent.click(screen.getByRole("button", { name: /submit/i }));

    expect(mutateAsync).not.toHaveBeenCalled();
  });

  it("submits month and day with no year after choosing 'Don't know the year' from blank", async () => {
    render(<BirthdaySubmissionForm token="test-token" />);

    fireEvent.change(screen.getByLabelText("Name *"), {
      target: { value: "Grandpa Joe" },
    });
    fireEvent.click(screen.getByLabelText("Don't know the year"));
    fireEvent.change(screen.getByLabelText("Month"), {
      target: { value: "3" },
    });
    fireEvent.change(screen.getByLabelText("Day"), {
      target: { value: "12" },
    });
    fireEvent.click(screen.getByRole("button", { name: /submit/i }));

    await waitFor(() => expect(mutateAsync).toHaveBeenCalledTimes(1));
    expect(mutateAsync).toHaveBeenCalledWith(
      expect.objectContaining({
        name: "Grandpa Joe",
        year: null,
        month: 3,
        day: 12,
      }),
    );
  });

  it("stays blank when the year toggle is switched on and back off before choosing", () => {
    render(<BirthdaySubmissionForm token="test-token" />);

    const toggle = screen.getByLabelText("Don't know the year");
    fireEvent.click(toggle);
    expect(screen.getByLabelText<HTMLSelectElement>("Month").value).toBe("");
    fireEvent.click(toggle);

    expect(screen.getByLabelText<HTMLInputElement>("Date").value).toBe("");
  });
});
