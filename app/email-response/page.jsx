// app/email-action/page.jsx
"use client";

import { useSearchParams } from "next/navigation";
import Link from "next/link";

export default function EmailActionPage() {
  const searchParams = useSearchParams();

  const type = searchParams.get("type");
  const action = searchParams.get("action");
  const success = searchParams.get("success") === "true";
  const reason = searchParams.get("reason");

  // Determine the message to show based on the action type and result
  let title = "Action Processed";
  let message = "Your request has been processed.";

  if (type === "rsvp") {
    if (success) {
      title = action === "attend" ? "RSVP Confirmed!" : "RSVP Cancelled";
      message =
        action === "attend"
          ? "You have successfully RSVP'd for this play day. We look forward to seeing you there!"
          : "Your RSVP has been cancelled. We hope to see you at another play day soon!";
    } else {
      title = "RSVP Action Failed";
      message =
        "We couldn't process your RSVP at this time. Please try again or contact support.";
    }
  } else if (type === "clinic-rsvp") {
    if (success) {
      title =
        action === "attend"
          ? "Clinic RSVP Confirmed!"
          : "Clinic RSVP Cancelled";
      message =
        action === "attend"
          ? "You have successfully RSVP'd for this beginner clinic. We look forward to seeing you there!"
          : "Your clinic RSVP has been cancelled. We hope to see you at another clinic soon!";
    } else {
      title = "Clinic RSVP Action Failed";

      if (reason === "full") {
        message =
          "This clinic is already at maximum capacity. Please try another clinic or contact support.";
      } else if (reason === "no-clinic") {
        message =
          "We couldn't find a clinic for this play day. The clinic may have been cancelled.";
      } else {
        message =
          "We couldn't process your clinic RSVP at this time. Please try again or contact support.";
      }
    }
  } else if (type === "unsubscribe") {
    if (success) {
      title = "Unsubscribed Successfully";
      message =
        "You have been unsubscribed from Sandsharks email notifications. You can resubscribe anytime from your profile settings.";
    } else {
      title = "Unsubscribe Failed";
      message =
        "We couldn't process your unsubscribe request at this time. Please try again or contact support.";
    }
  }

  return (
    <div className="container mx-auto px-4 py-12">
      <div className="max-w-md mx-auto bg-blue-50 p-8 rounded-lg shadow-md">
        <h1 className="text-2xl font-bold mb-4 text-center">{title}</h1>

        <p className="text-center mb-6">{message}</p>

        <div className="flex justify-center">
          <Link
            href="/dashboard/member"
            className="bg-blue-600 text-white px-6 py-2 rounded-md hover:bg-blue-700 transition-colors"
          >
            Go to Dashboard
          </Link>
        </div>
      </div>
    </div>
  );
}
