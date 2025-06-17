"use server";

//database connection
import { sql } from "@vercel/postgres";
//dependencies
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import bcrypt from "bcryptjs";
import { cookies } from "next/headers";
import { getSession, encrypt } from "@/app/lib/auth";
import Stripe from "stripe";
import { sendEmail } from "@/app/lib/email-sender";
import { sendBatchEmails } from "@/app/lib/email-sender";

//utils
import { generateEmailFooter } from "@/app/lib/email-utils";
import { logout } from "@/app/lib/auth";

//zod schemas
import {
  MemberSchema,
  MemberUpdateFormSchema,
} from "@/app/schemas/memberSchema";
import { PostFormSchema } from "@/app/schemas/postFormSchema";

///////////////////////////////////////////////
//-----------------MEMBERS-------------------//
///////////////////////////////////////////////

export async function handleLogout() {
  await logout();
  redirect("/");
}

export async function getCurrentUser() {
  try {
    // Get the session
    const session = await getSession();

    if (session?.resultObj?._id) {
      const userId = session.resultObj._id;

      // Get the user data from the database
      const userData = await sql`
        SELECT 
          id, 
          first_name, 
          last_name, 
          email, 
          member_type, 
          pronouns, 
          about, 
          profile_pic_url, 
          profile_pic_status, 
          created_at, 
          waiver_confirmed, 
          waiver_confirmed_at,
          welcome_confirmed,
          last_donation_date,
          email_list,
          photo_consent,
          instagram_handle
        FROM 
          members 
        WHERE 
          id = ${userId}
      `;

      if (userData.rows.length > 0) {
        // Convert from snake_case to camelCase for frontend consistency
        const currentUser = {
          id: userData.rows[0].id.toString(),
          _id: userData.rows[0].id.toString(),
          firstName: userData.rows[0].first_name,
          lastName: userData.rows[0].last_name,
          email: userData.rows[0].email,
          memberType: userData.rows[0].member_type,
          pronouns: userData.rows[0].pronouns,
          about: userData.rows[0].about,
          profilePic: userData.rows[0].profile_pic_url
            ? {
                status: userData.rows[0].profile_pic_status,
                url: userData.rows[0].profile_pic_url,
              }
            : undefined,
          createdAt: userData.rows[0].created_at,
          waiverConfirmed: userData.rows[0].waiver_confirmed,
          waiverConfirmedAt: userData.rows[0].waiver_confirmed_at,
          welcomeConfirmed: userData.rows[0].welcome_confirmed,
          lastDonationDate: userData.rows[0].last_donation_date || null,
          emailList: userData.rows[0].email_list || false,
          photoConsent: userData.rows[0].photo_consent || false,
          instagramHandle: userData.rows[0].instagram_handle || null,
        };

        return currentUser;
      }
    }

    return null;
  } catch (error) {
    console.error("Error getting current user:", error);
    return null;
  }
}
// export async function getCurrentUser() {
//   try {
//     // Get the session
//     const session = await getSession()

//     if (session?.resultObj?._id) {
//       const userId = session.resultObj._id

//       // Get the user data from the database
//       const userData = await sql`
//         SELECT
//           id,
//           first_name,
//           last_name,
//           email,
//           member_type,
//           pronouns,
//           about,
//           profile_pic_url,
//           profile_pic_status,
//           created_at,
//           waiver_confirmed,
//           waiver_confirmed_at,
//           welcome_confirmed,
//           last_donation_date
//         FROM
//           members
//         WHERE
//           id = ${userId}
//       `

//       if (userData.rows.length > 0) {
//         // Convert from snake_case to camelCase for frontend consistency
//         const currentUser = {
//           id: userData.rows[0].id.toString(),
//           _id: userData.rows[0].id.toString(),
//           firstName: userData.rows[0].first_name,
//           lastName: userData.rows[0].last_name,
//           email: userData.rows[0].email,
//           memberType: userData.rows[0].member_type,
//           pronouns: userData.rows[0].pronouns,
//           about: userData.rows[0].about,
//           profilePic: userData.rows[0].profile_pic_url
//             ? {
//                 status: userData.rows[0].profile_pic_status,
//                 url: userData.rows[0].profile_pic_url,
//               }
//             : undefined,
//           createdAt: userData.rows[0].created_at,
//           waiverConfirmed: userData.rows[0].waiver_confirmed,
//           waiverConfirmedAt: userData.rows[0].waiver_confirmed_at,
//           welcomeConfirmed: userData.rows[0].welcome_confirmed,
//           lastDonationDate: userData.rows[0].last_donation_date || null,
//         }

//         return currentUser
//       }
//     }

//     return null
//   } catch (error) {
//     console.error("Error getting current user:", error)
//     return null
//   }
// }

export async function registerNewMember(prevState, formData) {
  // Convert the form data to an object
  const formDataObj = Object.fromEntries(formData.entries());

  // Normalize the email address
  formDataObj.email = formDataObj.email.toLowerCase().trim();

  // Capitalize the first letter of the first name and preferred name
  formDataObj.firstName =
    formDataObj.firstName.charAt(0).toUpperCase() +
    formDataObj.firstName.slice(1);

  // Validate the form data
  const result = MemberSchema.safeParse(formDataObj);

  if (result.error) {
    // Find the error related to the password length
    const passwordError = result.error.issues.find(
      (issue) =>
        issue.path[0] === "password" &&
        issue.type === "string" &&
        issue.minimum === 6
    );

    const confirmPasswordError = result.error.issues.find(
      (issue) =>
        issue.path[0] === "confirmPassword" &&
        issue.type === "string" &&
        issue.minimum === 6
    );

    // If the error exists, return a custom message
    if (passwordError) {
      return { password: "^ Password must be at least 6 characters long" };
    }

    if (confirmPasswordError) {
      return {
        confirmPassword:
          "^ Passwords must be at least 6 characters long and match",
      };
    }

    const emailError = result.error.issues.find((issue) => {
      return (
        issue.path[0] === "email" &&
        issue.validation === "email" &&
        issue.code === "invalid_string"
      );
    });

    if (emailError) {
      return { email: "^ Please enter a valid email address" };
    }

    if (!result.success) {
      return {
        message:
          "Failed to register: make sure all required fields are completed and try again",
      };
    }
  }

  const { firstName, lastName, pronouns, email, password, confirmPassword } =
    result.data;

  //check if passwords match
  if (password !== confirmPassword) {
    return { confirmPassword: "^ Passwords do not match" };
  }

  try {
    // Check if user already exists using PostgreSQL
    const existingUser = await sql`
      SELECT * FROM members WHERE email = ${email}
    `;

    if (existingUser.rows.length > 0) {
      return { email: "^ This email is already registered" };
    }

    //hash password
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);

    // Get the profile picture data URL if it exists
    const profilePictureDataUrl = formData.get("profilePictureDataUrl");
    let profilePicUrl = null;
    let profilePicStatus = null;

    // If a profile picture was uploaded, process it
    if (profilePictureDataUrl) {
      // Convert data URL to a Buffer
      const base64Data = profilePictureDataUrl.split(",")[1];
      const buffer = Buffer.from(base64Data, "base64");

      // Upload the profile picture to Vercel Blob
      const { put } = await import("@vercel/blob");
      const filename = `profile-pic-signup-${Date.now()}.jpg`;

      const blob = await put(filename, buffer, {
        access: "public",
        contentType: "image/jpeg",
      });

      profilePicUrl = blob.url;
      profilePicStatus = "pending"; // Set status to pending for admin approval
    }

    // Get and clean Instagram handle
    const instagramHandle = formData.get("instagramHandle");
    const cleanedInstagramHandle = instagramHandle
      ? instagramHandle.trim().replace(/^@/, "")
      : null;

    // Insert new user into PostgreSQL with profile picture if provided
    const newMember = await sql`
      INSERT INTO members (
        first_name, 
        last_name, 
        pronouns, 
        email, 
        member_type, 
        password, 
        created_at,
        email_list,
        profile_pic_url,
        profile_pic_status,
        instagram_handle
      ) 
      VALUES (
        ${firstName}, 
        ${lastName}, 
        ${pronouns}, 
        ${email}, 
        ${"pending"}, 
        ${hashedPassword}, 
        ${new Date()},
        ${true},
        ${profilePicUrl},
        ${profilePicStatus},
        ${cleanedInstagramHandle}
      )
      RETURNING *
    `;

    // Get the inserted member data
    const memberData = newMember.rows[0];

    // Use the new email template system to send the welcome email
    // const { sendEmail } = await import("@/lib/email-sender");

    const emailResult = await sendEmail({
      to: email,
      subject: "Welcome to Sandsharks!",
      templateName: "welcome",
      templateData: {
        firstName,
        memberId: memberData.id.toString(),
        currentYear: new Date().getFullYear(),
      },
      replyTo: process.env.REPLY_TO_EMAIL,
    });

    if (!emailResult.success) {
      console.error("Error sending welcome email:", emailResult.error);
      // Continue with registration even if email fails
    }

    //remove password from the object
    const resultObj = {
      id: memberData.id, // Added this line to include the id property
      _id: memberData.id.toString(),
      firstName: memberData.first_name,
      lastName: memberData.last_name,
      email: memberData.email,
      memberType: memberData.member_type,
      pronouns: memberData.pronouns,
      createdAt: memberData.created_at,
      profilePic: memberData.profile_pic_url
        ? {
            url: memberData.profile_pic_url,
            status: memberData.profile_pic_status,
          }
        : null,
      instagramHandle: memberData.instagram_handle,
    };

    // Create the session
    const expires = new Date(Date.now() + 10 * 60 * 1000);
    const session = await encrypt({ resultObj, expires });

    // Save the session in a cookie
    const cookieStore = await cookies();
    cookieStore.set("session", session, {
      expires,
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "strict",
    });
  } catch (error) {
    console.log(error);
    return {
      message:
        "Failed to register: make sure all required fields are completed and try again",
    };
  }

  revalidatePath("/");
  redirect("/dashboard/member");
}

// export async function registerNewMember(prevState, formData) {
//   // Convert the form data to an object
//   const formDataObj = Object.fromEntries(formData.entries());

//   // Normalize the email address
//   formDataObj.email = formDataObj.email.toLowerCase().trim();

//   // Capitalize the first letter of the first name and preferred name
//   formDataObj.firstName =
//     formDataObj.firstName.charAt(0).toUpperCase() +
//     formDataObj.firstName.slice(1);

//   // Validate the form data
//   const result = MemberSchema.safeParse(formDataObj);

//   if (result.error) {
//     // Find the error related to the password length
//     const passwordError = result.error.issues.find(
//       (issue) =>
//         issue.path[0] === "password" &&
//         issue.type === "string" &&
//         issue.minimum === 6
//     );

//     const confirmPasswordError = result.error.issues.find(
//       (issue) =>
//         issue.path[0] === "confirmPassword" &&
//         issue.type === "string" &&
//         issue.minimum === 6
//     );

//     // If the error exists, return a custom message
//     if (passwordError) {
//       return { password: "^ Password must be at least 6 characters long" };
//     }

//     if (confirmPasswordError) {
//       return {
//         confirmPassword:
//           "^ Passwords must be at least 6 characters long and match",
//       };
//     }

//     const emailError = result.error.issues.find((issue) => {
//       return (
//         issue.path[0] === "email" &&
//         issue.validation === "email" &&
//         issue.code === "invalid_string"
//       );
//     });

//     if (emailError) {
//       return { email: "^ Please enter a valid email address" };
//     }

//     if (!result.success) {
//       return {
//         message:
//           "Failed to register: make sure all required fields are completed and try again",
//       };
//     }
//   }

//   const { firstName, lastName, pronouns, email, password, confirmPassword } =
//     result.data;

//   //check if passwords match
//   if (password !== confirmPassword) {
//     return { confirmPassword: "^ Passwords do not match" };
//   }

//   try {
//     // Check if user already exists using PostgreSQL
//     const existingUser = await sql`
//       SELECT * FROM members WHERE email = ${email}
//     `;

//     if (existingUser.rows.length > 0) {
//       return { email: "^ This email is already registered" };
//     }

//     //hash password
//     const salt = await bcrypt.genSalt(10);
//     const hashedPassword = await bcrypt.hash(password, salt);

//     // Get the profile picture data URL if it exists
//     const profilePictureDataUrl = formData.get("profilePictureDataUrl");
//     let profilePicUrl = null;
//     let profilePicStatus = null;

//     // If a profile picture was uploaded, process it
//     if (profilePictureDataUrl) {
//       // Convert data URL to a Buffer
//       const base64Data = profilePictureDataUrl.split(",")[1];
//       const buffer = Buffer.from(base64Data, "base64");

//       // Upload the profile picture to Vercel Blob
//       const { put } = await import("@vercel/blob");
//       const filename = `profile-pic-signup-${Date.now()}.jpg`;

//       const blob = await put(filename, buffer, {
//         access: "public",
//         contentType: "image/jpeg",
//       });

//       profilePicUrl = blob.url;
//       profilePicStatus = "pending"; // Set status to pending for admin approval
//     }

//     // Get and clean Instagram handle
//     const instagramHandle = formData.get("instagramHandle");
//     const cleanedInstagramHandle = instagramHandle
//       ? instagramHandle.trim().replace(/^@/, "")
//       : null;

//     // Insert new user into PostgreSQL with profile picture if provided
//     const newMember = await sql`
//       INSERT INTO members (
//         first_name,
//         last_name,
//         pronouns,
//         email,
//         member_type,
//         password,
//         created_at,
//         email_list,
//         profile_pic_url,
//         profile_pic_status,
//         instagram_handle
//       )
//       VALUES (
//         ${firstName},
//         ${lastName},
//         ${pronouns},
//         ${email},
//         ${"pending"},
//         ${hashedPassword},
//         ${new Date()},
//         ${true},
//         ${profilePicUrl},
//         ${profilePicStatus},
//         ${cleanedInstagramHandle}
//       )
//       RETURNING *
//     `;

//     // Get the inserted member data
//     const memberData = newMember.rows[0];

//     // Use the new email template system to send the welcome email
//     // const { sendEmail } = await import("@/lib/email-sender");

//     const emailResult = await sendEmail({
//       to: email,
//       subject: "Welcome to Sandsharks!",
//       templateName: "welcome",
//       templateData: {
//         firstName,
//         memberId: memberData.id.toString(),
//         currentYear: new Date().getFullYear(),
//       },
//       replyTo: process.env.REPLY_TO_EMAIL,
//     });

//     if (!emailResult.success) {
//       console.error("Error sending welcome email:", emailResult.error);
//       // Continue with registration even if email fails
//     }

//     //remove password from the object
//     const resultObj = {
//       _id: memberData.id.toString(),
//       firstName: memberData.first_name,
//       lastName: memberData.last_name,
//       email: memberData.email,
//       memberType: memberData.member_type,
//       pronouns: memberData.pronouns,
//       createdAt: memberData.created_at,
//       profilePic: memberData.profile_pic_url
//         ? {
//             url: memberData.profile_pic_url,
//             status: memberData.profile_pic_status,
//           }
//         : null,
//       instagramHandle: memberData.instagram_handle,
//     };

//     // Create the session
//     const expires = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000);
//     const session = await encrypt({ resultObj, expires });

//     // Save the session in a cookie
//     const cookieStore = await cookies();
//     cookieStore.set("session", session, {
//       expires,
//       httpOnly: true,
//       secure: process.env.NODE_ENV === "production",
//       sameSite: "strict",
//     });
//   } catch (error) {
//     console.log(error);
//     return {
//       message:
//         "Failed to register: make sure all required fields are completed and try again",
//     };
//   }

//   revalidatePath("/");
//   redirect("/dashboard/member");
// }

export async function confirmWelcomeRead(prevState, formData) {
  try {
    const userId = formData.get("userId");

    if (!userId) {
      return { success: false, message: "User ID is required" };
    }

    // Update the members table with the confirmation date
    await sql`
      UPDATE members
      SET welcome_confirmed = ${new Date()}
      WHERE id = ${userId}
    `;

    revalidatePath("/dashboard/member");
    return {
      success: true,
      message: "Thanks for reading! You're all set for the season.",
    };
  } catch (error) {
    console.error("Error confirming welcome read:", error);
    return { success: false, message: "Failed to confirm. Please try again." };
  }
}

export async function sendPasswordReset(prevState, formData) {
  const to = formData.get("email").toLowerCase().trim();

  try {
    // Check if the email is in the database
    const memberResult = await sql`
      SELECT id, first_name, last_name 
      FROM members 
      WHERE email = ${to}
    `;

    // If no member found, still return a success message for security
    if (memberResult.rows.length === 0) {
      return {
        message:
          "If this email is registered, a link to reset your password will be sent to this email address.",
      };
    }

    const member = memberResult.rows[0];

    // Generate a secure random token
    const crypto = require("crypto");
    const token = crypto.randomBytes(20).toString("hex");

    // Create expiration time (1 hour from now) as Unix timestamp (milliseconds)
    const tokenExpires = Date.now() + 3600000; // 1 hour in milliseconds

    // Save the token and expiration to the database
    await sql`
      UPDATE members
      SET 
        password_reset_token = ${token},
        password_reset_expires = ${tokenExpires}
      WHERE id = ${member.id}
    `;

    // Create the reset URL
    const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || "https://sandsharks.ca";
    const resetURL = `${baseUrl}/password-reset/set-new-password/${encodeURIComponent(
      token
    )}`;

    // const resetURL = `${baseUrl}/password-reset/set-new-password/${encodeURIComponent(token)}`;

    const emailResult = await sendEmail({
      to: to,
      subject: "Sandsharks Password Reset Request",
      templateName: "passwordReset",
      templateData: {
        firstName: member.first_name,
        resetURL,
        memberId: member.id.toString(),
        baseUrl,
      },
      replyTo: "sandsharks.org@gmail.com",
    });

    if (!emailResult.success) {
      console.error("Error sending password reset email:", emailResult.error);

      // Remove token from database if email sending failed
      await sql`
        UPDATE members
        SET 
          password_reset_token = NULL,
          password_reset_expires = NULL
        WHERE id = ${member.id}
      `;

      return {
        error: "Failed to send reset link. Please try again.",
      };
    }

    return {
      message:
        "If this email is registered, a link to reset your password will be sent to this email address. Check your inbox, junk mail, and spam folders.",
    };
  } catch (error) {
    console.error("Error in password reset:", error);
    return {
      error: "Something went wrong. Please try again.",
    };
  }
}

export async function setNewPassword(prevState, formData) {
  try {
    const token = formData.get("token");
    const password = formData.get("password");
    const confirmPassword = formData.get("confirmPassword");

    // Validate passwords
    if (!password || password.length < 6) {
      return {
        error: "Password must be at least 6 characters long.",
      };
    }

    if (password !== confirmPassword) {
      return {
        error: "Passwords do not match.",
      };
    }

    // Find the member with this token and check if it's still valid
    const now = Date.now(); // Current time in milliseconds
    const memberResult = await sql`
      SELECT id, email, first_name
      FROM members
      WHERE 
        password_reset_token = ${token}
        AND password_reset_expires > ${now}
    `;

    if (memberResult.rows.length === 0) {
      return {
        error: "Password reset token is invalid or has expired.",
      };
    }

    const member = memberResult.rows[0];

    // Hash the new password using the imported bcryptjs
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);

    // Update the member's password and clear the reset token
    await sql`
      UPDATE members
      SET 
        password = ${hashedPassword},
        password_reset_token = NULL,
        password_reset_expires = NULL
      WHERE id = ${member.id}
    `;

    // Send confirmation email
    try {
      await sendEmail({
        to: member.email,
        subject: "Your Sandsharks Password Has Been Reset",
        templateName: "passwordResetConfirmation",
        templateData: {
          firstName: member.first_name,
          memberId: member.id.toString(),
        },
        replyTo: "sandsharks.org@gmail.com",
      });
    } catch (emailError) {
      console.error(
        "Error sending password reset confirmation email:",
        emailError
      );
      // Continue with the password reset process even if the email fails
    }

    return {
      message:
        "Your password has been reset successfully. You can now log in with your new password.",
    };
  } catch (error) {
    console.error("Error setting new password:", error);
    return {
      error: "Something went wrong. Please try again.",
    };
  }
}

// export async function setNewPassword(prevState, formData) {
//   try {
//     const token = formData.get("token");
//     const password = formData.get("password");
//     const confirmPassword = formData.get("confirmPassword");

//     // Validate passwords
//     if (!password || password.length < 6) {
//       return {
//         error: "Password must be at least 6 characters long.",
//       };
//     }

//     if (password !== confirmPassword) {
//       return {
//         error: "Passwords do not match.",
//       };
//     }

//     // Find the member with this token and check if it's still valid
//     const now = Date.now(); // Current time in milliseconds
//     const memberResult = await sql`
//       SELECT id, email
//       FROM members
//       WHERE
//         password_reset_token = ${token}
//         AND password_reset_expires > ${now}
//     `;

//     if (memberResult.rows.length === 0) {
//       return {
//         error: "Password reset token is invalid or has expired.",
//       };
//     }

//     const member = memberResult.rows[0];

//     // Hash the new password using the imported bcryptjs
//     const salt = await bcrypt.genSalt(10);
//     const hashedPassword = await bcrypt.hash(password, salt);

//     // Update the member's password and clear the reset token
//     await sql`
//       UPDATE members
//       SET
//         password = ${hashedPassword},
//         password_reset_token = NULL,
//         password_reset_expires = NULL
//       WHERE id = ${member.id}
//     `;

//     return {
//       message:
//         "Your password has been reset successfully. You can now log in with your new password.",
//     };
//   } catch (error) {
//     console.error("Error setting new password:", error);
//     return {
//       error: "Something went wrong. Please try again.",
//     };
//   }
// }

///////////////////////////////////////////////
//-------------------POSTS-------------------//
///////////////////////////////////////////////

// export const createNewPost = async (prevState, formData) => {
//   //only ultrashark and supersharks can create new posts

//   const session = await getSession();
//   if (
//     session?.resultObj?.memberType !== "ultrashark" &&
//     session?.resultObj?.memberType !== "supershark"
//   ) {
//     return { message: "You must be logged in a supershark to create a post" };
//   }
//   const user = session?.resultObj?.firstName;

//   const formattedMessage = formData.get("message").replace(/\n/g, "<br />");
//   const buttonOn = formData.get("includeButton") === "on" ? true : false;

//   const result = PostFormSchema.safeParse({
//     title: formData.get("title"),
//     message: formattedMessage,
//     date: formData.get("date"),
//     startTime: formData.get("startTime"),
//     endTime: formData.get("endTime"),
//     buttonOption1: formData.get("buttonOption1"),
//     buttonOption2: formData.get("buttonOption2"),
//     includeButton: buttonOn,
//     beginnerClinic: {
//       beginnerClinicOffered: formData.get("beginnerClinicOffered")
//         ? true
//         : false,
//       beginnerClinicStartTime: formData.get("beginnerClinicStartTime"),
//       beginnerClinicEndTime: formData.get("beginnerClinicEndTime"),
//       beginnerClinicMessage: formData.get("beginnerClinicMessage"),
//       beginnerClinicCourts: formData.get("beginnerClinicCourts"),
//     },
//   });

//   if (!result.success) {
//     return { message: "Failed to create post" };
//   }

//   const {
//     title,
//     message,
//     date,
//     startTime,
//     endTime,
//     includeButton,
//     buttonOption1,
//     buttonOption2,
//   } = result.data;

//   const {
//     beginnerClinicOffered,
//     beginnerClinicStartTime,
//     beginnerClinicEndTime,
//     beginnerClinicMessage,
//     beginnerClinicCourts,
//   } = result.data.beginnerClinic;

//   try {
//     const dbClient = await dbConnection;
//     const db = await dbClient.db("Sandsharks");

//     const post = {
//       title,
//       message,
//       date,
//       startTime,
//       endTime,
//       includeButton,
//       buttonOption1,
//       buttonOption2,
//       beginnerClinic: {
//         beginnerClinicOffered: beginnerClinicOffered,
//         beginnerClinicStartTime: beginnerClinicStartTime,
//         beginnerClinicEndTime: beginnerClinicEndTime,
//         beginnerClinicMessage: beginnerClinicMessage,
//         beginnerClinicCourts: beginnerClinicCourts,
//       },
//       replies: [],
//       createdAt: new Date(),
//       postedBy: user,
//     };

//     await db.collection("posts").insertOne(post);

//     revalidatePath("/dashboard");
//     return { message: `Added post: ${title}` };
//   } catch (e) {
//     console.error(e);
//     return { message: "Failed to create post" };
//   }
// };

//postgres
export const getAllPosts = async () => {
  const session = await getSession();
  if (!session) {
    return { message: "You must be logged in to see posts" };
  }

  try {
    const result = await sql`
      SELECT * FROM posts
      ORDER BY created_at DESC
      LIMIT 5
    `;

    // Transform the PostgreSQL rows to match the expected structure
    const posts = result.rows.map((post) => {
      // Parse JSONB fields if they're strings
      const beginnerClinic =
        typeof post.beginner_clinic === "string"
          ? JSON.parse(post.beginner_clinic)
          : post.beginner_clinic || {};

      const replies =
        typeof post.replies === "string"
          ? JSON.parse(post.replies)
          : post.replies || [];

      // Ensure each reply has an _id field
      const formattedReplies = replies.map((reply, index) => {
        if (!reply._id) {
          return { ...reply, _id: `reply-${post.id}-${index}` };
        }
        return reply;
      });

      // Ensure beginnerClinicReplies have _id fields if they exist
      if (beginnerClinic.beginnerClinicReplies) {
        beginnerClinic.beginnerClinicReplies =
          beginnerClinic.beginnerClinicReplies.map((reply, index) => {
            if (!reply._id) {
              return { ...reply, _id: `clinic-reply-${post.id}-${index}` };
            }
            return reply;
          });
      }

      return {
        _id: post.id.toString(),
        title: post.title,
        message: post.message,
        date: post.date ? post.date.toISOString().split("T")[0] : null,
        startTime: post.start_time,
        endTime: post.end_time,
        includeButton: post.include_button,
        buttonOption1: post.button_option1,
        buttonOption2: post.button_option2,
        beginnerClinic: beginnerClinic,
        replies: formattedReplies,
        createdAt: post.created_at,
        postedBy: post.posted_by,
        courts: post.courts,
      };
    });

    return posts;
  } catch (error) {
    console.error("Error getting posts:", error);
    return { message: "An error occurred while retrieving posts." };
  }
};
//mongodb
// export const getAllPosts = async () => {
//   //must be logged in to get all posts
//   const session = await getSession();
//   if (!session) {
//     return { message: "You must be logged in to see posts" };
//   }

//   try {
//     const dbClient = await dbConnection;
//     const db = await dbClient.db("Sandsharks");
//     const posts = await db
//       .collection("posts")
//       .find()
//       .sort({ createdAt: -1 })
//       .limit(5)
//       .toArray();
//     return posts;
//   } catch (error) {
//     console.error(error);
//   }
// };

// export async function replyToPost(postId) {
//   const session = await getSession();
//   if (!session) {
//     return { message: "You must be logged in to RSVP" };
//   }

//   const member = await getCurrentUser();
//   const { email, firstName, lastName, _id } = member;

//   try {
//     const dbClient = await dbConnection;
//     const db = await dbClient.db("Sandsharks");

//     //check if user has already replied
//     const post = await db
//       .collection("posts")
//       .findOne({ _id: new ObjectId(postId) });
//     if (!post) {
//       return { message: "Post not found" };
//     }
//     const hasReplied = post.replies.some(
//       (reply) => reply.userId === _id.toString()
//     );

//     if (hasReplied) {
//       await db
//         .collection("posts")
//         .updateOne(
//           { _id: new ObjectId(postId) },
//           { $pull: { replies: { userId: _id.toString() } } }
//         );
//     } else {
//       await db.collection("posts").updateOne(
//         { _id: new ObjectId(postId) },
//         {
//           $push: {
//             replies: {
//               firstName,
//               lastName,
//               email,
//               userId: _id.toString(),
//               pic:
//                 member?.profilePic?.status === "approved"
//                   ? member.profilePic.url
//                   : null,
//               createdAt: new Date(),
//             },
//           },
//         }
//       );
//     }

//     revalidatePath("/dashboard");
//     return { message: "RSVP confirmed" };
//   } catch (error) {
//     console.error(error);
//   }
// }

// export async function replyToBeginnerClinic(postId) {
//   const session = await getSession();
//   if (!session) {
//     return { message: "You must be logged in to RSVP" };
//   }

//   const member = await getCurrentUser();
//   const { email, firstName, lastName, preferredName, _id } = member;

//   try {
//     const dbClient = await dbConnection;
//     const db = await dbClient.db("Sandsharks");

//     //check if user has already replied
//     const post = await db
//       .collection("posts")
//       .findOne({ _id: new ObjectId(postId) });
//     if (!post) {
//       return { message: "Post not found" };
//     }
//     const hasReplied = post?.beginnerClinic?.beginnerClinicReplies?.some(
//       (reply) => reply.userId === _id.toString()
//     );

//     if (hasReplied) {
//       await db.collection("posts").updateOne(
//         { _id: new ObjectId(postId) },
//         {
//           $pull: {
//             "beginnerClinic.beginnerClinicReplies": {
//               userId: _id.toString(),
//             },
//           },
//         }
//       );
//     } else {
//       await db.collection("posts").updateOne(
//         { _id: new ObjectId(postId) },
//         {
//           $push: {
//             "beginnerClinic.beginnerClinicReplies": {
//               name: preferredName || firstName,
//               pic:
//                 member?.profilePic?.status === "approved"
//                   ? member.profilePic.url
//                   : null,
//               email,
//               userId: _id.toString(),
//               createdAt: new Date(),
//             },
//           },
//         }
//       );
//     }

//     revalidatePath("/dashboard");
//     return { message: "RSVP confirmed" };
//   } catch (error) {
//     console.error(error);
//   }
// }

// export async function updatePost(prevState, formData) {
//   const session = await getSession();
//   if (session?.resultObj?.memberType !== "ultrashark") {
//     return { message: "You must be logged in as ultrashark to update a post" };
//   }

//   const formattedMessage = formData.get("message").replace(/\n/g, "<br />");

//   const result = PostFormSchema.safeParse({
//     title: formData.get("title"),
//     message: formattedMessage,
//     date: formData.get("date"),
//     startTime: formData.get("startTime"),
//     endTime: formData.get("endTime"),
//     beginnerClinic: {
//       beginnerClinicOffered: formData.get("beginnerClinicOffered")
//         ? true
//         : false,
//       beginnerClinicStartTime: formData.get("beginnerClinicStartTime"),
//       beginnerClinicEndTime: formData.get("beginnerClinicEndTime"),
//       beginnerClinicMessage: formData.get("beginnerClinicMessage"),
//       beginnerClinicCourts: formData.get("beginnerClinicCourts"),
//     },
//     courts: formData.get("courts"),
//   });

//   if (!result.success) {
//     console.log(result.error);
//     return { message: "Failed to update post" };
//   }

//   const postId = formData.get("postId");

//   const user =
//     session?.resultObj?.preferredName || session?.resultObj?.firstName;

//   const { title, message, date, startTime, endTime, courts } = result.data;

//   const {
//     beginnerClinicOffered,
//     beginnerClinicStartTime,
//     beginnerClinicEndTime,
//     beginnerClinicMessage,
//     beginnerClinicCourts,
//   } = result.data.beginnerClinic;

//   try {
//     const dbClient = await dbConnection;
//     const db = await dbClient.db("Sandsharks");

//     await db.collection("posts").updateOne(
//       { _id: new ObjectId(postId) },
//       {
//         $set: {
//           title,
//           message,
//           date,
//           startTime,
//           endTime,
//           "beginnerClinic.beginnerClinicOffered": beginnerClinicOffered,
//           "beginnerClinic.beginnerClinicStartTime": beginnerClinicStartTime,
//           "beginnerClinic.beginnerClinicEndTime": beginnerClinicEndTime,
//           "beginnerClinic.beginnerClinicMessage": beginnerClinicMessage,
//           "beginnerClinic.beginnerClinicCourts": beginnerClinicCourts,
//           courts,
//           postedBy: user,
//         },
//       }
//     );

//     revalidatePath("/dashboard/ultrashark/posts");
//     return { message: "Post updated" };
//   } catch (error) {
//     console.error(error);
//   }
// }

// export async function deletePost(postId) {
//   const session = await getSession();
//   if (session?.resultObj?.memberType !== "ultrashark") {
//     return { message: "You must be logged in as ultrashark to delete a post" };
//   }

//   try {
//     const dbClient = await dbConnection;
//     const db = await dbClient.db("Sandsharks");
//     await db.collection("posts").deleteOne({ _id: new ObjectId(postId) });

//     revalidatePath("/dashboard/ultrashark/posts");
//     return { message: "Post deleted" };
//   } catch (error) {
//     console.error(error);
//   }
// }

///////////////////////////////////////////////
//-----------------WAIVERS-------------------//
///////////////////////////////////////////////

export async function confirmWaiver(formData) {
  const member = await getSession();
  if (!member) {
    return { message: "You must be logged in to confirm the waiver" };
  }

  const { _id } = member.resultObj;

  // Handle both FormData objects and objects from useActionState
  let photoConsent = false;

  // Check if formData is a FormData object
  if (formData instanceof FormData) {
    photoConsent = formData.get("photoConsent") === "on";
  }
  // If it's an object with entries method (from useActionState)
  else if (formData && typeof formData === "object") {
    photoConsent =
      formData.photoConsent === true || formData.photoConsent === "on";
  }

  try {
    // Update the member record to mark waiver as confirmed and store photo consent
    await sql`
      UPDATE members 
      SET 
        waiver_confirmed = TRUE,
        waiver_confirmed_at = ${new Date()},
        photo_consent = ${photoConsent}
      WHERE id = ${_id}
    `;
  } catch (error) {
    console.error("Error confirming waiver:", error);
    return { message: "An error occurred. Please try again." };
  }

  revalidatePath("/dashboard/member");
  redirect("/dashboard/member");
}

// export async function getWaivers() {
//   const session = await getSession();
//   if (!session) {
//     return { message: "You must be logged in" };
//   }

//   try {
//     const dbClient = await dbConnection;
//     const db = await dbClient.db("Sandsharks");
//     const waivers = await db.collection("waivers").find().toArray();
//     return waivers;
//   } catch (error) {
//     console.error(error);
//   }
// }

// export async function submitSurvey(formData) {
//   try {
//     const dbClient = await dbConnection;
//     const db = await dbClient.db("Sandsharks");

//     // Ensure the "surveys" collection exists
//     const collections = await db.listCollections({ name: "surveys" }).toArray();
//     if (collections.length === 0) {
//       await db.createCollection("surveys");
//     }

//     // Insert the survey data into the "surveys" collection
//     await db.collection("surveys").insertOne({
//       firstName: formData.firstName,
//       lastName: formData.lastName,
//       email: formData.email,
//       permits: formData.permits,
//       volunteer: formData.volunteer,
//       comments: formData.comments,
//       feeDeterrent: formData.feeDeterrent,
//       createdAt: new Date(),
//     });

//     revalidatePath("/dashboard/member");
//     return { message: "Survey submitted" };
//   } catch (error) {
//     console.error(error);
//     throw new Error("Failed to submit survey");
//   }
// }

////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
//ultrashark admin
////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

// Function to get members for the volunteer selection
export async function getMembers() {
  try {
    const result = await sql`
      SELECT id, first_name, last_name 
      FROM members 
      WHERE member_type != 'pending'
      ORDER BY first_name, last_name
    `;

    return result.rows;
  } catch (error) {
    console.error("Error fetching members:", error);
    return [];
  }
}

//create new play day with email notification
function formatTime(timeString) {
  if (!timeString) return "";

  // Parse the time string (assuming format like "13:00" or "9:30")
  let [hours, minutes] = timeString
    .split(":")
    .map((num) => Number.parseInt(num, 10));

  // Determine AM/PM
  const period = hours >= 12 ? "pm" : "am";

  // Convert to 12-hour format
  hours = hours % 12;
  hours = hours === 0 ? 12 : hours; // Convert 0 to 12 for 12 AM

  // Format the time string
  return `${hours}:${minutes.toString().padStart(2, "0")}${period}`;
}

//create play day with email sending
// export async function createPlayDay(formData) {
//   console.log("Starting createPlayDay function");

//   const resend = new Resend(process.env.RESEND_API_KEY);

//   let result;

//   try {
//     const session = await getSession();
//     const user = session?.resultObj;

//     if (!user) {
//       return {
//         success: false,
//         message: "You must be logged in to create a play day",
//       };
//     }

//     // Check if user is an admin
//     if (user.memberType !== "ultrashark") {
//       return {
//         success: false,
//         message: "You must be an admin to create a play day",
//       };
//     }

//     // Extract basic play day data
//     const title = formData.get("title");
//     const description = formData.get("description");
//     const date = formData.get("date");
//     const startTime = formData.get("startTime");
//     const endTime = formData.get("endTime");
//     const courts = formData.get("courts");
//     const sponsorId = formData.get("sponsorId");
//     const mainVolunteerId = formData.get("mainVolunteerId");
//     const helperVolunteerId = formData.get("helperVolunteerId");
//     const hasClinic = formData.get("hasClinic") === "true";
//     const updateContent = formData.get("updateContent");

//     // Insert play day
//     const playDayResult = await sql`
//       INSERT INTO play_days (
//         title,
//         description,
//         date,
//         start_time,
//         end_time,
//         courts,
//         sponsor_id,
//         main_volunteer_id,
//         helper_volunteer_id,
//         created_by
//       )
//       VALUES (
//         ${title},
//         ${description},
//         ${date},
//         ${startTime},
//         ${endTime},
//         ${courts},
//         ${sponsorId || null},
//         ${mainVolunteerId || null},
//         ${helperVolunteerId || null},
//         ${user.id}
//       )
//       RETURNING id
//     `;

//     const playDayId = playDayResult.rows[0].id;
//     console.log("Play day created with ID:", playDayId);

//     // Create clinic if offered
//     if (hasClinic) {
//       const clinicDescription = formData.get("clinicDescription");
//       const clinicStartTime = formData.get("clinicStartTime");
//       const clinicEndTime = formData.get("clinicEndTime");
//       const clinicCourts = formData.get("clinicCourts");
//       const clinicMaxParticipants = formData.get("clinicMaxParticipants");

//       await sql`
//         INSERT INTO clinics (
//           play_day_id,
//           description,
//           start_time,
//           end_time,
//           courts,
//           max_participants
//         )
//         VALUES (
//           ${playDayId},
//           ${clinicDescription},
//           ${clinicStartTime},
//           ${clinicEndTime},
//           ${clinicCourts},
//           ${clinicMaxParticipants}
//         )
//       `;
//       console.log("Clinic created for play day");
//     }

//     // Create initial update if provided
//     if (updateContent) {
//       await sql`
//         INSERT INTO updates (
//           play_day_id,
//           content,
//           created_by
//         )
//         VALUES (
//           ${playDayId},
//           ${updateContent},
//           ${user.id}
//         )
//       `;
//       console.log("Update created for play day");
//     }

//     // Get volunteer information if volunteer IDs are provided
//     let mainVolunteerName = null;
//     let helperVolunteerName = null;

//     if (mainVolunteerId) {
//       const mainVolunteerResult = await sql`
//         SELECT first_name, last_name
//         FROM members
//         WHERE id = ${mainVolunteerId}
//       `;

//       if (mainVolunteerResult.rows.length > 0) {
//         const volunteer = mainVolunteerResult.rows[0];
//         mainVolunteerName = `${volunteer.first_name} ${volunteer.last_name}`;
//       }
//     }

//     if (helperVolunteerId) {
//       const helperVolunteerResult = await sql`
//         SELECT first_name, last_name
//         FROM members
//         WHERE id = ${helperVolunteerId}
//       `;

//       if (helperVolunteerResult.rows.length > 0) {
//         const volunteer = helperVolunteerResult.rows[0];
//         helperVolunteerName = `${volunteer.first_name} ${volunteer.last_name}`;
//       }
//     }

//     // Get sponsor information if a sponsor ID is provided
//     let sponsorInfo = null;

//     if (sponsorId) {
//       const sponsorResult = await sql`
//         SELECT name, description, website_url, instagram_url, other_url, logo_url
//         FROM sponsors
//         WHERE id = ${sponsorId}
//       `;

//       if (sponsorResult.rows.length > 0) {
//         sponsorInfo = sponsorResult.rows[0];
//       }
//     }

//     // Get all members who have opted into email notifications
//     const membersResult = await sql`
//       SELECT id, email, first_name, last_name, last_donation_date
//       FROM members
//       WHERE email_list = true
//     `;
//     console.log("Found members for email:", membersResult.rows.length);

//     // Format the date for display
//     const formattedDate = new Date(date).toLocaleDateString("en-US", {
//       weekday: "long",
//       year: "numeric",
//       month: "long",
//       day: "numeric",
//     });

//     // Format times to 12-hour format
//     const formattedStartTime = formatTime(startTime);
//     const formattedEndTime = formatTime(endTime);
//     const timeRange = `${formattedStartTime} - ${formattedEndTime}`;

//     // Format clinic times if applicable
//     let clinicTimeRange = "";
//     if (hasClinic) {
//       const clinicStartTime = formatTime(formData.get("clinicStartTime"));
//       const clinicEndTime = formatTime(formData.get("clinicEndTime"));
//       clinicTimeRange = `${clinicStartTime} - ${clinicEndTime}`;
//     }

//     // Get the current year for donation check
//     const currentYear = new Date().getFullYear();

//     // Donation message to add for members who haven't donated this year
//     const donationMessage = `
//       <div style="margin-top: 20px; padding: 15px; background-color: #f9f9f9; border-left: 4px solid #ff6600;">
//         <p><strong>Please consider making a donation to Sandsharks for the ${currentYear} season.</strong></p>
//         <p>Sandsharks is run solely by volunteers and donations from members like you. Donations cover the costs of court rentals, storage, new equipment, insurance, website hosting, and more. Donations are pay-what-you-can, with a suggested donation of $40 for the entire season.</p>
//         <p><a href="https://sandsharks.ca/donate" style="display: inline-block; background-color: #ff6600; color: white; padding: 8px 15px; text-decoration: none; border-radius: 4px; margin-top: 10px;">Donate Now</a></p>
//       </div>
//     `;

//     // Send email to all members who have opted in
//     if (membersResult.rows.length > 0) {
//       // Base URL for the application
//       const baseUrl =
//         process.env.NEXT_PUBLIC_BASE_URL || "https://sandsharks.ca";

//       // Logo URL - using absolute URL for email clients
//       const logoUrl = `${baseUrl}/images/sandsharks-rainbow-icon.svg`;

//       // Process emails for each member
//       for (const member of membersResult.rows) {
//         // Check if the member has donated this year
//         const needsDonationMessage =
//           !member.last_donation_date ||
//           new Date(member.last_donation_date).getFullYear() < currentYear;

//         // Create volunteer section if volunteers are assigned
//         let volunteerSection = "";
//         if (mainVolunteerName || helperVolunteerName) {
//           volunteerSection = `
//             <div style="margin-top: 15px; padding: 15px; background-color: #f0f8ff; border-radius: 5px;">
//               <h3 style="margin-top: 0; color: #0066cc;">Volunteers for this Beach Day</h3>
//               ${mainVolunteerName ? `<p>${mainVolunteerName}</p>` : ""}
//               ${helperVolunteerName ? `<p>and ${helperVolunteerName}</p>` : ""}
//             </div>
//           `;
//         }

//         // Create sponsor section if a sponsor is assigned
//         let sponsorSection = "";
//         if (sponsorInfo) {
//           const sponsorLogoHtml = sponsorInfo.logo_url
//             ? `<img src="${sponsorInfo.logo_url}" alt="${sponsorInfo.name} Logo" style="max-height: 80px; max-width: 200px; margin-bottom: 10px;">`
//             : "";

//           const sponsorLinks = [];
//           if (sponsorInfo.website_url)
//             sponsorLinks.push(
//               `<a href="${sponsorInfo.website_url}" style="color: #0066cc; margin-right: 10px;">Website</a>`
//             );
//           if (sponsorInfo.instagram_url)
//             sponsorLinks.push(
//               `<a href="${sponsorInfo.instagram_url}" style="color: #0066cc; margin-right: 10px;">Instagram</a>`
//             );
//           if (sponsorInfo.other_url)
//             sponsorLinks.push(
//               `<a href="${sponsorInfo.other_url}" style="color: #0066cc;">More Info</a>`
//             );

//           sponsorSection = `
//             <div style="margin-top: 20px; padding: 15px; background-color: #fff8f0; border-radius: 5px; text-align: center;">
//               <h3 style="margin-top: 0; color: #ff6600;">This Beach Day is Sponsored By</h3>
//               ${sponsorLogoHtml}
//               <h4 style="margin: 5px 0;">${sponsorInfo.name}</h4>
//               ${
//                 sponsorInfo.description
//                   ? `<p style="margin-bottom: 15px;">${sponsorInfo.description}</p>`
//                   : ""
//               }
//               <div>${sponsorLinks.join(" | ")}</div>
//             </div>
//           `;
//         }

//         // Create play day content
//         const playDayContent = `
//           <div style="background-color: #f5f5f5; padding: 20px; border-radius: 8px; margin: 20px 0;">
//             <h2 style="margin-top: 0; color: #0066cc;">${formattedDate}</h2>
//             <p><strong>Time:</strong> ${timeRange}</p>
//             <p><strong>Courts:</strong> ${courts}</p>
//             <h3 style="color: #ff6600;">${title}</h3>
//             <p>${description}</p>

//             ${
//               hasClinic
//                 ? `
//             <div style="margin-top: 20px; padding-top: 15px; border-top: 2px dashed #0066cc;">
//               <h3 style="margin-top: 0; color: #009933;">Clinic Available</h3>
//               <p>${formData.get("clinicDescription")}</p>
//               <p><strong>Time:</strong> ${clinicTimeRange}</p>
//               <p><strong>Courts:</strong> ${formData.get("clinicCourts")}</p>
//               <p><strong>Max Participants:</strong> ${formData.get(
//                 "clinicMaxParticipants"
//               )}</p>
//             </div>
//             `
//                 : ""
//             }

//             ${volunteerSection}
//             ${sponsorSection}
//           </div>

//           <div style="text-align: center; margin: 30px 0;">
//             <a href="${baseUrl}/dashboard/play-day/${playDayId}"
//                style="display: inline-block; background-color: #ff6600; color: white;
//                       padding: 12px 25px; text-decoration: none; border-radius: 5px;
//                       font-weight: bold; font-size: 16px;">
//               RSVP TO PLAY
//             </a>
//           </div>

//           ${needsDonationMessage ? donationMessage : ""}
//         `;

//         // Create personalized email content
//         const emailHtml = `
//           <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
//             <div style="background-color: #0066cc; padding: 20px; text-align: center; border-radius: 8px 8px 0 0;">
//               <img src="${logoUrl}" alt="Sandsharks Logo" style="height: 60px; margin-bottom: 10px;">
//               <h1 style="color: white; margin: 0;">New Beach Volleyball Day!</h1>
//             </div>

//             <div style="padding: 20px; background-color: #ffffff; border-left: 1px solid #ddd; border-right: 1px solid #ddd;">
//               <p style="font-size: 18px;">Hey ${
//                 member.first_name || "Shark"
//               }!</p>
//               <p>A new beach volleyball play day has been scheduled. Check out the details below:</p>

//               ${playDayContent}

//               <p style="margin-top: 30px;">See you on the sand!</p>
//               <p style="font-style: italic; color: #666;">-Cip</p>
//             </div>

//             <div style="background-color: #f5f5f5; padding: 15px; text-align: center; font-size: 12px; color: #666666; border-radius: 0 0 8px 8px; border: 1px solid #ddd; border-top: none;">
//               <p>
//                 You're receiving this email because you've opted into play day notifications.
//               </p>
//               <p style="margin-top: 10px;">
//                 <a href="${baseUrl}/unsubscribe/${
//           member.id
//         }" style="color: #666666; text-decoration: underline; margin-right: 15px;">Unsubscribe from emails</a>

//               </p>
//             </div>
//           </div>
//         `;

//         try {
//           await resend.emails.send({
//             from: "Sandsharks <notifications@sandsharks.ca>",
//             // to: member.email,
//             to: "cip.devries@gmail.com",
//             reply_to: "sandsharks.org@gmail.com",
//             subject: `New Beach Volleyball Day: ${formattedDate}`,
//             html: emailHtml,
//           });
//           console.log(`Email sent to ${member.email}`);
//         } catch (emailError) {
//           console.error(`Error sending email to ${member.email}:`, emailError);
//           // Continue with other emails even if one fails
//         }
//       }
//     } else {
//       console.log("No members found with email_list=true");
//     }

//     // Store the result but don't return it yet
//     result = {
//       success: true,
//       message: "Play day created successfully!",
//       shouldRedirect: true,
//     };
//   } catch (error) {
//     console.error("Error creating play day:", error);
//     console.error("Error stack:", error.stack);
//     return {
//       success: false,
//       message: "Failed to create play day. Please try again.",
//     };
//   }

//   // These will only execute if no error was thrown
//   console.log("Revalidating path and preparing to return/redirect");
//   revalidatePath("/dashboard/ultrashark");

//   // Only redirect if we should
//   if (formData.get("shouldRedirect") === "true") {
//     console.log("Redirecting to dashboard");
//     redirect("/dashboard/ultrashark");
//   }

//   // Return the result if we didn't redirect
//   console.log("Returning result:", result);
//   return result;
// }

// Create a new play day (without email notification)
export async function createPlayDay(formData) {
  try {
    const session = await getSession();
    const user = session?.resultObj;

    if (!user) {
      return {
        success: false,
        message: "You must be logged in to create a play day",
      };
    }

    // Check if user is an admin
    if (user.memberType !== "ultrashark") {
      return {
        success: false,
        message: "You must be an admin to create a play day",
      };
    }

    // Extract basic play day data
    const title = formData.get("title");
    const description = formData.get("description");
    const date = formData.get("date");
    const startTime = formData.get("startTime");
    const endTime = formData.get("endTime");
    const courts = formData.get("courts");
    const sponsorId = formData.get("sponsorId");
    const mainVolunteerId = formData.get("mainVolunteerId");
    const helperVolunteerId = formData.get("helperVolunteerId");
    const hasClinic = formData.get("hasClinic") === "true";
    const updateContent = formData.get("updateContent");

    // Insert play day
    const playDayResult = await sql`
      INSERT INTO play_days (
        title,
        description,
        date,
        start_time,
        end_time,
        courts,
        sponsor_id,
        main_volunteer_id,
        helper_volunteer_id,
        created_by
      )
      VALUES (
        ${title},
        ${description},
        ${date},
        ${startTime},
        ${endTime},
        ${courts},
        ${sponsorId || null},
        ${mainVolunteerId || null},
        ${helperVolunteerId || null},
        ${user.id}
      )
      RETURNING id
    `;

    const playDayId = playDayResult.rows[0].id;

    // Create clinic if offered
    if (hasClinic) {
      const clinicDescription = formData.get("clinicDescription");
      const clinicStartTime = formData.get("clinicStartTime");
      const clinicEndTime = formData.get("clinicEndTime");
      const clinicCourts = formData.get("clinicCourts");
      const clinicMaxParticipants = formData.get("clinicMaxParticipants");

      await sql`
        INSERT INTO clinics (
          play_day_id,
          description,
          start_time,
          end_time,
          courts,
          max_participants
        )
        VALUES (
          ${playDayId},
          ${clinicDescription},
          ${clinicStartTime},
          ${clinicEndTime},
          ${clinicCourts},
          ${clinicMaxParticipants}
        )
      `;
    }

    // Create initial update if provided
    if (updateContent) {
      await sql`
        INSERT INTO updates (
          play_day_id,
          content,
          created_by
        )
        VALUES (
          ${playDayId},
          ${updateContent},
          ${user.id}
        )
      `;
    }

    revalidatePath("/dashboard/ultrashark");
    return {
      success: true,
      message: "Play day created successfully!",
      shouldRedirect: true,
    };
  } catch (error) {
    console.error("Error creating play day:", error);
    return {
      success: false,
      message: "Failed to create play day. Please try again.",
    };
  }
}

// Update an existing play day
export async function updatePlayDay(formData) {
  try {
    const session = await getSession();
    const user = session?.resultObj;

    if (!user) {
      return {
        success: false,
        message: "You must be logged in to update a play day",
      };
    }

    // Check if user is an admin
    if (user.memberType !== "ultrashark") {
      return {
        success: false,
        message: "You must be an admin to update a play day",
      };
    }

    const playDayId = formData.get("playDayId");
    const title = formData.get("title");
    const description = formData.get("description");
    const date = formData.get("date");
    const startTime = formData.get("startTime");
    const endTime = formData.get("endTime");
    const courts = formData.get("courts");
    const sponsorId = formData.get("sponsorId");
    const mainVolunteerId = formData.get("mainVolunteerId");
    const helperVolunteerId = formData.get("helperVolunteerId");
    const hasClinic = formData.get("hasClinic") === "true";
    const updateContent = formData.get("updateContent");

    // Update play day
    await sql`
      UPDATE play_days
      SET 
        title = ${title},
        description = ${description},
        date = ${date},
        start_time = ${startTime},
        end_time = ${endTime},
        courts = ${courts},
        sponsor_id = ${sponsorId || null},
        main_volunteer_id = ${mainVolunteerId || null},
        helper_volunteer_id = ${helperVolunteerId || null}
      WHERE id = ${playDayId}
    `;

    // Handle clinic updates
    const clinicExists = await sql`
      SELECT id FROM clinics WHERE play_day_id = ${playDayId}
    `;

    if (hasClinic) {
      const clinicDescription = formData.get("clinicDescription");
      const clinicStartTime = formData.get("clinicStartTime");
      const clinicEndTime = formData.get("clinicEndTime");
      const clinicCourts = formData.get("clinicCourts");

      // Ensure clinicMaxParticipants is a number
      let clinicMaxParticipants = formData.get("clinicMaxParticipants");
      clinicMaxParticipants = clinicMaxParticipants
        ? Number.parseInt(clinicMaxParticipants, 10)
        : 10;

      if (clinicExists.rows.length > 0) {
        // Update existing clinic
        await sql`
          UPDATE clinics
          SET
            description = ${clinicDescription},
            start_time = ${clinicStartTime},
            end_time = ${clinicEndTime},
            courts = ${clinicCourts},
            max_participants = ${clinicMaxParticipants}
          WHERE play_day_id = ${playDayId}
        `;
      } else {
        // Create new clinic
        await sql`
          INSERT INTO clinics (
            play_day_id,
            description,
            start_time,
            end_time,
            courts,
            max_participants
          )
          VALUES (
            ${playDayId},
            ${clinicDescription},
            ${clinicStartTime},
            ${clinicEndTime},
            ${clinicCourts},
            ${clinicMaxParticipants}
          )
        `;
      }
    } else if (clinicExists.rows.length > 0) {
      // Remove clinic if it exists but hasClinic is false
      // First delete clinic attendance
      await sql`
        DELETE FROM clinic_attendance
        WHERE clinic_id = ${clinicExists.rows[0].id}
      `;

      // Then delete clinic
      await sql`
        DELETE FROM clinics
        WHERE play_day_id = ${playDayId}
      `;
    }

    // Create new update if provided
    if (updateContent) {
      await sql`
        INSERT INTO updates (
          play_day_id,
          content,
          created_by
        )
        VALUES (
          ${playDayId},
          ${updateContent},
          ${user.id}
        )
      `;
    }

    revalidatePath("/dashboard/ultrashark");
    return {
      success: true,
      message: "Play day updated successfully!",
      shouldRedirect: true,
    };
  } catch (error) {
    console.error("Error updating play day:", error);
    return {
      success: false,
      message: "Failed to update play day. Please try again.",
    };
  }
}

export const createPlayDayUpdate = async (formData) => {
  try {
    const session = await getSession();
    const user = session?.resultObj;

    if (!user) {
      return {
        success: false,
        message: "You must be logged in to create an update",
      };
    }

    // Get form data
    const playDayId = formData.get("playDayId");
    const content = formData.get("content");

    if (!playDayId || !content) {
      return {
        success: false,
        message: "Play day ID and content are required",
      };
    }

    // Check if user is authorized to create an update (main volunteer or ultrashark)
    if (user.memberType !== "ultrashark") {
      const playDayResult = await sql`
        SELECT main_volunteer_id FROM play_days 
        WHERE id = ${playDayId}
      `;

      if (playDayResult.rows.length === 0) {
        return {
          success: false,
          message: "Play day not found",
        };
      }

      const mainVolunteerId = playDayResult.rows[0].main_volunteer_id;

      if (String(mainVolunteerId) !== String(user._id)) {
        return {
          success: false,
          message: "You are not authorized to create updates for this play day",
        };
      }
    }

    // Insert the update
    await sql`
      INSERT INTO updates (
        play_day_id,
        content,
        created_by
      )
      VALUES (
        ${playDayId},
        ${content},
        ${user._id}
      )
    `;

    revalidatePath("/dashboard/member");
    return {
      success: true,
      message: "Update posted successfully!",
    };
  } catch (error) {
    console.error("Error creating play day update:", error);
    return {
      success: false,
      message: "Failed to post update. Please try again.",
    };
  }
};

// Function to get play days with all related data
export async function getPlayDays() {
  try {
    const playDaysResult = await sql`
      SELECT 
        pd.id, 
        pd.title, 
        pd.description, 
        pd.date, 
        pd.start_time, 
        pd.end_time, 
        pd.courts,
        pd.sponsor_id,
        pd.main_volunteer_id,
        pd.helper_volunteer_id,
        pd.created_at,
        pd.created_by,
        pd.is_cancelled,
        m.first_name AS created_by_first_name,
        m.last_name AS created_by_last_name,
        s.name AS sponsor_name,
        s.logo_url AS sponsor_logo,
        EXISTS(SELECT 1 FROM clinics c WHERE c.play_day_id = pd.id) AS has_clinic
      FROM 
        play_days pd
      JOIN
        members m ON pd.created_by = m.id
      LEFT JOIN
        sponsors s ON pd.sponsor_id = s.id
      ORDER BY 
        pd.date DESC
    `;

    // Process the results
    const playDays = await Promise.all(
      playDaysResult.rows.map(async (pd) => {
        // Format the data
        const playDay = {
          id: pd.id,
          _id: pd.id.toString(), // For compatibility with existing code
          title: pd.title,
          description: pd.description,
          date: pd.date ? pd.date.toISOString().split("T")[0] : null,
          startTime: pd.start_time,
          endTime: pd.end_time,
          courts: pd.courts,
          sponsorId: pd.sponsor_id,
          sponsorName: pd.sponsor_name,
          sponsorLogo: pd.sponsor_logo,
          mainVolunteerId: pd.main_volunteer_id,
          helperVolunteerId: pd.helper_volunteer_id,
          createdAt: pd.created_at,
          createdById: pd.created_by,
          postedBy: `${pd.created_by_first_name} ${pd.created_by_last_name}`,
          hasClinic: pd.has_clinic,
          is_cancelled: pd.is_cancelled || false,
        };

        // Get volunteer information if available
        if (pd.main_volunteer_id) {
          const mainVolunteerResult = await sql`
            SELECT id, first_name, last_name
            FROM members
            WHERE id = ${pd.main_volunteer_id}
          `;

          if (mainVolunteerResult.rows.length > 0) {
            playDay.mainVolunteer = mainVolunteerResult.rows[0];
          }
        }

        if (pd.helper_volunteer_id) {
          const helperVolunteerResult = await sql`
            SELECT id, first_name, last_name
            FROM members
            WHERE id = ${pd.helper_volunteer_id}
          `;

          if (helperVolunteerResult.rows.length > 0) {
            playDay.helperVolunteer = helperVolunteerResult.rows[0];
          }
        }

        // Get volunteers
        const volunteersResult = await sql`
          SELECT 
            v.role,
            m.id,
            m.first_name,
            m.last_name
          FROM 
            volunteers v
          JOIN 
            members m ON v.member_id = m.id
          WHERE 
            v.play_day_id = ${pd.id}
        `;

        playDay.volunteers = volunteersResult.rows.map((v) => ({
          id: v.id,
          firstName: v.first_name,
          lastName: v.last_name,
          role: v.role,
        }));

        // Get attendance
        const attendanceResult = await sql`
          SELECT 
            a.id,
            m.id AS member_id,
            m.first_name,
            m.last_name
          FROM 
            attendance a
          JOIN 
            members m ON a.member_id = m.id
          WHERE 
            a.play_day_id = ${pd.id}
        `;

        // Format attendance as replies for compatibility with existing code
        playDay.replies = attendanceResult.rows.map((a) => ({
          _id: a.id.toString(),
          firstName: a.first_name,
          lastName: a.last_name,
          email: "", // Add if needed
          userId: a.member_id.toString(),
        }));

        // Get clinic data if it exists
        if (pd.has_clinic) {
          const clinicResult = await sql`
            SELECT 
              id, 
              description, 
              start_time, 
              end_time, 
              max_participants, 
              courts
            FROM 
              clinics
            WHERE 
              play_day_id = ${pd.id}
          `;

          if (clinicResult.rows.length > 0) {
            const clinic = clinicResult.rows[0];

            // Get clinic attendance
            const clinicAttendanceResult = await sql`
              SELECT 
                ca.id,
                m.id AS member_id,
                m.first_name,
                m.last_name
              FROM 
                clinic_attendance ca
              JOIN 
                members m ON ca.member_id = m.id
              WHERE 
                ca.clinic_id = ${clinic.id}
            `;

            // Format clinic data for compatibility with existing code
            playDay.beginnerClinic = {
              beginnerClinicOffered: true,
              beginnerClinicMessage: clinic.description,
              beginnerClinicStartTime: clinic.start_time,
              beginnerClinicEndTime: clinic.end_time,
              beginnerClinicCourts: clinic.courts,
              maxParticipants: clinic.max_participants,
              beginnerClinicReplies: clinicAttendanceResult.rows.map((a) => ({
                _id: a.id.toString(),
                name: `${a.first_name} ${a.last_name}`,
                email: "", // Add if needed
                userId: a.member_id.toString(),
              })),
            };
          }
        }

        // Get updates
        const updatesResult = await sql`
          SELECT 
            u.id,
            u.content,
            u.created_at,
            u.created_by,
            m.first_name,
            m.last_name
          FROM 
            updates u
          JOIN 
            members m ON u.created_by = m.id
          WHERE 
            u.play_day_id = ${pd.id}
          ORDER BY 
            u.created_at DESC
        `;

        playDay.updates = updatesResult.rows.map((u) => ({
          id: u.id,
          _id: u.id.toString(), // For compatibility
          content: u.content,
          createdAt: u.created_at,
          createdById: u.created_by,
          createdByName: `${u.first_name} ${u.last_name}`,
        }));

        return playDay;
      })
    );

    return playDays;
  } catch (error) {
    console.error("Error fetching play days:", error);
    return [];
  }
}

// Function to get play days for members (non-admin view)
// export async function getPlayDaysForMembers() {
//   try {
//     const playDaysResult = await sql`
//       SELECT
//         pd.id,
//         pd.title,
//         pd.description,
//         pd.date,
//         pd.start_time,
//         pd.end_time,
//         pd.courts,
//         pd.sponsor_id,
//         pd.main_volunteer_id,
//         pd.helper_volunteer_id,
//         pd.created_at,
//         pd.created_by,
//         m.first_name AS created_by_first_name,
//         m.last_name AS created_by_last_name,
//         s.name AS sponsor_name,
//         s.logo_url AS sponsor_logo,
//         s.website_url AS sponsor_website,
//         s.instagram_url AS sponsor_instagram,
//         s.description AS sponsor_description,
//         EXISTS(SELECT 1 FROM clinics c WHERE c.play_day_id = pd.id) AS has_clinic
//       FROM
//         play_days pd
//       JOIN
//         members m ON pd.created_by = m.id
//       LEFT JOIN
//         sponsors s ON pd.sponsor_id = s.id
//       WHERE
//         pd.date >= CURRENT_DATE - INTERVAL '1 day'
//       ORDER BY
//         pd.date ASC
//     `;

//     // Process the results
//     const playDays = await Promise.all(
//       playDaysResult.rows.map(async (pd) => {
//         // Format the data
//         const playDay = {
//           id: pd.id,
//           _id: pd.id.toString(), // For compatibility with existing code
//           title: pd.title,
//           description: pd.description,
//           date: pd.date ? pd.date.toISOString().split("T")[0] : null,
//           startTime: pd.start_time,
//           endTime: pd.end_time,
//           courts: pd.courts,
//           sponsorId: pd.sponsor_id,
//           sponsorName: pd.sponsor_name,
//           sponsorLogo: pd.sponsor_logo,
//           sponsorWebsite: pd.sponsor_website,
//           sponsorInstagram: pd.sponsor_instagram,
//           sponsorDescription: pd.sponsor_description, // Added sponsor description
//           mainVolunteerId: pd.main_volunteer_id,
//           helperVolunteerId: pd.helper_volunteer_id,
//           createdAt: pd.created_at,
//           createdById: pd.created_by,
//           postedBy: `${pd.created_by_first_name} ${pd.created_by_last_name}`,
//           hasClinic: pd.has_clinic,
//           message: pd.description, // For compatibility with existing code
//         };

//         // Get volunteer information if available
//         if (pd.main_volunteer_id) {
//           const mainVolunteerResult = await sql`
//             SELECT id, first_name, last_name
//             FROM members
//             WHERE id = ${pd.main_volunteer_id}
//           `;

//           if (mainVolunteerResult.rows.length > 0) {
//             playDay.mainVolunteer = mainVolunteerResult.rows[0];
//           }
//         }

//         if (pd.helper_volunteer_id) {
//           const helperVolunteerResult = await sql`
//             SELECT id, first_name, last_name
//             FROM members
//             WHERE id = ${pd.helper_volunteer_id}
//           `;

//           if (helperVolunteerResult.rows.length > 0) {
//             playDay.helperVolunteer = helperVolunteerResult.rows[0];
//           }
//         }

//         // Rest of the function remains the same...
//         // Get attendance
//         const attendanceResult = await sql`
//           SELECT
//             a.id,
//             m.id AS member_id,
//             m.first_name,
//             m.last_name,
//             m.profile_pic_url
//           FROM
//             attendance a
//           JOIN
//             members m ON a.member_id = m.id
//           WHERE
//             a.play_day_id = ${pd.id}
//         `;

//         // Format attendance as replies for compatibility with existing code
//         playDay.replies = attendanceResult.rows.map((a) => ({
//           _id: a.id.toString(),
//           firstName: a.first_name,
//           lastName: a.last_name,
//           name: `${a.first_name} ${a.last_name}`,
//           email: "", // Add if needed
//           userId: a.member_id.toString(),
//           pic: a.profile_pic_url || "/images/sandsharks-rainbow-icon.svg",
//         }));

//         // Get clinic data if it exists
//         if (pd.has_clinic) {
//           const clinicResult = await sql`
//             SELECT
//               id,
//               description,
//               start_time,
//               end_time,
//               max_participants,
//               courts
//             FROM
//               clinics
//             WHERE
//               play_day_id = ${pd.id}
//           `;

//           if (clinicResult.rows.length > 0) {
//             const clinic = clinicResult.rows[0];

//             // Get clinic attendance
//             const clinicAttendanceResult = await sql`
//               SELECT
//                 ca.id,
//                 m.id AS member_id,
//                 m.first_name,
//                 m.last_name,
//                 m.profile_pic_url
//               FROM
//                 clinic_attendance ca
//               JOIN
//                 members m ON ca.member_id = m.id
//               WHERE
//                 ca.clinic_id = ${clinic.id}
//             `;

//             // Format clinic data for compatibility with existing code
//             playDay.beginnerClinic = {
//               beginnerClinicOffered: true,
//               beginnerClinicMessage: clinic.description,
//               beginnerClinicStartTime: clinic.start_time,
//               beginnerClinicEndTime: clinic.end_time,
//               beginnerClinicCourts: clinic.courts,
//               maxParticipants: clinic.max_participants,
//               beginnerClinicReplies: clinicAttendanceResult.rows.map((a) => ({
//                 _id: a.id.toString(),
//                 name: `${a.first_name} ${a.last_name}`,
//                 email: "", // Add if needed
//                 userId: a.member_id.toString(),
//                 pic: a.profile_pic_url || "/images/sandsharks-rainbow-icon.svg",
//               })),
//             };
//           }
//         }

//         // Get updates
//         const updatesResult = await sql`
//           SELECT
//             u.id,
//             u.content,
//             u.created_at,
//             u.created_by,
//             m.first_name,
//             m.last_name
//           FROM
//             updates u
//           JOIN
//             members m ON u.created_by = m.id
//           WHERE
//             u.play_day_id = ${pd.id}
//           ORDER BY
//             u.created_at DESC
//         `;

//         playDay.updates = updatesResult.rows.map((u) => ({
//           id: u.id,
//           _id: u.id.toString(), // For compatibility
//           content: u.content,
//           createdAt: u.created_at,
//           createdById: u.created_by,
//           createdByName: `${u.first_name} ${u.last_name}`,
//         }));

//         return playDay;
//       })
//     );

//     return playDays;
//   } catch (error) {
//     console.error("Error fetching play days for members:", error);
//     return [];
//   }
// }

// export async function getPlayDaysForMembers() {
//   try {
//     const playDaysResult = await sql`
//       SELECT
//         pd.id,
//         pd.title,
//         pd.description,
//         pd.date,
//         pd.start_time,
//         pd.end_time,
//         pd.courts,
//         pd.sponsor_id,
//         pd.main_volunteer_id,
//         pd.helper_volunteer_id,
//         pd.created_at,
//         pd.created_by,
//         m.first_name AS created_by_first_name,
//         m.last_name AS created_by_last_name,
//         m.instagram_handle as created by instagram_handle,
//         m.about as created by about,
//         s.name AS sponsor_name,
//         s.logo_url AS sponsor_logo,
//         s.website_url AS sponsor_website,
//         s.instagram_url AS sponsor_instagram,
//         s.description AS sponsor_description,
//         EXISTS(SELECT 1 FROM clinics c WHERE c.play_day_id = pd.id) AS has_clinic
//       FROM
//         play_days pd
//       JOIN
//         members m ON pd.created_by = m.id
//       LEFT JOIN
//         sponsors s ON pd.sponsor_id = s.id
//       WHERE
//         pd.date >= CURRENT_DATE
//       ORDER BY
//         pd.date ASC
//     `;

//     // Process the results
//     const playDays = await Promise.all(
//       playDaysResult.rows.map(async (pd) => {
//         // Format the data
//         const playDay = {
//           id: pd.id,
//           _id: pd.id.toString(), // For compatibility with existing code
//           title: pd.title,
//           description: pd.description,
//           date: pd.date ? pd.date.toISOString().split("T")[0] : null,
//           startTime: pd.start_time,
//           endTime: pd.end_time,
//           courts: pd.courts,
//           sponsorId: pd.sponsor_id,
//           sponsorName: pd.sponsor_name,
//           sponsorLogo: pd.sponsor_logo,
//           sponsorWebsite: pd.sponsor_website,
//           sponsorInstagram: pd.sponsor_instagram,
//           sponsorDescription: pd.sponsor_description, // Added sponsor description
//           mainVolunteerId: pd.main_volunteer_id,
//           helperVolunteerId: pd.helper_volunteer_id,
//           createdAt: pd.created_at,
//           createdById: pd.created_by,
//           postedBy: `${pd.created_by_first_name} ${pd.created_by_last_name}`,
//           hasClinic: pd.has_clinic,
//           message: pd.description, // For compatibility with existing code
//         };

//         // Get volunteer information if available
//         if (pd.main_volunteer_id) {
//           const mainVolunteerResult = await sql`
//             SELECT id, first_name, last_name
//             FROM members
//             WHERE id = ${pd.main_volunteer_id}
//           `;

//           if (mainVolunteerResult.rows.length > 0) {
//             playDay.mainVolunteer = mainVolunteerResult.rows[0];
//           }
//         }

//         if (pd.helper_volunteer_id) {
//           const helperVolunteerResult = await sql`
//             SELECT id, first_name, last_name
//             FROM members
//             WHERE id = ${pd.helper_volunteer_id}
//           `;

//           if (helperVolunteerResult.rows.length > 0) {
//             playDay.helperVolunteer = helperVolunteerResult.rows[0];
//           }
//         }

//         // Rest of the function remains the same...
//         // Get attendance
//         const attendanceResult = await sql`
//           SELECT
//             a.id,
//             m.id AS member_id,
//             m.first_name,
//             m.last_name,
//             m.profile_pic_url
//           FROM
//             attendance a
//           JOIN
//             members m ON a.member_id = m.id
//           WHERE
//             a.play_day_id = ${pd.id}
//         `;

//         // Format attendance as replies for compatibility with existing code
//         playDay.replies = attendanceResult.rows.map((a) => ({
//           _id: a.id.toString(),
//           firstName: a.first_name,
//           lastName: a.last_name,
//           name: `${a.first_name} ${a.last_name}`,
//           email: "", // Add if needed
//           userId: a.member_id.toString(),
//           pic: a.profile_pic_url || "/images/sandsharks-rainbow-icon.svg",
//         }));

//         // Get clinic data if it exists
//         if (pd.has_clinic) {
//           const clinicResult = await sql`
//             SELECT
//               id,
//               description,
//               start_time,
//               end_time,
//               max_participants,
//               courts
//             FROM
//               clinics
//             WHERE
//               play_day_id = ${pd.id}
//           `;

//           if (clinicResult.rows.length > 0) {
//             const clinic = clinicResult.rows[0];

//             // Get clinic attendance
//             const clinicAttendanceResult = await sql`
//               SELECT
//                 ca.id,
//                 m.id AS member_id,
//                 m.first_name,
//                 m.last_name,
//                 m.profile_pic_url
//               FROM
//                 clinic_attendance ca
//               JOIN
//                 members m ON ca.member_id = m.id
//               WHERE
//                 ca.clinic_id = ${clinic.id}
//             `;

//             // Format clinic data for compatibility with existing code
//             playDay.beginnerClinic = {
//               beginnerClinicOffered: true,
//               beginnerClinicMessage: clinic.description,
//               beginnerClinicStartTime: clinic.start_time,
//               beginnerClinicEndTime: clinic.end_time,
//               beginnerClinicCourts: clinic.courts,
//               maxParticipants: clinic.max_participants,
//               beginnerClinicReplies: clinicAttendanceResult.rows.map((a) => ({
//                 _id: a.id.toString(),
//                 name: `${a.first_name} ${a.last_name}`,
//                 email: "", // Add if needed
//                 userId: a.member_id.toString(),
//                 pic: a.profile_pic_url || "/images/sandsharks-rainbow-icon.svg",
//               })),
//             };
//           }
//         }

//         // Get updates
//         const updatesResult = await sql`
//           SELECT
//             u.id,
//             u.content,
//             u.created_at,
//             u.created_by,
//             m.first_name,
//             m.last_name
//           FROM
//             updates u
//           JOIN
//             members m ON u.created_by = m.id
//           WHERE
//             u.play_day_id = ${pd.id}
//           ORDER BY
//             u.created_at DESC
//         `;

//         playDay.updates = updatesResult.rows.map((u) => ({
//           id: u.id,
//           _id: u.id.toString(), // For compatibility
//           content: u.content,
//           createdAt: u.created_at,
//           createdById: u.created_by,
//           createdByName: `${u.first_name} ${u.last_name}`,
//         }));

//         // Get volunteer requests for this play day
//         const volunteerRequestsResult = await sql`
//           SELECT
//             vr.id,
//             vr.member_id,
//             vr.status,
//             vr.created_at
//           FROM
//             volunteer_requests vr
//           WHERE
//             vr.play_day_id = ${pd.id}
//         `;

//         playDay.volunteerRequests = volunteerRequestsResult.rows.map(
//           (request) => ({
//             id: request.id,
//             memberId: request.member_id,
//             status: request.status,
//             createdAt: request.created_at,
//           })
//         );

//         return playDay;
//       })
//     );

//     return playDays;
//   } catch (error) {
//     console.error("Error fetching play days for members:", error);
//     return [];
//   }
// }

export async function getPlayDaysForMembers() {
  try {
    const playDaysResult = await sql`
      SELECT 
        pd.id, 
        pd.title, 
        pd.description, 
        pd.date, 
        pd.start_time, 
        pd.end_time, 
        pd.courts,
        pd.sponsor_id,
        pd.main_volunteer_id,
        pd.helper_volunteer_id,
        pd.created_at,
        pd.created_by,
        m.first_name AS created_by_first_name,
        m.last_name AS created_by_last_name,
        s.name AS sponsor_name,
        s.logo_url AS sponsor_logo,
        s.website_url AS sponsor_website,
        s.instagram_url AS sponsor_instagram,
        s.description AS sponsor_description,
        EXISTS(SELECT 1 FROM clinics c WHERE c.play_day_id = pd.id) AS has_clinic
      FROM 
        play_days pd
      JOIN
        members m ON pd.created_by = m.id
      LEFT JOIN
        sponsors s ON pd.sponsor_id = s.id
      WHERE
        pd.date >= CURRENT_DATE
      ORDER BY 
        pd.date ASC
    `;

    // Process the results
    const playDays = await Promise.all(
      playDaysResult.rows.map(async (pd) => {
        // Format the data
        const playDay = {
          id: pd.id,
          _id: pd.id.toString(), // For compatibility with existing code
          title: pd.title,
          description: pd.description,
          date: pd.date ? pd.date.toISOString().split("T")[0] : null,
          startTime: pd.start_time,
          endTime: pd.end_time,
          courts: pd.courts,
          sponsorId: pd.sponsor_id,
          sponsorName: pd.sponsor_name,
          sponsorLogo: pd.sponsor_logo,
          sponsorWebsite: pd.sponsor_website,
          sponsorInstagram: pd.sponsor_instagram,
          sponsorDescription: pd.sponsor_description, // Added sponsor description
          mainVolunteerId: pd.main_volunteer_id,
          helperVolunteerId: pd.helper_volunteer_id,
          createdAt: pd.created_at,
          createdById: pd.created_by,
          postedBy: `${pd.created_by_first_name} ${pd.created_by_last_name}`,
          hasClinic: pd.has_clinic,
          message: pd.description, // For compatibility with existing code
        };

        // Get volunteer information if available
        if (pd.main_volunteer_id) {
          const mainVolunteerResult = await sql`
            SELECT id, first_name, last_name
            FROM members
            WHERE id = ${pd.main_volunteer_id}
          `;

          if (mainVolunteerResult.rows.length > 0) {
            playDay.mainVolunteer = mainVolunteerResult.rows[0];
          }
        }

        if (pd.helper_volunteer_id) {
          const helperVolunteerResult = await sql`
            SELECT id, first_name, last_name
            FROM members
            WHERE id = ${pd.helper_volunteer_id}
          `;

          if (helperVolunteerResult.rows.length > 0) {
            playDay.helperVolunteer = helperVolunteerResult.rows[0];
          }
        }

        // Get attendance with additional fields: about and instagram_handle
        const attendanceResult = await sql`
          SELECT 
            a.id,
            m.id AS member_id,
            m.first_name,
            m.last_name,
            m.profile_pic_url,
            m.profile_pic_status,
            m.about,
            m.instagram_handle,
            m.pronouns
          FROM 
            attendance a
          JOIN 
            members m ON a.member_id = m.id
          WHERE 
            a.play_day_id = ${pd.id}
        `;

        // Format attendance as replies for compatibility with existing code
        playDay.replies = attendanceResult.rows.map((a) => ({
          _id: a.id.toString(),
          firstName: a.first_name,
          lastName: a.last_name,
          name: `${a.first_name} ${a.last_name}`,
          email: "", // Add if needed
          userId: a.member_id.toString(),
          pic: a.profile_pic_url || "/images/sandsharks-rainbow-icon.svg",
          profilePicStatus: a.profile_pic_status,
          profilePicUrl: a.profile_pic_url,
          about: a.about,
          instagramHandle: a.instagram_handle,
          pronouns: a.pronouns,
        }));

        // Get clinic data if it exists
        if (pd.has_clinic) {
          const clinicResult = await sql`
            SELECT 
              id, 
              description, 
              start_time, 
              end_time, 
              max_participants, 
              courts
            FROM 
              clinics
            WHERE 
              play_day_id = ${pd.id}
          `;

          if (clinicResult.rows.length > 0) {
            const clinic = clinicResult.rows[0];

            // Get clinic attendance with additional fields: about and instagram_handle
            const clinicAttendanceResult = await sql`
              SELECT 
                ca.id,
                m.id AS member_id,
                m.first_name,
                m.last_name,
                m.profile_pic_url,
                m.profile_pic_status,
                m.about,
                m.instagram_handle,
                m.pronouns
              FROM 
                clinic_attendance ca
              JOIN 
                members m ON ca.member_id = m.id
              WHERE 
                ca.clinic_id = ${clinic.id}
            `;

            // Format clinic data for compatibility with existing code
            playDay.beginnerClinic = {
              beginnerClinicOffered: true,
              beginnerClinicMessage: clinic.description,
              beginnerClinicStartTime: clinic.start_time,
              beginnerClinicEndTime: clinic.end_time,
              beginnerClinicCourts: clinic.courts,
              maxParticipants: clinic.max_participants,
              beginnerClinicReplies: clinicAttendanceResult.rows.map((a) => ({
                _id: a.id.toString(),
                name: `${a.first_name} ${a.last_name}`,
                firstName: a.first_name,
                lastName: a.last_name,
                email: "", // Add if needed
                userId: a.member_id.toString(),
                pic: a.profile_pic_url || "/images/sandsharks-rainbow-icon.svg",
                profilePicStatus: a.profile_pic_status,
                profilePicUrl: a.profile_pic_url,
                about: a.about,
                instagramHandle: a.instagram_handle,
                pronouns: a.pronouns,
              })),
            };
          }
        }

        // Get updates
        const updatesResult = await sql`
          SELECT 
            u.id,
            u.content,
            u.created_at,
            u.created_by,
            m.first_name,
            m.last_name
          FROM 
            updates u
          JOIN 
            members m ON u.created_by = m.id
          WHERE 
            u.play_day_id = ${pd.id}
          ORDER BY 
            u.created_at DESC
        `;

        playDay.updates = updatesResult.rows.map((u) => ({
          id: u.id,
          _id: u.id.toString(), // For compatibility
          content: u.content,
          createdAt: u.created_at,
          createdById: u.created_by,
          createdByName: `${u.first_name} ${u.last_name}`,
        }));

        // Get volunteer requests for this play day
        const volunteerRequestsResult = await sql`
          SELECT 
            vr.id,
            vr.member_id,
            vr.status,
            vr.created_at
          FROM 
            volunteer_requests vr
          WHERE 
            vr.play_day_id = ${pd.id}
        `;

        playDay.volunteerRequests = volunteerRequestsResult.rows.map(
          (request) => ({
            id: request.id,
            memberId: request.member_id,
            status: request.status,
            createdAt: request.created_at,
          })
        );

        return playDay;
      })
    );

    return playDays;
  } catch (error) {
    console.error("Error fetching play days for members:", error);
    return [];
  }
}

// RSVP to a play day
export async function replyToPlayDay(playDayId) {
  try {
    const session = await getSession();
    const user = session?.resultObj;

    if (!user || !user.id) {
      return {
        success: false,
        message: "You must be logged in to RSVP",
      };
    }

    // Check if user has already RSVP'd
    const existingRsvp = await sql`
      SELECT id FROM attendance
      WHERE play_day_id = ${playDayId} AND member_id = ${user.id}
    `;

    if (existingRsvp.rows.length > 0) {
      // User has already RSVP'd, so remove their RSVP
      await sql`
        DELETE FROM attendance
        WHERE play_day_id = ${playDayId} AND member_id = ${user.id}
      `;

      revalidatePath("/dashboard/member");
      return { success: true, message: "RSVP removed" };
    } else {
      // User has not RSVP'd, so add their RSVP
      await sql`
        INSERT INTO attendance (play_day_id, member_id)
        VALUES (${playDayId}, ${user.id})
      `;

      revalidatePath("/dashboard/member");
      return { success: true, message: "RSVP added" };
    }
  } catch (error) {
    console.error("Error replying to play day:", error);
    return { success: false, message: "Failed to RSVP" };
  }
}

// RSVP to a beginner clinic
export async function replyToClinic(playDayId) {
  try {
    const session = await getSession();
    const user = session?.resultObj;

    if (!user || !user.id) {
      return {
        success: false,
        message: "You must be logged in to RSVP to a clinic",
      };
    }

    // Get the clinic ID for this play day
    const clinicResult = await sql`
      SELECT id, max_participants FROM clinics
      WHERE play_day_id = ${playDayId}
    `;

    if (clinicResult.rows.length === 0) {
      return {
        success: false,
        message: "Clinic not found",
      };
    }

    const clinicId = clinicResult.rows[0].id;
    const maxParticipants = clinicResult.rows[0].max_participants;

    // Check if user has already RSVP'd
    const existingRsvp = await sql`
      SELECT id FROM clinic_attendance
      WHERE clinic_id = ${clinicId} AND member_id = ${user.id}
    `;

    if (existingRsvp.rows.length > 0) {
      // User has already RSVP'd, so remove their RSVP
      await sql`
        DELETE FROM clinic_attendance
        WHERE clinic_id = ${clinicId} AND member_id = ${user.id}
      `;

      revalidatePath("/dashboard/member");
      return { success: true, message: "Clinic RSVP removed" };
    } else {
      // Check if clinic is full
      const attendanceCount = await sql`
        SELECT COUNT(*) as count FROM clinic_attendance
        WHERE clinic_id = ${clinicId}
      `;

      if (attendanceCount.rows[0].count >= maxParticipants) {
        return {
          success: false,
          message: "Clinic is full",
        };
      }

      // User has not RSVP'd and clinic is not full, so add their RSVP
      await sql`
        INSERT INTO clinic_attendance (clinic_id, member_id)
        VALUES (${clinicId}, ${user.id})
      `;

      revalidatePath("/dashboard/member");
      return { success: true, message: "Clinic RSVP added" };
    }
  } catch (error) {
    console.error("Error replying to clinic:", error);
    return { success: false, message: "Failed to RSVP to clinic" };
  }
}

// Delete a play day
export async function deletePlayDay(playDayId) {
  try {
    const session = await getSession();
    const user = session?.resultObj;

    if (!user) {
      return {
        success: false,
        message: "You must be logged in to delete a play day",
      };
    }

    // Check if user is an admin
    if (user.memberType !== "ultrashark") {
      return {
        success: false,
        message: "You must be an admin to delete a play day",
      };
    }

    // First, check if there's a clinic for this play day
    const clinicResult = await sql`
      SELECT id FROM clinics WHERE play_day_id = ${playDayId}
    `;

    // If there's a clinic, delete clinic attendance first
    if (clinicResult.rows.length > 0) {
      await sql`
        DELETE FROM clinic_attendance
        WHERE clinic_id = ${clinicResult.rows[0].id}
      `;

      // Then delete the clinic
      await sql`
        DELETE FROM clinics
        WHERE play_day_id = ${playDayId}
      `;
    }

    // Delete attendance records
    await sql`
      DELETE FROM attendance
      WHERE play_day_id = ${playDayId}
    `;

    // Delete updates
    await sql`
      DELETE FROM updates
      WHERE play_day_id = ${playDayId}
    `;

    // Finally, delete the play day
    await sql`
      DELETE FROM play_days
      WHERE id = ${playDayId}
    `;

    revalidatePath("/dashboard/ultrashark");
    return { success: true, message: "Play day deleted successfully!" };
  } catch (error) {
    console.error("Error deleting play day:", error);
    return {
      success: false,
      message: "Failed to delete play day. Please try again.",
    };
  }
}

export async function cancelPlayDay(formData) {
  let result = {
    success: false,
    message: "Failed to cancel play day",
  };

  try {
    const session = await getSession();
    const user = session?.resultObj;

    if (!user) {
      return {
        success: false,
        message: "You must be logged in to cancel a play day",
      };
    }

    // Check if user is an admin
    if (user.memberType !== "ultrashark") {
      return {
        success: false,
        message: "You must be an admin to cancel a play day",
      };
    }

    const playDayId = formData.get("playDayId");
    const cancellationReason = formData.get("cancellationReason");

    if (!playDayId || !cancellationReason) {
      return {
        success: false,
        message: "Play day ID and cancellation reason are required",
      };
    }

    // Get play day details before updating
    const playDayResult = await sql`
      SELECT 
        pd.title, 
        pd.date, 
        pd.start_time, 
        pd.end_time
      FROM 
        play_days pd
      WHERE 
        pd.id = ${playDayId}
    `;

    if (playDayResult.rows.length === 0) {
      return {
        success: false,
        message: "Play day not found",
      };
    }

    const playDay = playDayResult.rows[0];

    // Update play day to mark as cancelled
    await sql`
      UPDATE play_days
      SET 
        is_cancelled = true,
        cancellation_reason = ${cancellationReason},
        cancelled_by = ${user.id},
        cancelled_at = CURRENT_TIMESTAMP
      WHERE id = ${playDayId}
    `;

    // Get all members who have opted into emails
    const membersResult = await sql`
      SELECT 
        id, 
        email, 
        first_name, 
        last_name
      FROM 
        members
      WHERE 
        email_list = true
    `;

    // Format the date for display
    const date = new Date(playDay.date);
    const formattedDate = date.toLocaleDateString("en-US", {
      weekday: "long",
      year: "numeric",
      month: "long",
      day: "numeric",
    });

    // Create a time range string
    const timeRange = `${formatTime(playDay.start_time)} - ${formatTime(
      playDay.end_time
    )}`;

    // Send cancellation emails to members who opted in
    if (membersResult.rows.length > 0) {
      // Format the recipients array for batch sending
      const recipients = membersResult.rows.map((member) => ({
        id: member.id.toString(),
        first_name: member.first_name,
        email: member.email,
      }));

      // Send cancellation emails using our new BCC method
      const emailResult = await sendBatchEmails({
        recipients,
        templateName: "playDayCancellation",
        commonTemplateData: {
          // Match the parameter names expected by renderPlayDayCancellationEmail
          formattedDate: formattedDate,
          timeRange: timeRange,
          cancellationReason: cancellationReason,
          playDay: playDay.title,
        },
        subject: `Sandsharks is cancelled on ${formattedDate}`,
        replyTo: "sandsharks.org@gmail.com",
      });

      if (!emailResult.success) {
        console.error("Error sending cancellation emails:", emailResult.error);
        // Continue with cancellation even if emails fail
      }
    }

    result = {
      success: true,
      message: "Play day cancelled successfully!",
      shouldRedirect: true,
    };
  } catch (error) {
    console.error("Error cancelling play day:", error);
    return {
      success: false,
      message: "Failed to cancel play day. Please try again.",
    };
  }

  // These will only execute if no error was thrown
  revalidatePath("/dashboard/ultrashark");

  // Return the result
  return result;
}

export async function createSponsor(formData) {
  try {
    // Extract data from the form
    const name = formData.get("name");
    const memberId = formData.get("memberId") || null;
    const websiteUrl = formData.get("websiteUrl") || null;
    const instagramUrl = formData.get("instagramUrl") || null;
    const otherUrl = formData.get("otherUrl") || null;
    const description = formData.get("description") || null;
    const logoFile = formData.get("logo");

    // Handle logo upload with Vercel Blob
    let logoUrl = null;
    if (logoFile && logoFile.size > 0) {
      try {
        const { put } = await import("@vercel/blob");
        const filename = `sponsor-logo-${Date.now()}-${logoFile.name}`;

        // Upload the file to Vercel Blob
        const blob = await put(filename, logoFile, {
          access: "public",
        });

        // Get the URL of the uploaded file
        logoUrl = blob.url;
      } catch (uploadError) {
        console.error("Error uploading logo:", uploadError);
        // Continue with the sponsor creation even if the logo upload fails
      }
    }

    // Insert the sponsor into the PostgreSQL database
    const result = await sql`
      INSERT INTO sponsors (
        name,
        member_id,
        website_url,
        instagram_url,
        other_url,
        logo_url,
        description,
        created_at
      ) 
      VALUES (
        ${name},
        ${memberId},
        ${websiteUrl},
        ${instagramUrl},
        ${otherUrl},
        ${logoUrl},
        ${description},
        ${new Date()}
      )
      RETURNING id
    `;

    revalidatePath("/dashboard/ultrashark");
    return {
      success: true,
      message: `Sponsor ${name} created successfully!`,
      logoUrl: logoUrl,
    };
  } catch (error) {
    console.error("Error creating sponsor:", error);
    return {
      success: false,
      message: `Error creating sponsor: ${error.message}`,
    };
  }
}

export async function getSponsors() {
  try {
    const result = await sql`
      SELECT 
        s.*,
        m.first_name || ' ' || m.last_name AS member_name
      FROM 
        sponsors s
      LEFT JOIN
        members m ON s.member_id = m.id
      ORDER BY
        s.name
    `;

    return result.rows;
  } catch (error) {
    console.error("Error fetching sponsors:", error);
    return [];
  }
}

//////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
//donations
//////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

// Initialize Stripe with your secret key
const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);

// Create a payment intent (for Elements integration)
export async function createPaymentIntent(amountInCents, notes = "") {
  try {
    const session = await getSession();
    const user = session?.resultObj;

    if (!user) {
      throw new Error("You must be logged in to make a donation");
    }

    // Create a PaymentIntent with the order amount and currency
    const paymentIntent = await stripe.paymentIntents.create({
      amount: amountInCents,
      currency: "cad",
      metadata: {
        member_id: user.id || user._id,
        notes: notes,
      },
    });

    return {
      clientSecret: paymentIntent.client_secret,
    };
  } catch (error) {
    console.error("Error creating payment intent:", error);
    throw new Error(
      error.message || "An error occurred while processing your donation"
    );
  }
}

// Record a successful donation
export async function recordDonation(paymentIntentId) {
  try {
    // Retrieve the payment intent to get details
    const paymentIntent = await stripe.paymentIntents.retrieve(paymentIntentId);

    if (paymentIntent.status !== "succeeded") {
      return { success: false, message: "Payment not completed" };
    }

    const memberId = paymentIntent.metadata.member_id;
    const donationAmount = paymentIntent.amount / 100;
    const currentDate = new Date();

    // Record the donation in the donations table
    await sql`
      INSERT INTO donations (
        session_id, 
        amount, 
        member_id, 
        status, 
        notes, 
        created_at
      ) 
      VALUES (
        ${paymentIntentId}, 
        ${donationAmount}, 
        ${memberId}, 
        ${"completed"}, 
        ${paymentIntent.metadata.notes}, 
        ${currentDate}
      )
    `;

    // Update the member's last donation information
    await sql`
      UPDATE members
      SET 
        last_donation_date = ${currentDate},
        last_donation_amount = ${donationAmount}
      WHERE id = ${memberId}
    `;

    return { success: true };
  } catch (error) {
    console.error("Error recording donation:", error);
    return { success: false, message: error.message };
  }
}

// Separate function to handle revalidation
export async function revalidateDonationPages() {
  revalidatePath("/dashboard/member");
  return { success: true };
}

// Update the handleDonationSuccess function to prevent duplicate records and send a thank you email
export async function handleDonationSuccess(paymentIntentId) {
  try {
    // First, check if this payment has already been recorded
    const existingDonation = await sql`
      SELECT id FROM donations 
      WHERE session_id = ${paymentIntentId}
    `;

    // If donation already exists, don't record it again
    if (existingDonation.rows.length > 0) {
      console.log(
        `Donation for payment ${paymentIntentId} already recorded, skipping`
      );
      return { success: true, alreadyRecorded: true };
    }

    // Get the session to identify the user
    const session = await getSession();
    if (!session) {
      return { success: false, message: "User session not found" };
    }

    const userId = session.resultObj._id;

    // Fetch payment details from Stripe
    const stripe = require("stripe")(process.env.STRIPE_SECRET_KEY);
    const paymentIntent = await stripe.paymentIntents.retrieve(paymentIntentId);

    if (!paymentIntent || paymentIntent.status !== "succeeded") {
      return { success: false, message: "Invalid payment" };
    }

    // Record the donation in your database
    const amount = paymentIntent.amount / 100; // Convert from cents to dollars
    const donationDate = new Date();

    // Insert the donation record
    await sql`
      INSERT INTO donations (
        member_id,
        amount,
        created_at,
        session_id
      ) VALUES (
        ${userId},
        ${amount},
        ${donationDate},
        ${paymentIntentId}
      )
    `;

    // Update the member's last donation date
    await sql`
      UPDATE members
      SET last_donation_date = ${donationDate}
      WHERE id = ${userId}
    `;

    // Get member details for the email
    const memberResult = await sql`
      SELECT id, first_name, last_name, email
      FROM members
      WHERE id = ${userId}
    `;

    if (memberResult.rows.length > 0) {
      const member = memberResult.rows[0];

      // Send thank you email using our new template system
      const emailResult = await sendEmail({
        to: member.email,
        subject: "Thank You for Your Donation to Sandsharks Beach Volleyball",
        templateName: "donationThankYou",
        templateData: {
          firstName: member.first_name,
          amount: amount,
          donationDate: donationDate,
          memberId: member.id.toString(),
        },
        replyTo: "sandsharks.org@gmail.com",
      });

      if (!emailResult.success) {
        console.error(
          "Error sending donation thank you email:",
          emailResult.error
        );
        // Continue with the function even if email sending fails
      }
    }

    // Revalidate relevant pages
    revalidatePath("/dashboard/member");
    revalidatePath("/dashboard/ultrashark");

    return { success: true };
  } catch (error) {
    console.error("Error in handleDonationSuccess:", error);
    return { success: false, message: error.message || "An error occurred" };
  }
}

// Add this to your _actions.js file
// export async function handleEmailAction(action, id, expires, signature) {
//   try {
//     // Decode URL parameters
//     const decodedAction = decodeURIComponent(action);
//     const decodedId = decodeURIComponent(id);
//     const decodedExpires = decodeURIComponent(expires);
//     const decodedSignature = decodeURIComponent(signature);

//     console.log("Email action request:", {
//       action: decodedAction,
//       id: decodedId,
//       expires: decodedExpires,
//       signature: decodedSignature,
//     });

//     // Validate parameters
//     if (!decodedAction || !decodedId || !decodedExpires || !decodedSignature) {
//       return { success: false, message: "Missing required parameters" };
//     }

//     // Check if the link has expired
//     const expiresTimestamp = parseInt(decodedExpires, 10);
//     const currentTimestamp = Math.floor(Date.now() / 1000);

//     console.log("Timestamp check:", { expiresTimestamp, currentTimestamp });

//     if (currentTimestamp > expiresTimestamp) {
//       return { success: false, message: "This link has expired" };
//     }

//     // Verify the signature
//     const dataToSign = `action=${decodedAction}&id=${decodedId}&expires=${decodedExpires}`;
//     const expectedSignature = crypto
//       .createHmac("sha256", process.env.EMAIL_SIGNATURE_SECRET)
//       .update(dataToSign)
//       .digest("hex");

//     console.log("Signature verification:", {
//       dataToSign,
//       expectedSignature,
//       providedSignature: decodedSignature,
//       secretKeyLength: process.env.EMAIL_SIGNATURE_SECRET?.length || 0,
//       match: decodedSignature === expectedSignature,
//     });

//     if (decodedSignature !== expectedSignature) {
//       return {
//         success: false,
//         message:
//           "Invalid signature. This link appears to be invalid or tampered with.",
//       };
//     }

//     // Process the action
//     if (decodedAction === "unsubscribe") {
//       // Get member details before updating
//       const memberResult = await sql`
//         SELECT first_name, last_name, email
//         FROM members
//         WHERE id = ${decodedId}
//       `;

//       if (memberResult.rows.length === 0) {
//         return { success: false, message: "Member not found" };
//       }

//       const member = memberResult.rows[0];

//       // Update the member's email preferences
//       await sql`
//         UPDATE members
//         SET email_list = false
//         WHERE id = ${decodedId}
//       `;

//       // Send confirmation email
//       try {
//         const resend = new Resend(process.env.RESEND_API_KEY);
//         const baseUrl =
//           process.env.NEXT_PUBLIC_BASE_URL || "https://sandsharks.ca";

//         const emailHtml = `
//           <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
//             <div style="background-color: #0066cc; padding: 20px; text-align: center; border-radius: 8px 8px 0 0;">
//               <img src="${baseUrl}/images/sandsharks-rainbow-icon.svg" alt="Sandsharks Logo" style="height: 60px; margin-bottom: 10px;">
//               <h1 style="color: white; margin: 0;">Unsubscribe Confirmation</h1>
//             </div>

//             <div style="padding: 20px; background-color: #ffffff; border-left: 1px solid #ddd; border-right: 1px solid #ddd; border-bottom: 1px solid #ddd; border-radius: 0 0 8px 8px;">
//               <p style="font-size: 18px;">Hello ${
//                 member.first_name || "there"
//               },</p>

//               <p>You have been successfully unsubscribed from Sandsharks email communications.</p>

//               <p>If you unsubscribed by mistake or would like to resubscribe in the future, you can update your preferences by logging into your account at <a href="${baseUrl}" style="color: #0066cc; text-decoration: underline;">sandsharks.ca</a>.</p>

//               <p style="margin-top: 30px;">Thank you for being part of the Sandsharks community!</p>

//             </div>
//           </div>
//         `;

//         await resend.emails.send({
//           from: "Sandsharks <notifications@sandsharks.ca>",
//           to: member.email,
//           reply_to: "sandsharks.org@gmail.com",
//           subject: "You've been unsubscribed from Sandsharks emails",
//           html: emailHtml,
//         });

//         console.log(`Unsubscribe confirmation email sent to ${member.email}`);
//       } catch (emailError) {
//         console.error(
//           "Error sending unsubscribe confirmation email:",
//           emailError
//         );
//         // Continue even if email fails
//       }

//       return {
//         success: true,
//         message:
//           "You have been successfully unsubscribed from our emails. A confirmation has been sent to your email address.",
//         redirect: "/",
//       };
//     } else {
//       return { success: false, message: "Unknown action" };
//     }
//   } catch (error) {
//     console.error("Error in handleEmailAction:", error);
//     return {
//       success: false,
//       message: "An error occurred while processing your request",
//     };
//   }
// }

export async function handleEmailAction(action, id, expires, signature) {
  try {
    // Decode URL parameters
    const decodedAction = decodeURIComponent(action);
    const decodedId = decodeURIComponent(id);
    const decodedExpires = decodeURIComponent(expires);
    const decodedSignature = decodeURIComponent(signature);

    console.log("Email action request:", {
      action: decodedAction,
      id: decodedId,
      expires: decodedExpires,
      signature: decodedSignature,
    });

    // Validate parameters
    if (!decodedAction || !decodedId || !decodedExpires || !decodedSignature) {
      return { success: false, message: "Missing required parameters" };
    }

    // Check if the link has expired
    const expiresTimestamp = Number.parseInt(decodedExpires, 10);
    const currentTimestamp = Math.floor(Date.now() / 1000);

    if (currentTimestamp > expiresTimestamp) {
      return { success: false, message: "This link has expired" };
    }

    // Verify the signature
    const crypto = require("crypto");
    const dataToSign = `action=${decodedAction}&id=${decodedId}&expires=${decodedExpires}`;
    const expectedSignature = crypto
      .createHmac("sha256", process.env.EMAIL_SIGNATURE_SECRET)
      .update(dataToSign)
      .digest("hex");

    console.log("Signature verification:", {
      dataToSign,
      expectedSignature,
      providedSignature: decodedSignature,
      secretKeyLength: process.env.EMAIL_SIGNATURE_SECRET?.length || 0,
      match: decodedSignature === expectedSignature,
    });

    if (decodedSignature !== expectedSignature) {
      return {
        success: false,
        message:
          "Invalid signature. This link appears to be invalid or tampered with.",
      };
    }

    // Process the action
    if (decodedAction === "unsubscribe") {
      // Get member details before updating
      const memberResult = await sql`
        SELECT first_name, last_name, email
        FROM members 
        WHERE id = ${decodedId}
      `;

      if (memberResult.rows.length === 0) {
        return { success: false, message: "Member not found" };
      }

      const member = memberResult.rows[0];

      // Update the member's email preferences
      await sql`
        UPDATE members 
        SET email_list = false
        WHERE id = ${decodedId}
      `;

      // Send confirmation email using our new template system
      const emailResult = await sendEmail({
        to: member.email,
        subject: "You've been unsubscribed from Sandsharks emails",
        templateName: "unsubscribeConfirmation",
        templateData: {
          firstName: member.first_name,
          memberId: decodedId,
        },
        replyTo: "sandsharks.org@gmail.com",
      });

      if (!emailResult.success) {
        console.error(
          "Error sending unsubscribe confirmation email:",
          emailResult.error
        );
        // Continue even if email fails
      } else {
        console.log(`Unsubscribe confirmation email sent to ${member.email}`);
      }

      return {
        success: true,
        message:
          "You have been successfully unsubscribed from our emails. A confirmation has been sent to your email address.",
        redirect: "/",
      };
    } else {
      return { success: false, message: "Unknown action" };
    }
  } catch (error) {
    console.error("Error in handleEmailAction:", error);
    return {
      success: false,
      message: "An error occurred while processing your request",
    };
  }
}

export async function getDonationsByMember(memberId) {
  try {
    const donations = await sql`
      SELECT * FROM donations 
      WHERE member_id = ${memberId}
      ORDER BY created_at DESC
    `;

    return donations.rows;
  } catch (error) {
    console.error("Error fetching donations:", error);
    return [];
  }
}

export async function getAllDonations() {
  try {
    const donations = await sql`
      SELECT d.*, m.first_name, m.last_name
      FROM donations d
      LEFT JOIN members m ON d.member_id = m.id
      ORDER BY d.created_at DESC
    `;

    return donations.rows;
  } catch (error) {
    console.error("Error fetching all donations:", error);
    return [];
  }
}

// New function to check if a member should be prompted to donate
export async function shouldPromptForDonation(memberId) {
  try {
    const result = await sql`
      SELECT 
        last_donation_date,
        last_donation_amount
      FROM members
      WHERE id = ${memberId}
    `;

    if (result.rows.length === 0) {
      return { shouldPrompt: true, reason: "member-not-found" };
    }

    const member = result.rows[0];

    // If they've never donated
    if (!member.last_donation_date) {
      return { shouldPrompt: true, reason: "never-donated" };
    }

    // If it's been more than 6 months since their last donation
    const sixMonthsAgo = new Date();
    sixMonthsAgo.setMonth(sixMonthsAgo.getMonth() - 6);

    if (new Date(member.last_donation_date) < sixMonthsAgo) {
      return {
        shouldPrompt: true,
        reason: "time-elapsed",
        lastDonation: {
          date: member.last_donation_date,
          amount: member.last_donation_amount,
        },
      };
    }

    // They've donated recently
    return {
      shouldPrompt: false,
      lastDonation: {
        date: member.last_donation_date,
        amount: member.last_donation_amount,
      },
    };
  } catch (error) {
    console.error("Error checking donation status:", error);
    return { shouldPrompt: false, error: error.message };
  }
}

////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
//email sending with resend
////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

// Simple custom formatter to convert basic markdown to HTML
function simpleMarkdownToHtml(text) {
  if (!text) return "";

  // Replace headings
  text = text.replace(/^# (.*?)$/gm, "<h1>$1</h1>");
  text = text.replace(/^## (.*?)$/gm, "<h2>$1</h2>");
  text = text.replace(/^### (.*?)$/gm, "<h3>$1</h3>");

  // Replace bold
  text = text.replace(/\*\*(.*?)\*\*/g, "<strong>$1</strong>");

  // Replace italic
  text = text.replace(/\*(.*?)\*/g, "<em>$1</em>");

  // Replace lists (simple implementation)
  text = text.replace(/^- (.*?)$/gm, "<li>$1</li>");
  text = text.replace(/(<li>.*?<\/li>(\n|$))+/g, "<ul>$&</ul>");

  // Replace links
  text = text.replace(
    /\[(.*?)\]$$(.*?)$$/g,
    '<a href="$2" target="_blank" rel="noopener noreferrer">$1</a>'
  );

  // Replace line breaks with <br> tags
  text = text.replace(/\n/g, "<br>");

  return text;
}

const emailTemplates = {
  default: (content, subject, memberId) => `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
      <div style="background-color: #0066cc; padding: 20px; text-align: center;">
        <h1 style="color: white; margin: 0;">Sandsharks</h1>
      </div>
      
      <div style="padding: 20px; background-color: #ffffff;">
        <h2 style="color: #0066cc;">${subject}</h2>
        ${content}
      </div>
      
      ${generateEmailFooter(memberId)}
    </div>
  `,

  event: (content, subject, memberId) => `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
      <div style="background-color: #ff6600; padding: 20px; text-align: center;">
        <h1 style="color: white; margin: 0;">Sandsharks Event</h1>
      </div>
      
      <div style="padding: 20px; background-color: #ffffff;">
        <h2 style="color: #ff6600; text-align: center;">${subject}</h2>
        <div style="border-left: 4px solid #ff6600; padding-left: 15px;">
          ${content}
        </div>
      </div>
      
      ${generateEmailFooter(memberId)}
    </div>
  `,

  update: (content, subject, memberId) => `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
      <div style="background-color: #009933; padding: 20px; text-align: center;">
        <h1 style="color: white; margin: 0;">Sandsharks Weekly Update</h1>
      </div>
      
      <div style="padding: 20px; background-color: #ffffff;">
        <h2 style="color: #009933;">${subject}</h2>
        ${content}
      </div>
      
      ${generateEmailFooter(memberId)}
    </div>
  `,

  minimal: (content, subject, memberId) => `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
      <h2 style="color: #333333; border-bottom: 1px solid #eeeeee; padding-bottom: 10px;">${subject}</h2>
      ${content}
      
      ${generateEmailFooter(memberId)}
    </div>
  `,
};

// Send individual emails to each member with customized content
// export async function sendEmailBlast(formData) {
//   try {
//     const session = await getSession();
//     const user = session?.resultObj;

//     if (!user) {
//       return {
//         success: false,
//         message: "You must be logged in to send email blasts",
//       };
//     }

//     const subject = formData.get("subject");
//     const emailContent = formData.get("emailContent");
//     const template = formData.get("template") || "default";
//     const memberGroup = formData.get("memberGroup");

//     if (!subject || !emailContent || !memberGroup) {
//       return {
//         success: false,
//         message: "Subject, content, and member group are required",
//       };
//     }

//     // Convert markdown to HTML using our simple formatter
//     const contentHtml = simpleMarkdownToHtml(emailContent);

//     // Get the current year for donation check
//     const currentYear = new Date().getFullYear();

//     // Get emails based on the selected member group
//     // Only include members who have opted in to emails (email_list = true)
//     let membersQuery;

//     switch (memberGroup) {
//       case "all":
//         membersQuery = await sql`
//           SELECT
//             id,
//             email,
//             last_donation_date
//           FROM members
//           WHERE
//             member_type != 'pending'
//             AND email_list = true
//         `;
//         break;
//       case "volunteers":
//         membersQuery = await sql`
//           SELECT
//             id,
//             email,
//             last_donation_date
//           FROM members
//           WHERE
//             member_type = 'volunteer'
//         `;
//         break;
//       default:
//         return {
//           success: false,
//           message: "Invalid member group selected",
//         };
//     }

//     if (membersQuery.rows.length === 0) {
//       return {
//         success: false,
//         message: `No members found in the "${memberGroup}" group who have opted in to emails`,
//       };
//     }

//     // Donation message to add for members who haven't donated this year
//     const donationMessage = `
//       <div style="margin-top: 20px; padding: 15px; background-color: #f9f9f9; border-left: 4px solid #ff6600;">
//         <p><strong>Please consider making a donation to Sandsharks for the ${new Date().getFullYear()} season.</strong></p>
//         <p>Sandsharks is run solely by volunteers and donations from members like you. Donations cover the costs of court rentals, storage, new equipment, insurance, website hosting, and more. Donations are pay-what-you-can, with a suggested donation of $40 for the entire season.</p>
//         <p><a href="https://sandsharks.ca/donate" style="display: inline-block; background-color: #ff6600; color: white; padding: 8px 15px; text-decoration: none; border-radius: 4px; margin-top: 10px;">Donate Now</a></p>
//       </div>
//     `;

//     // Initialize Resend
//     const resend = new Resend(process.env.RESEND_API_KEY);

//     // Track how many emails were sent
//     let emailsSent = 0;

//     // Send individual emails to each member with customized content
//     for (const member of membersQuery.rows) {
//       // Check if the member has donated this year
//       const needsDonationMessage =
//         !member.last_donation_date ||
//         new Date(member.last_donation_date).getFullYear() < currentYear;

//       // Add donation message if needed
//       const memberContentHtml = needsDonationMessage
//         ? contentHtml + donationMessage
//         : contentHtml;

//       // Apply the selected template - now passing the member ID
//       const templateFunction =
//         emailTemplates[template] || emailTemplates.default;
//       const htmlMessage = templateFunction(
//         memberContentHtml,
//         subject,
//         member.id
//       );

//       // Send the email
//       const { data, error } = await resend.emails.send({
//         from: "Sandsharks <noreply@sandsharks.ca>", // Your verified domain
//         reply_to: process.env.REPLY_TO_EMAIL, // Your Gmail address
//         to: member.email,
//         subject: subject,
//         html: htmlMessage,
//       });

//       if (!error) {
//         emailsSent++;
//       }
//     }

//     if (emailsSent === 0) {
//       return {
//         success: false,
//         message: "Failed to send any emails. Please try again.",
//       };
//     }

//     // Record the email blast in the database
//     await sql`
//       INSERT INTO email_blasts (
//         sender_id,
//         subject,
//         message,
//         sent_at,
//         member_group,
//         recipient_count,
//         template
//       )
//       VALUES (
//         ${user.id},
//         ${subject},
//         ${emailContent},
//         ${new Date()},
//         ${memberGroup},
//         ${emailsSent},
//         ${template}
//       )
//     `;

//     return {
//       success: true,
//       message: `Email blast sent successfully to ${emailsSent} members in the "${memberGroup}" group!`,
//       recipientCount: emailsSent,
//     };
//   } catch (error) {
//     console.error("Error sending email blast:", error);
//     return {
//       success: false,
//       message: "Failed to send email blast. Please try again.",
//     };
//   }
// }

export async function sendEmailBlast(formData) {
  try {
    const session = await getSession();
    const user = session?.resultObj;

    if (!user) {
      return {
        success: false,
        message: "You must be logged in to send email blasts",
      };
    }

    const subject = formData.get("subject");
    const emailContent = formData.get("emailContent");
    const template = formData.get("template") || "default";
    const memberGroup = formData.get("memberGroup");

    if (!subject || !emailContent || !memberGroup) {
      return {
        success: false,
        message: "Subject, content, and member group are required",
      };
    }

    // Convert markdown to HTML using our simple formatter
    const contentHtml = simpleMarkdownToHtml(emailContent);

    // Get the current year for donation check
    const currentYear = new Date().getFullYear();

    // Get emails based on the selected member group
    // Only include members who have opted in to emails (email_list = true)
    let membersQuery;

    switch (memberGroup) {
      case "all":
        membersQuery = await sql`
          SELECT
            id,
            first_name,
            email,
            last_donation_date
          FROM members
          WHERE
            member_type != 'pending'
            AND email_list = true
        `;
        break;
      case "volunteers":
        membersQuery = await sql`
          SELECT 
            id, 
            first_name,
            email, 
            last_donation_date 
          FROM members 
          WHERE 
            member_type = 'volunteer'
            AND email_list = true
        `;
        break;
      default:
        return {
          success: false,
          message: "Invalid member group selected",
        };
    }

    if (membersQuery.rows.length === 0) {
      return {
        success: false,
        message: `No members found in the "${memberGroup}" group who have opted in to emails`,
      };
    }

    // Format the recipients array for batch sending
    const recipients = membersQuery.rows.map((member) => ({
      id: member.id.toString(),
      first_name: member.first_name,
      email: member.email,
      needsDonation:
        !member.last_donation_date ||
        new Date(member.last_donation_date).getFullYear() < currentYear,
    }));

    // Send batch emails using our new system
    const emailResult = await sendBatchEmails({
      recipients,
      templateName: "emailBlast",
      commonTemplateData: {
        content: contentHtml,
        subject,
        currentYear,
      },
      subject,
      replyTo: process.env.REPLY_TO_EMAIL,
    });

    if (!emailResult.success) {
      console.error("Error sending email blast:", emailResult.error);
      return {
        success: false,
        message: "Failed to send email blast. Please try again.",
      };
    }

    // Record the email blast in the database
    await sql`
      INSERT INTO email_blasts (
        sender_id,
        subject,
        message,
        sent_at,
        member_group,
        recipient_count,
        template
      )
      VALUES (
        ${user.id},
        ${subject},
        ${emailContent},
        ${new Date()},
        ${memberGroup},
        ${emailResult.stats.successCount},
        ${template}
      )
    `;

    return {
      success: true,
      message: `Email blast sent successfully to ${emailResult.stats.successCount} members in the "${memberGroup}" group!`,
      recipientCount: emailResult.stats.successCount,
    };
  } catch (error) {
    console.error("Error sending email blast:", error);
    return {
      success: false,
      message: "Failed to send email blast. Please try again.",
    };
  }
}

export async function getEmailBlasts() {
  try {
    const result = await sql`
      SELECT 
        eb.id,
        eb.subject,
        eb.message,
        eb.sent_at,
        m.first_name || ' ' || m.last_name AS sender_name
      FROM 
        email_blasts eb
      JOIN 
        members m ON eb.sender_id = m.id
      ORDER BY 
        eb.sent_at DESC
      LIMIT 10
    `;

    return result.rows;
  } catch (error) {
    console.error("Error fetching email blasts:", error);
    return [];
  }
}

export async function getAllMembers() {
  const session = await getSession();
  if (!session) {
    return { message: "You must be logged in to get members list" };
  }

  try {
    // Query members with sponsor information using a LEFT JOIN
    // Added waiver_confirmed_at to the SELECT statement
    const membersResult = await sql`
      SELECT 
        m.id,
        m.first_name,
        m.last_name,
        m.email,
        m.pronouns,
        m.profile_pic_url,
        m.photo_consent,
        m.email_list,
        m.waiver_confirmed,
        m.waiver_confirmed_at,
        m.member_type,
        m.instagram_handle,
        m.about,
        m.profile_pic_status,
        s.id AS sponsor_id,
        s.name AS sponsor_name,
        s.logo_url AS sponsor_logo
      FROM 
        members m
      LEFT JOIN 
        sponsors s ON m.id = s.member_id
      ORDER BY 
        m.last_name, m.first_name
    `;

    // Process the results to handle members with multiple sponsors
    const membersMap = new Map();

    for (const row of membersResult.rows) {
      if (!membersMap.has(row.id)) {
        // Create a new member object
        // Added waiverConfirmedAt property
        membersMap.set(row.id, {
          id: row.id,
          firstName: row.first_name,
          lastName: row.last_name,
          email: row.email,
          pronouns: row.pronouns,
          profilePicUrl: row.profile_pic_url,
          profilePicStatus: row.profile_pic_status,
          photoConsent: row.photo_consent,
          emailList: row.email_list,
          waiverConfirmed: row.waiver_confirmed,
          waiverConfirmedAt: row.waiver_confirmed_at,
          memberType: row.member_type,
          instagramHandle: row.instagram_handle,
          about: row.about,
          isVolunteer:
            row.member_type === "volunteer" ||
            row.member_type === "admin" ||
            row.member_type === "ultrashark",
          sponsors: [],
        });
      }

      // Add sponsor information if it exists
      if (row.sponsor_id) {
        membersMap.get(row.id).sponsors.push({
          id: row.sponsor_id,
          name: row.sponsor_name,
          logoUrl: row.sponsor_logo,
        });
      }
    }

    // Convert the map to an array
    const members = Array.from(membersMap.values());

    return members;
  } catch (error) {
    console.error("Error fetching members:", error);
    return { error: "Failed to fetch members" };
  }
}

// export async function getAllMembers() {
//   const session = await getSession();
//   if (!session) {
//     return { message: "You must be logged in to get members list" };
//   }

//   try {
//     // Query members with sponsor information using a LEFT JOIN
//     // Removed s.website since it doesn't exist in your sponsors table
//     const membersResult = await sql`
//       SELECT
//         m.id,
//         m.first_name,
//         m.last_name,
//         m.email,
//         m.pronouns,
//         m.profile_pic_url,
//         m.photo_consent,
//         m.member_type,
//         m.instagram_handle,
//         m.about,
//         m.profile_pic_status,
//         s.id AS sponsor_id,
//         s.name AS sponsor_name,
//         s.logo_url AS sponsor_logo
//       FROM
//         members m
//       LEFT JOIN
//         sponsors s ON m.id = s.member_id
//       ORDER BY
//         m.last_name, m.first_name
//     `;

//     // Process the results to handle members with multiple sponsors
//     const membersMap = new Map();

//     for (const row of membersResult.rows) {
//       if (!membersMap.has(row.id)) {
//         // Create a new member object
//         membersMap.set(row.id, {
//           id: row.id,
//           firstName: row.first_name,
//           lastName: row.last_name,
//           email: row.email,
//           pronouns: row.pronouns,
//           profilePicUrl: row.profile_pic_url,
//           profilePicStatus: row.profile_pic_status,
//           photoConsent: row.photo_consent,
//           memberType: row.member_type,
//           instagramHandle: row.instagram_handle,
//           about: row.about,
//           isVolunteer:
//             row.member_type === "volunteer" ||
//             row.member_type === "admin" ||
//             row.member_type === "ultrashark",
//           sponsors: [],
//         });
//       }

//       // Add sponsor information if it exists
//       if (row.sponsor_id) {
//         membersMap.get(row.id).sponsors.push({
//           id: row.sponsor_id,
//           name: row.sponsor_name,
//           logoUrl: row.sponsor_logo,
//         });
//       }
//     }

//     // Convert the map to an array
//     const members = Array.from(membersMap.values());

//     return members;
//   } catch (error) {
//     console.error("Error fetching members:", error);
//     return { error: "Failed to fetch members" };
//   }
// }

export async function approveMember(memberId) {
  const session = await getSession();
  if (!session?.resultObj) {
    return {
      success: false,
      message: "You must be logged in to approve members",
    };
  }

  try {
    await sql`
      UPDATE members 
      SET member_type = 'member' 
      WHERE id = ${memberId}
    `;

    revalidatePath("/dashboard/ultrashark/members");
    return { success: true };
  } catch (error) {
    console.error("Error approving member:", error);
    return { success: false, message: "Failed to approve member" };
  }
}

export async function rejectMember(memberId) {
  const session = await getSession();
  if (!session?.resultObj) {
    return {
      success: false,
      message: "You must be logged in to reject members",
    };
  }

  try {
    await sql`
      DELETE FROM members 
      WHERE id = ${memberId} AND member_type = 'pending'
    `;

    revalidatePath("/dashboard/ultrashark/members");
    return { success: true };
  } catch (error) {
    console.error("Error rejecting member:", error);
    return { success: false, message: "Failed to reject member" };
  }
}

export async function approveProfilePic(memberId) {
  const session = await getSession();
  if (!session?.resultObj) {
    return {
      success: false,
      message: "You must be logged in to approve profile pictures",
    };
  }

  try {
    await sql`
      UPDATE members 
      SET profile_pic_status = 'approved' 
      WHERE id = ${memberId}
    `;

    revalidatePath("/dashboard/ultrashark/members");
    return { success: true };
  } catch (error) {
    console.error("Error approving profile picture:", error);
    return { success: false, message: "Failed to approve profile picture" };
  }
}

export async function rejectProfilePic(memberId) {
  const session = await getSession();
  if (!session?.resultObj) {
    return {
      success: false,
      message: "You must be logged in to reject profile pictures",
    };
  }

  try {
    // Get the member's current and previous profile picture info
    const memberResult = await sql`
      SELECT 
        profile_pic_url, 
        profile_pic_status, 
        previous_profile_pic_url, 
        previous_profile_pic_status
      FROM members
      WHERE id = ${memberId}
    `;

    if (memberResult.rows.length === 0) {
      return {
        success: false,
        message: "Member not found",
      };
    }

    const member = memberResult.rows[0];

    // Check if there's a previous approved profile picture to revert to
    if (
      member.previous_profile_pic_status === "approved" &&
      member.previous_profile_pic_url
    ) {
      // Revert to the previous approved profile picture
      await sql`
        UPDATE members 
        SET 
          profile_pic_url = ${member.previous_profile_pic_url},
          profile_pic_status = ${member.previous_profile_pic_status},
          previous_profile_pic_url = NULL,
          previous_profile_pic_status = NULL
        WHERE id = ${memberId}
      `;

      revalidatePath("/dashboard/ultrashark/members");
      return {
        success: true,
        message:
          "Profile picture rejected. Reverted to previous approved picture.",
      };
    } else {
      // No previous approved picture, just mark the current one as rejected
      await sql`
        UPDATE members 
        SET 
          profile_pic_status = 'rejected'
        WHERE id = ${memberId}
      `;

      revalidatePath("/dashboard/ultrashark/members");
      return {
        success: true,
        message: "Profile picture rejected.",
      };
    }
  } catch (error) {
    console.error("Error rejecting profile picture:", error);
    return { success: false, message: "Failed to reject profile picture" };
  }
}

// Add these new server actions for member management

export async function getMemberById(memberId) {
  const session = await getSession();
  if (!session?.resultObj) {
    return { error: "You must be logged in to view member details" };
  }

  try {
    // Query member with sponsor information
    const memberResult = await sql`
      SELECT 
        m.id,
        m.first_name,
        m.last_name,
        m.email,
        m.pronouns,
        m.profile_pic_url,
        m.photo_consent,
        m.member_type,
        m.profile_pic_status,
        m.created_at,
        m.email_list,
        m.last_donation_date,
        s.id AS sponsor_id,
        s.name AS sponsor_name,
        s.logo_url AS sponsor_logo
      FROM 
        members m
      LEFT JOIN 
        sponsors s ON m.id = s.member_id
      WHERE 
        m.id = ${memberId}
    `;

    if (memberResult.rows.length === 0) {
      return { error: "Member not found" };
    }

    // Process the results to handle members with multiple sponsors
    const member = {
      id: memberResult.rows[0].id,
      firstName: memberResult.rows[0].first_name,
      lastName: memberResult.rows[0].last_name,
      email: memberResult.rows[0].email,
      pronouns: memberResult.rows[0].pronouns,
      profilePicUrl: memberResult.rows[0].profile_pic_url,
      profilePicStatus: memberResult.rows[0].profile_pic_status,
      photoConsent: memberResult.rows[0].photo_consent,
      memberType: memberResult.rows[0].member_type,
      createdAt: memberResult.rows[0].created_at,
      emailList: memberResult.rows[0].email_list,
      lastDonationDate: memberResult.rows[0].last_donation_date,
      isVolunteer:
        memberResult.rows[0].member_type === "volunteer" ||
        memberResult.rows[0].member_type === "admin" ||
        memberResult.rows[0].member_type === "ultrashark",
      sponsors: [],
    };

    // Add sponsor information if it exists
    for (const row of memberResult.rows) {
      if (row.sponsor_id) {
        member.sponsors.push({
          id: row.sponsor_id,
          name: row.sponsor_name,
          logoUrl: row.sponsor_logo,
        });
      }
    }

    return member;
  } catch (error) {
    console.error("Error fetching member:", error);
    return { error: "Failed to fetch member details" };
  }
}

export async function updateMemberType(memberId, newType) {
  try {
    const session = await getSession();
    if (!session || session.resultObj.memberType !== "ultrashark") {
      return {
        success: false,
        message: "You must be an admin to update member types",
      };
    }

    // Validate the new type
    if (!["member", "volunteer", "admin", "ultrashark"].includes(newType)) {
      return {
        success: false,
        message: "Invalid member type",
      };
    }

    // Update the member type in the database
    await sql`
      UPDATE members
      SET member_type = ${newType}
      WHERE id = ${memberId}
    `;

    // Get the member's name for the success message
    const memberResult = await sql`
      SELECT first_name, last_name
      FROM members
      WHERE id = ${memberId}
    `;

    const memberName =
      memberResult.rows.length > 0
        ? `${memberResult.rows[0].first_name} ${memberResult.rows[0].last_name}`
        : "Member";

    // Create appropriate success message based on the action
    let successMessage;
    if (newType === "volunteer") {
      successMessage = `${memberName} has been made a volunteer`;
    } else if (newType === "member") {
      successMessage = `${memberName} is now a regular member`;
    } else {
      successMessage = `${memberName}'s status has been updated to ${newType}`;
    }

    revalidatePath("/dashboard/ultrashark/members");
    return {
      success: true,
      message: successMessage,
    };
  } catch (error) {
    console.error("Error updating member type:", error);
    return {
      success: false,
      message: "Failed to update member type. Please try again.",
    };
  }
}

export async function deleteMember(memberId) {
  const session = await getSession();
  if (!session?.resultObj) {
    return {
      success: false,
      message: "You must be logged in to delete members",
    };
  }

  try {
    // Delete all related records in other tables first

    // Delete from sponsors
    await sql`
      DELETE FROM sponsors 
      WHERE member_id = ${memberId}
    `;

    // Delete from donations
    await sql`
      DELETE FROM donations 
      WHERE member_id = ${memberId}
    `;

    // Delete from volunteers
    await sql`
      DELETE FROM volunteers 
      WHERE member_id = ${memberId}
    `;

    // Delete from attendance
    await sql`
      DELETE FROM attendance 
      WHERE member_id = ${memberId}
    `;

    // Delete from clinic_attendance
    await sql`
      DELETE FROM clinic_attendance 
      WHERE member_id = ${memberId}
    `;

    // Delete from email_tokens
    await sql`
      DELETE FROM email_tokens 
      WHERE member_id = ${memberId}
    `;

    // Update play_days table to set volunteer IDs to null
    await sql`
      UPDATE play_days
      SET main_volunteer_id = NULL
      WHERE main_volunteer_id = ${memberId}
    `;

    await sql`
      UPDATE play_days
      SET helper_volunteer_id = NULL
      WHERE helper_volunteer_id = ${memberId}
    `;

    // Handle created_by and cancelled_by in play_days
    // Option 1: Set to NULL if allowed
    await sql`
      UPDATE play_days
      SET created_by = NULL
      WHERE created_by = ${memberId}
    `;

    await sql`
      UPDATE play_days
      SET cancelled_by = NULL
      WHERE cancelled_by = ${memberId}
    `;

    // Handle updates table
    await sql`
      UPDATE updates
      SET created_by = NULL
      WHERE created_by = ${memberId}
    `;

    // Handle email_blasts table
    await sql`
      UPDATE email_blasts
      SET sender_id = NULL
      WHERE sender_id = ${memberId}
    `;

    // Finally delete the member
    await sql`
      DELETE FROM members 
      WHERE id = ${memberId}
    `;

    revalidatePath("/dashboard/ultrashark/members");
    return { success: true, message: "Member deleted successfully" };
  } catch (error) {
    console.error("Error deleting member:", error);
    return { success: false, message: "Failed to delete member" };
  }
}

export async function uploadProfilePicture(formData) {
  const session = await getSession();
  if (!session?.resultObj) {
    return {
      success: false,
      message: "You must be logged in to upload a profile picture",
    };
  }

  try {
    const userId = session.resultObj._id;
    const file = formData.get("profilePicture");

    if (!file || file.size === 0) {
      return { success: false, message: "No file provided" };
    }

    // Validate file type
    if (!file.type.startsWith("image/")) {
      return {
        success: false,
        message: "Please upload an image file (JPEG, PNG, etc.)",
      };
    }

    // Validate file size (limit to 5MB)
    if (file.size > 5 * 1024 * 1024) {
      return { success: false, message: "File size exceeds 5MB limit" };
    }

    // Upload to Vercel Blob
    const { put } = await import("@vercel/blob");
    const filename = `profile-pic-${userId}-${Date.now()}-${file.name}`;

    const blob = await put(filename, file, {
      access: "public",
    });

    // Update the user's profile picture URL in the database
    await sql`
      UPDATE members 
      SET 
        profile_pic_url = ${blob.url},
        profile_pic_status = 'pending'
      WHERE id = ${userId}
    `;

    revalidatePath("/dashboard/member");
    return {
      success: true,
      message:
        "Profile picture uploaded successfully! It will be reviewed by an admin.",
      url: blob.url,
    };
  } catch (error) {
    console.error("Error uploading profile picture:", error);
    return {
      success: false,
      message: `Error uploading profile picture: ${error.message}`,
    };
  }
}

// Add these new server actions to your _actions.js file

export async function updateMemberProfile(prevState, formData) {
  const session = await getSession();
  if (!session) {
    return {
      success: false,
      message: "You must be logged in to update your profile.",
    };
  }

  const userId = session.resultObj._id;

  try {
    // Extract form data
    const firstName = formData.get("firstName");
    const lastName = formData.get("lastName");
    const pronouns = formData.get("pronouns");
    const email = formData.get("email");
    const about = formData.get("about");
    const instagramHandle = formData.get("instagramHandle");

    // Get the checkbox values as strings and convert to booleans
    const emailListStr = formData.get("emailList");
    const photoConsentStr = formData.get("photoConsent");

    // Convert string values to booleans
    const emailList = emailListStr === "true";
    const photoConsent = photoConsentStr === "true";

    console.log("Form values received in server action:", {
      emailListStr,
      photoConsentStr,
      emailList,
      photoConsent,
      instagramHandle,
    });

    const profilePicture = formData.get("profilePicture");

    // Normalize and validate data
    const normalizedEmail = email.toLowerCase().trim();
    const capitalizedFirstName =
      firstName.charAt(0).toUpperCase() + firstName.slice(1);
    const capitalizedLastName =
      lastName.charAt(0).toUpperCase() + lastName.slice(1);

    // Clean Instagram handle (remove @ if present)
    const cleanedInstagramHandle = instagramHandle
      ? instagramHandle.trim().replace(/^@/, "")
      : null;

    // Check if email is already in use by another user
    const emailCheck = await sql`
      SELECT id FROM members 
      WHERE email = ${normalizedEmail} AND id != ${userId}
    `;

    if (emailCheck.rows.length > 0) {
      return {
        success: false,
        message: "This email is already in use by another account.",
      };
    }

    // If a new profile picture is being uploaded, we need to handle it
    if (profilePicture && profilePicture.size > 0) {
      // First, get the current profile picture info to save as previous
      const currentProfileResult = await sql`
        SELECT profile_pic_url, profile_pic_status
        FROM members
        WHERE id = ${userId}
      `;

      let currentProfilePicUrl = null;
      let currentProfilePicStatus = null;

      if (currentProfileResult.rows.length > 0) {
        currentProfilePicUrl = currentProfileResult.rows[0].profile_pic_url;
        currentProfilePicStatus =
          currentProfileResult.rows[0].profile_pic_status;
      }

      // Upload the new profile picture to Vercel Blob
      const { put } = await import("@vercel/blob");
      const filename = `profile-pic-${userId}-${Date.now()}-${
        profilePicture.name
      }`;

      const blob = await put(filename, profilePicture, {
        access: "public",
      });

      const newProfilePicUrl = blob.url;
      const newProfilePicStatus = "pending";

      // Update user profile with new picture and store previous picture info
      await sql`
        UPDATE members 
        SET 
          first_name = ${capitalizedFirstName},
          last_name = ${capitalizedLastName},
          pronouns = ${pronouns},
          email = ${normalizedEmail},
          about = ${about},
          instagram_handle = ${cleanedInstagramHandle},
          email_list = ${emailList},
          photo_consent = ${photoConsent},
          profile_pic_url = ${newProfilePicUrl},
          profile_pic_status = ${newProfilePicStatus},
          previous_profile_pic_url = ${currentProfilePicUrl},
          previous_profile_pic_status = ${currentProfilePicStatus}
        WHERE id = ${userId}
      `;
    } else {
      // If there's no new profile picture, just update the other fields
      await sql`
        UPDATE members 
        SET 
          first_name = ${capitalizedFirstName},
          last_name = ${capitalizedLastName},
          pronouns = ${pronouns},
          email = ${normalizedEmail},
          about = ${about},
          instagram_handle = ${cleanedInstagramHandle},
          email_list = ${emailList},
          photo_consent = ${photoConsent}
        WHERE id = ${userId}
      `;
    }

    revalidatePath("/dashboard/member");
    return {
      success: true,
      message: "Profile updated successfully!",
    };
  } catch (error) {
    console.error("Error updating profile:", error);
    return {
      success: false,
      message: "Failed to update profile. Please try again.",
    };
  }
}

export async function updatePassword(formData) {
  const session = await getSession();
  if (!session) {
    return {
      success: false,
      message: "You must be logged in to update your password.",
    };
  }

  const userId = session.resultObj._id;

  // Log the incoming data type for debugging
  console.log("updatePassword received:", {
    type: typeof formData,
    isFormData: formData instanceof FormData,
    keys:
      formData instanceof FormData
        ? [...formData.keys()]
        : Object.keys(formData),
  });

  // Handle both FormData and regular objects
  const currentPassword =
    formData instanceof FormData
      ? formData.get("currentPassword")
      : formData.currentPassword;

  const newPassword =
    formData instanceof FormData
      ? formData.get("newPassword")
      : formData.newPassword;

  const confirmPassword =
    formData instanceof FormData
      ? formData.get("confirmPassword")
      : formData.confirmPassword;

  // Log the extracted values (without showing the actual passwords)
  console.log("Extracted values:", {
    currentPasswordExists: !!currentPassword,
    newPasswordExists: !!newPassword,
    confirmPasswordExists: !!confirmPassword,
  });

  // Validate inputs
  if (!currentPassword || !newPassword || !confirmPassword) {
    return {
      success: false,
      message: "All fields are required.",
    };
  }

  if (newPassword !== confirmPassword) {
    return {
      success: false,
      message: "New passwords do not match.",
    };
  }

  if (newPassword.length < 6) {
    return {
      success: false,
      message: "New password must be at least 6 characters long.",
    };
  }

  try {
    // Get the user's current password hash
    const userResult = await sql`
      SELECT password FROM members WHERE id = ${userId}
    `;

    if (userResult.rows.length === 0) {
      return {
        success: false,
        message: "User not found.",
      };
    }

    const storedHash = userResult.rows[0].password;

    // Verify the current password
    const isPasswordValid = await bcrypt.compare(currentPassword, storedHash);
    if (!isPasswordValid) {
      return {
        success: false,
        message: "Current password is incorrect.",
      };
    }

    // Hash the new password
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(newPassword, salt);

    // Update the password in the database
    await sql`
      UPDATE members 
      SET password = ${hashedPassword}
      WHERE id = ${userId}
    `;

    return {
      success: true,
      message: "Password updated successfully!",
    };
  } catch (error) {
    console.error("Error updating password:", error);
    return {
      success: false,
      message: "Failed to update password. Please try again.",
    };
  }
}

export async function deleteAccount(formData) {
  const session = await getSession();
  if (!session) {
    return {
      success: false,
      message: "You must be logged in to delete your account.",
    };
  }

  const userId = session.resultObj._id;

  // Handle both FormData and regular objects
  const password =
    formData instanceof FormData ? formData.get("password") : formData.password;

  if (!password) {
    return {
      success: false,
      message: "Password is required to confirm account deletion.",
    };
  }

  try {
    // Get the user's details before deletion
    const userResult = await sql`
      SELECT id, first_name, last_name, email, password FROM members WHERE id = ${userId}
    `;

    if (userResult.rows.length === 0) {
      return {
        success: false,
        message: "User not found.",
      };
    }

    const user = userResult.rows[0];
    const storedHash = user.password;
    const userEmail = user.email;
    const firstName = user.first_name;

    // Verify the password
    const isPasswordValid = await bcrypt.compare(password, storedHash);
    if (!isPasswordValid) {
      return {
        success: false,
        message: "Password is incorrect. Account deletion canceled.",
      };
    }

    // Delete all related records in order of dependency

    // 1. First delete any donations made by the member
    await sql`
      DELETE FROM donations 
      WHERE member_id = ${userId}
    `;

    // 2. Handle sponsor records - first find all sponsor IDs associated with this user
    const sponsorIds = await sql`
      SELECT id FROM sponsors 
      WHERE member_id = ${userId}
    `;

    // For each sponsor ID, update play_days to remove the reference
    if (sponsorIds.rows.length > 0) {
      for (const row of sponsorIds.rows) {
        const sponsorId = row.id;

        // Update play_days to set sponsor_id to NULL
        await sql`
          UPDATE play_days
          SET sponsor_id = NULL
          WHERE sponsor_id = ${sponsorId}
        `;
      }
    }

    // Now it's safe to delete the sponsor records
    await sql`
      DELETE FROM sponsors 
      WHERE member_id = ${userId}
    `;

    // 3. Check for other potential foreign key relationships and delete those records
    try {
      await sql`
        DELETE FROM play_day_volunteers 
        WHERE member_id = ${userId}
      `;
    } catch (error) {
      console.log(
        "Note: play_day_volunteers table might not exist or no records to delete"
      );
    }

    try {
      await sql`
        DELETE FROM clinic_participants 
        WHERE member_id = ${userId}
      `;
    } catch (error) {
      console.log(
        "Note: clinic_participants table might not exist or no records to delete"
      );
    }

    // 3.5 Handle updates table - DELETE records instead of setting to NULL
    await sql`
      DELETE FROM updates
      WHERE created_by = ${userId}
    `;

    // 3.6 Handle any other tables that might reference the member
    // Update play_days table to set volunteer IDs to null
    await sql`
      UPDATE play_days
      SET main_volunteer_id = NULL
      WHERE main_volunteer_id = ${userId}
    `;

    await sql`
      UPDATE play_days
      SET helper_volunteer_id = NULL
      WHERE helper_volunteer_id = ${userId}
    `;

    // Handle created_by in play_days - check if it allows NULL
    try {
      await sql`
        UPDATE play_days
        SET created_by = NULL
        WHERE created_by = ${userId}
      `;
    } catch (error) {
      // If NOT NULL constraint, delete the records instead
      console.log(
        "Note: created_by might have NOT NULL constraint, trying to delete records"
      );
      await sql`
        DELETE FROM play_days
        WHERE created_by = ${userId}
      `;
    }

    // Handle cancelled_by in play_days
    try {
      await sql`
        UPDATE play_days
        SET cancelled_by = NULL
        WHERE cancelled_by = ${userId}
      `;
    } catch (error) {
      console.log(
        "Note: Error updating cancelled_by, it might not exist or have constraints"
      );
    }

    // Handle email_blasts table if it exists
    try {
      await sql`
        UPDATE email_blasts
        SET sender_id = NULL
        WHERE sender_id = ${userId}
      `;
    } catch (error) {
      // If NOT NULL constraint, delete the records instead
      console.log(
        "Note: sender_id might have NOT NULL constraint, trying to delete records"
      );
      try {
        await sql`
          DELETE FROM email_blasts
          WHERE sender_id = ${userId}
        `;
      } catch (innerError) {
        console.log(
          "Note: Error deleting from email_blasts, table might not exist"
        );
      }
    }

    // 4. Finally delete the member
    await sql`
      DELETE FROM members 
      WHERE id = ${userId}
    `;

    // Clear the session cookie - properly awaited
    const cookieStore = await cookies();
    cookieStore.delete("session");

    // Send confirmation email using our centralized email system
    try {
      const emailResult = await sendEmail({
        to: userEmail,
        templateName: "accountDeletion",
        templateData: {
          firstName: firstName,
        },
        subject: "Your Sandsharks Account Has Been Deleted",
        replyTo: "sandsharks.org@gmail.com",
      });

      if (!emailResult.success) {
        console.error(
          "Error sending account deletion email:",
          emailResult.error
        );
      } else {
        console.log(`Account deletion confirmation email sent to ${userEmail}`);
      }
    } catch (emailError) {
      console.error(
        "Error sending account deletion confirmation email:",
        emailError
      );
      // Continue even if email fails since the account has been deleted
    }

    return {
      success: true,
      message:
        "Your account has been successfully deleted. A confirmation email has been sent to your email address.",
    };
  } catch (error) {
    console.error("Error deleting account:", error);
    return {
      success: false,
      message: `Failed to delete account: ${
        error.message || "Please try again."
      }`,
    };
  }
}
///////////////////////////////////////////////////////////////////////////////////////////////////////
//volunteering
///////////////////////////////////////////////////////////////////////////////////////////////////////

export async function signUpForVolunteering() {
  const session = await getSession();
  if (!session) {
    return {
      success: false,
      message: "You must be logged in to volunteer",
    };
  }

  const user = await getCurrentUser();
  if (!user) {
    return {
      success: false,
      message: "Unable to retrieve user information",
    };
  }

  const { firstName, lastName, email, _id } = user;

  try {
    // Send email notification to admin using our centralized email system
    const emailResult = await sendEmail({
      to: "sandsharks.org@gmail.com",
      templateName: "volunteerSignup",
      templateData: {
        firstName,
        lastName,
        email,
      },
      subject: "New Volunteer Sign-up",
      replyTo: email, // Set reply-to as the volunteer's email
    });

    if (!emailResult.success) {
      console.error(
        "Error sending volunteer sign-up email:",
        emailResult.error
      );
      return {
        success: false,
        message:
          "Failed to send volunteer sign-up notification. Please try again.",
      };
    }

    return {
      success: true,
      message: "Your volunteer sign-up has been submitted successfully!",
    };
  } catch (error) {
    console.error("Volunteer sign-up error:", error);
    return {
      success: false,
      message: "Something went wrong. Please try again later.",
    };
  }
}

export const requestToVolunteer = async (formData) => {
  try {
    const session = await getSession();
    const user = session?.resultObj;

    if (!user) {
      return {
        success: false,
        message: "You must be logged in to volunteer",
      };
    }

    // Check if user is a volunteer or ultrashark
    if (user.memberType !== "volunteer" && user.memberType !== "ultrashark") {
      return {
        success: false,
        message: "Only volunteers can sign up to volunteer for play days",
      };
    }

    const playDayId = formData.get("playDayId");

    if (!playDayId) {
      return {
        success: false,
        message: "Play day ID is required",
      };
    }

    // Check if play day exists
    const playDayResult = await sql`
      SELECT id FROM play_days WHERE id = ${playDayId}
    `;

    if (playDayResult.rows.length === 0) {
      return {
        success: false,
        message: "Play day not found",
      };
    }

    // Check if user has already requested to volunteer for this play day
    const existingRequestResult = await sql`
      SELECT id, status FROM volunteer_requests 
      WHERE play_day_id = ${playDayId} AND member_id = ${user._id}
    `;

    if (existingRequestResult.rows.length > 0) {
      const status = existingRequestResult.rows[0].status;

      if (status === "pending") {
        return {
          success: false,
          message: "You have already requested to volunteer for this play day",
        };
      } else if (status === "approved") {
        return {
          success: false,
          message: "You are already approved to volunteer for this play day",
        };
      } else if (status === "rejected") {
        // If previously rejected, allow them to request again
        await sql`
          UPDATE volunteer_requests 
          SET status = 'pending', created_at = CURRENT_TIMESTAMP 
          WHERE play_day_id = ${playDayId} AND member_id = ${user._id}
        `;

        revalidatePath("/dashboard/member");
        return {
          success: true,
          message: "Your volunteer request has been submitted again",
        };
      }
    }

    // Check if user is already assigned as a volunteer for this play day
    const volunteerAssignmentResult = await sql`
      SELECT id FROM play_days 
      WHERE id = ${playDayId} 
      AND (main_volunteer_id = ${user._id} OR helper_volunteer_id = ${user._id})
    `;

    if (volunteerAssignmentResult.rows.length > 0) {
      return {
        success: false,
        message: "You are already assigned as a volunteer for this play day",
      };
    }

    // Insert volunteer request
    await sql`
      INSERT INTO volunteer_requests (play_day_id, member_id, status)
      VALUES (${playDayId}, ${user._id}, 'pending')
    `;

    // Create a notification for admins (if you have a notifications table)
    // This is optional but useful
    try {
      await sql`
        INSERT INTO notifications (
          type,
          recipient_type,
          recipient_id,
          title,
          message,
          link,
          created_at
        )
        VALUES (
          'volunteer_request',
          'role',
          'ultrashark',
          'New Volunteer Request',
          ${`${user.firstName} ${user.lastName} has requested to volunteer for a play day`},
          ${`/dashboard/ultrashark/volunteer-requests?playDayId=${playDayId}`},
          CURRENT_TIMESTAMP
        )
      `;
    } catch (error) {
      // If notifications table doesn't exist or there's an error, just log it
      console.error("Error creating notification:", error);
    }

    revalidatePath("/dashboard/member");
    return {
      success: true,
      message: "Your volunteer request has been submitted",
    };
  } catch (error) {
    console.error("Error requesting to volunteer:", error);
    return {
      success: false,
      message: "Failed to submit volunteer request. Please try again.",
    };
  }
};

// Function to get volunteer requests for admin dashboard
export const getVolunteerRequests = async () => {
  try {
    const session = await getSession();
    const user = session?.resultObj;

    if (!user || user.memberType !== "ultrashark") {
      return {
        success: false,
        message: "You must be logged in as an admin to view volunteer requests",
      };
    }

    const requestsResult = await sql`
      SELECT 
        vr.id,
        vr.play_day_id,
        vr.member_id,
        vr.status,
        vr.created_at,
        m.first_name,
        m.last_name,
        m.email,
        pd.title AS play_day_title,
        pd.date AS play_day_date
      FROM 
        volunteer_requests vr
      JOIN 
        members m ON vr.member_id = m.id
      JOIN 
        play_days pd ON vr.play_day_id = pd.id
      WHERE 
        vr.status = 'pending'
      ORDER BY 
        pd.date ASC, vr.created_at ASC
    `;

    return {
      success: true,
      requests: requestsResult.rows.map((request) => ({
        id: request.id,
        playDayId: request.play_day_id,
        memberId: request.member_id,
        status: request.status,
        createdAt: request.created_at,
        memberName: `${request.first_name} ${request.last_name}`,
        memberEmail: request.email,
        playDayTitle: request.play_day_title,
        playDayDate: request.play_day_date,
      })),
    };
  } catch (error) {
    console.error("Error fetching volunteer requests:", error);
    return {
      success: false,
      message: "Failed to fetch volunteer requests",
    };
  }
};

// Function to approve a volunteer request
export const approveVolunteerRequest = async (formData) => {
  try {
    const session = await getSession();
    const user = session?.resultObj;

    if (!user || user.memberType !== "ultrashark") {
      return {
        success: false,
        message:
          "You must be logged in as an admin to approve volunteer requests",
      };
    }

    const requestId = formData.get("requestId");

    if (!requestId) {
      return {
        success: false,
        message: "Request ID is required",
      };
    }

    // Get the request details
    const requestResult = await sql`
      SELECT vr.play_day_id, vr.member_id, pd.main_volunteer_id, pd.helper_volunteer_id, pd.title, pd.date
      FROM volunteer_requests vr
      JOIN play_days pd ON vr.play_day_id = pd.id
      WHERE vr.id = ${requestId}
    `;

    if (requestResult.rows.length === 0) {
      return {
        success: false,
        message: "Volunteer request not found",
      };
    }

    const {
      play_day_id,
      member_id,
      main_volunteer_id,
      helper_volunteer_id,
      title,
      date,
    } = requestResult.rows[0];

    // Determine which volunteer position to assign
    let position = null;

    if (!main_volunteer_id) {
      position = "main";
    } else if (!helper_volunteer_id) {
      position = "helper";
    } else {
      // Both positions are filled
      await sql`
        UPDATE volunteer_requests
        SET status = 'rejected'
        WHERE id = ${requestId}
      `;

      return {
        success: false,
        message: "Both volunteer positions are already filled",
      };
    }

    // Update the play day with the volunteer
    if (position === "main") {
      await sql`
        UPDATE play_days
        SET main_volunteer_id = ${member_id}
        WHERE id = ${play_day_id}
      `;
    } else {
      await sql`
        UPDATE play_days
        SET helper_volunteer_id = ${member_id}
        WHERE id = ${play_day_id}
      `;
    }

    // Update the request status
    await sql`
      UPDATE volunteer_requests
      SET status = 'approved'
      WHERE id = ${requestId}
    `;

    // Get member details for notification
    const memberResult = await sql`
      SELECT first_name, last_name, email
      FROM members
      WHERE id = ${member_id}
    `;

    if (memberResult.rows.length > 0) {
      const member = memberResult.rows[0];

      // Create a notification for the member
      try {
        await sql`
          INSERT INTO notifications (
            type,
            recipient_type,
            recipient_id,
            title,
            message,
            link,
            created_at
          )
          VALUES (
            'volunteer_approved',
            'member',
            ${member_id},
            'Volunteer Request Approved',
            ${`Your request to volunteer has been approved!`},
            ${`/dashboard/member`},
            CURRENT_TIMESTAMP
          )
        `;
      } catch (error) {
        console.error("Error creating notification:", error);
      }

      // Format the date for the email
      const playDayDate = new Date(date);
      const formattedDate = playDayDate.toLocaleDateString("en-US", {
        weekday: "long",
        year: "numeric",
        month: "long",
        day: "numeric",
      });

      // Send email notification using our centralized email system
      try {
        const emailResult = await sendEmail({
          to: member.email,
          templateName: "volunteerApproval",
          templateData: {
            firstName: member.first_name,
            title,
            formattedDate,
            position,
          },
          subject: `Your Volunteer Request for ${formattedDate} has been Approved`,
          replyTo: "sandsharks.org@gmail.com",
        });

        if (!emailResult.success) {
          console.error(
            "Error sending volunteer approval email:",
            emailResult.error
          );
        } else {
          console.log(`Volunteer approval email sent to ${member.email}`);
        }
      } catch (error) {
        console.error("Error sending volunteer approval email:", error);
        // Continue with the approval process even if the email fails
      }
    }

    revalidatePath("/dashboard/ultrashark/volunteer-requests");
    revalidatePath("/dashboard/member");
    revalidatePath("/dashboard/ultrashark");

    return {
      success: true,
      message: "Volunteer request approved successfully",
    };
  } catch (error) {
    console.error("Error approving volunteer request:", error);
    return {
      success: false,
      message: "Failed to approve volunteer request",
    };
  }
};

// Function to reject a volunteer request
export const rejectVolunteerRequest = async (formData) => {
  try {
    const session = await getSession();
    const user = session?.resultObj;

    if (!user || user.memberType !== "ultrashark") {
      return {
        success: false,
        message:
          "You must be logged in as an admin to reject volunteer requests",
      };
    }

    const requestId = formData.get("requestId");

    if (!requestId) {
      return {
        success: false,
        message: "Request ID is required",
      };
    }

    // Get the request details
    const requestResult = await sql`
      SELECT member_id
      FROM volunteer_requests
      WHERE id = ${requestId}
    `;

    if (requestResult.rows.length === 0) {
      return {
        success: false,
        message: "Volunteer request not found",
      };
    }

    const { member_id } = requestResult.rows[0];

    // Update the request status
    await sql`
      UPDATE volunteer_requests
      SET status = 'rejected'
      WHERE id = ${requestId}
    `;

    // Get member details for notification
    const memberResult = await sql`
      SELECT first_name, last_name, email
      FROM members
      WHERE id = ${member_id}
    `;

    if (memberResult.rows.length > 0) {
      const member = memberResult.rows[0];

      // Create a notification for the member
      try {
        await sql`
          INSERT INTO notifications (
            type,
            recipient_type,
            recipient_id,
            title,
            message,
            link,
            created_at
          )
          VALUES (
            'volunteer_rejected',
            'member',
            ${member_id},
            'Volunteer Request Status',
            ${`Your volunteer request was not approved at this time.`},
            ${`/dashboard/member`},
            CURRENT_TIMESTAMP
          )
        `;
      } catch (error) {
        console.error("Error creating notification:", error);
      }
    }

    revalidatePath("/dashboard/ultrashark/volunteer-requests");

    return {
      success: true,
      message: "Volunteer request rejected successfully",
    };
  } catch (error) {
    console.error("Error rejecting volunteer request:", error);
    return {
      success: false,
      message: "Failed to reject volunteer request",
    };
  }
};

export const cancelVolunteerRequest = async (formData) => {
  try {
    const session = await getSession();
    const user = session?.resultObj;

    if (!user) {
      return {
        success: false,
        message: "You must be logged in to cancel a volunteer request",
      };
    }

    const playDayId = formData.get("playDayId");

    if (!playDayId) {
      return {
        success: false,
        message: "Play day ID is required",
      };
    }

    // Find the volunteer request
    const requestResult = await sql`
      SELECT id FROM volunteer_requests 
      WHERE play_day_id = ${playDayId} AND member_id = ${user._id} AND status = 'pending'
    `;

    if (requestResult.rows.length === 0) {
      return {
        success: false,
        message: "No pending volunteer request found",
      };
    }

    // Delete the volunteer request
    await sql`
      DELETE FROM volunteer_requests 
      WHERE play_day_id = ${playDayId} AND member_id = ${user._id} AND status = 'pending'
    `;

    revalidatePath("/dashboard/member");
    return {
      success: true,
      message: "Your volunteer request has been canceled",
    };
  } catch (error) {
    console.error("Error canceling volunteer request:", error);
    return {
      success: false,
      message: "Failed to cancel volunteer request. Please try again.",
    };
  }
};

//////////////////////////////////////////////////////////////////////////////////////////////////////
//sponsor application
//////////////////////////////////////////////////////////////////////////////////////////////////////

export async function createSponsorRequest(formData) {
  try {
    const session = await getSession();
    const user = session?.resultObj;

    if (!user) {
      return {
        success: false,
        message: "You must be logged in to submit a sponsorship request",
      };
    }

    // Extract data from the form
    const name = formData.get("name");
    const memberId = formData.get("memberId") || user._id;
    const description = formData.get("description") || null;
    const websiteUrl = formData.get("websiteUrl") || null;
    const instagramUrl = formData.get("instagramUrl") || null;
    const otherUrl = formData.get("otherUrl") || null;
    const logoFile = formData.get("logo");

    // Validate required fields
    if (!name) {
      return {
        success: false,
        message: "Organization/Business name is required",
      };
    }

    // Handle logo upload with Vercel Blob
    let logoUrl = null;
    if (logoFile && logoFile.size > 0) {
      try {
        const { put } = await import("@vercel/blob");
        const filename = `sponsor-logo-${memberId}-${Date.now()}-${
          logoFile.name
        }`;

        // Upload the file to Vercel Blob
        const blob = await put(filename, logoFile, {
          access: "public",
        });

        // Get the URL of the uploaded file
        logoUrl = blob.url;
      } catch (uploadError) {
        console.error("Error uploading logo:", uploadError);
        return {
          success: false,
          message: "Failed to upload logo. Please try again.",
        };
      }
    }

    // Insert the sponsor request into the database
    // We'll use a status field to track pending/approved/rejected
    await sql`
      INSERT INTO sponsor_requests (
        name,
        member_id,
        description,
        website_url,
        instagram_url,
        other_url,
        logo_url,
        status,
        created_at
      ) 
      VALUES (
        ${name},
        ${memberId},
        ${description},
        ${websiteUrl},
        ${instagramUrl},
        ${otherUrl},
        ${logoUrl},
        ${"pending"},
        ${new Date()}
      )
    `;

    // Notify admins about the new sponsor request
    try {
      await sql`
        INSERT INTO notifications (
          type,
          recipient_type,
          recipient_id,
          title,
          message,
          link,
          created_at
        )
        VALUES (
          'sponsor_request',
          'role',
          'ultrashark',
          'New Sponsor Request',
          ${`${user.firstName} ${user.lastName} has submitted a sponsorship request for ${name}`},
          ${`/dashboard/ultrashark/sponsors`},
          CURRENT_TIMESTAMP
        )
      `;
    } catch (notificationError) {
      console.error("Error creating notification:", notificationError);
      // Continue even if notification creation fails
    }

    revalidatePath("/dashboard/member");
    revalidatePath("/dashboard/ultrashark/sponsors");

    return {
      success: true,
      message: "Sponsorship request submitted successfully!",
    };
  } catch (error) {
    console.error("Error creating sponsor request:", error);
    return {
      success: false,
      message: `Error creating sponsor request: ${error.message}`,
    };
  }
}

export async function getSponsorRequests() {
  try {
    const session = await getSession();
    const user = session?.resultObj;

    if (!user || user.memberType !== "ultrashark") {
      return {
        success: false,
        message: "You must be an admin to view sponsor requests",
      };
    }

    const result = await sql`
      SELECT 
        sr.*,
        m.first_name,
        m.last_name,
        m.email
      FROM 
        sponsor_requests sr
      JOIN
        members m ON sr.member_id = m.id
      WHERE
        sr.status = 'pending'
      ORDER BY
        sr.created_at DESC
    `;

    return {
      success: true,
      requests: result.rows,
    };
  } catch (error) {
    console.error("Error fetching sponsor requests:", error);
    return {
      success: false,
      message: "Failed to fetch sponsor requests",
    };
  }
}

export async function approveSponsorRequest(formData) {
  try {
    const session = await getSession();
    const user = session?.resultObj;

    if (!user || user.memberType !== "ultrashark") {
      return {
        success: false,
        message: "You must be an admin to approve sponsor requests",
      };
    }

    const requestId = formData.get("requestId");

    if (!requestId) {
      return {
        success: false,
        message: "Request ID is required",
      };
    }

    // Get the request details
    const requestResult = await sql`
      SELECT * FROM sponsor_requests
      WHERE id = ${requestId} AND status = 'pending'
    `;

    if (requestResult.rows.length === 0) {
      return {
        success: false,
        message: "Sponsor request not found or already processed",
      };
    }

    const request = requestResult.rows[0];

    // Create the sponsor in the sponsors table
    await sql`
      INSERT INTO sponsors (
        name,
        member_id,
        description,
        website_url,
        instagram_url,
        other_url,
        logo_url,
        created_at
      ) 
      VALUES (
        ${request.name},
        ${request.member_id},
        ${request.description},
        ${request.website_url},
        ${request.instagram_url},
        ${request.other_url},
        ${request.logo_url},
        ${new Date()}
      )
    `;

    // Update the request status
    await sql`
      UPDATE sponsor_requests
      SET 
        status = 'approved',
        processed_at = ${new Date()},
        processed_by = ${user._id}
      WHERE id = ${requestId}
    `;

    // Get member details for notification
    const memberResult = await sql`
      SELECT first_name, last_name, email
      FROM members
      WHERE id = ${request.member_id}
    `;

    if (memberResult.rows.length > 0) {
      const member = memberResult.rows[0];

      // Create a notification for the member
      try {
        await sql`
          INSERT INTO notifications (
            type,
            recipient_type,
            recipient_id,
            title,
            message,
            link,
            created_at
          )
          VALUES (
            'sponsor_approved',
            'member',
            ${request.member_id},
            'Sponsorship Request Approved',
            ${`Your sponsorship request for ${request.name} has been approved!`},
            ${`/dashboard/member`},
            CURRENT_TIMESTAMP
          )
        `;
      } catch (error) {
        console.error("Error creating notification:", error);
      }

      // Send email notification using our centralized email system
      try {
        const emailResult = await sendEmail({
          to: member.email,
          templateName: "sponsorApproval",
          templateData: {
            firstName: member.first_name,
            sponsorName: request.name,
          },
          subject: "Your Sandsharks Sponsorship Request Has Been Approved",
          replyTo: "sandsharks.org@gmail.com",
        });

        if (!emailResult.success) {
          console.error(
            "Error sending sponsorship approval email:",
            emailResult.error
          );
        } else {
          console.log(`Sponsorship approval email sent to ${member.email}`);
        }
      } catch (emailError) {
        console.error("Error sending sponsorship approval email:", emailError);
        // Continue with the approval process even if the email fails
      }
    }

    revalidatePath("/dashboard/ultrashark/sponsors");
    return {
      success: true,
      message: "Sponsor request approved successfully",
    };
  } catch (error) {
    console.error("Error approving sponsor request:", error);
    return {
      success: false,
      message: "Failed to approve sponsor request",
    };
  }
}

export async function rejectSponsorRequest(formData) {
  try {
    const session = await getSession();
    const user = session?.resultObj;

    if (!user || user.memberType !== "ultrashark") {
      return {
        success: false,
        message: "You must be an admin to reject sponsor requests",
      };
    }

    const requestId = formData.get("requestId");
    const rejectionReason =
      formData.get("rejectionReason") ||
      "Your sponsorship request does not meet our current needs.";

    if (!requestId) {
      return {
        success: false,
        message: "Request ID is required",
      };
    }

    // Get the request details
    const requestResult = await sql`
      SELECT * FROM sponsor_requests
      WHERE id = ${requestId} AND status = 'pending'
    `;

    if (requestResult.rows.length === 0) {
      return {
        success: false,
        message: "Sponsor request not found or already processed",
      };
    }

    const request = requestResult.rows[0];

    // Update the request status
    await sql`
      UPDATE sponsor_requests
      SET 
        status = 'rejected',
        processed_at = ${new Date()},
        processed_by = ${user._id},
        rejection_reason = ${rejectionReason}
      WHERE id = ${requestId}
    `;

    // Get member details for notification
    const memberResult = await sql`
      SELECT first_name, last_name, email
      FROM members
      WHERE id = ${request.member_id}
    `;

    if (memberResult.rows.length > 0) {
      const member = memberResult.rows[0];

      // Create a notification for the member
      try {
        await sql`
          INSERT INTO notifications (
            type,
            recipient_type,
            recipient_id,
            title,
            message,
            link,
            created_at
          )
          VALUES (
            'sponsor_rejected',
            'member',
            ${request.member_id},
            'Sponsorship Request Status',
            ${`Your sponsorship request for ${request.name} was not approved at this time.`},
            ${`/dashboard/member`},
            CURRENT_TIMESTAMP
          )
        `;
      } catch (error) {
        console.error("Error creating notification:", error);
      }

      // Send email notification using our centralized email system
      try {
        const emailResult = await sendEmail({
          to: member.email,
          templateName: "sponsorRejection",
          templateData: {
            firstName: member.first_name,
            sponsorName: request.name,
            rejectionReason: rejectionReason,
          },
          subject: "Update on Your Sandsharks Sponsorship Request",
          replyTo: "sandsharks.org@gmail.com",
        });

        if (!emailResult.success) {
          console.error(
            "Error sending sponsorship rejection email:",
            emailResult.error
          );
        } else {
          console.log(`Sponsorship rejection email sent to ${member.email}`);
        }
      } catch (emailError) {
        console.error("Error sending sponsorship rejection email:", emailError);
        // Continue with the rejection process even if the email fails
      }
    }

    revalidatePath("/dashboard/ultrashark/sponsors");
    return {
      success: true,
      message: "Sponsor request rejected successfully",
    };
  } catch (error) {
    console.error("Error rejecting sponsor request:", error);
    return {
      success: false,
      message: "Failed to reject sponsor request",
    };
  }
}

// Update the createWeeklyNote function
export async function createWeeklyNote(prevState, formData) {
  try {
    const session = await getSession();
    const user = session?.resultObj;

    if (!user || user.memberType !== "ultrashark") {
      return {
        success: false,
        message: "You must be an admin to create weekly notes",
      };
    }

    const content = formData.get("content");

    if (!content) {
      return {
        success: false,
        message: "Note content is required",
      };
    }

    // Insert the weekly note with status 'pending'
    await sql`
      INSERT INTO weekly_notes (
        content,
        created_by,
        status
      )
      VALUES (
        ${content},
        ${user.id},
        'pending'
      )
    `;

    revalidatePath("/dashboard/ultrashark");
    return {
      success: true,
      message: "Weekly note created successfully",
    };
  } catch (error) {
    console.error("Error creating weekly note:", error);
    return {
      success: false,
      message: "Failed to create weekly note",
    };
  }
}

// Update the getActiveWeeklyNote function to get the next pending note
export async function getNextPendingNote() {
  try {
    const result = await sql`
      SELECT *
      FROM weekly_notes
      WHERE status = 'pending'
      ORDER BY created_at ASC
      LIMIT 1
    `;

    if (result.rows.length === 0) {
      return {
        success: true,
        note: null,
      };
    }

    return {
      success: true,
      note: result.rows[0],
    };
  } catch (error) {
    console.error("Error getting next pending note:", error);
    return {
      success: false,
      message: "Failed to get next pending note",
    };
  }
}

// Update the getAllWeeklyNotes function
export async function getAllWeeklyNotes() {
  try {
    const session = await getSession();
    const user = session?.resultObj;

    if (!user || user.memberType !== "ultrashark") {
      return {
        success: false,
        message: "You must be an admin to view all weekly notes",
      };
    }

    const result = await sql`
      SELECT w.*, 
             m.first_name, 
             m.last_name
      FROM weekly_notes w
      LEFT JOIN members m ON w.created_by = m.id
      ORDER BY 
        CASE WHEN w.status = 'pending' THEN 0 ELSE 1 END,
        w.created_at DESC
    `;

    return {
      success: true,
      notes: result.rows,
    };
  } catch (error) {
    console.error("Error getting all weekly notes:", error);
    return {
      success: false,
      message: "Failed to get weekly notes",
    };
  }
}

// Add a new function to mark a note as sent
export async function markNoteAsSent(noteId) {
  try {
    await sql`
      UPDATE weekly_notes
      SET 
        status = 'sent',
        date_sent = CURRENT_TIMESTAMP
      WHERE id = ${noteId}
    `;

    return {
      success: true,
    };
  } catch (error) {
    console.error("Error marking note as sent:", error);
    return {
      success: false,
      error: error.message,
    };
  }
}

export async function deleteWeeklyNote(prevState, formData) {
  try {
    const session = await getSession();
    const user = session?.resultObj;

    if (!user || user.memberType !== "ultrashark") {
      return {
        success: false,
        message: "You must be an admin to delete weekly notes",
      };
    }

    const noteId = formData.get("noteId");

    if (!noteId) {
      return {
        success: false,
        message: "Note ID is required",
      };
    }

    await sql`
      DELETE FROM weekly_notes
      WHERE id = ${noteId}
    `;

    revalidatePath("/dashboard/ultrashark/weekly-notes");
    return {
      success: true,
      message: "Weekly note deleted successfully",
    };
  } catch (error) {
    console.error("Error deleting weekly note:", error);
    return {
      success: false,
      message: "Failed to delete weekly note",
    };
  }
}

// Add a new function to update an existing note
export async function updateWeeklyNote(prevState, formData) {
  try {
    const session = await getSession();
    const user = session?.resultObj;

    if (!user || user.memberType !== "ultrashark") {
      return {
        success: false,
        message: "You must be an admin to update weekly notes",
      };
    }

    const noteId = formData.get("noteId");
    const content = formData.get("content");

    if (!noteId || !content) {
      return {
        success: false,
        message: "Note ID and content are required",
      };
    }

    // Update the weekly note
    await sql`
      UPDATE weekly_notes
      SET content = ${content}
      WHERE id = ${noteId} AND status = 'pending'
    `;

    revalidatePath("/dashboard/ultrashark");
    return {
      success: true,
      message: "Weekly note updated successfully",
    };
  } catch (error) {
    console.error("Error updating weekly note:", error);
    return {
      success: false,
      message: "Failed to update weekly note",
    };
  }
}

export async function unsubscribeByEmail(prevState, formData) {
  try {
    const email = formData.get("email");

    if (!email) {
      return {
        success: false,
        message: "Email address is required",
      };
    }

    // Check if the email exists in the database
    const memberResult = await sql`
      SELECT id, first_name, email_list FROM members 
      WHERE email = ${email}
    `;

    if (memberResult.rows.length === 0) {
      return {
        success: false,
        message:
          "Email address not found. Please check your email and try again.",
      };
    }

    const member = memberResult.rows[0];

    // If already unsubscribed, let them know
    if (!member.email_list) {
      return {
        success: true,
        message: "You are already unsubscribed from our emails.",
      };
    }

    // Update the member's email_list preference
    await sql`
      UPDATE members 
      SET email_list = false 
      WHERE id = ${member.id}
    `;

    // Create a notification for the member
    try {
      await sql`
        INSERT INTO notifications (
          type,
          recipient_type,
          recipient_id,
          title,
          message,
          created_at
        )
        VALUES (
          'unsubscribe',
          'member',
          ${member.id},
          'Email Preferences Updated',
          'You have been unsubscribed from Sandsharks email communications.',
          CURRENT_TIMESTAMP
        )
      `;
    } catch (error) {
      console.error("Error creating notification:", error);
      // Continue with unsubscribe even if notification fails
    }

    return {
      success: true,
      message:
        "You have been successfully unsubscribed from Sandsharks emails.",
    };
  } catch (error) {
    console.error("Error unsubscribing by email:", error);
    return {
      success: false,
      message:
        "An error occurred while processing your request. Please try again later.",
    };
  }
}

////////////////////////////////////////////////////////////////////////////////////
//photo gallery
////////////////////////////////////////////////////////////////////////////////////

// New function specifically for photo tagging - simpler structure
export async function getMembersForTagging() {
  try {
    const result = await sql`
      SELECT 
        id, 
        first_name, 
        last_name,
        profile_pic_url
      FROM 
        members
      WHERE
        member_type IN ('member', 'volunteer', 'admin', 'ultrashark')
      ORDER BY 
        first_name, last_name
    `;
    return result.rows;
  } catch (error) {
    console.error("Error fetching members for tagging:", error);
    return [];
  }
}

// Get all years that have photos
export async function getPhotoYears() {
  try {
    const result = await sql`
      SELECT DISTINCT year 
      FROM photo_gallery 
      ORDER BY year DESC
    `;
    return result.rows.map((row) => row.year);
  } catch (error) {
    console.error("Error fetching photo years:", error);
    return [];
  }
}

// Get current year for default selection
export async function getCurrentYear() {
  return new Date().getFullYear();
}

// Update the uploadPhotos function to handle member tagging (including custom names)
export async function uploadPhotos(formData) {
  const session = await getSession();
  if (!session?.resultObj || session.resultObj.memberType !== "ultrashark") {
    return {
      success: false,
      message: "You must be logged in as ultrashark to upload photos",
    };
  }

  try {
    const files = formData.getAll("photos");
    const year = Number.parseInt(
      formData.get("year") || new Date().getFullYear()
    );

    // Get tagged members for each photo (now includes both member IDs and custom names)
    const taggedMembersData = formData.get("taggedMembers");
    let taggedMembersMap = {};

    if (taggedMembersData) {
      try {
        taggedMembersMap = JSON.parse(taggedMembersData);
      } catch (e) {
        console.error("Error parsing tagged members:", e);
      }
    }

    if (!files || files.length === 0) {
      return {
        success: false,
        message: "Please select at least one photo to upload",
      };
    }

    const uploadedPhotos = [];
    const { put } = await import("@vercel/blob");

    // Process each file
    for (const file of files) {
      if (!file || file.size === 0) continue;

      // Validate file type
      if (!file.type.startsWith("image/")) {
        return {
          success: false,
          message: `File ${file.name} is not an image. Please upload only image files.`,
        };
      }

      // Validate file size (limit to 10MB per image)
      if (file.size > 10 * 1024 * 1024) {
        return {
          success: false,
          message: `File ${file.name} exceeds 10MB limit`,
        };
      }

      // Upload to Vercel Blob
      const filename = `gallery-${year}-${Date.now()}-${Math.random()
        .toString(36)
        .substring(7)}-${file.name}`;

      const blob = await put(filename, file, {
        access: "public",
      });

      uploadedPhotos.push({
        filename: file.name,
        url: blob.url,
        size: file.size,
        fileIndex: uploadedPhotos.length, // Keep track of the original index
      });
    }

    // Insert photos into database and tag members
    for (const photo of uploadedPhotos) {
      // Insert the photo
      const photoResult = await sql`
        INSERT INTO photo_gallery (
          url,
          filename,
          file_size,
          year,
          uploaded_by,
          created_at
        )
        VALUES (
          ${photo.url},
          ${photo.filename},
          ${photo.size},
          ${year},
          ${session.resultObj._id},
          ${new Date()}
        )
        RETURNING id
      `;

      const photoId = photoResult.rows[0].id;

      // Add member tags if any are specified for this photo
      const photoTags = taggedMembersMap[photo.fileIndex] || [];

      for (const tag of photoTags) {
        if (tag) {
          if (tag.type === "member" && tag.id) {
            // Check if tag already exists before inserting
            const existingTag = await sql`
              SELECT id FROM photo_tags 
              WHERE photo_id = ${photoId} AND member_id = ${tag.id}
            `;

            if (existingTag.rows.length === 0) {
              // Tag existing member only if not already tagged
              await sql`
                INSERT INTO photo_tags (photo_id, member_id)
                VALUES (${photoId}, ${tag.id})
              `;
            }
          } else if (tag.type === "custom" && tag.name) {
            // Check if custom name tag already exists
            const existingCustomTag = await sql`
              SELECT id FROM photo_tags 
              WHERE photo_id = ${photoId} AND custom_name = ${tag.name}
            `;

            if (existingCustomTag.rows.length === 0) {
              // Tag custom name only if not already tagged
              await sql`
                INSERT INTO photo_tags (photo_id, custom_name)
                VALUES (${photoId}, ${tag.name})
              `;
            }
          }
        }
      }
    }

    revalidatePath("/dashboard/ultrashark/photo-upload");
    revalidatePath("/dashboard/ultrashark/gallery");

    return {
      success: true,
      message: `Successfully uploaded ${uploadedPhotos.length} photo${
        uploadedPhotos.length > 1 ? "s" : ""
      } to ${year} gallery`,
      count: uploadedPhotos.length,
    };
  } catch (error) {
    console.error("Error uploading photos:", error);
    return {
      success: false,
      message: `Error uploading photos: ${error.message}`,
    };
  }
}

// Get photos for a specific year
export async function getPhotosByYear(year) {
  try {
    const result = await sql`
      SELECT 
        pg.*,
        m.first_name || ' ' || m.last_name AS uploaded_by_name
      FROM 
        photo_gallery pg
      LEFT JOIN
        members m ON pg.uploaded_by = m.id
      WHERE
        pg.year = ${year}
      ORDER BY
        pg.created_at DESC
    `;
    return result.rows;
  } catch (error) {
    console.error("Error fetching photos by year:", error);
    return [];
  }
}

// Delete a photo
export async function deletePhoto(photoId) {
  const session = await getSession();
  if (!session?.resultObj || session.resultObj.memberType !== "ultrashark") {
    return {
      success: false,
      message: "You must be logged in as ultrashark to delete photos",
    };
  }

  try {
    // Get photo details before deletion
    const photoResult = await sql`
      SELECT url FROM photo_gallery WHERE id = ${photoId}
    `;

    if (photoResult.rows.length === 0) {
      return {
        success: false,
        message: "Photo not found",
      };
    }

    // Delete from database
    await sql`
      DELETE FROM photo_gallery WHERE id = ${photoId}
    `;

    // Note: Vercel Blob doesn't have a delete API in the current version
    // The blob will remain but won't be accessible through your app

    revalidatePath("/dashboard/ultrashark/gallery");
    revalidatePath("/dashboard/ultrashark/photo-upload");

    return {
      success: true,
      message: "Photo deleted successfully",
    };
  } catch (error) {
    console.error("Error deleting photo:", error);
    return {
      success: false,
      message: "Failed to delete photo",
    };
  }
}

// Add a tag to an existing photo
export async function addTagToPhoto(photoId, tagData) {
  const session = await getSession();
  if (!session?.resultObj || session.resultObj.memberType !== "ultrashark") {
    return {
      success: false,
      message: "You must be logged in as ultrashark to add tags",
    };
  }

  try {
    if (tagData.type === "member" && tagData.id) {
      // Check if tag already exists
      const existingTag = await sql`
        SELECT id FROM photo_tags 
        WHERE photo_id = ${photoId} AND member_id = ${tagData.id}
      `;

      if (existingTag.rows.length > 0) {
        return {
          success: false,
          message: "This person is already tagged in this photo",
        };
      }

      // Add member tag
      await sql`
        INSERT INTO photo_tags (photo_id, member_id)
        VALUES (${photoId}, ${tagData.id})
      `;
    } else if (tagData.type === "custom" && tagData.name) {
      // Check if custom tag already exists
      const existingCustomTag = await sql`
        SELECT id FROM photo_tags 
        WHERE photo_id = ${photoId} AND custom_name = ${tagData.name}
      `;

      if (existingCustomTag.rows.length > 0) {
        return {
          success: false,
          message: "This name is already tagged in this photo",
        };
      }

      // Add custom tag
      await sql`
        INSERT INTO photo_tags (photo_id, custom_name)
        VALUES (${photoId}, ${tagData.name})
      `;
    } else {
      return {
        success: false,
        message: "Invalid tag data",
      };
    }

    revalidatePath("/dashboard/ultrashark/photo-upload");

    return {
      success: true,
      message: "Tag added successfully",
    };
  } catch (error) {
    console.error("Error adding tag:", error);
    return {
      success: false,
      message: "Failed to add tag",
    };
  }
}

// Remove a tag from a photo
export async function removeTagFromPhoto(photoId, tagId) {
  const session = await getSession();
  if (!session?.resultObj || session.resultObj.memberType !== "ultrashark") {
    return {
      success: false,
      message: "You must be logged in as ultrashark to remove tags",
    };
  }

  try {
    await sql`
      DELETE FROM photo_tags 
      WHERE id = ${tagId} AND photo_id = ${photoId}
    `;

    revalidatePath("/dashboard/ultrashark/photo-upload");

    return {
      success: true,
      message: "Tag removed successfully",
    };
  } catch (error) {
    console.error("Error removing tag:", error);
    return {
      success: false,
      message: "Failed to remove tag",
    };
  }
}

// Get members tagged in a photo
export async function getPhotoTags(photoId) {
  try {
    const result = await sql`
      SELECT 
        pt.id,
        pt.member_id,
        pt.custom_name,
        m.first_name,
        m.last_name,
        m.profile_pic_url
      FROM 
        photo_tags pt
      LEFT JOIN
        members m ON pt.member_id = m.id
      WHERE
        pt.photo_id = ${photoId}
      ORDER BY
        m.first_name, m.last_name, pt.custom_name
    `;
    return result.rows;
  } catch (error) {
    console.error("Error fetching photo tags:", error);
    return [];
  }
}

///////////////////////////////////////////////////////////////////////
//guest sign up
///////////////////////////////////////////////////////////////////////

// Create payment intent for guest donation
export async function createGuestPaymentIntent(amount, guestInfo = {}) {
  console.log(
    "Server action: createGuestPaymentIntent called with amount:",
    amount
  );
  console.log("Guest info:", guestInfo);

  try {
    if (
      !amount ||
      isNaN(Number.parseFloat(amount)) ||
      Number.parseFloat(amount) <= 0
    ) {
      throw new Error("Invalid donation amount");
    }

    const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);
    const amountInCents = Math.round(Number.parseFloat(amount) * 100);

    const paymentIntent = await stripe.paymentIntents.create({
      amount: amountInCents,
      currency: "cad",
      automatic_payment_methods: {
        enabled: true,
        allow_redirects: "never",
      },
      metadata: {
        guest_name: guestInfo.name || "",
        guest_email: guestInfo.email || "",
        guest_id: guestInfo.guestId || "",
        type: "guest_donation",
      },
    });

    console.log("Payment intent created successfully:", paymentIntent.id);
    return {
      clientSecret: paymentIntent.client_secret,
    };
  } catch (error) {
    console.error("Error creating payment intent:", error);
    throw new Error(
      error.message || "An error occurred while processing your donation"
    );
  }
}

// Guest registration action
export async function registerGuestOnly(prevState, formData) {
  console.log("Server action: registerGuestOnly called");

  try {
    const firstName = formData.get("firstName");
    const lastName = formData.get("lastName");
    const email = formData.get("email");
    const photoConsent = formData.get("photoConsent") === "on";
    const waiverAgreement = formData.get("waiverAgreement") === "on";

    // Validate required fields
    if (!firstName || !lastName || !email || !waiverAgreement) {
      return {
        success: false,
        message: "Please fill in all required fields and agree to the waiver.",
      };
    }

    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return {
        success: false,
        message: "Please enter a valid email address.",
      };
    }

    // Check if email already exists
    const existingGuest = await sql`
      SELECT id FROM guests WHERE email = ${email}
    `;

    if (existingGuest.rows.length > 0) {
      return {
        success: false,
        message: "This email address is already registered as a guest.",
      };
    }

    // Insert new guest
    const result = await sql`
      INSERT INTO guests (first_name, last_name, email, photo_release, waiver_confirmed_at)
      VALUES (${firstName}, ${lastName}, ${email}, ${photoConsent}, CURRENT_TIMESTAMP)
      RETURNING id
    `;

    const guestId = result.rows[0].id;
    console.log("Guest registered with ID:", guestId);

    return {
      success: true,
      message: "Registration successful!",
      guestId,
    };
  } catch (error) {
    console.error("Guest registration error:", error);
    return {
      success: false,
      message: "Registration failed: " + (error.message || "Unknown error"),
    };
  }
}

export async function recordGuestDonation(paymentIntentId) {
  console.log(
    "Server action: recordGuestDonation called with paymentIntentId:",
    paymentIntentId
  );

  try {
    // Fetch payment intent details from Stripe
    const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);
    const paymentIntent = await stripe.paymentIntents.retrieve(paymentIntentId);

    if (!paymentIntent) {
      throw new Error(`Payment intent not found: ${paymentIntentId}`);
    }

    const amount = paymentIntent.amount / 100; // Amount in dollars
    const guestName = paymentIntent.metadata.guest_name || "Guest";
    const guestEmail = paymentIntent.metadata.guest_email || "N/A";
    const guestId = paymentIntent.metadata.guest_id || "";

    // Insert donation record into the database with NULL member_id for guest donations
    const guestNotes = `Guest donation - Name: ${guestName}, Email: ${guestEmail}, Guest ID: ${guestId}`;

    await sql`
      INSERT INTO donations (
        session_id, 
        amount, 
        member_id,
        status, 
        notes, 
        created_at
      ) 
      VALUES (
        ${paymentIntentId}, 
        ${amount}, 
        ${null},
        ${"completed"}, 
        ${guestNotes}, 
        ${new Date()}
      )
    `;

    console.log(
      "Guest donation recorded successfully for payment intent:",
      paymentIntentId
    );
    revalidatePath("/guest-donation");
    return { success: true, message: "Donation recorded successfully" };
  } catch (error) {
    console.error("Error recording guest donation:", error);
    return {
      success: false,
      message:
        "Failed to record donation: " + (error.message || "Unknown error"),
    };
  }
}
