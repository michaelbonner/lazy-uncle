import { createHmac } from "crypto";

export type UnsubscribeType = "submission" | "summary" | "reminder";

function getSecret(): string {
  const secret = process.env.BETTER_AUTH_SECRET;
  if (!secret) {
    throw new Error("BETTER_AUTH_SECRET is required for unsubscribe tokens");
  }
  return secret;
}

export function generateUnsubscribeToken(
  userId: string,
  type: UnsubscribeType,
): string {
  return createHmac("sha256", getSecret())
    .update(`${userId}:${type}`)
    .digest("base64url");
}

export function verifyUnsubscribeToken(
  userId: string,
  type: UnsubscribeType,
  token: string,
): boolean {
  const expected = generateUnsubscribeToken(userId, type);
  // Constant-time comparison to prevent timing attacks
  if (expected.length !== token.length) return false;
  let diff = 0;
  for (let i = 0; i < expected.length; i++) {
    diff |= expected.charCodeAt(i) ^ token.charCodeAt(i);
  }
  return diff === 0;
}

export function buildUnsubscribeUrl(
  userId: string,
  type: UnsubscribeType,
): string {
  const baseUrl = process.env.BETTER_AUTH_URL ?? "http://localhost:3000";
  const token = generateUnsubscribeToken(userId, type);
  const params = new URLSearchParams({ userId, type, token });
  return `${baseUrl}/api/unsubscribe?${params}`;
}
