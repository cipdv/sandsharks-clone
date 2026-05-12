import nodemailer from "nodemailer";
import { sql } from "@vercel/postgres";
import {
  getLocalEmailSendCountForToday,
  getLocalEmailSendWindow,
  incrementLocalEmailSendCount,
} from "@/app/lib/local-email-dev";

export const LOCAL_DEV_GMAIL_DAILY_CAP = 280;
export const LOCAL_DEV_GMAIL_BATCH_SIZE = 20;
export const LOCAL_DEV_DELAY_BETWEEN_EMAILS_MS = 7000;
export const LOCAL_DEV_DELAY_BETWEEN_BATCHES_MS = 60000;

const runningJobs = new Set();

function delay(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

function simpleMarkdownToHtmlForLocalEmail(text) {
  return String(text || "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/\*\*(.*?)\*\*/g, "<strong>$1</strong>")
    .replace(/\*(.*?)\*/g, "<em>$1</em>")
    .replace(/\n/g, "<br>");
}

function buildLocalDevEmailHtml({ subject, bodyHtml }) {
  const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || "https://www.sandsharks.ca";
  const unsubscribeUrl = `${baseUrl}/unsubscribe`;

  return `
    <!DOCTYPE html>
    <html>
      <head>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>${subject}</title>
      </head>
      <body style="margin:0;padding:12px;background:#f3f7fb;font-family:Arial,sans-serif;color:#163045;">
        <div style="max-width:680px;margin:0 auto;background:#ffffff;border:1px solid #d9e3ef;border-radius:18px;overflow:hidden;">
          <div style="padding:24px;background:linear-gradient(135deg,#0d3b66 0%,#157a6e 100%);color:#ffffff;">
            <p style="margin:0 0 8px 0;font-size:12px;letter-spacing:0.12em;text-transform:uppercase;opacity:0.84;">Toronto Sandsharks</p>
            <h1 style="margin:0;font-size:28px;line-height:1.2;">${subject}</h1>
          </div>
          <div style="padding:24px;background:#ffffff;">
            <div style="font-size:16px;line-height:1.7;color:#24425c;">
              ${bodyHtml}
            </div>
          </div>
          <div style="padding:18px 24px;border-top:1px solid #d9e3ef;background:#f8fbfe;font-size:12px;line-height:1.6;color:#5f7387;">
            <p style="margin:0 0 8px 0;">Toronto Sandsharks Beach Volleyball League · <a href="${baseUrl}" style="color:#0d5ea6;">sandsharks.ca</a></p>
            <p style="margin:0;">If you no longer wish to receive emails from Sandsharks, <a href="${unsubscribeUrl}" style="color:#0d5ea6;">unsubscribe here</a>.</p>
          </div>
        </div>
      </body>
    </html>
  `;
}

export async function getLocalDevelopmentEmailJobProgress(jobId) {
  const countsResult = await sql`
    SELECT
      COUNT(*) AS total_count,
      COUNT(*) FILTER (WHERE status = 'sent') AS sent_count,
      COUNT(*) FILTER (WHERE status = 'queued') AS queued_count,
      COUNT(*) FILTER (WHERE status = 'failed') AS failed_count
    FROM local_dev_email_job_recipients
    WHERE job_id = ${jobId}
  `;

  return {
    totalCount: Number(countsResult.rows[0]?.total_count || 0),
    sentCount: Number(countsResult.rows[0]?.sent_count || 0),
    queuedCount: Number(countsResult.rows[0]?.queued_count || 0),
    failedCount: Number(countsResult.rows[0]?.failed_count || 0),
  };
}

export async function processLocalDevelopmentEmailJobInBackground(jobId) {
  if (runningJobs.has(jobId)) {
    return { started: false, reason: "already_running" };
  }

  runningJobs.add(jobId);

  try {
    const jobResult = await sql`
      SELECT id, subject, body, sender_email, reply_to_email
      FROM local_dev_email_jobs
      WHERE id = ${jobId}
      LIMIT 1
    `;

    if (jobResult.rows.length === 0) {
      return { started: false, reason: "not_found" };
    }

    const job = jobResult.rows[0];
    const emailUser = job.sender_email || process.env.EMAIL_USER || "sandsharks.org@gmail.com";
    const emailPass = process.env.EMAIL_PASS || process.env.SMTP_PASSWORD;

    if (!emailPass) {
      return { started: false, reason: "missing_password" };
    }

    const alreadySentToday = await getLocalEmailSendCountForToday();
    const remainingDailyAllowance = Math.max(
      LOCAL_DEV_GMAIL_DAILY_CAP - alreadySentToday,
      0,
    );

    if (remainingDailyAllowance === 0) {
      return { started: false, reason: "daily_cap_reached" };
    }

    await sql`
      UPDATE local_dev_email_jobs
      SET
        last_run_started_at = ${new Date()},
        last_run_completed_at = NULL,
        updated_at = ${new Date()}
      WHERE id = ${jobId}
    `;

    const progressBeforeSend = await getLocalDevelopmentEmailJobProgress(jobId);
    const pendingRecipientsResult = await sql`
      SELECT id, member_id, email, status
      FROM local_dev_email_job_recipients
      WHERE
        job_id = ${jobId}
        AND status IN ('queued', 'failed')
      ORDER BY
        CASE WHEN status = 'queued' THEN 0 ELSE 1 END,
        member_id ASC
      LIMIT ${remainingDailyAllowance}
    `;

    const recipientsToSend = pendingRecipientsResult.rows;
    if (recipientsToSend.length === 0) {
      await sql`
        UPDATE local_dev_email_jobs
        SET
          completed_at = COALESCE(completed_at, ${new Date()}),
          last_run_completed_at = ${new Date()},
          updated_at = ${new Date()}
        WHERE id = ${jobId}
      `;
      return { started: false, reason: "nothing_to_send", progress: progressBeforeSend };
    }

    const transporter = nodemailer.createTransport({
      service: "gmail",
      auth: {
        user: emailUser,
        pass: emailPass,
      },
    });

    const htmlBody = simpleMarkdownToHtmlForLocalEmail(job.body);
    const htmlMessage = buildLocalDevEmailHtml({
      subject: job.subject,
      bodyHtml: htmlBody,
    });

    const recipientBatches = [];
    for (let i = 0; i < recipientsToSend.length; i += LOCAL_DEV_GMAIL_BATCH_SIZE) {
      recipientBatches.push(recipientsToSend.slice(i, i + LOCAL_DEV_GMAIL_BATCH_SIZE));
    }

    let successCount = 0;

    for (const [batchIndex, batch] of recipientBatches.entries()) {
      console.log(
        `[local-email-send] Sending Gmail batch ${batchIndex + 1} of ${recipientBatches.length} (${batch.length} emails)`,
      );

      for (const [recipientIndex, member] of batch.entries()) {
        try {
          await transporter.sendMail({
            from: `"Sandsharks" <${emailUser}>`,
            to: member.email,
            replyTo: job.reply_to_email || process.env.REPLY_TO_EMAIL || emailUser,
            subject: job.subject,
            html: htmlMessage,
            text: `${job.body}`,
          });

          await sql`
            UPDATE local_dev_email_job_recipients
            SET
              status = 'sent',
              sent_at = ${new Date()},
              last_error = NULL,
              updated_at = ${new Date()}
            WHERE id = ${member.id}
          `;

          successCount += 1;
          console.log(
            `[local-email-send] Sent ${successCount}/${recipientsToSend.length} in this run to ${member.email}`,
          );
        } catch (error) {
          await sql`
            UPDATE local_dev_email_job_recipients
            SET
              status = 'failed',
              last_error = ${error?.message || "Unknown SMTP error"},
              updated_at = ${new Date()}
            WHERE id = ${member.id}
          `;

          console.error(
            `[local-email-send] Failed for ${member.email}:`,
            error?.message || error,
          );
        }

        const hasMoreEmails =
          recipientIndex < batch.length - 1 ||
          batchIndex < recipientBatches.length - 1;

        if (hasMoreEmails) {
          await delay(LOCAL_DEV_DELAY_BETWEEN_EMAILS_MS);
        }
      }

      if (batchIndex < recipientBatches.length - 1) {
        await delay(LOCAL_DEV_DELAY_BETWEEN_BATCHES_MS);
      }
    }

    if (successCount > 0) {
      await incrementLocalEmailSendCount(successCount);
    }

    const progressAfterSend = await getLocalDevelopmentEmailJobProgress(jobId);
    await sql`
      UPDATE local_dev_email_jobs
      SET
        last_run_completed_at = ${new Date()},
        completed_at = ${
          progressAfterSend.queuedCount === 0 && progressAfterSend.failedCount === 0
            ? new Date()
            : null
        },
        updated_at = ${new Date()}
      WHERE id = ${jobId}
    `;

    const sendWindow = await getLocalEmailSendWindow(LOCAL_DEV_GMAIL_DAILY_CAP);
    return {
      started: true,
      progress: progressAfterSend,
      nextSafeSendAt: sendWindow.nextSafeSendAt,
    };
  } finally {
    runningJobs.delete(jobId);
  }
}
