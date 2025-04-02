// components/DonationPrompt.jsx
"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { ActionButton } from "./ActionButton";

export default function DonationPrompt({ user }) {
  // State to track if we're on the client
  const [mounted, setMounted] = useState(false);
  // State to track if the prompt should be shown
  const [showPrompt, setShowPrompt] = useState(false);
  // State to track the reason for showing the prompt
  const [reason, setReason] = useState("");
  // State to track loading state for the button
  const [isNavigating, setIsNavigating] = useState(false);

  useEffect(() => {
    // Mark as mounted (client-side)
    setMounted(true);

    // Check if the prompt was dismissed recently
    const promptDismissed = localStorage.getItem("donationPromptDismissed");
    let dismissedRecently = false;

    if (promptDismissed) {
      const dismissedTime = Number.parseInt(promptDismissed, 10);
      const oneDayAgo = Date.now() - 24 * 60 * 60 * 1000;
      dismissedRecently = dismissedTime > oneDayAgo;
    }

    // Determine if we should show the prompt
    let shouldShow = false;
    let promptReason = "";

    if (!user.lastDonationDate) {
      // No donation date, should show for first-time donation
      shouldShow = true;
      promptReason = "never-donated";
    } else {
      try {
        // Check if donation was in current year
        const lastDonationDate = new Date(user.lastDonationDate);
        const currentYear = new Date().getFullYear();

        if (lastDonationDate.getFullYear() < currentYear) {
          shouldShow = true;
          promptReason = "new-year";
        }
      } catch (error) {
        // If there's an error parsing the date, don't show the prompt
        shouldShow = false;
      }
    }

    // Only show if it should be shown AND it wasn't recently dismissed
    setShowPrompt(shouldShow && !dismissedRecently);
    if (shouldShow) {
      setReason(promptReason);
    }
  }, [user.lastDonationDate]);

  // Handle dismissing the prompt
  const handleDismiss = () => {
    setShowPrompt(false);
    localStorage.setItem("donationPromptDismissed", Date.now().toString());
  };

  // Format date consistently
  const formatDate = (dateString) => {
    if (!dateString) return "";

    try {
      const date = new Date(dateString);
      return date.toISOString().split("T")[0]; // YYYY-MM-DD format
    } catch (error) {
      return "Invalid date";
    }
  };

  // Don't render anything on the server or if we shouldn't show the prompt
  if (!mounted || !showPrompt) return null;

  return (
    <div className="bg-blue-100 border-l-4 border-sandsharks-blue p-4 mb-8 rounded-md">
      <div className="flex justify-between">
        <div>
          {reason === "never-donated" && (
            <div className="space-y-4">
              <p className="text-sandsharks-blue font-bold text-xl">
                Support our community by making your first donation to
                Sandsharks!
              </p>
              <p>
                Sandsharks is completely volunteer run and we need donations
                from members like you to help pay for court rentals, replacing
                worn out equipment, equipment storage, and more.
              </p>
              <p>
                All donations are pay-what-you-can, with a suggested donation
                amount of $40 for the entire Summer! :D
              </p>
            </div>
          )}

          {reason === "new-year" && (
            <div className="space-y-4">
              <p className="text-sandsharks-blue font-bold text-xl">
                Happy {new Date().getFullYear()}! Please consider making a
                donation to support Sandsharks this year.
                {/* {user.lastDonationDate && (
                <span className="block text-medium mt-1">
                  Your last donation was on {formatDate(user.lastDonationDate)}
                </span>
              )} */}
              </p>
              <p>
                Sandsharks is completely volunteer run and we need donations
                from members like you to help pay for court rentals, replacing
                worn out equipment, storage, and more.
              </p>
              <p>
                All donations are pay-what-you-can, with a suggested donation
                amount of $40 for the entire Summer! :D
              </p>
            </div>
          )}

          <div className="mt-3 flex items-center">
            <Link href="/dashboard/member/donations" className="mr-4">
              <ActionButton
                className=""
                onClick={() => setIsNavigating(true)}
                disabled={isNavigating}
              >
                Donate Now
              </ActionButton>
            </Link>
            <button
              onClick={handleDismiss}
              className="text-sm hover:underline"
              disabled={isNavigating}
            >
              Remind me later
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

// "use client";

// import { useState, useEffect } from "react";
// import Link from "next/link";

// export default function DonationPrompt({ user }) {
//   // State to track if we're on the client
//   const [mounted, setMounted] = useState(false);
//   // State to track if the prompt should be shown
//   const [showPrompt, setShowPrompt] = useState(false);
//   // State to track the reason for showing the prompt
//   const [reason, setReason] = useState("");

//   useEffect(() => {
//     // Mark as mounted (client-side)
//     setMounted(true);

//     // Check if the prompt was dismissed recently
//     const promptDismissed = localStorage.getItem("donationPromptDismissed");
//     let dismissedRecently = false;

//     if (promptDismissed) {
//       const dismissedTime = Number.parseInt(promptDismissed, 10);
//       const oneDayAgo = Date.now() - 24 * 60 * 60 * 1000;
//       dismissedRecently = dismissedTime > oneDayAgo;
//     }

//     // Determine if we should show the prompt
//     let shouldShow = false;
//     let promptReason = "";

//     if (!user.lastDonationDate) {
//       // No donation date, should show for first-time donation
//       shouldShow = true;
//       promptReason = "never-donated";
//     } else {
//       try {
//         // Check if donation was in current year
//         const lastDonationDate = new Date(user.lastDonationDate);
//         const currentYear = new Date().getFullYear();

//         if (lastDonationDate.getFullYear() < currentYear) {
//           shouldShow = true;
//           promptReason = "new-year";
//         }
//       } catch (error) {
//         // If there's an error parsing the date, don't show the prompt
//         shouldShow = false;
//       }
//     }

//     // Only show if it should be shown AND it wasn't recently dismissed
//     setShowPrompt(shouldShow && !dismissedRecently);
//     if (shouldShow) {
//       setReason(promptReason);
//     }
//   }, [user.lastDonationDate]);

//   // Handle dismissing the prompt
//   const handleDismiss = () => {
//     setShowPrompt(false);
//     localStorage.setItem("donationPromptDismissed", Date.now().toString());
//   };

//   // Format date consistently
//   const formatDate = (dateString) => {
//     if (!dateString) return "";

//     try {
//       const date = new Date(dateString);
//       return date.toISOString().split("T")[0]; // YYYY-MM-DD format
//     } catch (error) {
//       return "Invalid date";
//     }
//   };

//   // Don't render anything on the server or if we shouldn't show the prompt
//   if (!mounted || !showPrompt) return null;

//   return (
//     <div className="bg-blue-100 border-l-4 border-sandsharks-blue p-4 mb-8 rounded-md">
//       <div className="flex justify-between">
//         <div>
//           {reason === "never-donated" && (
//             <div className="space-y-4">
//               <p className="text-sandsharks-blue font-bold text-xl">
//                 Support our community by making your first donation to
//                 Sandsharks!
//               </p>
//               <p>
//                 Sandsharks is completely volunteer run and we need donations to
//                 help pay for court rentals, replacing worn out equipment,
//                 storage, and more.
//               </p>
//               <p>
//                 All donations are pay-what-you-can, with a suggested donation
//                 amount of $40 for the entire Summer! :D
//               </p>
//             </div>
//           )}

//           {reason === "new-year" && (
//             <div className="space-y-4">
//               <p className="text-sandsharks-blue font-bold text-xl">
//                 Happy {new Date().getFullYear()}! Please consider making a
//                 donation to support Sandsharks this year.
//                 {/* {user.lastDonationDate && (
//                 <span className="block text-medium mt-1">
//                   Your last donation was on {formatDate(user.lastDonationDate)}
//                 </span>
//               )} */}
//               </p>
//               <p>
//                 Sandsharks is completely volunteer run and we need donations
//                 from members like you to help pay for court rentals, replacing
//                 worn out equipment, storage, and more.
//               </p>
//               <p>
//                 All donations are pay-what-you-can, with a suggested donation
//                 amount of $40 for the entire Summer! :D
//               </p>
//             </div>
//           )}

//           <div className="mt-3 flex items-center">
//             <Link
//               href="/dashboard/member/donations"
//               className="inline-block btn mr-4"
//             >
//               Donate Now
//             </Link>
//             <button
//               onClick={handleDismiss}
//               className=" text-sm hover:underline"
//             >
//               Remind me later
//             </button>
//           </div>
//         </div>
//       </div>
//     </div>
//   );
// }
