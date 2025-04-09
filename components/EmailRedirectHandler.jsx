"use client";

import { useEffect } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import LoadingSpinner from "./LoadingSpinner";

export default function EmailRedirectHandler({ children }) {
  const searchParams = useSearchParams();
  const router = useRouter();

  // Check if this is a direct access from email
  const fromEmail = searchParams.get("from") === "email";
  const target = searchParams.get("target");

  useEffect(() => {
    // If coming from email with a target, redirect to the appropriate page
    if (fromEmail && target) {
      console.log("Redirecting to target:", target); // Add this for debugging

      switch (target) {
        case "donations":
        case "donate":
          router.push("/dashboard/member/donations");
          break;
        case "volunteering":
        case "volunteer":
          router.push("/dashboard/member/volunteering");
          break;
        case "become-a-sponsor":
        case "sponsor":
          router.push("/dashboard/member/become-a-sponsor");
          break;
        case "profile":
          router.push("/dashboard/member/profile");
          break;
        default:
          // If no valid target, stay on the dashboard
          console.log("No valid target found:", target);
          break;
      }
    }
  }, [fromEmail, target, router]);

  // If we're about to redirect, show the custom loading spinner
  if (fromEmail && target) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen">
        <LoadingSpinner />
        <p className="mt-4">Redirecting to {target}...</p>
      </div>
    );
  }

  // Otherwise, render the children
  return children;
}
