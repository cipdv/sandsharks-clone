export function formatDate(dateString) {
  const options = {
    weekday: "long",
    year: "numeric",
    month: "long",
    day: "numeric",
  };
  return new Date(dateString).toLocaleDateString("en-US", options);
}

export function formatTime(timeString) {
  // Convert "HH:MM:SS" to "HH:MM AM/PM"
  const [hours, minutes] = timeString.split(":");
  const hour = Number.parseInt(hours, 10);
  const ampm = hour >= 12 ? "PM" : "AM";
  const hour12 = hour % 12 || 12;
  return `${hour12}:${minutes} ${ampm}`;
}

// Add this to your utility functions (e.g., in lib/utils.js)
export function generateSignedUrl(action, memberId, secret) {
  const crypto = require("crypto");

  // Create a timestamp that expires in 1 year
  const expires = Math.floor(Date.now() / 1000) + 365 * 24 * 60 * 60;

  // Create the string to sign
  const stringToSign = `${action}:${memberId}:${expires}`;

  // Create the signature
  const signature = crypto
    .createHmac("sha256", secret)
    .update(stringToSign)
    .digest("hex");

  // Return the signed URL parameters
  return `action=${action}&id=${memberId}&expires=${expires}&signature=${signature}`;
}
