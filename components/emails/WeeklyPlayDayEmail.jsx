// // components/emails/WeeklyPlayDayEmail.jsx
// import { EmailTemplate } from "@/components/emails/EmailTemplate"

// export function renderWeeklyPlayDayEmail({
//   playDays,
//   baseUrl,
//   isPersonalized = false,
//   weeklyNote = null,
//   noteAuthor = null,
// }) {
//   // Helper function to format date - handles multiple date formats
//   const formatDate = (dateInput) => {
//     if (!dateInput) return "No date specified"

//     let date

//     // Check if dateInput is already a Date object
//     if (dateInput instanceof Date) {
//       date = dateInput
//     }
//     // Check if it's a string in ISO format (YYYY-MM-DD)
//     else if (typeof dateInput === "string" && dateInput.includes("-")) {
//       const [year, month, day] = dateInput.split("-")
//       date = new Date(year, month - 1, day)
//     }
//     // Handle PostgreSQL date objects which might be returned as objects with properties
//     else if (typeof dateInput === "object" && dateInput.toISOString) {
//       date = new Date(dateInput.toISOString())
//     }
//     // If all else fails, try to create a date directly
//     else {
//       try {
//         date = new Date(dateInput)
//       } catch (e) {
//         console.error("Invalid date format:", dateInput)
//         return "Date format error"
//       }
//     }

//     return date.toLocaleDateString("en-US", {
//       weekday: "long",
//       month: "long",
//       day: "numeric",
//     })
//   }

//   // Helper function to format time
//   const formatTime = (timeString) => {
//     if (!timeString) return "TBD"

//     const [hours, minutes] = timeString.split(":")
//     const date = new Date()
//     date.setHours(hours)
//     date.setMinutes(minutes)

//     return date.toLocaleTimeString("en-US", {
//       hour: "numeric",
//       minute: "2-digit",
//       hour12: true,
//     })
//   }

//   // Helper function to get volunteers for a play day
//   const getVolunteersHtml = (playDay) => {
//     if (!playDay.volunteers || playDay.volunteers.length === 0) {
//       return '<p style="color: #333333;">No volunteers yet</p>'
//     }

//     return `
//       <div style="margin-top: 10px;">
//         <p style="color: #333333;"><strong>Volunteers:</strong></p>
//         <ul style="margin-top: 5px; padding-left: 20px; color: #333333;">
//           ${playDay.volunteers.map((v) => `<li style="color: #333333;">${v.firstName} ${v.lastName}</li>`).join("")}
//         </ul>
//       </div>
//     `
//   }

//   // Generate the content for the email
//   const content = `
//     <p style="color: #333333;">Hey Sharks,</p>

//     ${weeklyNote ? `<p style="color: #333333;">${weeklyNote.replace(/\n/g, "<br>")}</p>` : ""}

//     ${
//       playDays.length === 0
//         ? `
//       <div style="margin-bottom: 25px; padding: 15px; background-color: #f0f9ff; border-left: 4px solid #3b82f6; border-radius: 3px;">
//         <h3 style="margin-top: 0; color: #333333;">No Play Days This Weekend</h3>
//         <p style="color: #333333;">There are no beach volleyball play days scheduled for this upcoming weekend.</p>
//         <p style="color: #333333;">Check back next week for updates or visit the dashboard to see upcoming events.</p>
//       </div>
//     `
//         : `<p style="color: #333333;">Here are the upcoming play days for this weekend:</p>`
//     }

//     ${playDays
//       .map(
//         (playDay) => `
//       <div style="margin-bottom: 25px; padding: 15px; background-color: #ffffff; border: 1px solid #e2e8f0; border-radius: 5px;">
//         <h3 style="margin-top: 0; color: #17677a;">${formatDate(playDay?.date)}</h3>
//         <p style="color: #333333;"><strong>Time:</strong> ${formatTime(playDay.start_time)} - ${formatTime(playDay.end_time)}</p>
//         <p style="color: #333333;"><strong>Courts:</strong> ${playDay.courts || "TBD"}</p>

//         ${getVolunteersHtml(playDay)}

//         <div style="margin-top: 15px;">
//           <a href="${baseUrl}/api/email-link?target=/dashboard/member&playDayId=${playDay.id}" style="display: inline-block; background-color: #2ebebe; color: white; padding: 10px 20px; text-decoration: none; border-radius: 8px; font-weight: bold;">View Details & RSVP</a>
//         </div>
//       </div>
//     `,
//       )
//       .join("")}

//     <p style="color: #333333;">See you on the sand!</p>
//     <p style="color: #333333;">-Cip</p>
//     <p style="color: #666666; font-size: 12px; margin-top: 20px; text-align: center;">
//       If you no longer wish to receive these emails, you can <a href="${baseUrl}/unsubscribe" style="color: #666666; text-decoration: underline;">unsubscribe here</a>.
//     </p>
//   `

//   // Use the EmailTemplate component to generate the full email
//   return EmailTemplate({
//     subject: playDays.length > 0 ? "Upcoming Play Days This Weekend" : "Sandsharks Weekly Update",
//     preheaderText:
//       playDays.length > 0
//         ? "Check out the upcoming play days this weekend"
//         : "Weekly update from Sandsharks Beach Volleyball",
//     content,
//     templateType: "event",
//   })
// }

// // // components/emails/WeeklyPlayDayEmail.jsx
// // import { EmailTemplate } from "@/components/emails/EmailTemplate";

// // export function renderWeeklyPlayDayEmail({
// //   playDays,
// //   baseUrl,
// //   isPersonalized = false,
// //   weeklyNote = null,
// //   noteAuthor = null,
// // }) {
// //   // Helper function to format date - handles multiple date formats
// //   const formatDate = (dateInput) => {
// //     if (!dateInput) return "No date specified";

// //     let date;

// //     // Check if dateInput is already a Date object
// //     if (dateInput instanceof Date) {
// //       date = dateInput;
// //     }
// //     // Check if it's a string in ISO format (YYYY-MM-DD)
// //     else if (typeof dateInput === "string" && dateInput.includes("-")) {
// //       const [year, month, day] = dateInput.split("-");
// //       date = new Date(year, month - 1, day);
// //     }
// //     // Handle PostgreSQL date objects which might be returned as objects with properties
// //     else if (typeof dateInput === "object" && dateInput.toISOString) {
// //       date = new Date(dateInput.toISOString());
// //     }
// //     // If all else fails, try to create a date directly
// //     else {
// //       try {
// //         date = new Date(dateInput);
// //       } catch (e) {
// //         console.error("Invalid date format:", dateInput);
// //         return "Date format error";
// //       }
// //     }

// //     return date.toLocaleDateString("en-US", {
// //       weekday: "long",
// //       month: "long",
// //       day: "numeric",
// //     });
// //   };

// //   // Helper function to format time
// //   const formatTime = (timeString) => {
// //     if (!timeString) return "TBD";

// //     const [hours, minutes] = timeString.split(":");
// //     const date = new Date();
// //     date.setHours(hours);
// //     date.setMinutes(minutes);

// //     return date.toLocaleTimeString("en-US", {
// //       hour: "numeric",
// //       minute: "2-digit",
// //       hour12: true,
// //     });
// //   };

// //   // Helper function to get volunteers for a play day
// //   const getVolunteersHtml = (playDay) => {
// //     if (!playDay.volunteers || playDay.volunteers.length === 0) {
// //       return '<p style="color: #333333;">No volunteers yet</p>';
// //     }

// //     return `
// //       <div style="margin-top: 10px;">
// //         <p style="color: #333333;"><strong>Volunteers:</strong></p>
// //         <ul style="margin-top: 5px; padding-left: 20px; color: #333333;">
// //           ${playDay.volunteers.map((v) => `<li style="color: #333333;">${v.firstName} ${v.lastName}</li>`).join("")}
// //         </ul>
// //       </div>
// //     `;
// //   };

// //   // Generate the content for the email
// //   const content = `
// //     <p style="color: #333333;">Hey Sharks,</p>

// //     ${weeklyNote ? `<p style="color: #333333;">${weeklyNote.replace(/\n/g, "<br>")}</p>` : ""}

// //     ${
// //       playDays.length === 0
// //         ? `
// //       <div style="margin-bottom: 25px; padding: 15px; background-color: #f0f9ff; border-left: 4px solid #3b82f6; border-radius: 3px;">
// //         <h3 style="margin-top: 0; color: #333333;">No Play Days This Weekend</h3>
// //         <p style="color: #333333;">There are no beach volleyball play days scheduled for this upcoming weekend.</p>
// //         <p style="color: #333333;">Check back next week for updates or visit the dashboard to see upcoming events.</p>
// //       </div>
// //     `
// //         : `<p style="color: #333333;">Here are the upcoming play days for this weekend:</p>`
// //     }

// //     ${playDays
// //       .map(
// //         (playDay) => `
// //       <div style="margin-bottom: 25px; padding: 15px; background-color: #ffffff; border: 1px solid #e2e8f0; border-radius: 5px;">
// //         <h3 style="margin-top: 0; color: #17677a;">${formatDate(playDay?.date)}</h3>
// //         <p style="color: #333333;"><strong>Time:</strong> ${formatTime(playDay.start_time)} - ${formatTime(playDay.end_time)}</p>
// //         <p style="color: #333333;"><strong>Courts:</strong> ${playDay.courts || "TBD"}</p>

// //         ${getVolunteersHtml(playDay)}

// //         <div style="margin-top: 15px;">
// //           <a href="${baseUrl}/dashboard/member" style="display: inline-block; background-color: #2ebebe; color: white; padding: 10px 20px; text-decoration: none; border-radius: 8px; font-weight: bold;">View Details & RSVP</a>
// //         </div>
// //       </div>
// //     `
// //       )
// //       .join("")}

// //     <p style="color: #333333;">See you on the sand!</p>
// //     <p style="color: #333333;">-Cip</p>
// //     <p style="color: #666666; font-size: 12px; margin-top: 20px; text-align: center;">
// //       If you no longer wish to receive these emails, you can <a href="${baseUrl}/unsubscribe" style="color: #666666; text-decoration: underline;">unsubscribe here</a>.
// //     </p>
// //   `;

// //   // Use the EmailTemplate component to generate the full email
// //   return EmailTemplate({
// //     subject:
// //       playDays.length > 0
// //         ? "Upcoming Play Days This Weekend"
// //         : "Sandsharks Weekly Update",
// //     preheaderText:
// //       playDays.length > 0
// //         ? "Check out the upcoming play days this weekend"
// //         : "Weekly update from Sandsharks Beach Volleyball",
// //     content,
// //     templateType: "event",
// //   });
// // }

// // // components/emails/WeeklyPlayDayEmail.jsx
// // import { EmailTemplate } from "@/components/emails/EmailTemplate";

// // export function renderWeeklyPlayDayEmail({
// //   playDays,
// //   baseUrl,
// //   isPersonalized = false,
// //   weeklyNote = null,
// //   noteAuthor = null,
// // }) {
// //   // Helper function to format date - handles multiple date formats
// //   const formatDate = (dateInput) => {
// //     if (!dateInput) return "No date specified";

// //     let date;

// //     // Check if dateInput is already a Date object
// //     if (dateInput instanceof Date) {
// //       date = dateInput;
// //     }
// //     // Check if it's a string in ISO format (YYYY-MM-DD)
// //     else if (typeof dateInput === "string" && dateInput.includes("-")) {
// //       const [year, month, day] = dateInput.split("-");
// //       date = new Date(year, month - 1, day);
// //     }
// //     // Handle PostgreSQL date objects which might be returned as objects with properties
// //     else if (typeof dateInput === "object" && dateInput.toISOString) {
// //       date = new Date(dateInput.toISOString());
// //     }
// //     // If all else fails, try to create a date directly
// //     else {
// //       try {
// //         date = new Date(dateInput);
// //       } catch (e) {
// //         console.error("Invalid date format:", dateInput);
// //         return "Date format error";
// //       }
// //     }

// //     return date.toLocaleDateString("en-US", {
// //       weekday: "long",
// //       month: "long",
// //       day: "numeric",
// //     });
// //   };

// //   // Helper function to format time
// //   const formatTime = (timeString) => {
// //     if (!timeString) return "TBD";

// //     const [hours, minutes] = timeString.split(":");
// //     const date = new Date();
// //     date.setHours(hours);
// //     date.setMinutes(minutes);

// //     return date.toLocaleTimeString("en-US", {
// //       hour: "numeric",
// //       minute: "2-digit",
// //       hour12: true,
// //     });
// //   };

// //   // Helper function to get volunteers for a play day
// //   const getVolunteersHtml = (playDay) => {
// //     if (!playDay.volunteers || playDay.volunteers.length === 0) {
// //       return '<p style="color: #333333;">No volunteers yet</p>';
// //     }

// //     return `
// //       <div style="margin-top: 10px;">
// //         <p style="color: #333333;"><strong>Volunteers:</strong></p>
// //         <ul style="margin-top: 5px; padding-left: 20px; color: #333333;">
// //           ${playDay.volunteers.map((v) => `<li style="color: #333333;">${v.firstName} ${v.lastName}</li>`).join("")}
// //         </ul>
// //       </div>
// //     `;
// //   };

// //   // Generate the content for the email
// //   const content = `
// //     <p style="color: #333333;">Hey Sharks,</p>

// //     ${weeklyNote ? `<p style="color: #333333;">${weeklyNote.replace(/\n/g, "<br>")}</p>` : ""}

// //     ${
// //       playDays.length === 0
// //         ? `
// //       <div style="margin-bottom: 25px; padding: 15px; background-color: #f0f9ff; border-left: 4px solid #3b82f6; border-radius: 3px;">
// //         <h3 style="margin-top: 0; color: #333333;">No Play Days This Weekend</h3>
// //         <p style="color: #333333;">There are no beach volleyball play days scheduled for this upcoming weekend.</p>
// //         <p style="color: #333333;">Check back next week for updates or visit the dashboard to see upcoming events.</p>
// //       </div>
// //     `
// //         : `<p style="color: #333333;">Here are the upcoming play days for this weekend:</p>`
// //     }

// //     ${playDays
// //       .map(
// //         (playDay) => `
// //       <div style="margin-bottom: 25px; padding: 15px; background-color: #ffffff; border: 1px solid #e2e8f0; border-radius: 5px;">
// //         <h3 style="margin-top: 0; color: #17677a;">${formatDate(playDay.date)}</h3>
// //         <p style="color: #333333;"><strong>Time:</strong> ${formatTime(playDay.start_time)} - ${formatTime(playDay.end_time)}</p>
// //         <p style="color: #333333;"><strong>Courts:</strong> ${playDay.courts || "TBD"}</p>

// //         ${getVolunteersHtml(playDay)}

// //         <div style="margin-top: 15px;">
// //           <a href="${baseUrl}/dashboard/member" style="display: inline-block; background-color: #2ebebe; color: white; padding: 10px 20px; text-decoration: none; border-radius: 8px; font-weight: bold;">View Details & RSVP</a>
// //         </div>
// //       </div>
// //     `
// //       )
// //       .join("")}

// //     <p style="color: #333333;">See you on the sand!</p>
// //     <p style="color: #333333;">-Cip</p>
// //   `;

// //   // Use the EmailTemplate component to generate the full email
// //   return EmailTemplate({
// //     subject:
// //       playDays.length > 0
// //         ? "Upcoming Play Days This Weekend"
// //         : "Sandsharks Weekly Update",
// //     preheaderText:
// //       playDays.length > 0
// //         ? "Check out the upcoming play days this weekend"
// //         : "Weekly update from Sandsharks Beach Volleyball",
// //     content,
// //     templateType: "event",
// //   });
// // }
