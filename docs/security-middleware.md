# Security Middleware Documentation

## Overview

The security middleware provides comprehensive protection for the birthday sharing feature, implementing multiple layers of security including rate limiting, suspicious activity detection, and automatic threat mitigation.

## Components

### SecurityMiddleware

The main security middleware class that orchestrates all security checks.

#### Key Features

- **IP-based rate limiting**: Prevents abuse from specific IP addresses
- **User-based rate limiting**: Enforces per-user limits on sharing link creation
- **Bot detection**: Identifies and blocks automated requests
- **Content validation**: Detects and blocks malicious content
- **Automatic link deactivation**: Disables sharing links when high-risk activity is detected
- **Security logging**: Comprehensive logging for monitoring and analysis

#### Methods

##### `checkSharingLinkRateLimit(context)`

Validates security for sharing link creation requests.

**Parameters:**

- `context`: Object containing `ipAddress`, `userAgent`, and `userId`

**Returns:**

- `SecurityResult` with `allowed` boolean and additional metadata

**Security Checks:**

1. IP-based rate limiting (10 requests per hour)
2. User-specific limits (5 active links, 3 new links per day)
3. Suspicious activity detection (bot user agents, rapid generation)

##### `checkSubmissionSecurity(context, submissionData)`

Validates security for birthday submission requests.

**Parameters:**

- `context`: Object containing `ipAddress`, `userAgent`, and `token`
- `submissionData`: Object with `name`, `date`, and optional `submitterEmail`

**Returns:**

- `SecurityResult` with `allowed` boolean and additional metadata

**Security Checks:**

1. IP-based rate limiting (10 submissions per hour)
2. Link-based rate limiting (50 submissions per hour per link)
3. Persistent rate limiting (database-backed limits)
4. Suspicious activity detection
5. Content validation for XSS and injection attempts

### Rate Limiting

#### IP-Based Limits

- **Submissions**: 10 per hour per IP address
- **Persistent tracking**: 20 per hour, 100 per day (database-backed)

#### Link-Based Limits

- **Submissions**: 50 per hour per sharing link
- **Link creation**: 5 active links per user, 3 new links per day

#### User-Based Limits

- **Active links**: Maximum 5 active sharing links per user
- **Daily generation**: Maximum 3 new sharing links per day

### Suspicious Activity Detection

#### Bot Detection

Identifies requests from automated tools based on user agent patterns:

- Common crawlers and bots (Googlebot, bingbot, etc.)
- HTTP clients (curl, wget, python-requests, etc.)
- Scraping tools (scrapy, spider-bot, etc.)

#### Content Validation

Detects malicious content in submission data:

- HTML tags and scripts
- JavaScript injection attempts
- Data URIs and other suspicious patterns

#### Behavioral Analysis

Monitors for suspicious patterns:

- Duplicate submissions within short time windows
- Rapid submissions from same email address
- Unusual submission patterns

### Security Logging

All security events are logged with the following information:

- Timestamp
- IP address and user agent
- User ID (when available)
- Action attempted
- Result (allowed/blocked)
- Reason for blocking
- Additional metadata

#### Log Levels

- **INFO**: Normal security checks and allowed requests
- **WARN**: High-severity security events and blocked requests
- **ERROR**: Security system failures

### Automatic Threat Mitigation

#### Link Deactivation

Sharing links are automatically deactivated when:

- High-severity suspicious activity is detected
- Multiple security violations occur
- Malicious content is submitted

#### Progressive Blocking

Rate limiting implements progressive delays:

- First violations: Standard rate limiting
- Repeated violations: Extended blocking periods
- Severe violations: Automatic link deactivation

## Integration

### GraphQL Resolvers

Security middleware is integrated into GraphQL mutations:

```typescript
// createSharingLink mutation
const securityResult = await SecurityMiddleware.checkSharingLinkRateLimit({
  ipAddress: extractedIP,
  userAgent: request.headers["user-agent"],
  userId: context.user.id,
});

if (!securityResult.allowed) {
  throw new Error(securityResult.reason);
}
```

## Configuration

### Rate Limits

Rate limits are configured in the SecurityMiddleware class:

```typescript
private static readonly SUSPICIOUS_PATTERNS = {
  RAPID_SUBMISSIONS: {
    threshold: 5,
    windowMs: 60 * 1000, // 1 minute
  },
  RAPID_LINK_GENERATION: {
    threshold: 3,
    windowMs: 5 * 60 * 1000, // 5 minutes
  },
};
```

### Bot Detection Patterns

Bot detection patterns can be customized:

```typescript
BOT_USER_AGENTS: [
  /bot/i,
  /crawler/i,
  /spider/i,
  /scraper/i,
  // Add custom patterns here
],
```

## Monitoring

### Security Statistics

The middleware provides methods to retrieve security statistics:

```typescript
const stats = await SecurityMiddleware.getSecurityStats(24); // Last 24 hours
```

### Alerting

High-severity events trigger console warnings that can be integrated with monitoring systems:

```typescript
console.warn("HIGH_SEVERITY_SECURITY_EVENT:", {
  timestamp: entry.timestamp.toISOString(),
  ipAddress: entry.ipAddress,
  action: entry.action,
  reason: entry.reason,
});
```

## Testing

The security middleware includes comprehensive tests:

- **Unit tests**: Individual method testing with mocked dependencies
- **Integration tests**: Rate limiting service integration
- **Security tests**: Suspicious activity detection and content validation
- **Error handling**: Graceful failure scenarios

Run security tests:

```bash
npm test -- --run lib/security-middleware.test.ts
npm test -- --run lib/rate-limiter.integration.test.ts
npm test -- --run graphql/schema/security-integration.test.ts
```

## Production Considerations

### Performance

- In-memory rate limiting for development
- Consider Redis for production rate limiting
- Database connection pooling for persistent checks

### Monitoring

- Integrate with centralized logging (ELK stack, Splunk)
- Set up alerts for high-severity events
- Monitor rate limiting effectiveness

### Scalability

- Distributed rate limiting for multiple server instances
- Caching for frequently accessed security data
- Background cleanup jobs for expired data

## Security Best Practices

1. **Fail Secure**: Block requests when security checks fail
2. **Defense in Depth**: Multiple layers of protection
3. **Logging**: Comprehensive security event logging
4. **Monitoring**: Real-time threat detection and alerting
5. **Regular Updates**: Keep bot detection patterns current
6. **Testing**: Continuous security testing and validation
