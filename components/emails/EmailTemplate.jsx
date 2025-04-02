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
  const logoUrl = `${baseUrl}/images/sandsharks-rainbow-icon.svg`;

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
              <img src="${logoUrl}" alt="Toronto Sandsharks Logo" />
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
