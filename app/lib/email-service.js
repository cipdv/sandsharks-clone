// app/lib/email-service.js
import { renderWeeklyPlayDayEmail } from "@/components/emails/WeeklyPlayDayEmail";
import { Resend } from "resend";
import { sql } from "@vercel/postgres";
import { markNoteAsSent, getNextPendingNote } from "@/app/_actions";

export async function sendWeeklyPlayDayEmails() {
  try {
    // Check for required environment variables
    const resendApiKey = process.env.RESEND_API_KEY;
    if (!resendApiKey) {
      throw new Error("RESEND_API_KEY environment variable is not set");
    }

    // Initialize Resend
    const resend = new Resend(resendApiKey);

    // Get the base URL for links
    const baseUrl = process.env.NEXT_PUBLIC_APP_URL || "https://sandsharks.ca";

    // Get upcoming play days for the weekend
    const today = new Date();
    const friday = new Date(today);
    friday.setDate(today.getDate() + ((5 - today.getDay() + 7) % 7)); // Next Friday

    const sunday = new Date(friday);
    sunday.setDate(friday.getDate() + 2); // Sunday after Friday

    // Format dates for SQL query
    const fridayStr = friday.toISOString().split("T")[0];
    const sundayStr = sunday.toISOString().split("T")[0];

    // Get play days for the weekend that are not cancelled
    const playDaysResult = await sql`
      SELECT * FROM play_days 
      WHERE date >= ${fridayStr} 
      AND date <= ${sundayStr}
      AND (is_cancelled IS NULL OR is_cancelled = false)
      ORDER BY date ASC
    `;

    // Process play days to include clinic information and volunteers
    const playDays = await Promise.all(
      playDaysResult.rows.map(async (playDay) => {
        // Check if there's a clinic for this play day
        const clinicResult = await sql`
          SELECT * FROM clinics WHERE play_day_id = ${playDay.id}
        `;

        const hasClinic = clinicResult.rows.length > 0;

        // Get volunteer information directly from members table
        const volunteers = [];

        // Add main volunteer if exists
        if (playDay.main_volunteer_id) {
          const mainVolunteerResult = await sql`
            SELECT id, first_name as "firstName", last_name as "lastName"
            FROM members
            WHERE id = ${playDay.main_volunteer_id}
          `;

          if (mainVolunteerResult.rows.length > 0) {
            volunteers.push({
              ...mainVolunteerResult.rows[0],
              role: "Main Volunteer",
            });
          }
        }

        // Add helper volunteer if exists
        if (playDay.helper_volunteer_id) {
          const helperVolunteerResult = await sql`
            SELECT id, first_name as "firstName", last_name as "lastName"
            FROM members
            WHERE id = ${playDay.helper_volunteer_id}
          `;

          if (helperVolunteerResult.rows.length > 0) {
            volunteers.push({
              ...helperVolunteerResult.rows[0],
              role: "Helper Volunteer",
            });
          }
        }

        return {
          ...playDay,
          hasClinic,
          beginnerClinic: hasClinic ? clinicResult.rows[0] : null,
          volunteers,
        };
      })
    );

    // Get the next pending weekly note if any
    const weeklyNoteResult = await getNextPendingNote();

    let weeklyNote = null;
    let noteAuthor = null;
    let noteId = null;

    if (weeklyNoteResult.success && weeklyNoteResult.note) {
      weeklyNote = weeklyNoteResult.note.content;
      noteId = weeklyNoteResult.note.id;

      // Get author name if there's a note
      if (weeklyNoteResult.note.created_by) {
        const authorResult = await sql`
          SELECT first_name, last_name 
          FROM members 
          WHERE id = ${weeklyNoteResult.note.created_by}
        `;

        if (authorResult.rows.length > 0) {
          noteAuthor = `${authorResult.rows[0].first_name} ${authorResult.rows[0].last_name}`;
        }
      }
    }

    // Get members who want to receive emails
    const membersResult = await sql`
      SELECT id, first_name, last_name, email 
      FROM members 
      WHERE email_list = true
    `;

    // If there are no members to email, return early
    if (membersResult.rows.length === 0) {
      console.log(
        "No members found who want to receive emails. No emails sent."
      );
      return {
        success: true,
        totalEmails: 0,
        message: "No members found who want to receive emails",
      };
    }

    // Extract just the email addresses for BCC
    const bccEmails = membersResult.rows.map((member) => member.email);

    // Render the non-personalized email HTML
    const emailHtml = renderWeeklyPlayDayEmail({
      playDays,
      baseUrl,
      isPersonalized: false,
      weeklyNote,
      noteAuthor,
    });

    // Determine the subject line based on whether there are play days
    const subject =
      playDays.length > 0
        ? "Upcoming Play Days This Weekend"
        : "Sandsharks Weekly Update - No Play Days This Weekend";

    // Send a single email with all recipients in BCC
    const { data, error } = await resend.emails.send({
      from: "Sandsharks <notifications@sandsharks.ca>",
      to: "cip.devries@gmail.com",
      // to: "notifications@sandsharks.ca", // Send to ourselves as the primary recipient
      // bcc: bccEmails, // All members in BCC
      subject: subject,
      html: emailHtml,
    });

    if (error) {
      console.error("Error sending weekly play day email:", error);
      return {
        success: false,
        error: error,
      };
    }

    // If the email was sent successfully and we used a note, mark it as sent
    if (noteId) {
      await markNoteAsSent(noteId);
    }

    console.log(
      `Successfully sent weekly play day email to ${bccEmails.length} members`
    );
    return {
      success: true,
      totalEmails: 1, // Just one email sent with multiple BCC recipients
      recipientCount: bccEmails.length,
      messageId: data?.id,
      noteUsed: noteId ? true : false,
    };
  } catch (error) {
    console.error("Error sending weekly play day emails:", error);
    return {
      success: false,
      error: error.message,
    };
  }
}
