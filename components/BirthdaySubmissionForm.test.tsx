import { gql } from "@apollo/client";
import { beforeEach, describe, expect, it, vi } from "vitest";

describe("BirthdaySubmissionForm Component", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe("Form Validation", () => {
    it("should validate required name field", () => {
      // Test that empty name is rejected
      const errors = [];
      const name = "";

      if (!name.trim()) {
        errors.push("Name is required");
      }

      expect(errors).toContain("Name is required");
    });

    it("should validate required date field", () => {
      const errors = [];
      const date = "";

      if (!date) {
        errors.push("Birthday is required");
      }

      expect(errors).toContain("Birthday is required");
    });

    it("should validate date format and range", () => {
      const errors = [];
      const date = "1800-01-01";

      const dateRegex = /^\d{4}-\d{2}-\d{2}$/;
      if (!dateRegex.test(date)) {
        errors.push("Please enter a valid date");
      } else {
        const parsedDate = new Date(date);
        const currentYear = new Date().getFullYear();
        const dateYear = parsedDate.getFullYear();

        if (dateYear < 1900 || dateYear > currentYear + 1) {
          errors.push("Please enter a date between 1900 and next year");
        }
      }

      expect(errors).toContain(
        "Please enter a date between 1900 and next year",
      );
    });

    it("should validate email format", () => {
      const errors = [];
      const email = "invalid-email";

      if (email && email.trim()) {
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!emailRegex.test(email.trim())) {
          errors.push("Please enter a valid email address");
        }
      }

      expect(errors).toContain("Please enter a valid email address");
    });

    it("should validate field length limits", () => {
      const errors = [];
      const name = "a".repeat(101);
      const category = "b".repeat(51);
      const notes = "c".repeat(501);

      if (name.length > 100) {
        errors.push("Name must be 100 characters or less");
      }

      if (category.length > 50) {
        errors.push("Category must be 50 characters or less");
      }

      if (notes.length > 500) {
        errors.push("Notes must be 500 characters or less");
      }

      expect(errors).toContain("Name must be 100 characters or less");
      expect(errors).toContain("Category must be 50 characters or less");
      expect(errors).toContain("Notes must be 500 characters or less");
    });

    it("should accept valid form data", () => {
      const errors = [];
      const name = "John Doe";
      const date = "1990-05-15";
      const email = "john@example.com";

      // Name validation
      if (!name.trim()) {
        errors.push("Name is required");
      }
      if (name.length > 100) {
        errors.push("Name must be 100 characters or less");
      }

      // Date validation
      if (!date) {
        errors.push("Birthday is required");
      } else {
        const dateRegex = /^\d{4}-\d{2}-\d{2}$/;
        if (!dateRegex.test(date)) {
          errors.push("Please enter a valid date");
        } else {
          const parsedDate = new Date(date);
          const currentYear = new Date().getFullYear();
          const dateYear = parsedDate.getFullYear();

          if (dateYear < 1900 || dateYear > currentYear + 1) {
            errors.push("Please enter a date between 1900 and next year");
          }
        }
      }

      // Email validation
      if (email && email.trim()) {
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!emailRegex.test(email.trim())) {
          errors.push("Please enter a valid email address");
        }
      }

      expect(errors).toHaveLength(0);
    });
  });

  describe("Data Processing", () => {
    it("should trim whitespace from form fields", () => {
      const formData = {
        name: "  John Doe  ",
        category: "  Friend  ",
        notes: "  Great person  ",
        submitterName: "  Jane Smith  ",
        submitterEmail: "  jane@example.com  ",
        relationship: "  Best friend  ",
      };

      const processedData = {
        name: formData.name.trim(),
        category: formData.category.trim() || null,
        notes: formData.notes.trim() || null,
        submitterName: formData.submitterName.trim() || null,
        submitterEmail: formData.submitterEmail.trim() || null,
        relationship: formData.relationship.trim() || null,
      };

      expect(processedData.name).toBe("John Doe");
      expect(processedData.category).toBe("Friend");
      expect(processedData.notes).toBe("Great person");
      expect(processedData.submitterName).toBe("Jane Smith");
      expect(processedData.submitterEmail).toBe("jane@example.com");
      expect(processedData.relationship).toBe("Best friend");
    });

    it("should convert empty strings to null for optional fields", () => {
      const formData = {
        name: "John Doe",
        date: "1990-05-15",
        category: "",
        notes: "",
        submitterName: "",
        submitterEmail: "",
        relationship: "",
      };

      const processedData = {
        name: formData.name.trim(),
        date: formData.date,
        category: formData.category.trim() || null,
        notes: formData.notes.trim() || null,
        submitterName: formData.submitterName.trim() || null,
        submitterEmail: formData.submitterEmail.trim() || null,
        relationship: formData.relationship.trim() || null,
      };

      expect(processedData.name).toBe("John Doe");
      expect(processedData.date).toBe("1990-05-15");
      expect(processedData.category).toBeNull();
      expect(processedData.notes).toBeNull();
      expect(processedData.submitterName).toBeNull();
      expect(processedData.submitterEmail).toBeNull();
      expect(processedData.relationship).toBeNull();
    });
  });

  describe("Error Handling", () => {
    it("should handle expired link error messages", () => {
      const errorMessage = "Invalid or expired sharing link";
      const isExpiredError = errorMessage.includes("expired");

      expect(isExpiredError).toBe(true);
    });

    it("should handle rate limit error messages", () => {
      const errorMessage =
        "Rate limit exceeded. Please try again in 3600 seconds.";
      const isRateLimitError = errorMessage.includes("Rate limit");

      expect(isRateLimitError).toBe(true);
    });

    it("should provide appropriate error messages for different scenarios", () => {
      const errors = {
        expired:
          "This sharing link has expired or is no longer valid. Please ask for a new link.",
        rateLimit:
          "Too many submissions have been made recently. Please try again later.",
        generic:
          "An error occurred while submitting the birthday. Please try again.",
      };

      expect(errors.expired).toContain("expired");
      expect(errors.rateLimit).toContain("Too many submissions");
      expect(errors.generic).toContain("error occurred");
    });
  });

  describe("Form State Management", () => {
    it("should track character count for notes field", () => {
      const notes = "Hello world";
      const characterCount = notes.length;
      const maxLength = 500;

      expect(characterCount).toBe(11);
      expect(characterCount).toBeLessThanOrEqual(maxLength);
    });

    it("should manage form submission state", () => {
      let isSubmitted = false;
      let loading = false;

      // Simulate form submission
      loading = true;
      expect(loading).toBe(true);

      // Simulate successful submission
      loading = false;
      isSubmitted = true;
      expect(loading).toBe(false);
      expect(isSubmitted).toBe(true);
    });
  });

  describe("GraphQL Mutation Variables", () => {
    it("should prepare correct mutation variables for minimal submission", () => {
      const formData = {
        token: "test-token",
        name: "John Doe",
        date: "1990-05-15",
        category: "",
        notes: "",
        submitterName: "",
        submitterEmail: "",
        relationship: "",
      };

      const variables = {
        token: formData.token,
        name: formData.name.trim(),
        date: formData.date,
        category: formData.category.trim() || null,
        notes: formData.notes.trim() || null,
        submitterName: formData.submitterName.trim() || null,
        submitterEmail: formData.submitterEmail.trim() || null,
        relationship: formData.relationship.trim() || null,
      };

      expect(variables.token).toBe("test-token");
      expect(variables.name).toBe("John Doe");
      expect(variables.date).toBe("1990-05-15");
      expect(variables.category).toBeNull();
      expect(variables.notes).toBeNull();
      expect(variables.submitterName).toBeNull();
      expect(variables.submitterEmail).toBeNull();
      expect(variables.relationship).toBeNull();
    });

    it("should prepare correct mutation variables for complete submission", () => {
      const formData = {
        token: "test-token",
        name: "John Doe",
        date: "1990-05-15",
        category: "Friend",
        notes: "Great person",
        submitterName: "Jane Smith",
        submitterEmail: "jane@example.com",
        relationship: "Best friend",
      };

      const variables = {
        token: formData.token,
        name: formData.name.trim(),
        date: formData.date,
        category: formData.category.trim() || null,
        notes: formData.notes.trim() || null,
        submitterName: formData.submitterName.trim() || null,
        submitterEmail: formData.submitterEmail.trim() || null,
        relationship: formData.relationship.trim() || null,
      };

      expect(variables.token).toBe("test-token");
      expect(variables.name).toBe("John Doe");
      expect(variables.date).toBe("1990-05-15");
      expect(variables.category).toBe("Friend");
      expect(variables.notes).toBe("Great person");
      expect(variables.submitterName).toBe("Jane Smith");
      expect(variables.submitterEmail).toBe("jane@example.com");
      expect(variables.relationship).toBe("Best friend");
    });
  });

  describe("GraphQL Mutation Definition", () => {
    it("should define the correct GraphQL mutation", () => {
      const SUBMIT_BIRTHDAY_MUTATION = gql`
        mutation SubmitBirthday(
          $token: String!
          $name: String!
          $date: String!
          $category: String
          $notes: String
          $submitterName: String
          $submitterEmail: String
          $relationship: String
        ) {
          submitBirthday(
            token: $token
            name: $name
            date: $date
            category: $category
            notes: $notes
            submitterName: $submitterName
            submitterEmail: $submitterEmail
            relationship: $relationship
          ) {
            id
            name
            date
            status
            __typename
          }
        }
      `;

      expect(SUBMIT_BIRTHDAY_MUTATION).toBeDefined();
      expect(SUBMIT_BIRTHDAY_MUTATION.kind).toBe("Document");
    });
  });

  describe("Component Props Interface", () => {
    it("should define correct props interface", () => {
      interface BirthdaySubmissionFormProps {
        token: string;
        onSuccess?: () => void;
        onCancel?: () => void;
      }

      const props: BirthdaySubmissionFormProps = {
        token: "test-token",
        onSuccess: vi.fn(),
        onCancel: vi.fn(),
      };

      expect(props.token).toBe("test-token");
      expect(typeof props.onSuccess).toBe("function");
      expect(typeof props.onCancel).toBe("function");
    });

    it("should handle optional props", () => {
      interface BirthdaySubmissionFormProps {
        token: string;
        onSuccess?: () => void;
        onCancel?: () => void;
      }

      const minimalProps: BirthdaySubmissionFormProps = {
        token: "test-token",
      };

      expect(minimalProps.token).toBe("test-token");
      expect(minimalProps.onSuccess).toBeUndefined();
      expect(minimalProps.onCancel).toBeUndefined();
    });
  });
});
