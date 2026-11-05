import BirthdaySubmissionForm from "./BirthdaySubmissionForm";
import { render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

vi.mock("../lib/trpc", () => ({
  trpc: {
    submission: {
      submit: { useMutation: () => ({ mutateAsync: vi.fn() }) },
    },
  },
}));

describe("BirthdaySubmissionForm rendering", () => {
  it("starts with an empty birthday so no date is submitted by accident", () => {
    render(<BirthdaySubmissionForm token="test-token" />);

    const dateInput = screen.getByLabelText<HTMLInputElement>("Birthday *");

    expect(dateInput.type).toBe("date");
    expect(dateInput.value).toBe("");
  });
});
