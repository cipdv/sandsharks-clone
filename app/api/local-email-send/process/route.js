import { NextResponse } from "next/server";
import { getSession } from "@/app/lib/auth";
import { processLocalDevelopmentEmailJobInBackground } from "@/app/lib/local-email-send-service";

export async function POST(request) {
  try {
    if (process.env.NODE_ENV !== "development") {
      return NextResponse.json(
        { success: false, message: "Local email processing is only available in development mode." },
        { status: 403 },
      );
    }

    const session = await getSession();
    const user = session?.resultObj;

    if (!user || user.memberType !== "ultrashark") {
      return NextResponse.json(
        { success: false, message: "Unauthorized" },
        { status: 401 },
      );
    }

    const { jobId } = await request.json();
    if (!jobId) {
      return NextResponse.json(
        { success: false, message: "jobId is required." },
        { status: 400 },
      );
    }

    void processLocalDevelopmentEmailJobInBackground(jobId);

    return NextResponse.json({
      success: true,
      message: "Local email batch runner started.",
      jobId,
    });
  } catch (error) {
    console.error("Error starting local email batch runner:", error);
    return NextResponse.json(
      { success: false, message: "Failed to start local email batch runner." },
      { status: 500 },
    );
  }
}
