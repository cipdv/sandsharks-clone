// app/lib/cookieFunctions.js
import { cookies } from "next/headers";
import { NextResponse } from "next/server";
import { encrypt, decrypt } from "./auth";

// Set the cookie with proper attributes for cross-site requests
export async function updateSession(request) {
  const session = request.cookies.get("session")?.value;

  // If no session exists, just continue
  if (!session) {
    return NextResponse.next();
  }

  // Create a response object
  const response = NextResponse.next();

  // Set the cookie with SameSite=None to allow cross-site requests
  // Only set Secure=true in production
  const isProduction = process.env.NODE_ENV === "production";

  response.cookies.set({
    name: "session",
    value: session,
    httpOnly: true,
    secure: isProduction, // Only use secure in production
    sameSite: "lax", // Use 'lax' instead of 'strict' to allow links from emails
    maxAge: 60 * 60 * 24 * 7, // 1 week
    path: "/",
  });

  return response;
}

// Function to set a session cookie
export async function setSessionCookie(data) {
  const encryptedData = await encrypt(data);
  const isProduction = process.env.NODE_ENV === "production";

  cookies().set({
    name: "session",
    value: encryptedData,
    httpOnly: true,
    secure: isProduction, // Only use secure in production
    sameSite: "lax", // Use 'lax' instead of 'strict'
    maxAge: 60 * 60 * 24 * 7, // 1 week
    path: "/",
  });
}

// Function to delete the session cookie
export async function deleteSessionCookie() {
  cookies().delete("session");
}

// Export decrypt for use in other files
export { decrypt };

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
