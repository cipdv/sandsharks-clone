import {
  expireSessionCookie,
  refreshSessionCookie,
  validateMiddlewareSession,
} from "@/app/lib/middleware-session";
import { NextResponse } from "next/server";

export async function middleware(request) {
  console.log("middleware ran successfully");

  // For API routes that need to be public (like cron job endpoints)
  if (
    request.nextUrl.pathname.startsWith("/api/test-weekly-email") ||
    request.nextUrl.pathname.startsWith("/api/weekly-email") ||
    request.nextUrl.pathname.startsWith("/api/send-season-announcement") ||
    request.nextUrl.pathname.startsWith("/api/rsvp/") ||
    request.nextUrl.pathname.startsWith("/api/process-email-jobs") ||
    request.nextUrl.pathname.startsWith("/api/local-email-send/")
  ) {
    return NextResponse.next();
  }

  // Define public paths that should be accessible to everyone
  const publicPaths = [
    "/",
    "/signin",
    "/signup",
    "/contact",
    "/password-reset",
    "/league-history",
    "/events",
    "/donations",
    "/rules",
    "/email-action",
    "/email-response",
    "/unsubscribe",
    "/guest-signup",
    "/guest-donation",
    "/guest-signup/success",
    /^\/password-reset\/set-new-password\/.*$/,
    /^\/guest-signup\/.*$/,
    /^\/guest-donation\/.*$/,
  ];

  const allowedLoggedInPaths = [
    "/email-action",
    "/events",
    "/contact",
    "/delete-account",
    "/dashboard/member",
    "/unsubscribe",
    /^\/unsubscribe\/.*$/,
    /^\/account\/delete\/.*$/,
  ];

  // Check if the current path is a public path
  const isPublicPath = publicPaths.some((path) =>
    typeof path === "string"
      ? path === request.nextUrl.pathname
      : path.test(request.nextUrl.pathname)
  );

  const isAllowedLoggedInPath = allowedLoggedInPaths.some((path) =>
    typeof path === "string"
      ? path === request.nextUrl.pathname
      : path.test(request.nextUrl.pathname)
  );

  // Check if this is a direct access to the dashboard from email
  const isEmailAccess =
    request.nextUrl.pathname === "/dashboard/member" &&
    request.nextUrl.searchParams.get("from") === "email";

  // Use DB-backed session validation so stale pre-migration cookies are cleared
  // instead of being treated as logged in by middleware redirects.
  const session = await validateMiddlewareSession(request);
  const hasSessionToken = Boolean(session.token);
  const hasValidSession = session.isAuthenticated;

  // If this is an email access and the user is not logged in, redirect to signin with special parameters
  if (isEmailAccess && !hasValidSession) {
    const target = request.nextUrl.searchParams.get("target");
    const url = new URL("/signin", request.url);

    // Pass both redirectTo and emailTarget parameters
    url.searchParams.set("redirectTo", "/dashboard/member");
    if (target) {
      url.searchParams.set("emailTarget", target);
    }

    const response = NextResponse.redirect(url);
    return hasSessionToken ? expireSessionCookie(response) : response;
  }

  // If user is not logged in and trying to access a non-public path, redirect to signin
  if (!hasValidSession && !isPublicPath) {
    // Store the original URL to redirect back after login
    const url = new URL("/signin", request.url);
    url.searchParams.set(
      "redirectTo",
      request.nextUrl.pathname + request.nextUrl.search
    );
    const response = NextResponse.redirect(url);
    return hasSessionToken ? expireSessionCookie(response) : response;
  }

  if (!hasValidSession && hasSessionToken) {
    return expireSessionCookie(NextResponse.next());
  }

  if (
    hasValidSession &&
    isPublicPath &&
    !isAllowedLoggedInPath &&
    request.nextUrl.pathname !== "/dashboard"
  ) {
    return refreshSessionCookie(
      NextResponse.redirect(new URL("/dashboard", request.url)),
      session.token,
      session.expires
    );
  }

  if (hasValidSession) {
    return refreshSessionCookie(
      NextResponse.next(),
      session.token,
      session.expires
    );
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/((?!.+\\.[\\w]+$|_next).*)", "/(api|trpc)(.*)"],
};

// import { updateSession, decrypt } from "@/app/lib/cookieFunctions";
// import { NextResponse } from "next/server";

// export async function middleware(request) {
//   console.log("middleware ran successfully");

//   // For API routes that need to be public (like cron job endpoints)
//   if (
//     request.nextUrl.pathname.startsWith("/api/test-weekly-email") ||
//     request.nextUrl.pathname.startsWith("/api/weekly-email") ||
//     request.nextUrl.pathname.startsWith("/api/send-season-announcement")
//   ) {
//     return NextResponse.next();
//   }

//   // Define public paths that should be accessible to everyone
//   const publicPaths = [
//     "/",
//     "/signin",
//     "/signup",
//     "/survey",
//     "/password-reset",
//     "/league-history",
//     "/donations",
//     "/rules",
//     "/email-action",
//     "/email-response",
//     "/unsubscribe",
//     "/guest-signup",
//     "/guest-donation",
//     "/guest-signup/success",
//     /^\/password-reset\/set-new-password\/.*$/,
//     /^\/guest-signup\/.*$/,
//     /^\/guest-donation\/.*$/,
//   ];

//   // Define paths that should be accessible even when logged in
//   const allowedLoggedInPaths = [
//     "/email-action",
//     "/delete-account",
//     "/dashboard/member", // Allow direct access to member dashboard
//     "/unsubscribe", // Add this line to allow access to the unsubscribe page
//     /^\/unsubscribe\/.*$/,
//     /^\/account\/delete\/.*$/,
//   ];

//   // Check if the current path is a public path
//   const isPublicPath = publicPaths.some((path) =>
//     typeof path === "string"
//       ? path === request.nextUrl.pathname
//       : path.test(request.nextUrl.pathname)
//   );

//   // Check if the current path is allowed even when logged in
//   const isAllowedLoggedInPath = allowedLoggedInPaths.some((path) =>
//     typeof path === "string"
//       ? path === request.nextUrl.pathname
//       : path.test(request.nextUrl.pathname)
//   );

//   // Check if this is a direct access to the dashboard from email
//   const isEmailAccess =
//     request.nextUrl.pathname === "/dashboard/member" &&
//     request.nextUrl.searchParams.get("from") === "email";

//   // Get current user from cookie
//   const currentUser = request.cookies.get("session")?.value;
//   let currentUserObj = null;

//   if (currentUser) {
//     try {
//       currentUserObj = await decrypt(currentUser);
//     } catch (error) {
//       console.error("Error decrypting session:", error);
//       // If we can't decrypt the session, treat as if no session exists
//       // This handles corrupted cookies
//     }
//   }

//   const memberType = currentUserObj?.resultObj?.memberType;

//   // If this is an email access and the user is not logged in, redirect to signin with special parameters
//   if (isEmailAccess && !currentUser) {
//     const target = request.nextUrl.searchParams.get("target");
//     const url = new URL("/signin", request.url);

//     // Pass both redirectTo and emailTarget parameters
//     url.searchParams.set("redirectTo", "/dashboard/member");
//     if (target) {
//       url.searchParams.set("emailTarget", target);
//     }

//     return NextResponse.redirect(url);
//   }

//   // If user is not logged in and trying to access a non-public path, redirect to signin
//   if (!currentUser && !isPublicPath) {
//     // Store the original URL to redirect back after login
//     const url = new URL("/signin", request.url);
//     url.searchParams.set(
//       "redirectTo",
//       request.nextUrl.pathname + request.nextUrl.search
//     );
//     return NextResponse.redirect(url);
//   }

//   // Define dashboard paths for different member types
//   const dashboardPaths = {
//     ultrashark: "/dashboard/ultrashark",
//     supershark: "/dashboard/supershark",
//     admin: "/dashboard/ultrashark",
//     volunteer: "/dashboard/member",
//     member: "/dashboard/member",
//     pending: "/dashboard/member",
//   };

//   // If user is logged in and not on an allowed path, redirect to their dashboard
//   // Skip this check if the user is trying to access /dashboard/member directly (from email)
//   if (
//     currentUser &&
//     memberType &&
//     dashboardPaths[memberType] &&
//     !isAllowedLoggedInPath && // Check if it's not an allowed logged-in path
//     !request.nextUrl.pathname.startsWith(dashboardPaths[memberType])
//   ) {
//     return NextResponse.redirect(
//       new URL(dashboardPaths[memberType], request.url)
//     );
//   }

//   return await updateSession(request);
// }

// export const config = {
//   matcher: ["/((?!.+\\.[\\w]+$|_next).*)", "/(api|trpc)(.*)"],
// };
