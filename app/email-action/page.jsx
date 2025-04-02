"use client";

import { useState, useEffect } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import Link from "next/link";
import { handleEmailAction } from "@/app/_actions";

export default function EmailActionPage() {
  const [message, setMessage] = useState("Processing your request...");
  const [error, setError] = useState(null);
  const [isProcessing, setIsProcessing] = useState(true);
  const [memberId, setMemberId] = useState(null);
  const [unsubscribeSuccess, setUnsubscribeSuccess] = useState(false);
  const searchParams = useSearchParams();
  const router = useRouter();

  useEffect(() => {
    async function processAction() {
      try {
        const action = searchParams.get("action");
        const id = searchParams.get("id");
        const expires = searchParams.get("expires");
        const signature = searchParams.get("signature");

        console.log("Email action page params:", {
          action,
          id,
          expires,
          signature,
        });

        // Store the member ID for potential account deletion
        if (id) {
          setMemberId(id);
        }

        // Check if all required parameters are present
        if (!action || !id || !expires || !signature) {
          setError("Missing required parameters");
          setIsProcessing(false);
          return;
        }

        const result = await handleEmailAction(action, id, expires, signature);

        if (result.success) {
          setMessage(result.message);
          setIsProcessing(false);

          if (action === "unsubscribe") {
            setUnsubscribeSuccess(true);
          }

          // Redirect after successful action if needed
          if (result.redirect && action !== "unsubscribe") {
            setTimeout(() => {
              router.push(result.redirect);
            }, 3000);
          }
        } else {
          setError(result.message);
          setIsProcessing(false);
        }
      } catch (err) {
        console.error("Error processing email action:", err);
        setError("An unexpected error occurred");
        setIsProcessing(false);
      }
    }

    processAction();
  }, [searchParams, router]);

  const handleDeleteAccount = () => {
    // Use the URL parameter approach instead of localStorage
    router.push("/dashboard/member/delete-account");
  };

  return (
    <div className="container mx-auto py-8 px-4">
      <div className="bg-blue-100 p-4 rounded-md w-full max-w-md mx-auto">
        <h1 className="text-2xl font-bold mb-6 text-center">
          {error ? "Error" : isProcessing ? "Processing" : "Success"}
        </h1>

        <div className="p-4">
          {isProcessing ? (
            <div className="flex flex-col items-center">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mb-4"></div>
              <p className="text-center">{message}</p>
            </div>
          ) : error ? (
            <div className="text-center">
              <div className="text-red-500 text-5xl mb-4">
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  className="h-16 w-16 mx-auto"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                  />
                </svg>
              </div>
              <p className="mb-6">{error}</p>
              <Link
                href="/"
                className="inline-block bg-blue-600 hover:bg-blue-700 text-white font-medium py-2 px-6 rounded-md transition duration-300"
              >
                Return to Homepage
              </Link>
            </div>
          ) : (
            <div className="text-center">
              <div className="text-green-500 text-5xl mb-4">
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  className="h-16 w-16 mx-auto"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M5 13l4 4L19 7"
                  />
                </svg>
              </div>
              <p className="mb-6">{message}</p>

              {unsubscribeSuccess && (
                <div className="mt-6 pt-6 border-t border-gray-300">
                  <h2 className="text-lg font-bold mb-4">
                    Would you like to delete your account?
                  </h2>
                  <p className="mb-4">
                    If you no longer wish to be a member of Sandsharks, you can
                    delete your account permanently.
                  </p>
                  <div className="flex flex-col sm:flex-row justify-center gap-4">
                    <button
                      onClick={handleDeleteAccount}
                      className="bg-red-600 hover:bg-red-700 text-white font-medium py-2 px-6 rounded-md transition duration-300"
                    >
                      Delete My Account
                    </button>
                    <Link
                      href="/"
                      className="bg-gray-200 hover:bg-gray-300 text-gray-800 font-medium py-2 px-6 rounded-md transition duration-300"
                    >
                      Return to Homepage
                    </Link>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
