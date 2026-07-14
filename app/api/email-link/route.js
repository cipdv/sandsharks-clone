// app/api/email-link/route.js
import { NextResponse } from "next/server";
import { getSession } from "@/app/lib/auth";

export async function GET(request) {
  // Get the target URL from the query parameters
  const { searchParams } = new URL(request.url);
  const targetPath = searchParams.get("target") || "/dashboard/member";
  const playDayId = searchParams.get("playDayId");

  // Build the final URL
  let finalUrl = targetPath;
  if (playDayId) {
    finalUrl += `?playDayId=${playDayId}`;
  }

  const session = await getSession();

  if (!session?.resultObj?.memberType) {
    // If not logged in, redirect to signin with callback
    return NextResponse.redirect(
      new URL(
        `/signin?redirectTo=${encodeURIComponent(finalUrl)}`,
        request.url
      )
    );
  }

  // Valid session, redirect to the target URL
  return NextResponse.redirect(new URL(finalUrl, request.url));
}
