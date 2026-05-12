import { sql } from "@vercel/postgres";
import { NextResponse } from "next/server";
import { createHash } from "node:crypto";
import {
  chunkForResendBatch,
  isValidEmailAddress,
  sendResendBatchWithRetry,
} from "@/app/lib/email-sender";

export async function POST() {
  try {
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

    await sql`
      UPDATE email_jobs 
      SET status = 'processing', started_at = ${new Date()}
      WHERE id = ${job.id}
    `;

    const result = await processEmailJob(job);

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
      result,
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

    const membersResult = await sql`
      SELECT id, first_name, last_name, email
      FROM members
      WHERE email_list = true AND member_type != 'pending'
    `;

    if (membersResult.rows.length === 0) {
      return { success: false, message: "No members found" };
    }

    const members = membersResult.rows;

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
    const tokenMap = new Map(tokens.map((token) => [token.memberId, token.token]));

    let successCount = 0;
    let failureCount = 0;
    const invalidRecipients = [];
    const preparedEmails = [];

    console.log(
      `Processing email job ${job.id}: sending ${members.length} emails...`
    );

    for (const member of members) {
      const normalizedEmail = member.email?.trim().toLowerCase();

      if (!isValidEmailAddress(normalizedEmail)) {
        invalidRecipients.push(member.email || `member:${member.id}`);
        continue;
      }

      const token = tokenMap.get(member.id);
      const baseUrl =
        process.env.NEXT_PUBLIC_BASE_URL || "http://localhost:3000";
      const rsvpYesUrl = `${baseUrl}/api/rsvp/${token}?action=yes`;
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
    <div style="background-color: #1e40af; color: white; padding: 30px 20px; text-align: center;">
      <h1 style="margin: 0; font-size: 28px; font-weight: bold;">Sandsharks Beach Volleyball</h1>
    </div>

    <div style="padding: 30px 20px;">
      <h2 style="color: #1e40af; margin: 0 0 20px 0; font-size: 24px;">Hi ${member.first_name}!</h2>

      <div style="font-size: 16px; line-height: 1.6; color: #374151; margin: 0 0 30px 0;">
        <p>Oops, that's embarrassing, I made a typo in the button URL in the last email. Here's the real "I'll be there" button.</p>
        <p>Click the button below if you want to come play on August 4.</p>

        <div style="text-align: center; margin: 30px 0;">
          <a href="${rsvpYesUrl}" style="display: inline-block; background-color: #22c55e; color: white; padding: 15px 30px; text-decoration: none; border-radius: 8px; font-weight: bold; font-size: 16px;">
            I'll be there!
          </a>
        </div>

        <div style="text-align: center; margin: 20px 0;">
          <p style="font-size: 14px; color: #6b7280; margin: 0 0 10px 0;">
            If the RSVP button still doesn't work for you, reply to this email and let me know.
          </p>
          <p style="font-size: 14px; color: #6b7280; margin: 10px 0 0 0;">
            You can also manage your RSVP from your dashboard:
            <a href="${dashboardUrl}" style="color: #1e40af;"> ${dashboardUrl}</a>
          </p>
        </div>

        <div style="margin: 30px 0; padding: 20px; background-color: #f0f9ff; border-radius: 8px;">
          <p style="margin: 0; font-size: 16px; color: #1e40af; text-align: center;">
            Thanks everybody. See you on Friday.<br>
            <strong>-Cip</strong>
          </p>
        </div>
      </div>
    </div>

    <div style="background-color: #f8fafc; padding: 20px; text-align: center; border-top: 1px solid #e5e7eb;">
      <p>You're receiving this email because you're signed up as a member of <a href="https://www.sandsharks.ca">Toronto Sandsharks Beach Volleyball League</a>.</p>
      <p>If you no longer wish to receive emails from Sandsharks: <a href="https://www.sandsharks.ca/unsubscribe">click here to unsubscribe</a>.</p>
    </div>
  </div>
</body>
</html>
`;

      preparedEmails.push({
        from: "Sandsharks <sandsharks@sandsharks.ca>",
        to: [normalizedEmail],
        subject: "Oops, here's the real RSVP link for August 4!",
        html: emailHtml,
        replyTo: process.env.REPLY_TO_EMAIL || "sandsharks.org@gmail.com",
        tags: [
          { name: "email_type", value: "playday_announcement" },
          { name: "job_id", value: String(job.id) },
          { name: "play_day_id", value: String(job.play_day_id) },
        ],
      });
    }

    if (preparedEmails.length === 0) {
      return {
        success: false,
        message: "No valid member email addresses were found",
        recipientCount: 0,
        failureCount: invalidRecipients.length,
      };
    }

    const resendBatches = chunkForResendBatch(preparedEmails);

    for (const [batchIndex, batch] of resendBatches.entries()) {
      const idempotencyHash = createHash("sha256")
        .update(
          JSON.stringify({
            jobId: job.id,
            playDayId: job.play_day_id,
            subject: "Oops, here's the real RSVP link for August 4!",
            recipients: batch.map((email) => email.to[0]).sort(),
          })
        )
        .digest("hex")
        .slice(0, 20);

      const idempotencyKey = `email-job/${job.id}/batch/${batchIndex + 1}/${idempotencyHash}`;
      const { error } = await sendResendBatchWithRetry(
        batch,
        { idempotencyKey },
        { operationName: `email job ${job.id} batch ${batchIndex + 1}` }
      );

      if (error) {
        failureCount += batch.length;
        console.error(
          `[email-job] Batch ${batchIndex + 1} failed for job ${job.id}:`,
          error
        );
      } else {
        successCount += batch.length;
        console.log(
          `[email-job] Batch ${batchIndex + 1}/${resendBatches.length} sent (${batch.length} emails)`
        );
      }
    }

    console.log(
      `Job ${job.id} complete. Success: ${successCount}, Failed: ${failureCount}, Invalid: ${invalidRecipients.length}`
    );

    return {
      success: successCount > 0,
      message: "Emails sent successfully",
      recipientCount: successCount,
      failureCount: failureCount + invalidRecipients.length,
    };
  } catch (error) {
    console.error("Error in processEmailJob:", error);
    return {
      success: false,
      message: error.message,
    };
  }
}
