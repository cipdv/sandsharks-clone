// // app/api/cron/weekly-email/route.js
// import { NextResponse } from "next/server";
// import { sendWeeklyPlayDayEmails } from "@/app/lib/email-service";

// // This ensures only Vercel cron jobs can trigger this endpoint
// const allowedOrigins = ["vercel.com", "vercel-insights.com"];

// export async function GET(request) {
//   try {
//     // Verify the request is coming from Vercel Cron
//     const requestOrigin = request.headers.get("x-vercel-cron") || "";
//     const isVercelCron = allowedOrigins.some((origin) =>
//       requestOrigin.includes(origin)
//     );

//     // For additional security, you can check for a secret token
//     const authHeader = request.headers.get("authorization") || "";
//     const token = authHeader.split(" ")[1]; // Extract token from "Bearer <token>"
//     const isValidToken = token === process.env.CRON_SECRET;

//     // In production, enforce security checks
//     if (
//       process.env.NODE_ENV === "production" &&
//       (!isVercelCron || !isValidToken)
//     ) {
//       return NextResponse.json(
//         {
//           success: false,
//           message: "Unauthorized",
//         },
//         { status: 401 }
//       );
//     }

//     // Send the weekly play day emails using the BCC approach
//     const result = await sendWeeklyPlayDayEmails();

//     return NextResponse.json({
//       success: true,
//       result,
//     });
//   } catch (error) {
//     console.error("Error in weekly email cron job:", error);
//     return NextResponse.json(
//       {
//         success: false,
//         error: error.message,
//       },
//       { status: 500 }
//     );
//   }
// }

// // // app/api/cron/weekly-email/route.js
// // import { NextResponse } from "next/server";
// // import { sql } from "@vercel/postgres";
// // import { Resend } from "resend";
// // import { WeeklyPlayDayEmail } from "@/components/emails/WeeklyPlayDayEmail";

// // export const dynamic = "force-dynamic";
// // export const revalidate = 0;

// // // This runs every Wednesday at 9:00 AM
// // export const config = {
// //   runtime: "edge",
// //   schedule: "0 9 * * 3", // Cron syntax: minute hour day month day-of-week
// // };

// // export async function GET() {
// //   try {
// //     // Initialize Resend
// //     const resend = new Resend(process.env.RESEND_API_KEY);

// //     // 1. Get all upcoming play days for the weekend
// //     const playDays = await getUpcomingWeekendPlayDays();

// //     // 2. Get all members who have opted in to emails
// //     const members = await getOptedInMembers();

// //     // 3. Send personalized emails to each member
// //     const results = await Promise.allSettled(
// //       members.map(async (member) => {
// //         await sendPlayDayEmail(resend, member, playDays);
// //       })
// //     );

// //     // Count successes and failures
// //     const successful = results.filter((r) => r.status === "fulfilled").length;
// //     const failed = results.filter((r) => r.status === "rejected").length;

// //     return NextResponse.json({
// //       success: true,
// //       message: `Sent ${successful} emails, ${failed} failed`,
// //     });
// //   } catch (error) {
// //     console.error("Weekly email cron job failed:", error);
// //     return NextResponse.json(
// //       { success: false, error: error.message },
// //       { status: 500 }
// //     );
// //   }
// // }

// // // Helper functions
// // async function getUpcomingWeekendPlayDays() {
// //   // Get play days for the upcoming weekend (Friday to Sunday)
// //   const today = new Date();
// //   const friday = new Date(today);
// //   friday.setDate(today.getDate() + (5 - today.getDay()));

// //   const sunday = new Date(friday);
// //   sunday.setDate(friday.getDate() + 2);

// //   const fridayStr = friday.toISOString().split("T")[0];
// //   const sundayStr = sunday.toISOString().split("T")[0];

// //   const result = await sql`
// //     SELECT
// //       pd.id,
// //       pd.title,
// //       pd.description,
// //       pd.date,
// //       pd.start_time,
// //       pd.end_time,
// //       pd.courts,
// //       pd.sponsor_id,
// //       pd.main_volunteer_id,
// //       pd.helper_volunteer_id,
// //       pd.created_at,
// //       pd.created_by,
// //       m.first_name AS created_by_first_name,
// //       m.last_name AS created_by_last_name,
// //       s.name AS sponsor_name,
// //       s.logo_url AS sponsor_logo,
// //       s.website_url AS sponsor_website,
// //       s.instagram_url AS sponsor_instagram,
// //       s.description AS sponsor_description,
// //       EXISTS(SELECT 1 FROM clinics c WHERE c.play_day_id = pd.id) AS has_clinic
// //     FROM
// //       play_days pd
// //     JOIN
// //       members m ON pd.created_by = m.id
// //     LEFT JOIN
// //       sponsors s ON pd.sponsor_id = s.id
// //     WHERE
// //       pd.date >= ${fridayStr} AND pd.date <= ${sundayStr}
// //     ORDER BY
// //       pd.date ASC
// //   `;

// //   // Process the results to include all related data
// //   const playDays = await Promise.all(
// //     result.rows.map(async (pd) => {
// //       // Format the data
// //       const playDay = {
// //         id: pd.id,
// //         title: pd.title,
// //         description: pd.description,
// //         date: pd.date ? pd.date.toISOString().split("T")[0] : null,
// //         startTime: pd.start_time,
// //         endTime: pd.end_time,
// //         courts: pd.courts,
// //         sponsorId: pd.sponsor_id,
// //         sponsorName: pd.sponsor_name,
// //         sponsorLogo: pd.sponsor_logo,
// //         sponsorWebsite: pd.sponsor_website,
// //         sponsorInstagram: pd.sponsor_instagram,
// //         sponsorDescription: pd.sponsor_description,
// //         mainVolunteerId: pd.main_volunteer_id,
// //         helperVolunteerId: pd.helper_volunteer_id,
// //         createdAt: pd.created_at,
// //         createdById: pd.created_by,
// //         postedBy: `${pd.created_by_first_name} ${pd.created_by_last_name}`,
// //         hasClinic: pd.has_clinic,
// //       };

// //       // Get volunteer information
// //       if (pd.main_volunteer_id) {
// //         const mainVolunteerResult = await sql`
// //           SELECT id, first_name, last_name
// //           FROM members
// //           WHERE id = ${pd.main_volunteer_id}
// //         `;
// //         if (mainVolunteerResult.rows.length > 0) {
// //           playDay.mainVolunteer = mainVolunteerResult.rows[0];
// //         }
// //       }

// //       if (pd.helper_volunteer_id) {
// //         const helperVolunteerResult = await sql`
// //           SELECT id, first_name, last_name
// //           FROM members
// //           WHERE id = ${pd.helper_volunteer_id}
// //         `;
// //         if (helperVolunteerResult.rows.length > 0) {
// //           playDay.helperVolunteer = helperVolunteerResult.rows[0];
// //         }
// //       }

// //       // Get attendance
// //       const attendanceResult = await sql`
// //         SELECT
// //           a.id,
// //           m.id AS member_id,
// //           m.first_name,
// //           m.last_name,
// //           m.profile_pic_url
// //         FROM
// //           attendance a
// //         JOIN
// //           members m ON a.member_id = m.id
// //         WHERE
// //           a.play_day_id = ${pd.id}
// //       `;

// //       playDay.replies = attendanceResult.rows.map((a) => ({
// //         id: a.id.toString(),
// //         firstName: a.first_name,
// //         lastName: a.last_name,
// //         name: `${a.first_name} ${a.last_name}`,
// //         userId: a.member_id.toString(),
// //         pic: a.profile_pic_url || "/images/sandsharks-rainbow-icon.svg",
// //       }));

// //       // Get clinic data if it exists
// //       if (pd.has_clinic) {
// //         const clinicResult = await sql`
// //           SELECT
// //             id,
// //             description,
// //             start_time,
// //             end_time,
// //             max_participants,
// //             courts
// //           FROM
// //             clinics
// //           WHERE
// //             play_day_id = ${pd.id}
// //         `;

// //         if (clinicResult.rows.length > 0) {
// //           const clinic = clinicResult.rows[0];

// //           // Get clinic attendance
// //           const clinicAttendanceResult = await sql`
// //             SELECT
// //               ca.id,
// //               m.id AS member_id,
// //               m.first_name,
// //               m.last_name,
// //               m.profile_pic_url
// //             FROM
// //               clinic_attendance ca
// //             JOIN
// //               members m ON ca.member_id = m.id
// //             WHERE
// //               ca.clinic_id = ${clinic.id}
// //           `;

// //           playDay.beginnerClinic = {
// //             beginnerClinicMessage: clinic.description,
// //             beginnerClinicStartTime: clinic.start_time,
// //             beginnerClinicEndTime: clinic.end_time,
// //             beginnerClinicCourts: clinic.courts,
// //             maxParticipants: clinic.max_participants,
// //             beginnerClinicReplies: clinicAttendanceResult.rows.map((a) => ({
// //               id: a.id.toString(),
// //               name: `${a.first_name} ${a.last_name}`,
// //               userId: a.member_id.toString(),
// //               pic: a.profile_pic_url || "/images/sandsharks-rainbow-icon.svg",
// //             })),
// //           };
// //         }
// //       }

// //       // Get updates
// //       const updatesResult = await sql`
// //         SELECT
// //           u.id,
// //           u.content,
// //           u.created_at,
// //           u.created_by,
// //           m.first_name,
// //           m.last_name
// //         FROM
// //           updates u
// //         JOIN
// //           members m ON u.created_by = m.id
// //         WHERE
// //           u.play_day_id = ${pd.id}
// //         ORDER BY
// //           u.created_at DESC
// //       `;

// //       playDay.updates = updatesResult.rows.map((u) => ({
// //         id: u.id,
// //         content: u.content,
// //         createdAt: u.created_at,
// //         createdById: u.created_by,
// //         createdByName: `${u.first_name} ${u.last_name}`,
// //       }));

// //       return playDay;
// //     })
// //   );

// //   return playDays;
// // }

// // async function getOptedInMembers() {
// //   const result = await sql`
// //     SELECT id, first_name, last_name, email
// //     FROM members
// //     WHERE email_list = true AND member_type != 'pending'
// //   `;

// //   return result.rows;
// // }

// // async function sendPlayDayEmail(resend, member, playDays) {
// //   // Generate a unique token for this member that will be used for one-click actions
// //   const token = await generateSecureToken(member.id);

// //   // Send the email using Resend's React email template
// //   await resend.emails.send({
// //     from: "Sandsharks <notifications@sandsharks.ca>",
// //     // to: member.email,
// //     to: "cip.devries",
// //     subject: `Weekend Play Days: ${formatDateRange(playDays)}`,
// //     react: WeeklyPlayDayEmail({
// //       member,
// //       playDays,
// //       token,
// //       baseUrl: process.env.NEXT_PUBLIC_APP_URL || "https://sandsharks.ca",
// //     }),
// //   });
// // }

// // // Helper to generate a secure token for one-click actions
// // async function generateSecureToken(memberId) {
// //   // In a real implementation, you'd use a JWT or similar
// //   // This is a simplified example
// //   const { SignJWT } = await import("jose");
// //   const secret = new TextEncoder().encode(process.env.NEXT_PUBLIC_JWT_SECRET);

// //   const token = await new SignJWT({ memberId })
// //     .setProtectedHeader({ alg: "HS256" })
// //     .setIssuedAt()
// //     .setExpirationTime("7d") // Token valid for 7 days
// //     .sign(secret);

// //   return token;
// // }

// // // Format date range for email subject
// // function formatDateRange(playDays) {
// //   if (!playDays || playDays.length === 0) return "No upcoming play days";

// //   const dates = playDays.map((pd) => new Date(pd.date));
// //   const firstDate = new Date(Math.min(...dates));
// //   const lastDate = new Date(Math.max(...dates));

// //   const options = { month: "short", day: "numeric" };

// //   if (firstDate.getTime() === lastDate.getTime()) {
// //     return firstDate.toLocaleDateString("en-US", options);
// //   }

// //   return `${firstDate.toLocaleDateString(
// //     "en-US",
// //     options
// //   )} - ${lastDate.toLocaleDateString("en-US", options)}`;
// // }
