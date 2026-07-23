import { sql } from "@vercel/postgres";

const SESSION_MAX_AGE_DAYS = 30;
const SESSION_REFRESH_THRESHOLD_DAYS = 15;
const SESSION_COOKIE_NAME = "session";

let memberActivityColumnsPromise;

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

async function ensureMemberActivityColumns() {
  if (!memberActivityColumnsPromise) {
    memberActivityColumnsPromise = (async () => {
      await sql`
        ALTER TABLE members
        ADD COLUMN IF NOT EXISTS last_login_at TIMESTAMPTZ,
        ADD COLUMN IF NOT EXISTS last_seen_at TIMESTAMPTZ
      `;

      await sql`
        CREATE INDEX IF NOT EXISTS idx_members_last_login_at
        ON members(last_login_at)
      `;

      await sql`
        CREATE INDEX IF NOT EXISTS idx_members_last_seen_at
        ON members(last_seen_at)
      `;
    })().catch((error) => {
      memberActivityColumnsPromise = null;
      throw error;
    });
  }

  await memberActivityColumnsPromise;
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
  await ensureMemberActivityColumns();

  const result = await sql`
    SELECT
      s.expires_at,
      s.member_id,
      m.last_seen_at
    FROM member_sessions s
    JOIN members m ON m.id = s.member_id
    WHERE s.token_hash = ${tokenHash}
      AND s.expires_at > NOW()
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

  const memberLastSeenAt = result.rows[0].last_seen_at
    ? new Date(result.rows[0].last_seen_at)
    : null;
  const memberSeenRefreshThreshold = new Date(
    Date.now() - 24 * 60 * 60 * 1000
  );

  if (!memberLastSeenAt || memberLastSeenAt < memberSeenRefreshThreshold) {
    await sql`
      UPDATE members
      SET last_seen_at = NOW()
      WHERE id = ${result.rows[0].member_id}
    `;
  }

  return { isAuthenticated: true, token, expires };
}
