# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

Lazy Uncle is a birthday reminder application that allows users to track birthdays, share submission links with others, and receive notifications about upcoming birthdays. Live at: https://www.lazyuncle.net/

**Core Stack**: Next.js 16+ (React 19), PostgreSQL, Drizzle ORM, GraphQL (Yoga + Nexus), Better Auth, Tailwind CSS 4.1+

**Package Manager**: Bun (enforced via preinstall script)

## Essential Commands

### Development

```bash
bun dev                    # Start dev server (http://localhost:3000)
bun db:studio              # Open Drizzle Studio (database GUI)
bun db:push                # Push schema changes to database
```

### Database

```bash
bun db:generate            # Generate Drizzle migration files
bun db:migrate             # Run migrations
```

### Testing

```bash
bun test                   # Run all tests (193 test files)
bun test:watch             # Watch mode
bun coverage               # Generate coverage report
bun test path/to/file.test.ts  # Run single test file
```

### Build & Deploy

```bash
bun build                  # Build production bundle
bun start                  # Start production server
bun lint                   # Run ESLint
```

### Utilities

```bash
bun out                    # Check outdated packages
bun up                     # Update packages
```

## Architecture Overview

### Routing Structure

- **Hybrid Next.js**: Pages Router for UI (`pages/`), App Router for API routes (`app/api/`)
- **API Endpoints**:
  - `/api/graphql` - GraphQL Yoga endpoint (all data operations)
  - `/api/auth/[...all]` - Better Auth handlers
  - `/api/healthz` - Health check
  - `/api/calendar-subscription/[userId]` - iCal export

### Database Schema (Drizzle ORM)

Key tables and their relationships:

- **user** → **account** (1:many OAuth providers)
- **user** → **session** (1:many)
- **user** → **Birthday** (1:many, owns birthdays)
- **user** → **SharingLink** (1:many, creates sharing links)
- **SharingLink** → **BirthdaySubmission** (1:many, receives submissions)
- **user** → **NotificationPreference** (1:1)

All user data is isolated by `userId` - enforce this in all queries.

### GraphQL Schema

**Location**: `graphql/schema/`

- `index.ts` - Schema builder (Nexus)
- `Query.ts` - Query resolvers
- `Mutation.ts` - Mutation resolvers
- Auto-generated types: `generated/nexus-typegen.ts`

**Context**: Every GraphQL request includes:

```typescript
{
  user: { id, email, name },  // From Better Auth session
  db: DrizzleDB                // Database instance
}
```

**Authorization Pattern**: All resolvers must check `ctx.user.id` exists and filter by `userId`.

### Service Layer Architecture

Core business logic lives in `lib/*-service.ts`:

- **SharingService** (`lib/sharing-service.ts`)
  - Creates cryptographically secure sharing links (32 bytes base64url)
  - Enforces limits: max 5 active links per user, 3 new links per day
  - Default expiration: 7 days
  - Handles token collision retry (max 10 attempts)

- **SubmissionService** (`lib/submission-service.ts`)
  - Processes birthday submissions from sharing links
  - Duplicate detection via Levenshtein distance (60% name, 40% date)
  - Threshold: 0.8 similarity score
  - Rate limit: 10 submissions/hour per link

- **NotificationService** (`lib/notification-service.ts`)
  - Sends emails via Resend API
  - Falls back to console.log in development (no RESEND_API_KEY)
  - Two types: individual submission alerts, daily summary digests

- **SecurityMiddleware** (`lib/security-middleware.ts`)
  - Multi-layer protection: bot detection, rate limiting, suspicious pattern detection
  - Auto-deactivates sharing links on high-risk activity
  - Logs all security events

- **BackgroundJobScheduler** (`lib/background-jobs.ts`)
  - Auto-starts in production (`NODE_ENV=production`)
  - Jobs: notification processing (30s), expired link cleanup (1h), old submission cleanup (6h), daily summaries (24h)
  - Access status via `getStatus()` API

### Authentication Flow (Better Auth)

1. OAuth login → provider callback → session created in DB
2. Session token stored in HTTP-only cookie
3. GraphQL context automatically injects user from session
4. Client hook: `authClient.useSession()` (from `lib/auth-client.ts`)
5. Route protection: Server-side via `getServerSideProps` + client-side checks

### Security Architecture

**Defense in Depth**:

1. **Input Validation** (`lib/input-validator.ts`) - Sanitize all user input, remove XSS patterns
2. **Rate Limiting** (`lib/rate-limiter.ts`) - In-memory limiter (⚠️ should be Redis in production)
   - IP-based: 10 submissions/hour
   - Link-based: 50 submissions/hour
   - Persistent DB checks: 20/hour, 100/day per IP
3. **Security Middleware** - Bot detection, rapid action detection, auto-deactivation
4. **Authorization** - Row-level security via `userId` filtering

**Important**: The in-memory rate limiter does NOT persist across server restarts. For production, replace with Redis-backed implementation.

## Key Development Patterns

### Adding a New Birthday Field

1. Update schema: `drizzle/schema.ts` (add column to `Birthday` table)
2. Generate migration: `bun db:generate`
3. Run migration: `bun db:migrate` (or `bun db:push` for dev)
4. Update GraphQL type: `graphql/schema/Birthday.ts` (add field to Nexus object type)
5. Update input validation: `lib/input-validator.ts` (add sanitization rules)
6. Update components: `components/AddBirthdayDialog.tsx`, `EditBirthdayDialog.tsx`
7. Run tests: `bun test`

### Creating a New GraphQL Mutation

1. Define in `graphql/schema/Mutation.ts`:

```typescript
t.field("myMutation", {
  type: "Birthday",
  args: { id: nonNull(stringArg()) },
  resolve: async (_, args, ctx) => {
    if (!ctx.user?.id) throw new Error("Unauthorized");
    // Business logic here - consider creating a service method
    return result;
  },
});
```

2. Add service method if complex: `lib/my-service.ts`
3. Write tests: `graphql/schema/MyMutation.test.ts`
4. Update frontend: Add mutation in `graphql/Birthday.ts`, use in component

### Adding a New Service

1. Create `lib/my-service.ts` with clear method signatures
2. Export pure functions that accept `db` instance as parameter
3. Return result objects: `{ success: boolean, data?, errors? }`
4. Write comprehensive tests: `lib/my-service.test.ts`
5. Import in GraphQL resolvers or other services

### Working with Background Jobs

Edit `lib/background-jobs.ts`:

```typescript
{
  name: 'my-job',
  interval: 60 * 60 * 1000, // 1 hour in ms
  handler: async () => {
    // Job logic here
  }
}
```

Jobs auto-start in production. Monitor via `getStatus()` method.

## Date Format Standards

- **Database storage**: `YYYY-MM-DD` (text column, not date type)
- **User display**: Varies by component (MM/DD/YYYY common in forms)
- **Validation**: Accepts 1900-01-01 to current year + 1
- **Age calculation**: See `shared/getAgeForHumans.ts`
- **Days until birthday**: See `shared/getDaysUntilNextBirthday.ts`

## Important Constraints & Limits

- Max 5 active sharing links per user
- Max 3 new sharing links per user per day
- Sharing link default expiration: 7 days
- Rate limit: 10 submissions/hour per sharing link
- Rate limit: 10 submissions/hour per IP
- Persistent rate limit: 20/hour, 100/day per IP
- Duplicate submission detection: 0.8 similarity threshold
- Old rejected submissions: Deleted after 30 days
- Orphaned submissions: Deleted after link deletion (background job)

## Environment Setup

Required environment variables:

```bash
DATABASE_URL=postgresql://...           # PostgreSQL connection string
GITHUB_ID=                              # OAuth GitHub app ID
GITHUB_SECRET=                          # OAuth GitHub secret
GOOGLE_CLIENT_ID=                       # OAuth Google client ID
GOOGLE_CLIENT_SECRET=                   # OAuth Google secret
BETTER_AUTH_SECRET=                     # Session encryption key (generate with openssl rand -base64 32)
BETTER_AUTH_URL=http://localhost:3000   # Base URL

# Optional
RESEND_API_KEY=                         # Email service (falls back to console.log)
NEXT_PUBLIC_POSTHOG_KEY=                # Analytics (optional)
```

## Testing Strategy

- **Unit tests**: Services, utilities, validators (`lib/*.test.ts`)
- **Integration tests**: Rate limiting, security (`lib/*.integration.test.ts`)
- **Security tests**: `graphql/schema/security-integration.test.ts`
- **Component tests**: React components (`components/*.test.tsx`)

When writing tests:

- Mock external dependencies (Resend API, etc.)
- Use in-memory database for integration tests (if applicable)
- Test security boundaries extensively
- Include edge cases (rate limits, expired tokens, etc.)

## Common Troubleshooting

### GraphQL Endpoint Issues

- Visit `http://localhost:3000/api/graphql` for GraphQL playground
- Check `graphql/context.ts` for auth context setup
- Verify session cookie is being sent with requests

### Database Connection Issues

- Ensure `DATABASE_URL` is set correctly in `.env`
- Run `bun db:push` to sync schema
- Open `bun db:studio` to inspect database directly

### Authentication Not Working

- Verify OAuth app credentials in `.env`
- Check Better Auth documentation: https://www.better-auth.com/
- GitHub: https://www.better-auth.com/docs/authentication/github
- Google: https://www.better-auth.com/docs/authentication/google
- Ensure `BETTER_AUTH_SECRET` is set (32+ character random string)

### Rate Limiting in Development

- Rate limiter is in-memory, resets on server restart
- To bypass during testing, temporarily increase limits in `lib/rate-limiter.ts`
- For production, implement Redis-backed rate limiter

### Email Notifications Not Sending

- In development, emails log to console (check terminal output)
- For production emails, set `RESEND_API_KEY` in environment
- Check `lib/notification-service.ts` for email logic

## Architecture Decisions & Rationale

### Why Hybrid Routing (Pages + App Router)?

- Pages Router: Mature, stable, better for SSR-heavy UI pages
- App Router: Modern API route handling with better streaming support
- Gradual migration strategy - can move pages to App Router incrementally

### Why Better Auth over NextAuth?

- More modern, actively maintained
- Better TypeScript support
- Simpler session management
- Easier to customize

### Why Nexus for GraphQL?

- Code-first schema with full TypeScript inference
- Auto-generates types and schema
- Better DX than schema-first approaches

### Why In-Memory Rate Limiter?

- Simplicity for initial launch
- Good enough for low-traffic applications
- ⚠️ Known limitation: Does not persist across deployments
- TODO: Replace with Redis for production scale

### Why Text Column for Dates?

- Birthday dates often don't have year (e.g., "celebrate every year")
- Storing as text provides flexibility
- Validation ensures consistent format
- Age calculation handles missing years gracefully

## File Organization Conventions

```
components/          # React components (presentational + containers)
├── layout/         # Layout wrappers (MainLayout, PublicLayout)
└── [Feature]*.tsx  # Feature-specific components (e.g., AddBirthdayDialog)

graphql/            # GraphQL schema and queries
├── schema/         # Nexus schema definition (Query, Mutation, types)
└── Birthday.ts     # Client-side queries/mutations (Apollo)

lib/                # Business logic services
├── *-service.ts    # Core services (sharing, submission, notification)
├── db.ts           # Database singleton
├── auth*.ts        # Authentication (server + client)
└── *.test.ts       # Service tests

pages/              # Next.js Pages Router (UI routes)
├── api/            # API routes (legacy, some still used)
└── [routes].tsx    # Page components

app/                # Next.js App Router (API only)
└── api/            # Modern API routes (auth, graphql)

drizzle/            # Database layer
├── schema.ts       # Drizzle schema definition
└── migrations/     # Auto-generated migration files

shared/             # Pure utility functions
└── get*.ts         # Calculation utilities (age, zodiac, etc.)

types/              # Shared TypeScript types
```

## GraphQL Query Examples

### Fetch All Birthdays

```graphql
query GetAllBirthdays {
  birthdays {
    id
    name
    date
    category
    notes
  }
}
```

### Create Sharing Link

```graphql
mutation CreateSharingLink($description: String, $expirationHours: Int) {
  createSharingLink(
    description: $description
    expirationHours: $expirationHours
  ) {
    id
    token
    expiresAt
    isActive
  }
}
```

### Submit Birthday (Public, No Auth)

```graphql
mutation SubmitBirthday($token: String!, $name: String!, $date: String!) {
  submitBirthday(token: $token, name: $name, date: $date) {
    id
    status
  }
}
```

### Import Submission

```graphql
mutation ImportSubmission($submissionId: String!) {
  importSubmission(submissionId: $submissionId) {
    id
    name
    date
  }
}
```

## Scripts & Automation

### Add Birthdays for User

```bash
# Manually via CSV
bun scripts/addBirthdaysForUser.ts user@example.com

# With seeded data (if CSV is empty)
# Script will prompt: "Would you like to add 100 seeded birthdays? (yes/no)"
```

The script:

1. Reads from `data/birthdays.csv`
2. If CSV is empty, offers to generate 100 seeded birthdays
3. Uses @faker-js/faker for realistic names
4. Generates dates within last 70 years
5. Prevents duplicates (checks existing user birthdays)

## Performance Considerations

- Apollo Client cache: Normalized cache enabled, use `update` function after mutations
- Database indexes: All FK columns indexed, see `drizzle/schema.ts` for index definitions
- N+1 queries: Use Drizzle `.with()` for eager loading relationships
- Pagination: Implemented for submissions (`pendingSubmissions` query), add to other lists as needed

## Security Checklist for New Features

- [ ] Validate all user input (use `lib/input-validator.ts`)
- [ ] Check user authorization (`ctx.user.id` in GraphQL resolvers)
- [ ] Filter queries by `userId` (row-level security)
- [ ] Apply rate limiting for public endpoints
- [ ] Sanitize output to prevent XSS
- [ ] Add security tests
- [ ] Log security events via `lib/security-middleware.ts`
- [ ] Consider bot detection for public forms

## README Notes

The README.md mentions MongoDB Atlas, but the codebase uses PostgreSQL with Drizzle ORM. This appears to be outdated documentation. The actual setup uses:

- PostgreSQL (not MongoDB)
- Better Auth (not NextAuth, though README mentions NextAuth)
- Bun package manager (enforced)
