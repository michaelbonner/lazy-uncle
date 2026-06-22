# Birthday Submission API

This document describes the public birthday submission API endpoint that allows external users to submit birthday information through sharing links.

## Overview

The `submission.submit` tRPC procedure provides a public endpoint for submitting birthday information without requiring authentication. It includes comprehensive input validation, sanitization, rate limiting, and security measures.

## tRPC Procedure

```ts
await trpc.submission.submit.mutate({
  token,
  name,
  year,
  month,
  day,
  notes,
  submitterName,
  submitterEmail,
  relationship,
});
```

## Parameters

### Required Parameters

- **token** (String!): The sharing link token provided by the link owner
- **name** (String!): The name of the person whose birthday is being submitted (1-100 characters, must contain at least one letter)
- **month** (Number): Birth month, 1-12
- **day** (Number): Birth day for the selected month

### Optional Parameters

- **year** (Number): Birth year between 1900 and next year. Omit when the year is unknown.
- **category** (String): Category for the birthday (max 50 characters)
- **notes** (String): Additional notes about the birthday (max 500 characters)
- **submitterName** (String): Name of the person submitting the birthday (1-100 characters)
- **submitterEmail** (String): Email address of the submitter (valid email format)
- **relationship** (String): Relationship to the birthday person (max 50 characters)

## Input Validation

The API performs comprehensive input validation and sanitization:

### Data Sanitization

- HTML tags and dangerous content are removed from all text inputs
- JavaScript protocols and event handlers are stripped
- Input length is limited to prevent abuse
- All inputs are trimmed of whitespace

### Validation Rules

- **Name**: Must be 1-100 characters and contain at least one letter
- **Date components**: Month and day must form a valid calendar date. Year must be between 1900 and next year when provided.
- **Email**: Must be a valid email format (if provided)
- **Category**: Maximum 50 characters
- **Notes**: Maximum 500 characters
- **Relationship**: Maximum 50 characters

## Rate Limiting

The API implements multiple layers of rate limiting:

### IP-Based Rate Limiting

- **10 submissions per hour per IP address**
- Progressive delays for repeated violations
- Temporary blocking for severe abuse

### Link-Based Rate Limiting

- **50 submissions per hour per sharing link**
- Prevents abuse of individual sharing links

### Persistent Rate Limiting

- Database-tracked limits for longer-term protection
- 20 submissions per hour per IP (persistent)
- 100 submissions per day per IP (persistent)

## Security Features

### Token Validation

- Cryptographically secure token validation
- Automatic expiration checking
- Inactive link detection

### Suspicious Activity Detection

- Duplicate submission detection
- Multiple submissions from same email monitoring
- Automatic logging of suspicious patterns

### Error Handling

- Graceful handling of invalid inputs
- Informative error messages without exposing system details
- Database error protection

## Response Format

### Success Response

```json
{
  "data": {
    "submitBirthday": {
      "id": "submission-123",
      "name": "John Doe",
      "date": "1990-05-15",
      "category": "Friend",
      "notes": "Met at college",
      "submitterName": "Jane Smith",
      "submitterEmail": "jane@example.com",
      "relationship": "Friend",
      "status": "PENDING",
      "createdAt": "2024-01-15T10:30:00Z"
    }
  }
}
```

### Error Response

```json
{
  "errors": [
    {
      "message": "Validation failed: Name is required and must be between 1-100 characters with at least one letter",
      "extensions": {
        "code": "VALIDATION_ERROR"
      }
    }
  ]
}
```

## Common Error Messages

- `"Invalid or expired sharing link"` - The sharing link token is invalid, expired, or inactive
- `"Rate limit exceeded. Please try again in X seconds."` - Too many requests from the IP address
- `"Too many submissions for this link. Please try again in X seconds."` - Too many submissions for the specific sharing link
- `"Validation failed: [details]"` - Input validation errors with specific details
- `"Failed to submit birthday. Please try again."` - Generic database or system error

## Usage Example

```typescript
const submitBirthday = async (token: string, birthdayData: BirthdayData) => {
  try {
    const result = await submitBirthdayMutation.mutateAsync({
      token,
      name: birthdayData.name,
      year: birthdayData.year,
      month: birthdayData.month,
      day: birthdayData.day,
      submitterName: birthdayData.submitterName,
      submitterEmail: birthdayData.submitterEmail,
    });

    return result;
  } catch (error) {
    console.error("Failed to submit birthday:", error);
    throw error;
  }
};

// Usage
submitBirthday("sharing-token-123", {
  name: "John Doe",
  year: 1990,
  month: 5,
  day: 15,
  submitterName: "Jane Smith",
  submitterEmail: "jane@example.com",
});
```

## Testing

The API includes comprehensive test coverage:

- Input validation and sanitization tests
- Rate limiting functionality tests
- Sharing link validation tests
- Error handling tests
- Integration tests for the complete submission flow

Run tests with:

```bash
npm test -- lib/birthday-submission.test.ts --run
npm test -- server/routers/submission.test.ts --run
```

## Security Considerations

1. **No Authentication Required**: This is a public endpoint by design, but it's protected by sharing link tokens
2. **Rate Limiting**: Multiple layers prevent abuse and spam
3. **Input Sanitization**: All inputs are sanitized to prevent XSS and injection attacks
4. **Token Security**: Sharing link tokens are cryptographically secure and time-limited
5. **Monitoring**: Suspicious activity is logged for review
6. **Data Validation**: Strict validation prevents malformed data from entering the system

## Monitoring and Logging

The API logs the following events:

- Successful birthday submissions
- Rate limiting violations
- Suspicious activity detection
- Database errors
- Invalid sharing link attempts

All logs include relevant context for security monitoring and debugging.
