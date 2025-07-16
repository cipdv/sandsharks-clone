import { handleEmailRsvp } from "@/app/_actions.js";
import { NextResponse } from "next/server";

export async function GET(request, { params }) {
  const { token } = params;
  const { searchParams } = new URL(request.url);
  const action = searchParams.get("action") || "toggle";

  const result = await handleEmailRsvp(token, action);

  // Create a simple HTML response
  const html = `
    <!DOCTYPE html>
    <html>
    <head>
      <title>RSVP Response</title>
      <meta name="viewport" content="width=device-width, initial-scale=1">
      <style>
        body { 
          font-family: Arial, sans-serif; 
          max-width: 600px; 
          margin: 50px auto; 
          padding: 20px; 
          text-align: center;
          background-color: #f5f5f5;
        }
        .container {
          background: white;
          padding: 40px;
          border-radius: 8px;
          box-shadow: 0 2px 10px rgba(0,0,0,0.1);
        }
        .success { color: #22c55e; }
        .error { color: #ef4444; }
        .button {
          display: inline-block;
          padding: 12px 24px;
          background-color: #3b82f6;
          color: white;
          text-decoration: none;
          border-radius: 6px;
          margin-top: 20px;
        }
      </style>
    </head>
    <body>
      <div class="container">
        <h1>RSVP Response</h1>
        <p class="${result.success ? "success" : "error"}">
          ${result.message}
        </p>
        ${
          result.success && result.playDay
            ? `
          <p><strong>Event:</strong> ${result.playDay.title}</p>
          <p><strong>Date:</strong> ${new Date(
            result.playDay.date
          ).toLocaleDateString()}</p>
        `
            : ""
        }
        <a href="${
          process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3000"
        }/dashboard/member" class="button">
          View Dashboard
        </a>
      </div>
    </body>
    </html>
  `;

  return new NextResponse(html, {
    headers: { "Content-Type": "text/html" },
  });
}
