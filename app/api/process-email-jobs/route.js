import { sql } from "@vercel/postgres";
import { NextResponse } from "next/server";

export async function POST(request) {
  try {
    // Get the oldest queued job
    const jobResult = await sql`
      SELECT * FROM email_jobs 
      WHERE status = 'queued' 
      ORDER BY created_at ASC 
      LIMIT 1
    `;

    if (jobResult.rows.length === 0) {
      return NextResponse.json({ message: "No jobs to process" });
    }

    const job = jobResult.rows[0];

    // Update job status to processing
    await sql`
      UPDATE email_jobs 
      SET status = 'processing', started_at = ${new Date()}
      WHERE id = ${job.id}
    `;

    // Process the emails
    const result = await processEmailJob(job);

    // Update job status with results
    await sql`
      UPDATE email_jobs 
      SET 
        status = ${result.success ? "completed" : "failed"},
        completed_at = ${new Date()},
        success_count = ${result.recipientCount || 0},
        failure_count = ${result.failureCount || 0},
        error_message = ${result.success ? null : result.message}
      WHERE id = ${job.id}
    `;

    return NextResponse.json({
      success: true,
      message: `Job ${job.id} processed`,
      result: result,
    });
  } catch (error) {
    console.error("Error processing email job:", error);
    return NextResponse.json(
      { success: false, message: "Error processing job" },
      { status: 500 }
    );
  }
}

async function processEmailJob(job) {
  try {
    // Get play day details
    const playDayResult = await sql`
      SELECT 
        id, title, description, date, start_time, end_time, courts,
        main_volunteer_id, helper_volunteer_id, sponsor_id
      FROM play_days
      WHERE id = ${job.play_day_id}
    `;

    if (playDayResult.rows.length === 0) {
      return { success: false, message: "Play day not found" };
    }

    const playDay = playDayResult.rows[0];

    // Get all members who have opted into emails
    const membersResult = await sql`
      SELECT id, first_name, last_name, email
      FROM members
      WHERE email_list = true AND member_type != 'pending'
    `;

    if (membersResult.rows.length === 0) {
      return { success: false, message: "No members found" };
    }

    const members = membersResult.rows;

    // Generate RSVP tokens
    const tokenPromises = members.map(async (member) => {
      const existingTokenResult = await sql`
        SELECT token FROM rsvp_tokens
        WHERE play_day_id = ${job.play_day_id} 
        AND member_id = ${member.id}
        AND expires_at > NOW()
        AND used = FALSE
      `;

      if (existingTokenResult.rows.length > 0) {
        return {
          memberId: member.id,
          token: existingTokenResult.rows[0].token,
        };
      }

      const expiresAt = new Date();
      expiresAt.setDate(expiresAt.getDate() + 7);

      const tokenResult = await sql`
        INSERT INTO rsvp_tokens (play_day_id, member_id, expires_at)
        VALUES (${job.play_day_id}, ${member.id}, ${expiresAt})
        ON CONFLICT (play_day_id, member_id)
        DO UPDATE SET 
          expires_at = ${expiresAt},
          used = FALSE
        RETURNING token
      `;

      return {
        memberId: member.id,
        token: tokenResult.rows[0].token,
      };
    });

    const tokens = await Promise.all(tokenPromises);
    const tokenMap = new Map(tokens.map((t) => [t.memberId, t.token]));

    // Format date and time
    const date = new Date(playDay.date);
    const formattedDate = date.toLocaleDateString("en-US", {
      weekday: "long",
      year: "numeric",
      month: "long",
      day: "numeric",
    });

    const formatTime = (timeString) => {
      const [hours, minutes] = timeString.split(":");
      const hour = Number.parseInt(hours);
      const ampm = hour >= 12 ? "PM" : "AM";
      const displayHour = hour % 12 || 12;
      return `${displayHour}:${minutes} ${ampm}`;
    };

    const timeRange = `${formatTime(playDay.start_time)} - ${formatTime(
      playDay.end_time
    )}`;

    // Send emails with rate limiting
    const { Resend } = await import("resend");
    const resend = new Resend(process.env.RESEND_API_KEY);

    const delay = (ms) => new Promise((resolve) => setTimeout(resolve, ms));
    const RATE_LIMIT_DELAY = 700;

    let successCount = 0;
    let failureCount = 0;

    console.log(
      `Processing email job ${job.id}: sending ${members.length} emails...`
    );

    for (let i = 0; i < members.length; i++) {
      const member = members[i];

      try {
        const token = tokenMap.get(member.id);
        const baseUrl =
          process.env.NEXT_PUBLIC_BASE_URL || "http://localhost:3000";

        const rsvpYesUrl = `${baseUrl}/api/rsvp/${token}?action=yes`;
        const rsvpNoUrl = `${baseUrl}/api/rsvp/${token}?action=no`;
        const dashboardUrl = `${baseUrl}/dashboard/member`;

        const emailHtml = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Sandsharks Play Day - ${playDay.title}</title>
</head>
<body style="margin: 0; padding: 0; font-family: Arial, sans-serif; background-color: #f5f5f5;">
  <div style="max-width: 600px; margin: 0 auto; background-color: white;">
    <!-- Header -->
    <div style="background-color: #1e40af; color: white; padding: 30px 20px; text-align: center;">
      <h1 style="margin: 0; font-size: 28px; font-weight: bold;">Sandsharks Beach Volleyball</h1>
    </div>

    <!-- Content -->
    <div style="padding: 30px 20px;">
      <h2 style="color: #1e40af; margin: 0 0 20px 0; font-size: 24px;">Hi ${
        member.first_name
      }!</h2>
      
      <div style="font-size: 16px; line-height: 1.6; color: #374151; margin: 0 0 30px 0;">
        <p>We'll be playing Friday nights for the next few weeks as the OVA and Volleyball Canada have all the courts booked over the next 5 weekends, PLUS I'm planning to set up on Monday August 4 for the long weekend!</p>
        
        <p>I've been chatting with TSVL (our sister indoor volleyball league) about organizing a big ol' gay crossover event on August 4: <strong>Sandsharks x Spartans!</strong></p>
        
        <p><strong>Here's what I'm thinking:</strong></p>
        <ul style="margin: 10px 0; padding-left: 20px;">
          <li>Open play from 9am - 12pm</li>
          <li>Learn-to-play from 10am - 12pm for any indoor players who want to learn how to apply their skills to 2v2 beach volleyball</li>
          <li>Beach volleyball "Sandsharks style" tournament from 12-3pm</li>
        </ul>
        
        <p>The tournament is for everyone! All skill levels are welcome to play (it's all about having fun afterall). The tournament would be totally voluntary, people can continue to play regular games as usual.</p>
        
        <p><strong>For those who want to play in the tournament, here's how it'll work:</strong></p>
        <ul style="margin: 10px 0; padding-left: 20px;">
          <li>every game you'll be randomly assigned a partner</li>
          <li>at the end of every game each player will record the points their team earned that game</li>
          <li>at the end of all the games, the individual players with the most total points will battle it out for the top spot in a round of "queens" style best of 3 series (4 players total, each player plays one game with each other player for a total of 3 games). The player with the most total points from those 3 games will become the winner and crowned the first-ever <strong>SuperShark!</strong></li>
        </ul>
        
        <p>So all that being said, I'd like to get a sense of how many people will be around for August 4 to play. If you want to come play, regardless of playing the tournament style or just regular gameplay, can you click the button below by July 20 to let me know 🙂</p>
        
        <p>(don't worry, you can still sign up later by logging in to sandsharks.ca, I just want to get a rough idea now of how many people to expect).</p>
      </div>

      

      ${
        job.custom_message
          ? `
        <div style="background-color: #fef3c7; border-left: 4px solid #f59e0b; padding: 20px; margin: 20px 0;">
          <p style="margin: 0; font-size: 16px; color: #92400e; line-height: 1.6;">${job.custom_message}</p>
        </div>
      `
          : ""
      }

      <!-- RSVP Buttons -->
      <div style="text-align: center; margin: 30px 0;">
        <div style="display: inline-block;">
          <a href="${rsvpYesUrl}" 
             style="display: inline-block; background-color: #22c55e; color: white; padding: 15px 30px; text-decoration: none; border-radius: 8px; font-weight: bold; font-size: 16px; margin: 0 10px;">
            🏐 I'll be there!
          </a>
          
          
        </div>
      </div>

      <div style="text-align: center; margin: 20px 0;">
        <p style="font-size: 14px; color: #6b7280; margin: 0 0 10px 0;">
          Testing out this new RSVP button in emails, so if it doesn't work for you let me know.
        </p>
        
      </div>

      <div style="margin: 30px 0; padding: 20px; background-color: #f0f9ff; border-radius: 8px;">
        <p style="margin: 0; font-size: 16px; color: #1e40af; text-align: center;">
          Thanks everybody! See you on Friday 🙂<br>
          <strong>-Cip</strong>
        </p>
      </div>
    </div>

    <!-- Footer -->
    <div style="background-color: #f8fafc; padding: 20px; text-align: center; border-top: 1px solid #e5e7eb;">
              <p>You're receiving this email because you're signed up as a member of <a href="https://www.sandsharks.ca">Toronto Sandsharks Beach Volleyball League</a>.</p>

             <p>If you no longer wish to receive emails from Sandsharks: <a href="https://www.sandsharks.ca/unsubscribe">click here to unsubscribe</a>.</p>
    </div>
  </div>
</body>
</html>
`;

        await resend.emails.send({
          from: "sandsharks@sandsharks.ca",
          to: member.email,

          subject: `Sandsharks Play Day: ${playDay.title} - ${formattedDate}`,
          html: emailHtml,
          replyTo: process.env.REPLY_TO_EMAIL || "sandsharks.org@gmail.com",
        });

        successCount++;
        console.log(
          `✅ Email ${i + 1}/${members.length} sent to ${member.email}`
        );
      } catch (error) {
        failureCount++;
        console.error(
          `❌ Email ${i + 1}/${members.length} failed for ${member.email}:`,
          error.message
        );
      }

      if (i < members.length - 1) {
        await delay(RATE_LIMIT_DELAY);
      }
    }

    console.log(
      `Job ${job.id} complete. Success: ${successCount}, Failed: ${failureCount}`
    );

    return {
      success: true,
      message: `Emails sent successfully`,
      recipientCount: successCount,
      failureCount: failureCount,
    };
  } catch (error) {
    console.error("Error in processEmailJob:", error);
    return {
      success: false,
      message: error.message,
    };
  }
}
