// app/api/test-weekly-email/route.js
import { NextResponse } from "next/server";
import { sendWeeklyPlayDayEmails } from "@/app/lib/email-service";

export async function GET() {
  try {
    const result = await sendWeeklyPlayDayEmails();

    return NextResponse.json({
      success: true,
      result,
    });
  } catch (error) {
    console.error("Error testing weekly email:", error);
    return NextResponse.json(
      {
        success: false,
        error: error.message,
      },
      { status: 500 }
    );
  }
}
