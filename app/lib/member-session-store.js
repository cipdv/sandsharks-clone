import { sql } from "@vercel/postgres";
import { createHash, randomBytes } from "node:crypto";

const SESSION_MAX_AGE_DAYS = 30;
const SESSION_REFRESH_THRESHOLD_DAYS = 15;
const SESSION_COOKIE_NAME = "session";

let memberSessionsTablePromise;
let memberActivityColumnsPromise;

function hashSessionToken(token) {
  return createHash("sha256").update(token).digest("hex");
}

function sessionExpiresAt() {
  return new Date(Date.now() + SESSION_MAX_AGE_DAYS * 24 * 60 * 60 * 1000);
}

export function getSessionCookieOptions(expires = sessionExpiresAt()) {
  return {
    expires,
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
  };
}

export function getExpiredSessionCookieOptions() {
  return {
    expires: new Date(0),
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
  };
}

export function getSessionCookieName() {
  return SESSION_COOKIE_NAME;
}

export async function ensureMemberActivityColumns() {
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

export async function ensureMemberSessionsTable() {
  if (!memberSessionsTablePromise) {
    memberSessionsTablePromise = (async () => {
      await ensureMemberActivityColumns();

      await sql`
        CREATE TABLE IF NOT EXISTS member_sessions (
          token_hash TEXT PRIMARY KEY,
          member_id INTEGER NOT NULL REFERENCES members(id) ON DELETE CASCADE,
          expires_at TIMESTAMPTZ NOT NULL,
          created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
          last_seen_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
        )
      `;

      await sql`
        CREATE INDEX IF NOT EXISTS idx_member_sessions_member_id
        ON member_sessions(member_id)
      `;

      await sql`
        CREATE INDEX IF NOT EXISTS idx_member_sessions_expires_at
        ON member_sessions(expires_at)
      `;
    })().catch((error) => {
      memberSessionsTablePromise = null;
      throw error;
    });
  }

  await memberSessionsTablePromise;
}

export function mapMemberRowToSessionUser(memberData) {
  return {
    id: memberData.id,
    _id: memberData.id.toString(),
    firstName: memberData.first_name,
    lastName: memberData.last_name,
    email: memberData.email,
    memberType: memberData.member_type,
    pronouns: memberData.pronouns,
    about: memberData.about,
    profilePic: memberData.profile_pic_url
      ? {
          status: memberData.profile_pic_status,
          url: memberData.profile_pic_url,
        }
      : undefined,
    createdAt: memberData.created_at,
    instagramHandle: memberData.instagram_handle,
  };
}

export async function createMemberSession(memberId) {
  await ensureMemberSessionsTable();

  const token = randomBytes(32).toString("base64url");
  const tokenHash = hashSessionToken(token);
  const expires = sessionExpiresAt();
  const now = new Date();

  await sql`
    INSERT INTO member_sessions (token_hash, member_id, expires_at)
    VALUES (${tokenHash}, ${memberId}, ${expires})
  `;

  await sql`
    UPDATE members
    SET
      last_login_at = ${now},
      last_seen_at = ${now}
    WHERE id = ${memberId}
  `;

  return { token, expires };
}

export async function deleteMemberSession(token) {
  if (!token) return;

  await ensureMemberSessionsTable();
  await sql`
    DELETE FROM member_sessions
    WHERE token_hash = ${hashSessionToken(token)}
  `;
}

export async function getMemberSession(token) {
  if (!token) return null;

  await ensureMemberSessionsTable();

  const result = await sql`
    SELECT
      s.expires_at,
      m.last_seen_at,
      m.id,
      m.first_name,
      m.last_name,
      m.email,
      m.member_type,
      m.pronouns,
      m.about,
      m.profile_pic_url,
      m.profile_pic_status,
      m.created_at,
      m.instagram_handle
    FROM member_sessions s
    JOIN members m ON m.id = s.member_id
    WHERE s.token_hash = ${hashSessionToken(token)}
      AND s.expires_at > NOW()
    LIMIT 1
  `;

  if (result.rows.length === 0) {
    await deleteMemberSession(token);
    return null;
  }

  const row = result.rows[0];
  const expiresAt = new Date(row.expires_at);
  const refreshAfter = new Date(
    Date.now() + SESSION_REFRESH_THRESHOLD_DAYS * 24 * 60 * 60 * 1000
  );

  let expires = expiresAt;
  if (expiresAt < refreshAfter) {
    expires = sessionExpiresAt();
    await sql`
      UPDATE member_sessions
      SET expires_at = ${expires}, last_seen_at = NOW()
      WHERE token_hash = ${hashSessionToken(token)}
    `;
  } else {
    await sql`
      UPDATE member_sessions
      SET last_seen_at = NOW()
      WHERE token_hash = ${hashSessionToken(token)}
    `;
  }

  const memberLastSeenAt = row.last_seen_at
    ? new Date(row.last_seen_at)
    : null;
  const memberSeenRefreshThreshold = new Date(
    Date.now() - 24 * 60 * 60 * 1000
  );

  if (!memberLastSeenAt || memberLastSeenAt < memberSeenRefreshThreshold) {
    await sql`
      UPDATE members
      SET last_seen_at = NOW()
      WHERE id = ${row.id}
    `;
  }

  return {
    resultObj: mapMemberRowToSessionUser(row),
    expires,
  };
}
