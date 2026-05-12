import { handleEmailRsvp } from "@/app/_actions.js";
import { NextResponse } from "next/server";

export async function GET(request, { params }) {
  const { token } = params;
  const { searchParams } = new URL(request.url);
  const action = searchParams.get("action") || "toggle";
  const baseUrl =
    process.env.NEXT_PUBLIC_BASE_URL || "https://www.sandsharks.ca";
  const logoUrl = `${baseUrl}/images/sandsharks-logo.png`;

  const result = await handleEmailRsvp(token, action);
  const headingText = result.success
    ? action === "no"
      ? "Cancelled"
      : "Confirmed"
    : "Unable to update RSVP";
  const statusClass = result.success ? "success" : "error";
  const accentClass = result.success ? "accent-success" : "accent-error";

  const html = `
    <!DOCTYPE html>
    <html>
    <head>
      <title>${headingText} | Toronto Sandsharks</title>
      <meta name="viewport" content="width=device-width, initial-scale=1">
      <style>
        :root {
          color-scheme: light;
          --sand: #fff7ed;
          --ink: #0f172a;
          --slate: #475569;
          --line: rgba(15, 23, 42, 0.12);
          --blue: #0d5ea6;
          --orange: #ea580c;
          --green: #15803d;
          --red: #b91c1c;
          --card: rgba(255, 255, 255, 0.92);
        }
        body { 
          margin: 0;
          min-height: 100vh;
          padding: 24px;
          font-family: Arial, sans-serif;
          color: var(--ink);
          background:
            radial-gradient(circle at top left, rgba(13, 94, 166, 0.18), transparent 32%),
            radial-gradient(circle at bottom right, rgba(234, 88, 12, 0.16), transparent 30%),
            linear-gradient(180deg, #fffaf3 0%, #f7fbff 100%);
        }
        .shell {
          max-width: 720px;
          margin: 0 auto;
        }
        .card {
          background: var(--card);
          border: 1px solid var(--line);
          border-radius: 28px;
          overflow: hidden;
          box-shadow: 0 24px 60px rgba(15, 23, 42, 0.12);
          backdrop-filter: blur(8px);
        }
        .hero {
          padding: 28px 28px 22px;
          text-align: center;
          color: white;
          background: linear-gradient(135deg, var(--blue) 0%, #1d4ed8 54%, var(--orange) 100%);
        }
        .hero img {
          width: 76px;
          height: 76px;
          display: block;
          margin: 0 auto 16px;
          border-radius: 18px;
          background: rgba(255,255,255,0.95);
          padding: 10px;
          box-sizing: border-box;
        }
        .eyebrow {
          margin: 0 0 8px;
          font-size: 12px;
          letter-spacing: 0.18em;
          text-transform: uppercase;
          opacity: 0.92;
        }
        .hero h1 {
          margin: 0;
          font-size: 52px;
          line-height: 0.95;
          font-weight: 800;
          letter-spacing: -0.04em;
          text-transform: lowercase;
        }
        .content {
          padding: 28px;
          text-align: center;
        }
        .status-copy {
          margin: 0 auto 24px;
          max-width: 520px;
          font-size: 18px;
          line-height: 1.7;
          color: var(--slate);
        }
        .status-copy.success {
          color: var(--green);
        }
        .status-copy.error {
          color: var(--red);
        }
        .accent-success {
          background: linear-gradient(180deg, rgba(21, 128, 61, 0.12), rgba(21, 128, 61, 0.04));
          border-color: rgba(21, 128, 61, 0.24);
        }
        .accent-error {
          background: linear-gradient(180deg, rgba(185, 28, 28, 0.10), rgba(185, 28, 28, 0.03));
          border-color: rgba(185, 28, 28, 0.22);
        }
        .details {
          margin: 0 auto 24px;
          max-width: 520px;
          padding: 22px;
          border: 1px solid var(--line);
          border-radius: 22px;
          text-align: left;
        }
        .details p {
          margin: 0 0 10px;
          color: var(--slate);
          font-size: 16px;
        }
        .details p:last-child {
          margin-bottom: 0;
        }
        .details strong {
          color: var(--ink);
        }
        .button {
          display: inline-block;
          padding: 14px 24px;
          background-color: var(--orange);
          color: white;
          text-decoration: none;
          border-radius: 999px;
          margin-top: 8px;
          font-weight: 700;
          box-shadow: 0 12px 28px rgba(234, 88, 12, 0.28);
        }
        .button:hover {
          background-color: #c2410c;
        }
        .footer {
          margin-top: 18px;
          text-align: center;
          color: var(--slate);
          font-size: 14px;
        }
        .footer a {
          color: var(--blue);
          text-decoration: none;
        }
        @media (max-width: 640px) {
          body {
            padding: 14px;
          }
          .hero,
          .content {
            padding: 22px 18px;
          }
          .hero h1 {
            font-size: 40px;
          }
        }
      </style>
    </head>
    <body>
      <div class="shell">
        <div class="card">
          <div class="hero">
            <img src="${logoUrl}" alt="Toronto Sandsharks Logo">
            <p class="eyebrow">Toronto Sandsharks</p>
            <h1>${headingText}</h1>
          </div>
          <div class="content">
            <p class="status-copy ${statusClass}">
          ${result.message}
            </p>
        ${
          result.success && result.playDay
            ? `
            <div class="details ${accentClass}">
              <p><strong>Event:</strong> ${result.playDay.title}</p>
              <p><strong>Date:</strong> ${new Date(
                result.playDay.date,
              ).toLocaleDateString("en-CA", {
                weekday: "long",
                month: "long",
                day: "numeric",
                year: "numeric",
              })}</p>
            </div>
        `
            : ""
        }
            <a href="${baseUrl}/dashboard/member" class="button">
          View Dashboard
        </a>
            <p class="footer">
              Back to <a href="${baseUrl}">sandsharks.ca</a>
            </p>
          </div>
        </div>
      </div>
    </body>
    </html>
  `;

  return new NextResponse(html, {
    headers: { "Content-Type": "text/html" },
  });
}
