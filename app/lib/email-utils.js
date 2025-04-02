import crypto from "crypto";

/**
 * Generates a secure signed URL for email actions like unsubscribe
 *
 * @param {string} action - The action to perform (e.g., 'unsubscribe')
 * @param {string|number} memberId - The member's ID
 * @param {number} expiresInSeconds - How long the link should be valid (default: 1 year)
 * @returns {string} The complete signed URL
 */
export function generateSecureEmailLink(
  action,
  memberId,
  expiresInSeconds = 31536000
) {
  if (!memberId) {
    console.error("Member ID is required for generating secure email links");
    throw new Error("Member ID is required");
  }

  // Convert memberId to string to ensure consistent type
  const memberIdStr = String(memberId);

  const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || "https://sandsharks.ca";
  const expires = Math.floor(Date.now() / 1000) + expiresInSeconds;

  // Create the data to sign
  const dataToSign = `action=${action}&id=${memberIdStr}&expires=${expires}`;

  // Generate the signature
  const signature = crypto
    .createHmac("sha256", process.env.EMAIL_SIGNATURE_SECRET)
    .update(dataToSign)
    .digest("hex");

  console.log("Generating secure email link:", {
    action,
    memberId: memberIdStr,
    expires,
    dataToSign,
    signature,
    secretKeyLength: process.env.EMAIL_SIGNATURE_SECRET?.length || 0,
  });

  // Return the complete URL
  return `${baseUrl}/email-action?action=${action}&id=${memberIdStr}&expires=${expires}&signature=${signature}`;
}

/**
 * Generates HTML for the email footer with unsubscribe link
 *
 * @param {string|number} memberId - The member's ID
 * @param {number} year - The current year for copyright notice
 * @returns {string} HTML for the email footer
 */
export function generateEmailFooter(memberId, year = new Date().getFullYear()) {
  const unsubscribeUrl = generateSecureEmailLink("unsubscribe", memberId);

  return `
    <div style="background-color: #f5f5f5; padding: 15px; text-align: center; font-size: 12px; color: #666666;">
      <p>© ${year} Sandsharks. All rights reserved.</p>
      <p style="margin-top: 10px;">
        <a href="${unsubscribeUrl}" style="color: #666666; text-decoration: underline;">Unsubscribe from emails</a>
      </p>
    </div>
  `;
}
