"use client";

import { useEffect } from "react";
import { useSearchParams, useRouter } from "next/navigation";

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
          router.push("/dashboard/member/donations");
          break;
        case "volunteering":
          router.push("/dashboard/member/volunteering");
          break;
        case "become-a-sponsor":
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

  // If we're about to redirect, show a loading state
  if (fromEmail && target) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p>Redirecting to {target}...</p>
        </div>
      </div>
    );
  }

  // Otherwise, render the children
  return children;
}
