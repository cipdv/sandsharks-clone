"use server";

import { sql } from "@vercel/postgres";
import { cookies } from "next/headers";
import { unstable_rethrow } from "next/navigation";
import { NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import {
  getDashboardPathForMemberType,
  isDashboardPath,
} from "@/app/lib/dashboard-path";
import { loginSchema } from "@/app/schemas/memberSchema";
import {
  createMemberSession,
  deleteMemberSession,
  getExpiredSessionCookieOptions,
  getMemberSession,
  getSessionCookieName,
  getSessionCookieOptions,
} from "@/app/lib/member-session-store";

//postgres
export async function login(prevState, formData) {
  console.log("logging in");
  const formDataObj = Object.fromEntries(formData.entries());
  formDataObj.rememberMe = formDataObj.rememberMe === "on";
  formDataObj.email = formDataObj.email.toLowerCase().trim();

  // Extract redirectTo and emailTarget from formData if they exist
  const redirectTo = formDataObj.redirectTo || null;
  const emailTarget = formDataObj.emailTarget || null;

  // Remove redirectTo and emailTarget from formDataObj before validation
  delete formDataObj.redirectTo;
  delete formDataObj.emailTarget;

  const { success, data, error } = loginSchema.safeParse(formDataObj);
  if (!success) {
    return { message: error.message };
  }

  const user = data;
  let dashboardPath = "/dashboard/member";

  try {
    // Query PostgreSQL for the user with the given email
    const result = await sql`
      SELECT * FROM members WHERE email = ${user.email}
    `;

    // Check if user exists
    if (result.rows.length === 0) {
      return { message: "Invalid credentials" };
    }

    const memberData = result.rows[0];
    dashboardPath = getDashboardPathForMemberType(memberData.member_type);

    // Compare passwords
    const passwordsMatch = await bcrypt.compare(
      user.password,
      memberData.password
    );
    if (!passwordsMatch) {
      return { message: "Invalid credentials" };
    }

    const { token, expires } = await createMemberSession(memberData.id);

    const cookieStore = await cookies();
    cookieStore.set(
      getSessionCookieName(),
      token,
      getSessionCookieOptions(expires)
    );

    // Revalidate the path before redirecting
    revalidatePath("/dashboard");
  } catch (error) {
    // Handle database or other errors
    console.error("Database error:", error);
    return { message: "An error occurred during login. Please try again." };
  }

  // Check if there's an emailTarget parameter and construct the redirect URL
  if (emailTarget && redirectTo === "/dashboard/member") {
    redirect(`/dashboard/member?from=email&target=${emailTarget}`);
  }
  // Dashboard destinations are role-resolved after login.
  else if (redirectTo && !isDashboardPath(redirectTo)) {
    redirect(redirectTo);
  } else {
    redirect(dashboardPath);
  }
}

export async function logout() {
  const cookieStore = await cookies();
  const sessionToken = cookieStore.get(getSessionCookieName())?.value;

  if (sessionToken) {
    await deleteMemberSession(sessionToken);
  }

  cookieStore.set(
    getSessionCookieName(),
    "",
    getExpiredSessionCookieOptions()
  );
}

export async function getSession() {
  try {
    const cookieStore = await cookies();
    const sessionToken = cookieStore.get(getSessionCookieName())?.value;
    if (!sessionToken) return null;
    return await getMemberSession(sessionToken);
  } catch (error) {
    unstable_rethrow(error);
    console.error("Error getting session:", error);
    return null;
  }
}

export async function updateSession(request) {
  const sessionToken = request.cookies.get(getSessionCookieName())?.value;
  if (!sessionToken) return NextResponse.next();

  let session;
  try {
    session = await getMemberSession(sessionToken);
  } catch (error) {
    unstable_rethrow(error);
    console.error("Error refreshing session:", error);
  }

  if (!session) {
    const res = NextResponse.next();
    res.cookies.set(
      getSessionCookieName(),
      "",
      getExpiredSessionCookieOptions()
    );
    return res;
  }

  const res = NextResponse.next();
  res.cookies.set(
    getSessionCookieName(),
    sessionToken,
    getSessionCookieOptions(session.expires)
  );
  return res;
}

export async function createSessionForMember(memberId) {
  const { token, expires } = await createMemberSession(memberId);
  const cookieStore = await cookies();

  cookieStore.set(
    getSessionCookieName(),
    token,
    getSessionCookieOptions(expires)
  );

  return { token, expires };
}

// "use server";

// import { sql } from "@vercel/postgres";
// import { SignJWT, jwtVerify } from "jose";
// import { cookies } from "next/headers";
// import { NextResponse } from "next/server";
// import bcrypt from "bcryptjs";
// import { revalidatePath } from "next/cache";
// import { redirect } from "next/navigation";
// import { loginSchema } from "@/app/schemas/memberSchema";

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

// //postgres
// export async function login(prevState, formData) {
//   const formDataObj = Object.fromEntries(formData.entries());
//   formDataObj.rememberMe = formDataObj.rememberMe === "on";
//   formDataObj.email = formDataObj.email.toLowerCase().trim();

//   // Extract redirectTo from formData if it exists
//   const redirectTo = formDataObj.redirectTo || null;

//   // Remove redirectTo from formDataObj before validation
//   delete formDataObj.redirectTo;

//   const { success, data, error } = loginSchema.safeParse(formDataObj);
//   if (!success) {
//     return { message: error.message };
//   }

//   const user = data;

//   try {
//     // Query PostgreSQL for the user with the given email
//     const result = await sql`
//       SELECT * FROM members WHERE email = ${user.email}
//     `;

//     // Check if user exists
//     if (result.rows.length === 0) {
//       return { message: "Invalid credentials" };
//     }

//     const memberData = result.rows[0];

//     // Compare passwords
//     const passwordsMatch = await bcrypt.compare(
//       user.password,
//       memberData.password
//     );
//     if (!passwordsMatch) {
//       return { message: "Invalid credentials" };
//     }

//     // Create a clean object without the password
//     let resultObj = { ...memberData };
//     delete resultObj.password;

//     // Convert snake_case to camelCase for consistency with your frontend
//     resultObj = {
//       // _id: resultObj.id.toString(),
//       id: resultObj.id, // Make sure this is set correctly
//       _id: resultObj.id.toString(), // For backward compatibility
//       firstName: resultObj.first_name,
//       lastName: resultObj.last_name,
//       email: resultObj.email,
//       memberType: resultObj.member_type,
//       pronouns: resultObj.pronouns,
//       about: resultObj.about,
//       profilePic: resultObj.profile_pic_url
//         ? {
//             status: resultObj.profile_pic_status,
//             url: resultObj.profile_pic_url,
//           }
//         : undefined,
//       createdAt: resultObj.created_at,
//     };

//     const expires = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000); // 30 days
//     const session = await encrypt({ resultObj, expires });

//     const cookieStore = await cookies();
//     cookieStore.set("session", session, {
//       expires,
//       httpOnly: true,
//       secure: process.env.NODE_ENV === "production",
//       sameSite: "strict",
//     });

//     // Revalidate the path before redirecting
//     revalidatePath("/dashboard");
//   } catch (error) {
//     // Handle database or other errors
//     console.error("Database error:", error);
//     return { message: "An error occurred during login. Please try again." };
//   }

//   // Check if there's a redirectTo parameter and redirect accordingly
//   if (redirectTo) {
//     redirect(redirectTo);
//   } else {
//     // Default redirect to dashboard
//     redirect("/dashboard");
//   }
// }

// export async function logout() {
//   const cookieStore = await cookies();
//   cookieStore.set("session", "", {
//     expires: new Date(0),
//     httpOnly: true,
//     secure: process.env.NODE_ENV === "production",
//     sameSite: "strict",
//   });
// }

// export async function getSession() {
//   try {
//     const cookieStore = cookies();
//     const session = cookieStore.get("session")?.value;
//     if (!session) return null;
//     return await decrypt(session);
//   } catch (error) {
//     console.log("Session not available during static generation");
//     return null;
//   }
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

// export async function getJwtSecretKey() {
//   const secret = process.env.JWT_SECRET;
//   if (!secret) {
//     throw new Error("JWT_SECRET is not defined");
//   }
//   return secret;
// }

// export const verifyAuth = async (token) => {
//   try {
//     const verified = await jwtVerify(
//       token,
//       new TextEncoder().encode(await getJwtSecretKey())
//     );
//     return verified.payload;
//   } catch (error) {
//     throw new Error("Invalid token");
//   }
// };
