/**
 * Input validation and sanitization utilities for birthday submissions
 */

export interface ValidationResult {
  isValid: boolean;
  errors: string[];
  sanitizedData?: BirthdaySubmissionInput & { token: string };
}

export interface BirthdaySubmissionInput {
  name: string;
  date: string;
  category?: string | null;
  notes?: string | null;
  submitterName?: string | null;
  submitterEmail?: string | null;
  relationship?: string | null;
}

export class InputValidator {
  /**
   * Sanitize HTML entities and remove potentially dangerous characters
   */
  static sanitizeString(input: string | null | undefined): string {
    if (!input || typeof input !== "string") {
      return "";
    }

    return input
      .trim()
      .replace(/[<>]/g, "") // Remove angle brackets
      .replace(/javascript:/gi, "") // Remove javascript: protocol
      .replace(/on\w+=/gi, "") // Remove event handlers
      .substring(0, 1000); // Limit length
  }

  /**
   * Validate and sanitize email address
   */
  static validateEmail(email: string | null | undefined): {
    isValid: boolean;
    sanitized: string;
  } {
    if (!email || typeof email !== "string") {
      return { isValid: true, sanitized: "" }; // Email is optional
    }

    const sanitized = email.trim().toLowerCase().substring(0, 254);
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    const isValid = emailRegex.test(sanitized);

    return { isValid, sanitized };
  }

  /**
   * Validate date string in YYYY-MM-DD format
   */
  static validateDate(dateString: string): {
    isValid: boolean;
    sanitized: string;
    parsedDate?: Date;
  } {
    if (!dateString || typeof dateString !== "string") {
      return { isValid: false, sanitized: "" };
    }

    const sanitized = dateString.trim();

    // Check format YYYY-MM-DD
    const dateRegex = /^\d{4}-\d{2}-\d{2}$/;
    if (!dateRegex.test(sanitized)) {
      return { isValid: false, sanitized };
    }

    // Parse and validate the date
    const parsedDate = new Date(sanitized + "T00:00:00.000Z");

    // Check if date is valid
    if (isNaN(parsedDate.getTime())) {
      return { isValid: false, sanitized };
    }

    // Check if date is reasonable (not too far in past or future)
    const currentYear = new Date().getFullYear();
    const dateYear = parsedDate.getFullYear();

    if (dateYear < 1900 || dateYear > currentYear + 1) {
      return { isValid: false, sanitized };
    }

    return { isValid: true, sanitized, parsedDate };
  }

  /**
   * Validate name field
   */
  static validateName(name: string): { isValid: boolean; sanitized: string } {
    if (!name || typeof name !== "string") {
      return { isValid: false, sanitized: "" };
    }

    const sanitized = this.sanitizeString(name);

    // Name must be between 1 and 100 characters
    if (sanitized.length < 1 || sanitized.length > 100) {
      return { isValid: false, sanitized };
    }

    // Name should contain at least one letter
    if (!/[a-zA-Z]/.test(sanitized)) {
      return { isValid: false, sanitized };
    }

    return { isValid: true, sanitized };
  }

  /**
   * Validate category field
   */
  static validateCategory(category: string | null | undefined): {
    isValid: boolean;
    sanitized: string;
  } {
    if (!category || typeof category !== "string") {
      return { isValid: true, sanitized: "" }; // Category is optional
    }

    const sanitized = this.sanitizeString(category);

    // Category should be reasonable length
    if (sanitized.length > 50) {
      return { isValid: false, sanitized };
    }

    return { isValid: true, sanitized };
  }

  /**
   * Validate notes field
   */
  static validateNotes(notes: string | null | undefined): {
    isValid: boolean;
    sanitized: string;
  } {
    if (!notes || typeof notes !== "string") {
      return { isValid: true, sanitized: "" }; // Notes are optional
    }

    const sanitized = this.sanitizeString(notes);

    // Notes should be reasonable length
    if (sanitized.length > 500) {
      return { isValid: false, sanitized };
    }

    return { isValid: true, sanitized };
  }

  /**
   * Validate relationship field
   */
  static validateRelationship(relationship: string | null | undefined): {
    isValid: boolean;
    sanitized: string;
  } {
    if (!relationship || typeof relationship !== "string") {
      return { isValid: true, sanitized: "" }; // Relationship is optional
    }

    const sanitized = this.sanitizeString(relationship);

    // Relationship should be reasonable length
    if (sanitized.length > 50) {
      return { isValid: false, sanitized };
    }

    return { isValid: true, sanitized };
  }

  /**
   * Validate sharing link token
   */
  static validateToken(token: string): { isValid: boolean; sanitized: string } {
    if (!token || typeof token !== "string") {
      return { isValid: false, sanitized: "" };
    }

    const sanitized = token.trim();

    // Token should be base64url format and reasonable length
    const tokenRegex = /^[A-Za-z0-9_-]+$/;
    if (
      !tokenRegex.test(sanitized) ||
      sanitized.length < 10 ||
      sanitized.length > 100
    ) {
      return { isValid: false, sanitized };
    }

    return { isValid: true, sanitized };
  }

  /**
   * Comprehensive validation for birthday submission data
   */
  static validateBirthdaySubmission(
    input: BirthdaySubmissionInput & { token: string },
  ): ValidationResult {
    const errors: string[] = [];
    const sanitizedData: BirthdaySubmissionInput & { token: string } = {
      name: "",
      date: "",
      token: "",
    };

    // Validate token
    const tokenValidation = this.validateToken(input.token);
    if (!tokenValidation.isValid) {
      errors.push("Invalid sharing link token");
    } else {
      sanitizedData.token = tokenValidation.sanitized;
    }

    // Validate name (required)
    const nameValidation = this.validateName(input.name);
    if (!nameValidation.isValid) {
      errors.push(
        "Name is required and must be between 1-100 characters with at least one letter",
      );
    } else {
      sanitizedData.name = nameValidation.sanitized;
    }

    // Validate date (required)
    const dateValidation = this.validateDate(input.date);
    if (!dateValidation.isValid) {
      errors.push(
        "Date must be in YYYY-MM-DD format and be a valid date between 1900 and next year",
      );
    } else {
      sanitizedData.date = dateValidation.sanitized;
    }

    // Validate optional fields
    const categoryValidation = this.validateCategory(input.category);
    if (!categoryValidation.isValid) {
      errors.push("Category must be 50 characters or less");
    } else {
      sanitizedData.category = categoryValidation.sanitized || null;
    }

    const notesValidation = this.validateNotes(input.notes);
    if (!notesValidation.isValid) {
      errors.push("Notes must be 500 characters or less");
    } else {
      sanitizedData.notes = notesValidation.sanitized || null;
    }

    const submitterNameValidation = this.validateName(
      input.submitterName || "",
    );
    if (input.submitterName && !submitterNameValidation.isValid) {
      errors.push(
        "Submitter name must be between 1-100 characters with at least one letter",
      );
    } else {
      sanitizedData.submitterName = submitterNameValidation.sanitized || null;
    }

    const emailValidation = this.validateEmail(input.submitterEmail);
    if (!emailValidation.isValid) {
      errors.push("Invalid email address format");
    } else {
      sanitizedData.submitterEmail = emailValidation.sanitized || null;
    }

    const relationshipValidation = this.validateRelationship(
      input.relationship,
    );
    if (!relationshipValidation.isValid) {
      errors.push("Relationship must be 50 characters or less");
    } else {
      sanitizedData.relationship = relationshipValidation.sanitized || null;
    }

    return {
      isValid: errors.length === 0,
      errors,
      sanitizedData: errors.length === 0 ? sanitizedData : undefined,
    };
  }
}
