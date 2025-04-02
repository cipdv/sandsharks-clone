import { sql } from "@vercel/postgres";

export async function getUpcomingPlayDays(userId = null) {
  const today = new Date().toISOString().split("T")[0];

  // Base query to get upcoming play days
  const query = `
    SELECT 
      p.id, 
      p.title, 
      p.content, 
      p.date, 
      p.start_time, 
      p.end_time, 
      p.home_court,
      (
        SELECT json_build_object(
          'id', c.id,
          'start_time', c.start_time,
          'end_time', c.end_time,
          'description', c.description
        )
        FROM clinics c
        WHERE c.post_id = p.id
      ) as clinic,
      (
        SELECT COUNT(*) 
        FROM rsvps r 
        WHERE r.post_id = p.id
      ) as rsvp_count,
      ${
        userId
          ? `
        (
          SELECT EXISTS(
            SELECT 1 
            FROM rsvps r 
            WHERE r.post_id = p.id AND r.user_id = ${userId}
          )
        ) as user_rsvp,
      `
          : "false as user_rsvp,"
      }
      (
        SELECT json_build_object(
          'id', u.id,
          'name', u.first_name || ' ' || u.last_name
        )
        FROM users u
        WHERE u.id = p.main_volunteer_id
      ) as main_volunteer,
      (
        SELECT json_build_object(
          'id', u.id,
          'name', u.first_name || ' ' || u.last_name
        )
        FROM users u
        WHERE u.id = p.helper_volunteer_id
      ) as helper_volunteer
    FROM 
      posts p
    WHERE 
      p.date >= $1
    ORDER BY 
      p.date ASC
    LIMIT 6
  `;

  try {
    const playDays = await sql.query(query, [today]);
    return playDays.rows;
  } catch (error) {
    console.error("Database error:", error);
    return [];
  }
}

export async function getPlayDayById(id, userId = null) {
  const query = `
    SELECT 
      p.id, 
      p.title, 
      p.content, 
      p.date, 
      p.start_time, 
      p.end_time, 
      p.home_court,
      p.created_at,
      (
        SELECT json_build_object(
          'id', c.id,
          'start_time', c.start_time,
          'end_time', c.end_time,
          'description', c.description
        )
        FROM clinics c
        WHERE c.post_id = p.id
      ) as clinic,
      (
        SELECT COUNT(*) 
        FROM rsvps r 
        WHERE r.post_id = p.id
      ) as rsvp_count,
      ${
        userId
          ? `
        (
          SELECT EXISTS(
            SELECT 1 
            FROM rsvps r 
            WHERE r.post_id = p.id AND r.user_id = ${userId}
          )
        ) as user_rsvp,
      `
          : "false as user_rsvp,"
      }
      (
        SELECT json_build_object(
          'id', u.id,
          'name', u.first_name || ' ' || u.last_name
        )
        FROM users u
        WHERE u.id = p.main_volunteer_id
      ) as main_volunteer,
      (
        SELECT json_build_object(
          'id', u.id,
          'name', u.first_name || ' ' || u.last_name
        )
        FROM users u
        WHERE u.id = p.helper_volunteer_id
      ) as helper_volunteer,
      (
        SELECT json_agg(
          json_build_object(
            'id', upd.id,
            'content', upd.content,
            'created_at', upd.created_at
          )
        )
        FROM updates upd
        WHERE upd.post_id = p.id
        ORDER BY upd.created_at DESC
      ) as updates,
      (
        SELECT json_agg(
          json_build_object(
            'id', c.id,
            'content', c.content,
            'created_at', c.created_at,
            'user', json_build_object(
              'id', u.id,
              'name', u.first_name || ' ' || u.last_name,
              'profile_pic_url', u.profile_pic_url
            )
          )
        )
        FROM comments c
        JOIN users u ON c.user_id = u.id
        WHERE c.post_id = p.id
        ORDER BY c.created_at DESC
      ) as comments
    FROM 
      posts p
    WHERE 
      p.id = $1
  `;

  try {
    const results = await sql.query(query, [id]);
    return results.rows[0] || null;
  } catch (error) {
    console.error("Database error:", error);
    return null;
  }
}
