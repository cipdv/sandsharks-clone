import { sql } from "@vercel/postgres";

const SESSION_MAX_AGE_DAYS = 30;
const SESSION_REFRESH_THRESHOLD_DAYS = 15;
const SESSION_COOKIE_NAME = "session";

function sessionExpiresAt() {
  return new Date(Date.now() + SESSION_MAX_AGE_DAYS * 24 * 60 * 60 * 1000);
}

function getSessionCookieOptions(expires = sessionExpiresAt()) {
  return {
    expires,
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
  };
}

function getExpiredSessionCookieOptions() {
  return {
    expires: new Date(0),
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
  };
}

async function hashSessionToken(token) {
  const encodedToken = new TextEncoder().encode(token);
  const digest = await crypto.subtle.digest("SHA-256", encodedToken);
  return Array.from(new Uint8Array(digest))
    .map((byte) => byte.toString(16).padStart(2, "0"))
    .join("");
}

export function expireSessionCookie(response) {
  response.cookies.set(
    SESSION_COOKIE_NAME,
    "",
    getExpiredSessionCookieOptions()
  );
  return response;
}

export function refreshSessionCookie(response, token, expires) {
  response.cookies.set(
    SESSION_COOKIE_NAME,
    token,
    getSessionCookieOptions(expires)
  );
  return response;
}

export async function validateMiddlewareSession(request) {
  const token = request.cookies.get(SESSION_COOKIE_NAME)?.value;
  if (!token) {
    return { isAuthenticated: false, token: null, expires: null };
  }

  const tokenHash = await hashSessionToken(token);
  const result = await sql`
    SELECT expires_at
    FROM member_sessions
    WHERE token_hash = ${tokenHash}
      AND expires_at > NOW()
    LIMIT 1
  `;

  if (result.rows.length === 0) {
    return { isAuthenticated: false, token, expires: null };
  }

  const expiresAt = new Date(result.rows[0].expires_at);
  const refreshAfter = new Date(
    Date.now() + SESSION_REFRESH_THRESHOLD_DAYS * 24 * 60 * 60 * 1000
  );

  let expires = expiresAt;
  if (expiresAt < refreshAfter) {
    expires = sessionExpiresAt();
    await sql`
      UPDATE member_sessions
      SET expires_at = ${expires}, last_seen_at = NOW()
      WHERE token_hash = ${tokenHash}
    `;
  } else {
    await sql`
      UPDATE member_sessions
      SET last_seen_at = NOW()
      WHERE token_hash = ${tokenHash}
    `;
  }

  return { isAuthenticated: true, token, expires };
}
