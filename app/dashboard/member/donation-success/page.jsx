// app/dashboard/member/donation-success/page.jsx
"use client";

import { useEffect, useState, Suspense } from "react";
import { useSearchParams } from "next/navigation";
import { handleDonationSuccess } from "@/app/_actions";
import Link from "next/link";
import LoadingSpinner from "@/components/LoadingSpinner";
import Image from "next/image";

// Component that handles the donation success logic
function DonationSuccessContent() {
  const searchParams = useSearchParams();
  const paymentIntentId = searchParams.get("payment_intent");
  const [status, setStatus] = useState("processing");
  const [error, setError] = useState("");

  useEffect(() => {
    async function processDonation() {
      if (paymentIntentId) {
        try {
          const result = await handleDonationSuccess(paymentIntentId);
          if (result.success) {
            setStatus("success");
          } else {
            setStatus("error");
            setError(result.message || "An error occurred");
          }
        } catch (error) {
          setStatus("error");
          setError(error.message || "An error occurred");
        }
      }
    }

    processDonation();
  }, [paymentIntentId]);

  return (
    <div className="text-center">
      {status === "processing" && (
        <>
          <h1 className="text-2xl font-bold text-sandsharks-blue mb-4">
            Processing Your Donation
          </h1>
          <p className="mb-6">Please wait while we confirm your donation...</p>
          <div className="flex justify-center">
            <div className="rotating-logo">
              <Image
                src="/images/sandsharks-rainbow-icon.svg"
                alt="Loading..."
                width={40}
                height={40}
                className="object-contain"
              />
            </div>
          </div>
        </>
      )}

      {status === "success" && (
        <>
          <h1 className="text-2xl font-bold text-sandsharks-blue mb-4">
            Thank You for Your Donation!
          </h1>
          <p className="mb-6">
            Your generous contribution helps keep Sandsharks running. :)
          </p>
          <Link href="/dashboard/member" className="btn mt-4 inline-block">
        Return to Dashboard
      </Link>
        </>
      )}

      {status === "error" && (
        <>
          <h1 className="text-2xl font-bold text-red-600 mb-4">
            Donation Processing Issue
          </h1>
          <p className="mb-6">
            {error ||
              "We encountered an issue processing your donation. Please contact us for assistance."}
          </p>
        </>
      )}

      
    </div>
  );
}

// Main component with Suspense
export default function DonationSuccessPage() {
  return (
    <div className="container mx-auto py-10 px-4">
      <div className="max-w-md mx-auto bg-blue-100 rounded-lg shadow-md p-6 my-10">
        <Suspense fallback={<LoadingSpinner />}>
          <DonationSuccessContent />
        </Suspense>
      </div>
    </div>
  );
}
