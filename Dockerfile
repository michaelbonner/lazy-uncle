# syntax=docker/dockerfile:1

FROM oven/bun:1-alpine AS dependencies
WORKDIR /app
COPY package.json bun.lock ./
RUN bun install --frozen-lockfile

FROM dependencies AS build
WORKDIR /app
COPY . .

# Next.js inlines NEXT_PUBLIC_* values into the browser bundle at build time.
ARG NEXT_PUBLIC_POSTHOG_KEY
ARG NEXT_PUBLIC_POSTHOG_HOST=/ingest
ENV NEXT_PUBLIC_POSTHOG_KEY=$NEXT_PUBLIC_POSTHOG_KEY \
    NEXT_PUBLIC_POSTHOG_HOST=$NEXT_PUBLIC_POSTHOG_HOST

# These placeholders only satisfy modules evaluated while Next.js builds.
# Dokploy supplies the real values when the container starts.
RUN DATABASE_URL=postgresql://build:build@127.0.0.1:5432/build \
    BETTER_AUTH_SECRET=build-time-placeholder \
    BETTER_AUTH_URL=http://localhost:3000 \
    bun run build

FROM oven/bun:1-alpine AS production-dependencies
WORKDIR /app
COPY package.json bun.lock ./
RUN bun install --frozen-lockfile --production

FROM oven/bun:1-alpine AS runtime
WORKDIR /app

ENV NODE_ENV=production \
    HOSTNAME=0.0.0.0 \
    PORT=3000

RUN apk add --no-cache ca-certificates

COPY --from=production-dependencies /app/node_modules ./node_modules
COPY --from=build /app/.next/standalone ./
COPY --from=build /app/.next/static ./app/.next/static
COPY --from=build /app/public ./app/public
COPY --from=build /app/drizzle ./drizzle
COPY --from=build /app/drizzle.config.ts ./drizzle.config.ts

# The Dokploy schedules `docker exec` into this container and run the
# package.json job scripts, which Next.js does not trace into standalone.
COPY --from=build /app/scripts ./scripts
COPY --from=build /app/lib ./lib

COPY --from=build /app/package.json ./package.json

EXPOSE 3000

# Fail before binding the port if a migration cannot run.
CMD ["sh", "-c", "bun run db:migrate && bun app/server.js"]
