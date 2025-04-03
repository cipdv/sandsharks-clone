/**
 * Base email template component that provides consistent styling and structure
 * for all emails sent from the Sandsharks application.
 */
export function EmailTemplate({
  subject,
  preheaderText,
  content,
  memberId,
  templateType = "default",
}) {
  // Get the base URL from environment or default to production URL
  const baseUrl =
    process.env.NEXT_PUBLIC_BASE_URL || "https://www.sandsharks.ca";


  // Use absolute URL for logo to ensure it works in emails
  const logoUrl = `data:image/png;base64,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`;

  return `
      <!DOCTYPE html>
      <html>
        <head>
          <meta charset="utf-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
          <title>${subject}</title>
          ${preheaderText ? `<meta name="description" content="${preheaderText}">` : ""}
          <style>
            body {
              font-family: Arial, sans-serif;
              line-height: 1.6;
              color: #333;
              margin: 0;
              padding: 0;
              -webkit-text-size-adjust: 100%;
              -ms-text-size-adjust: 100%;
            }
            .email-container {
              max-width: 600px;
              margin: 0 auto;
            }
            .email-header {
              background-color: ${getHeaderColor(templateType)};
              padding: 20px;
              text-align: center;
            }
            .email-header img {
              max-height: 60px;
              margin-bottom: 10px;
            }
            .email-header h1 {
              color: white;
              margin: 0;
              font-size: 24px;
              font-weight: bold;
            }
            .email-content {
              padding: 20px;
              background-color: #ffffff;
            }
            .email-footer {
              background-color: #f5f5f5;
              padding: 15px;
              text-align: center;
              font-size: 12px;
              color: #666666;
            }
            .email-footer a {
              color: #666666;
              text-decoration: underline;
            }
            @media screen and (max-width: 600px) {
              .email-container {
                width: 100% !important;
              }
            }
          </style>
        </head>
        <body>
          <div class="email-container">
            <div class="email-header">
              <h1>Toronto Sandsharks Beach Volleyball</h1>
            </div>
            
            <div class="email-content">
              ${content}
            </div>
        

            <div class="email-footer">
              <p>You're receiving this email because you're signed up as a member of <a href="https://www.sandsharks.ca">Toronto Sandsharks Beach Volleyball League</a>.</p>

              ${
                memberId
                  ? generateUnsubscribeLink(memberId, baseUrl)
                  : `<p>If you no longer wish to receive emails from Sandsharks: <a href="${baseUrl}/unsubscribe">click here to unsubscribe</a>.</p>`
              }
            </div>
          </div>
        </body>
      </html>
    `;
}

// Helper function to generate unsubscribe link with proper signature
function generateUnsubscribeLink(memberId, baseUrl) {
  if (memberId) {
    // Since we're in a server component, we can use the Node.js crypto module
    const crypto = require("crypto");
    const expires = Math.floor(Date.now() / 1000 + 31536000); // 1 year from now

    // Create the data to sign
    const dataToSign = `action=unsubscribe&id=${memberId}&expires=${expires}`;

    // Generate the signature
    const signature = crypto
      .createHmac("sha256", process.env.EMAIL_SIGNATURE_SECRET)
      .update(dataToSign)
      .digest("hex");

    // Return the complete unsubscribe link HTML
    return `<p><a href="${baseUrl}/email-action?action=unsubscribe&id=${memberId}&expires=${expires}&signature=${signature}" style="color: #666666; text-decoration: underline;">Unsubscribe from emails</a></p>`;
  } else {
    // For bulk emails, use the generic unsubscribe page
    return `<p><a href="${baseUrl}/unsubscribe" style="color: #666666; text-decoration: underline;">Unsubscribe from emails</a></p>`;
  }
}

// Helper function to get header color based on template type
function getHeaderColor(templateType) {
  switch (templateType) {
    case "event":
      return "#ff6600"; // Orange for events
    case "update":
      return "#009933"; // Green for updates
    case "alert":
      return "#cc0000"; // Red for alerts
    default:
      return "#0066cc"; // Blue for default emails
  }
}

// /**
//  * Base email template component that provides consistent styling and structure
//  * for all emails sent from the Sandsharks application.
//  */
// export function EmailTemplate({
//   subject,
//   preheaderText,
//   content,
//   memberId,
//   templateType = "default",
// }) {
//   // Get the base URL from environment or default to production URL
//   const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || "https://sandsharks.ca";

//   // Use absolute URL for logo to ensure it works in emails
//   const logoUrl = `${baseUrl}/images/sandsharks-rainbow-icon.svg`;

//   return `
//       <!DOCTYPE html>
//       <html>
//         <head>
//           <meta charset="utf-8">
//           <meta name="viewport" content="width=device-width, initial-scale=1.0">
//           <title>${subject}</title>
//           ${preheaderText ? `<meta name="description" content="${preheaderText}">` : ""}
//           <style>
//             body {
//               font-family: Arial, sans-serif;
//               line-height: 1.6;
//               color: #333;
//               margin: 0;
//               padding: 0;
//               -webkit-text-size-adjust: 100%;
//               -ms-text-size-adjust: 100%;
//             }
//             .email-container {
//               max-width: 600px;
//               margin: 0 auto;
//             }
//             .email-header {
//               background-color: ${getHeaderColor(templateType)};
//               padding: 20px;
//               text-align: center;
//             }
//             .email-header img {
//               max-height: 60px;
//               margin-bottom: 10px;
//             }
//             .email-header h1 {
//               color: white;
//               margin: 0;
//               font-size: 24px;
//               font-weight: bold;
//             }
//             .email-content {
//               padding: 20px;
//               background-color: #ffffff;
//             }
//             .email-footer {
//               background-color: #f5f5f5;
//               padding: 15px;
//               text-align: center;
//               font-size: 12px;
//               color: #666666;
//             }
//             .email-footer a {
//               color: #666666;
//               text-decoration: underline;
//             }
//             @media screen and (max-width: 600px) {
//               .email-container {
//                 width: 100% !important;
//               }
//             }
//           </style>
//         </head>
//         <body>
//           <div class="email-container">
//             <div class="email-header">
//               <img src="${logoUrl}" alt="Toronto Sandsharks Logo" />
//               <h1>Toronto Sandsharks Beach Volleyball</h1>
//             </div>

//             <div class="email-content">
//               ${content}
//             </div>

//             <div class="email-footer">
//               <p>You're receiving this email because you're signed up as a member of <a href="https://www.sandsharks.ca">Toronto Sandsharks Beach Volleyball League</a>.</p>
//               ${
//                 memberId
//                   ? generateUnsubscribeLink(memberId, baseUrl)
//                   : `<p>If you no longer wish to receive emails from Sandsharks: <a href="${baseUrl}/unsubscribe">click here to unsubscribe</a>.</p>`
//               }
//             </div>
//           </div>
//         </body>
//       </html>
//     `;
// }

// // Helper function to generate unsubscribe link with proper signature
// function generateUnsubscribeLink(memberId, baseUrl) {
//   // Since we're in a server component, we can use the Node.js crypto module
//   const crypto = require("crypto");
//   const expires = Math.floor(Date.now() / 1000 + 31536000); // 1 year from now

//   // Create the data to sign
//   const dataToSign = `action=unsubscribe&id=${memberId}&expires=${expires}`;

//   // Generate the signature
//   const signature = crypto
//     .createHmac("sha256", process.env.EMAIL_SIGNATURE_SECRET)
//     .update(dataToSign)
//     .digest("hex");

//   // Return the complete unsubscribe link HTML
//   return `<p><a href="${baseUrl}/email-action?action=unsubscribe&id=${memberId}&expires=${expires}&signature=${signature}">Unsubscribe from emails</a></p>`;
// }

// // Helper function to get header color based on template type
// function getHeaderColor(templateType) {
//   switch (templateType) {
//     case "event":
//       return "#d69e78"; // Orange for events
//     case "update":
//       return "#009933"; // Green for updates
//     case "alert":
//       return "#cc0000"; // Red for alerts
//     default:
//       return "#0066cc"; // Blue for default emails
//   }
// }
