import { Resend } from "resend";
import * as EmailTemplates from "./email-templates";

/**
 * Centralized email sending function that uses the Resend API
 * and our email templates
 */
export async function sendEmail({
  to,
  subject,
  templateName,
  templateData,
  replyTo = "sandsharks.org@gmail.com",
}) {
  try {
    // Initialize Resend with API key
    const resend = new Resend(process.env.RESEND_API_KEY);

    // Get the appropriate template rendering function
    let htmlContent;

    switch (templateName) {
      case "welcome":
        htmlContent = EmailTemplates.renderWelcomeEmail(templateData);
        break;
      case "passwordReset":
        htmlContent = EmailTemplates.renderPasswordResetEmail(templateData);
        break;
      case "passwordResetConfirmation":
        htmlContent =
          EmailTemplates.renderPasswordResetConfirmationEmail(templateData);
        break;
      case "donationThankYou":
        htmlContent = EmailTemplates.renderDonationThankYouEmail(templateData);
        break;
      case "playDayAnnouncement":
        htmlContent =
          EmailTemplates.renderPlayDayAnnouncementEmail(templateData);
        break;
      case "playDayCancellation":
        htmlContent =
          EmailTemplates.renderPlayDayCancellationEmail(templateData);
        break;
      case "unsubscribeConfirmation":
        htmlContent =
          EmailTemplates.renderUnsubscribeConfirmationEmail(templateData);
        break;
      case "emailBlast":
        htmlContent = EmailTemplates.renderEmailBlastEmail(templateData);
        break;
      case "accountDeletion":
        htmlContent = EmailTemplates.renderAccountDeletionEmail(templateData);
        break;
      case "volunteerSignup":
        htmlContent = EmailTemplates.renderVolunteerSignupEmail(templateData);
        break;
      case "volunteerApproval":
        htmlContent = EmailTemplates.renderVolunteerApprovalEmail(templateData);
        break;
      case "sponsorApproval":
        htmlContent = EmailTemplates.renderSponsorApprovalEmail(templateData);
        break;
      case "sponsorRejection":
        htmlContent = EmailTemplates.renderSponsorRejectionEmail(templateData);
        break;
      case "seasonAnnouncement":
        htmlContent =
          EmailTemplates.renderSeasonAnnouncementEmail(templateData);
        break;
      default:
        throw new Error(`Unknown email template: ${templateName}`);
    }

    // Send the email using Resend
    const { data, error } = await resend.emails.send({
      from: "Sandsharks <sandsharks@sandsharks.ca>",
      to,
      reply_to: replyTo,
      subject: subject || templateData.subject,
      html: htmlContent,
    });

    if (error) {
      console.error(`Error sending ${templateName} email:`, error);
      return { success: false, error };
    }

    return { success: true, messageId: data?.id };
  } catch (error) {
    console.error("Error in sendEmail:", error);
    return { success: false, error: error.message };
  }
}

// Helper function to split an array into chunks of a specified size
function chunkArray(array, chunkSize) {
  const chunks = [];
  for (let i = 0; i < array.length; i += chunkSize) {
    chunks.push(array.slice(i, i + chunkSize));
  }
  return chunks;
}

/**
 * Sends a single email to multiple recipients using BCC
 * This is the most efficient way to send the same email to many recipients
 * Note: This doesn't allow for personalization, so it's best for mass announcements
 */
export async function sendBccEmail({
  recipients,
  subject,
  htmlContent,
  replyTo = "sandsharks.org@gmail.com",
}) {
  try {
    // Initialize Resend with API key
    const resend = new Resend(process.env.RESEND_API_KEY);

    // In development, send to test email only
    const toEmail =
      process.env.NODE_ENV === "development"
        ? "cip.devries@gmail.com"
        : "sandsharks.org@gmail.com"; // Send to ourselves as the main recipient

    // Format recipient emails for BCC
    const allBccEmails =
      process.env.NODE_ENV === "development"
        ? [
            "cip.devries@gmail.com",
            "sandsharks.org@gmail.com",
            "cip_devries@hotmail.com",
            "cippy_d@hotmail.com",
            "cdvsignupspare@gmail.com",
            "info@sandsharks.org",
          ]
        : recipients.map((recipient) => recipient.email);

    // If we're in development or have fewer than 50 recipients, send as a single email
    if (process.env.NODE_ENV === "development" || allBccEmails.length <= 50) {
      const { data, error } = await resend.emails.send({
        from: "Sandsharks <sandsharks@sandsharks.ca>",
        to: toEmail,
        bcc: allBccEmails,
        reply_to: replyTo,
        subject: subject,
        html: htmlContent,
      });

      if (error) {
        console.error(`Error sending BCC email:`, error);
        return { success: false, error };
      }

      return {
        success: true,
        messageId: data?.id,
        stats: {
          totalRecipients: allBccEmails.length,
          successCount: allBccEmails.length,
          failureCount: 0,
        },
      };
    }

    // For production with more than 50 recipients, split into batches
    const bccBatches = chunkArray(allBccEmails, 50);
    console.log(
      `Splitting ${allBccEmails.length} emails into ${bccBatches.length} BCC batches`
    );

    let successCount = 0;
    let failureCount = 0;
    const results = [];

    // Send each batch
    for (let i = 0; i < bccBatches.length; i++) {
      const batch = bccBatches[i];
      console.log(
        `Sending BCC batch ${i + 1} of ${bccBatches.length} with ${
          batch.length
        } recipients`
      );

      try {
        const { data, error } = await resend.emails.send({
          from: "Sandsharks <sandsharks@sandsharks.ca>",
          to: toEmail,
          bcc: batch,
          reply_to: replyTo,
          subject: subject,
          html: htmlContent,
        });

        if (error) {
          console.error(`Error sending BCC batch ${i + 1}:`, error);
          failureCount += batch.length;
          results.push({
            batch: i + 1,
            success: false,
            error: error,
            recipients: batch.length,
          });
        } else {
          successCount += batch.length;
          results.push({
            batch: i + 1,
            success: true,
            messageId: data?.id,
            recipients: batch.length,
          });
        }

        // Add a small delay between batches to avoid rate limiting
        if (i < bccBatches.length - 1) {
          await new Promise((resolve) => setTimeout(resolve, 1000));
        }
      } catch (error) {
        console.error(`Error sending BCC batch ${i + 1}:`, error);
        failureCount += batch.length;
        results.push({
          batch: i + 1,
          success: false,
          error: error.message,
          recipients: batch.length,
        });
      }
    }

    return {
      success: successCount > 0,
      stats: {
        totalRecipients: allBccEmails.length,
        successCount,
        failureCount,
        batchResults: results,
      },
    };
  } catch (error) {
    console.error("Error in sendBccEmail:", error);
    return { success: false, error: error.message };
  }
}

/**
 * Sends emails in batches to multiple recipients with rate limiting
 * This allows for personalization for each recipient but respects API rate limits
 */
export async function sendBatchEmails({
  recipients,
  templateName,
  commonTemplateData = {},
  subject,
  replyTo = "sandsharks.org@gmail.com",
  batchSize = 50,
  useThrottling = true,
}) {
  try {
    // If this is a mass email without critical personalization, use BCC method
    if (
      templateName === "emailBlast" ||
      templateName === "playDayAnnouncement" ||
      templateName === "playDayCancellation"
    ) {
      // For these template types, we'll use the BCC method which is much more efficient

      // Get a sample recipient to generate the template
      const sampleRecipient = recipients[0];

      // Generate the email content using the first recipient as a template
      // Note: This won't have personalization for each recipient
      let htmlContent;

      switch (templateName) {
        case "emailBlast":
          htmlContent = EmailTemplates.renderEmailBlastEmail({
            ...commonTemplateData,
            firstName: null, // No personalized greeting
            memberId: null, // No member ID for unsubscribe (we'll handle this differently)
            needsDonation: false, // No personalized donation message
          });
          break;
        case "playDayAnnouncement":
          htmlContent = EmailTemplates.renderPlayDayAnnouncementEmail({
            ...commonTemplateData,
            firstName: null,
            memberId: null,
          });
          break;
        case "playDayCancellation":
          htmlContent = EmailTemplates.renderPlayDayCancellationEmail({
            ...commonTemplateData,
            firstName: null,
            memberId: null,
          });
          break;
        default:
          // For other templates, fall back to the individual email method
          return sendThrottledBatchEmails({
            recipients,
            templateName,
            commonTemplateData,
            subject,
            replyTo,
            batchSize,
          });
      }

      // Send the email using BCC
      return sendBccEmail({
        recipients,
        subject,
        htmlContent,
        replyTo,
      });
    }

    // For templates that require personalization, use the throttled method
    return sendThrottledBatchEmails({
      recipients,
      templateName,
      commonTemplateData,
      subject,
      replyTo,
      batchSize,
    });
  } catch (error) {
    console.error("Error in batch email sending:", error);
    return { success: false, error: error.message };
  }
}

/**
 * Helper function to send emails with throttling to respect rate limits
 */
async function sendThrottledBatchEmails({
  recipients,
  templateName,
  commonTemplateData = {},
  subject,
  replyTo = "sandsharks.org@gmail.com",
  batchSize = 50,
}) {
  // Split recipients into batches
  const batches = [];
  for (let i = 0; i < recipients.length; i += batchSize) {
    batches.push(recipients.slice(i, i + batchSize));
  }

  let successCount = 0;
  let failureCount = 0;

  // Process each batch
  for (const [batchIndex, batch] of batches.entries()) {
    console.log(
      `Processing email batch ${batchIndex + 1} of ${batches.length} (${
        batch.length
      } recipients)`
    );

    // Process each recipient in the batch with throttling
    for (const [index, recipient] of batch.entries()) {
      try {
        // Throttle to respect Resend's rate limit (2 requests per second)
        if (index > 0) {
          // Wait 500ms between requests (2 per second)
          await new Promise((resolve) => setTimeout(resolve, 500));
        }

        const result = await sendEmail({
          to:
            process.env.NODE_ENV === "development"
              ? "cip.devries@gmail.com"
              : recipient.email,
          subject,
          templateName,
          templateData: {
            ...commonTemplateData,
            firstName: recipient.first_name,
            memberId: recipient.id.toString(),
            needsDonation: recipient.needsDonation,
          },
          replyTo,
        });

        if (result.success) {
          successCount++;
          console.log(
            `Successfully sent ${templateName} email to ${recipient.email} (${successCount}/${recipients.length})`
          );
        } else {
          failureCount++;
          console.error(
            `Failed to send ${templateName} email to ${recipient.email}:`,
            result.error
          );
        }
      } catch (error) {
        failureCount++;
        console.error(
          `Error sending ${templateName} email to ${recipient.email}:`,
          error
        );
      }
    }

    // Add a small delay between batches
    if (batchIndex < batches.length - 1) {
      await new Promise((resolve) => setTimeout(resolve, 1000));
    }
  }

  return {
    success: true,
    stats: {
      totalRecipients: recipients.length,
      successCount,
      failureCount,
    },
  };
}

// import { Resend } from "resend";
// import * as EmailTemplates from "./email-templates";

// /**
//  * Centralized email sending function that uses the Resend API
//  * and our email templates
//  */
// export async function sendEmail({
//   to,
//   subject,
//   templateName,
//   templateData,
//   replyTo = "sandsharks.org@gmail.com",
// }) {
//   try {
//     // Initialize Resend with API key
//     const resend = new Resend(process.env.RESEND_API_KEY);

//     // Get the appropriate template rendering function
//     let htmlContent;

//     switch (templateName) {
//       case "welcome":
//         htmlContent = EmailTemplates.renderWelcomeEmail(templateData);
//         break;
//       case "passwordReset":
//         htmlContent = EmailTemplates.renderPasswordResetEmail(templateData);
//         break;
//       case "passwordResetConfirmation":
//         htmlContent = EmailTemplates.renderPasswordResetConfirmationEmail(templateData)
//         break;
//       case "donationThankYou":
//         htmlContent = EmailTemplates.renderDonationThankYouEmail(templateData);
//         break;
//       case "playDayAnnouncement":
//         htmlContent =
//           EmailTemplates.renderPlayDayAnnouncementEmail(templateData);
//         break;
//       case "playDayCancellation":
//         htmlContent =
//           EmailTemplates.renderPlayDayCancellationEmail(templateData);
//         break;
//       case "unsubscribeConfirmation":
//         htmlContent =
//           EmailTemplates.renderUnsubscribeConfirmationEmail(templateData);
//         break;
//       case "emailBlast":
//         htmlContent = EmailTemplates.renderEmailBlastEmail(templateData);
//         break;
//       case "accountDeletion":
//         htmlContent = EmailTemplates.renderAccountDeletionEmail(templateData);
//         break;
//       case "volunteerSignup":
//         htmlContent = EmailTemplates.renderVolunteerSignupEmail(templateData);
//         break;
//       case "volunteerApproval":
//         htmlContent = EmailTemplates.renderVolunteerApprovalEmail(templateData);
//         break;
//       case "sponsorApproval":
//         htmlContent = EmailTemplates.renderSponsorApprovalEmail(templateData);
//         break;
//       case "sponsorRejection":
//         htmlContent = EmailTemplates.renderSponsorRejectionEmail(templateData);
//         break;
//       default:
//         throw new Error(`Unknown email template: ${templateName}`);
//     }

//     // Send the email using Resend
//     const { data, error } = await resend.emails.send({
//       from: "Sandsharks <sandsharks@sandsharks.ca>",
//       to,
//       reply_to: replyTo,
//       subject: subject || templateData.subject,
//       html: htmlContent,
//     });

//     if (error) {
//       console.error(`Error sending ${templateName} email:`, error);
//       return { success: false, error };
//     }

//     return { success: true, messageId: data?.id };
//   } catch (error) {
//     console.error("Error in sendEmail:", error);
//     return { success: false, error: error.message };
//   }
// }

// /**
//  * Sends a single email to multiple recipients using BCC
//  * This is the most efficient way to send the same email to many recipients
//  * Note: This doesn't allow for personalization, so it's best for mass announcements
//  */
// export async function sendBccEmail({
//   recipients,
//   subject,
//   htmlContent,
//   replyTo = "sandsharks.org@gmail.com",
// }) {
//   try {
//     // Initialize Resend with API key
//     const resend = new Resend(process.env.RESEND_API_KEY);

//     // In development, send to test email only
//     const toEmail =
//       process.env.NODE_ENV === "development"
//         ? "cip.devries@gmail.com"
//         : "sandsharks.org@gmail.com"; // Send to ourselves as the main recipient

//     // Format recipient emails for BCC
//     const bccEmails =
//       process.env.NODE_ENV === "development"
//         ? ["cip.devries@gmail.com", "sandsharks.org@gmail.com", "cip_devries@hotmail.com", "cippy_d@hotmail.com", "cdvsignupspare@gmail.com", "info@sandsharks.org"]

//         : recipients.map((recipient) => recipient.email);

//     // Send the email using Resend with BCC
//     const { data, error } = await resend.emails.send({
//       from: "Sandsharks <sandsharks@sandsharks.ca>",
//       to: toEmail,
//       bcc: bccEmails,
//       reply_to: replyTo,
//       subject: subject,
//       html: htmlContent,
//     });

//     if (error) {
//       console.error(`Error sending BCC email:`, error);
//       return { success: false, error };
//     }

//     return {
//       success: true,
//       messageId: data?.id,
//       stats: {
//         totalRecipients: recipients.length,
//         successCount: recipients.length,
//         failureCount: 0,
//       },
//     };
//   } catch (error) {
//     console.error("Error in sendBccEmail:", error);
//     return { success: false, error: error.message };
//   }
// }

// /**
//  * Sends emails in batches to multiple recipients with rate limiting
//  * This allows for personalization for each recipient but respects API rate limits
//  */
// export async function sendBatchEmails({
//   recipients,
//   templateName,
//   commonTemplateData = {},
//   subject,
//   replyTo = "sandsharks.org@gmail.com",
//   batchSize = 50,
//   useThrottling = true,
// }) {
//   try {
//     // If this is a mass email without critical personalization, use BCC method
//     if (
//       templateName === "emailBlast" ||
//       templateName === "playDayAnnouncement" ||
//       templateName === "playDayCancellation"
//     ) {
//       // For these template types, we'll use the BCC method which is much more efficient

//       // Get a sample recipient to generate the template
//       const sampleRecipient = recipients[0];

//       // Generate the email content using the first recipient as a template
//       // Note: This won't have personalization for each recipient
//       let htmlContent;

//       switch (templateName) {
//         case "emailBlast":
//           htmlContent = EmailTemplates.renderEmailBlastEmail({
//             ...commonTemplateData,
//             firstName: null, // No personalized greeting
//             memberId: null, // No member ID for unsubscribe (we'll handle this differently)
//             needsDonation: false, // No personalized donation message
//           });
//           break;
//         case "playDayAnnouncement":
//           htmlContent = EmailTemplates.renderPlayDayAnnouncementEmail({
//             ...commonTemplateData,
//             firstName: null,
//             memberId: null,
//           });
//           break;
//         case "playDayCancellation":
//           htmlContent = EmailTemplates.renderPlayDayCancellationEmail({
//             ...commonTemplateData,
//             firstName: null,
//             memberId: null,
//           });
//           break;
//         default:
//           // For other templates, fall back to the individual email method
//           return sendThrottledBatchEmails({
//             recipients,
//             templateName,
//             commonTemplateData,
//             subject,
//             replyTo,
//             batchSize,
//           });
//       }

//       // Send the email using BCC
//       return sendBccEmail({
//         recipients,
//         subject,
//         htmlContent,
//         replyTo,
//       });
//     }

//     // For templates that require personalization, use the throttled method
//     return sendThrottledBatchEmails({
//       recipients,
//       templateName,
//       commonTemplateData,
//       subject,
//       replyTo,
//       batchSize,
//     });
//   } catch (error) {
//     console.error("Error in batch email sending:", error);
//     return { success: false, error: error.message };
//   }
// }

// /**
//  * Helper function to send emails with throttling to respect rate limits
//  */
// async function sendThrottledBatchEmails({
//   recipients,
//   templateName,
//   commonTemplateData = {},
//   subject,
//   replyTo = "sandsharks.org@gmail.com",
//   batchSize = 50,
// }) {
//   // Split recipients into batches
//   const batches = [];
//   for (let i = 0; i < recipients.length; i += batchSize) {
//     batches.push(recipients.slice(i, i + batchSize));
//   }

//   let successCount = 0;
//   let failureCount = 0;

//   // Process each batch
//   for (const [batchIndex, batch] of batches.entries()) {
//     console.log(
//       `Processing email batch ${batchIndex + 1} of ${batches.length} (${batch.length} recipients)`
//     );

//     // Process each recipient in the batch with throttling
//     for (const [index, recipient] of batch.entries()) {
//       try {
//         // Throttle to respect Resend's rate limit (2 requests per second)
//         if (index > 0) {
//           // Wait 500ms between requests (2 per second)
//           await new Promise((resolve) => setTimeout(resolve, 500));
//         }

//         const result = await sendEmail({
//           to:
//             process.env.NODE_ENV === "development"
//               ? "cip.devries@gmail.com"
//               : recipient.email,
//           subject,
//           templateName,
//           templateData: {
//             ...commonTemplateData,
//             firstName: recipient.first_name,
//             memberId: recipient.id.toString(),
//             needsDonation: recipient.needsDonation,
//           },
//           replyTo,
//         });

//         if (result.success) {
//           successCount++;
//           console.log(
//             `Successfully sent ${templateName} email to ${recipient.email} (${successCount}/${recipients.length})`
//           );
//         } else {
//           failureCount++;
//           console.error(
//             `Failed to send ${templateName} email to ${recipient.email}:`,
//             result.error
//           );
//         }
//       } catch (error) {
//         failureCount++;
//         console.error(
//           `Error sending ${templateName} email to ${recipient.email}:`,
//           error
//         );
//       }
//     }

//     // Add a small delay between batches
//     if (batchIndex < batches.length - 1) {
//       await new Promise((resolve) => setTimeout(resolve, 1000));
//     }
//   }

//   return {
//     success: true,
//     stats: {
//       totalRecipients: recipients.length,
//       successCount,
//       failureCount,
//     },
//   };
// }
