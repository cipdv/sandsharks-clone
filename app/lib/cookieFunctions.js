// app/lib/cookieFunctions.js
import { cookies } from "next/headers";
import { NextResponse } from "next/server";

const SESSION_COOKIE_NAME = "session";
const SESSION_MAX_AGE_SECONDS = 60 * 60 * 24 * 30;

// Set the cookie with proper attributes for cross-site requests
export async function updateSession(request) {
  const session = request.cookies.get(SESSION_COOKIE_NAME)?.value;

  // If no session exists, just continue
  if (!session) {
    return NextResponse.next();
  }

  // Create a response object
  const response = NextResponse.next();

  // Only set Secure=true in production
  const isProduction = process.env.NODE_ENV === "production";

  response.cookies.set({
    name: SESSION_COOKIE_NAME,
    value: session,
    httpOnly: true,
    secure: isProduction, // Only use secure in production
    sameSite: "lax", // Use 'lax' instead of 'strict' to allow links from emails
    maxAge: SESSION_MAX_AGE_SECONDS,
    path: "/",
  });

  return response;
}

// Function to set a session cookie
export async function setSessionCookie(token) {
  const isProduction = process.env.NODE_ENV === "production";

  const cookieStore = await cookies();
  cookieStore.set({
    name: SESSION_COOKIE_NAME,
    value: token,
    httpOnly: true,
    secure: isProduction, // Only use secure in production
    sameSite: "lax", // Use 'lax' instead of 'strict'
    maxAge: SESSION_MAX_AGE_SECONDS,
    path: "/",
  });
}

// Function to delete the session cookie
export async function deleteSessionCookie() {
  const cookieStore = await cookies();
  cookieStore.delete(SESSION_COOKIE_NAME);
}

// "use server";

// import { SignJWT, jwtVerify } from "jose";
// import { cookies } from "next/headers";
// import { NextResponse } from "next/server";

// const secretKey = process.env.SECRET_KEY;
// const key = new TextEncoder().encode(secretKey);

// export async function encrypt(payload) {
//   return await new SignJWT(payload)
//     .setProtectedHeader({ alg: "HS256" })
//     .setIssuedAt()
//     .setExpirationTime("30 days")
//     .sign(key);
// }

// export async function decrypt(input) {
//   const { payload } = await jwtVerify(input, key, {
//     algorithms: ["HS256"],
//   });
//   return payload;
// }

// export async function getSession() {
//   const session = cookies().get("session")?.value;
//   if (!session) return null;
//   return await decrypt(session);
// }

// export async function updateSession(request) {
//   const session = request.cookies.get("session")?.value;
//   if (!session) return;

//   const parsed = await decrypt(session);
//   parsed.expires = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000); // 30 days
//   const res = NextResponse.next();
//   res.cookies.set({
//     name: "session",
//     value: await encrypt(parsed),
//     httpOnly: true,
//     expires: parsed.expires,
//     secure: process.env.NODE_ENV === "production",
//     sameSite: "strict",
//   });
//   return res;
// }
