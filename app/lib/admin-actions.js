"use server";

import { sql } from "@vercel/postgres";
import { revalidatePath } from "next/cache";

// Function to get the current user (placeholder - replace with your auth logic)
const getCurrentUser = async () => {
  // In a real app, you'd get the user from the session
  // For now, we'll return a mock ultrashark user
  return {
    id: 1,
    memberType: "ultrashark",
  };
};

// Create a new play day
export async function createPost(formData) {
  try {
    const user = await getCurrentUser();

    if (user?.memberType !== "ultrashark") {
      return {
        success: false,
        message: "You must be logged in as an admin to create a play day",
      };
    }

    // Extract play day data
    const {
      title,
      content,
      date,
      startTime,
      endTime,
      homeCourt,
      hasClinic,
      clinicStartTime,
      clinicEndTime,
      clinicDescription,
    } = formData;

    // Insert play day
    const playDayResult = await sql`
      INSERT INTO posts (
        title, 
        content, 
        date, 
        start_time, 
        end_time, 
        home_court,
        created_at,
        updated_at
      ) 
      VALUES (
        ${title}, 
        ${content}, 
        ${date}, 
        ${startTime}, 
        ${endTime}, 
        ${homeCourt},
        NOW(),
        NOW()
      )
      RETURNING id
    `;

    const playDayId = playDayResult.rows[0].id;

    // Create clinic if offered
    if (hasClinic && clinicStartTime && clinicEndTime) {
      await sql`
        INSERT INTO clinics (
          post_id,
          start_time,
          end_time,
          description,
          created_at,
          updated_at
        )
        VALUES (
          ${playDayId},
          ${clinicStartTime},
          ${clinicEndTime},
          ${clinicDescription || ""},
          NOW(),
          NOW()
        )
      `;
    }

    revalidatePath("/dashboard/ultrashark");
    revalidatePath("/");
    return { success: true, message: "Play day created successfully!" };
  } catch (error) {
    console.error("Error creating play day:", error);
    return {
      success: false,
      message: "Failed to create play day. Please try again.",
    };
  }
}

// Update an existing play day
export async function updatePost(formData) {
  try {
    const user = await getCurrentUser();

    if (user?.memberType !== "ultrashark") {
      return {
        success: false,
        message: "You must be logged in as an admin to update a play day",
      };
    }

    const {
      postId,
      title,
      content,
      date,
      startTime,
      endTime,
      homeCourt,
      hasClinic,
      clinicStartTime,
      clinicEndTime,
      clinicDescription,
    } = formData;

    // Update play day
    await sql`
      UPDATE posts
      SET 
        title = ${title},
        content = ${content},
        date = ${date},
        start_time = ${startTime},
        end_time = ${endTime},
        home_court = ${homeCourt},
        updated_at = NOW()
      WHERE id = ${postId}
    `;

    // Check if clinic exists for this play day
    const clinicResult = await sql`
      SELECT id FROM clinics WHERE post_id = ${postId}
    `;

    const clinicExists = clinicResult.rows.length > 0;

    if (hasClinic && clinicStartTime && clinicEndTime) {
      if (clinicExists) {
        // Update existing clinic
        await sql`
          UPDATE clinics
          SET 
            start_time = ${clinicStartTime},
            end_time = ${clinicEndTime},
            description = ${clinicDescription || ""},
            updated_at = NOW()
          WHERE post_id = ${postId}
        `;
      } else {
        // Create new clinic
        await sql`
          INSERT INTO clinics (
            post_id,
            start_time,
            end_time,
            description,
            created_at,
            updated_at
          )
          VALUES (
            ${postId},
            ${clinicStartTime},
            ${clinicEndTime},
            ${clinicDescription || ""},
            NOW(),
            NOW()
          )
        `;
      }
    } else if (clinicExists) {
      // Remove clinic if it exists but is no longer needed
      await sql`
        DELETE FROM clinics WHERE post_id = ${postId}
      `;
    }

    revalidatePath("/dashboard/ultrashark");
    revalidatePath(`/play-days/${postId}`);
    revalidatePath("/");
    return { success: true, message: "Play day updated successfully!" };
  } catch (error) {
    console.error("Error updating play day:", error);
    return {
      success: false,
      message: "Failed to update play day. Please try again.",
    };
  }
}

// Delete a play day
export async function deletePost(postId) {
  try {
    const user = await getCurrentUser();

    if (user?.memberType !== "ultrashark") {
      return {
        success: false,
        message: "You must be logged in as an admin to delete a play day",
      };
    }

    // Delete play day (cascade will delete related records)
    await sql`
      DELETE FROM posts WHERE id = ${postId}
    `;

    revalidatePath("/dashboard/ultrashark");
    revalidatePath("/");
    return { success: true, message: "Play day deleted successfully!" };
  } catch (error) {
    console.error("Error deleting play day:", error);
    return {
      success: false,
      message: "Failed to delete play day. Please try again.",
    };
  }
}

// Get all play days for admin dashboard
export async function getAdminPlayDays() {
  try {
    const user = await getCurrentUser();

    if (user?.memberType !== "ultrashark") {
      return [];
    }

    const result = await sql`
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
        ) as rsvp_count
      FROM 
        posts p
      ORDER BY 
        p.date DESC
    `;

    return result.rows;
  } catch (error) {
    console.error("Error fetching admin play days:", error);
    return [];
  }
}

// Add an update to a play day
export async function addPlayDayUpdate(formData) {
  try {
    const user = await getCurrentUser();

    if (user?.memberType !== "ultrashark") {
      return {
        success: false,
        message: "You must be logged in as an admin to add updates",
      };
    }

    const { postId, content } = formData;

    await sql`
      INSERT INTO updates (
        post_id,
        content,
        created_at,
        updated_at
      )
      VALUES (
        ${postId},
        ${content},
        NOW(),
        NOW()
      )
    `;

    revalidatePath(`/play-days/${postId}`);
    return { success: true, message: "Update added successfully!" };
  } catch (error) {
    console.error("Error adding update:", error);
    return {
      success: false,
      message: "Failed to add update. Please try again.",
    };
  }
}
