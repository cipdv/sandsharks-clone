"use client";

import Link from "next/link";
import { useSearchParams } from "next/navigation";

export default function GuestSignupSuccess() {
  const searchParams = useSearchParams();
  const donated = searchParams.get("donated") === "true";
  const amount = searchParams.get("amount");

  return (
    <div className="container mx-auto py-12 px-4 text-center">
      <div className="max-w-md mx-auto bg-green-100 p-8 rounded-md">
        <div className="text-green-600 text-6xl mb-4">✓</div>
        <h1 className="text-2xl font-bold text-green-800 mb-4">
          Registration Successful!
        </h1>
        <p className="text-green-700 mb-4">
          Thanks for signing up for our August 4 event!
        </p>
        <p className="text-green-700 mb-4">
          Check your email for all the details (if you didn't receive an email,
          check your junk folder).
        </p>
        <p className="text-green-700 mb-4">
          If you have any questions, email us at sandsharks.org@gmail.com
        </p>
        <p className="text-green-700 mb-4">See you on the sand!</p>

        {donated && amount && (
          <div className="bg-white p-4 rounded-md mb-6">
            <h2 className="text-xl font-semibold mb-2">
              Thank You for Your Generous Donation!
            </h2>
            <p className="text-gray-700">
              Your donation of <span className="font-bold">${amount}</span>{" "}
              helps keep Sandsharks running all Summer long!
            </p>
          </div>
        )}

        <div className="space-y-3">
          <Link href="/" className="block btn transition-colors">
            Return to Home
          </Link>
        </div>
      </div>
    </div>
  );
}

// "use client";

// import Link from "next/link";
// import { useSearchParams } from "next/navigation";

// export default function GuestSignupSuccess() {
//   const searchParams = useSearchParams();
//   const donated = searchParams.get("donated") === "true";
//   const amount = searchParams.get("amount");

//   return (
//     <div className="container mx-auto py-12 px-4 text-center">
//       <div className="max-w-md mx-auto bg-green-100 p-8 rounded-md">
//         <div className="text-green-600 text-6xl mb-4">✓</div>
//         <h1 className="text-2xl font-bold text-green-800 mb-4">
//           Registration Successful!
//         </h1>
//         <p className="text-green-700 mb-4">Thanks for signing up as a guest.</p>
//         <p className="text-green-700 mb-4">
//           If you have any questions, email us at sandsharks.org@gmail.com
//         </p>
//         <p className="text-green-700 mb-4">See you on the sand!</p>

//         {donated && amount && (
//           <div className="bg-white p-4 rounded-md mb-6">
//             <h2 className="text-xl font-semibold mb-2">
//               Thank You for Your Generous Donation!
//             </h2>
//             <p className="text-gray-700">
//               Your donation of <span className="font-bold">${amount}</span>{" "}
//               helps keep Sandsharks running all Summer long!
//             </p>
//           </div>
//         )}

//         <div className="space-y-3">
//           <Link href="/" className="block btn transition-colors">
//             Return to Home
//           </Link>
//         </div>
//       </div>
//     </div>
//   );
// }
