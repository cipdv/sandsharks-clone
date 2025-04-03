// app/api/email-link/route.js
import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { decrypt } from "@/app/lib/auth";

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

  // Check if the user is logged in
  const sessionCookie = cookies().get("session");

  if (!sessionCookie?.value) {
    // If not logged in, redirect to signin with callback
    return NextResponse.redirect(
      new URL(
        `/signin?callbackUrl=${encodeURIComponent(finalUrl)}`,
        request.url
      )
    );
  }

  try {
    // Try to decrypt the session to verify it's valid
    const session = await decrypt(sessionCookie.value);

    if (!session?.resultObj?.memberType) {
      // Invalid session, redirect to signin
      return NextResponse.redirect(
        new URL(
          `/signin?callbackUrl=${encodeURIComponent(finalUrl)}`,
          request.url
        )
      );
    }

    // Valid session, redirect to the target URL
    return NextResponse.redirect(new URL(finalUrl, request.url));
  } catch (error) {
    console.error("Error decrypting session:", error);
    // Error decrypting, redirect to signin
    return NextResponse.redirect(
      new URL(
        `/signin?callbackUrl=${encodeURIComponent(finalUrl)}`,
        request.url
      )
    );
  }
}
