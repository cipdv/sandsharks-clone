// // app/api/test-weekly-email/route.js
// import { NextResponse } from "next/server"
// import { sendWeeklyPlayDayEmails } from "@/app/lib/email-service"

// export async function GET() {
//   try {
//     const result = await sendWeeklyPlayDayEmails()

//     // If it's a duplicate prevention, return a 429 status
//     if (result.isDuplicate) {
//       return NextResponse.json(
//         {
//           success: false,
//           message: "Email sending prevented to avoid duplication",
//           result,
//         },
//         { status: 429 },
//       )
//     }

//     return NextResponse.json({
//       success: true,
//       result,
//     })
//   } catch (error) {
//     console.error("Error testing weekly email:", error)
//     return NextResponse.json(
//       {
//         success: false,
//         error: error.message,
//       },
//       { status: 500 },
//     )
//   }
// }

