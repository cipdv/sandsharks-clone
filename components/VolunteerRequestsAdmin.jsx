"use client";

import { useState } from "react";
import {
  approveVolunteerRequest,
  rejectVolunteerRequest,
} from "@/app/_actions";
import { useFormStatus } from "react-dom";

function ActionButton({ children }) {
  const { pending } = useFormStatus();

  return (
    <button
      type="submit"
      disabled={pending}
      className={`btn ${pending ? "opacity-80" : ""}`}
    >
      {pending ? (
        <span className="flex items-center justify-center">
          <svg
            className="animate-spin -ml-1 mr-2 h-4 w-4 text-white"
            xmlns="http://www.w3.org/2000/svg"
            fill="none"
            viewBox="0 0 24 24"
          >
            <circle
              className="opacity-25"
              cx="12"
              cy="12"
              r="10"
              stroke="currentColor"
              strokeWidth="4"
            ></circle>
            <path
              className="opacity-75"
              fill="currentColor"
              d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
            ></path>
          </svg>
          Loading...
        </span>
      ) : (
        children
      )}
    </button>
  );
}

export default function VolunteerRequestsAdmin({ requests }) {
  const [message, setMessage] = useState(null);

  const formatDate = (dateString) => {
    if (!dateString) return "No date specified";
    const date = new Date(dateString);
    return date.toLocaleDateString("en-US", {
      year: "numeric",
      month: "long",
      day: "numeric",
    });
  };

  const handleApprove = async (formData) => {
    const result = await approveVolunteerRequest(formData);
    setMessage(result);

    // Clear message after 3 seconds
    setTimeout(() => {
      setMessage(null);
    }, 3000);
  };

  const handleReject = async (formData) => {
    const result = await rejectVolunteerRequest(formData);
    setMessage(result);

    // Clear message after 3 seconds
    setTimeout(() => {
      setMessage(null);
    }, 3000);
  };

  if (!requests || requests.length === 0) {
    return (
      <div className="bg-blue-50 p-4 rounded-md">
        <p>No pending volunteer requests at this time.</p>
      </div>
    );
  }

  return (
    <div>
      <h2 className="text-xl font-bold mb-4">Pending Volunteer Requests</h2>

      {message && (
        <div
          className={`p-3 mb-4 rounded-md ${
            message.success
              ? "bg-green-100 text-green-800"
              : "bg-red-100 text-red-800"
          }`}
        >
          {message.message}
        </div>
      )}

      <div className="space-y-4">
        {requests.map((request) => (
          <div
            key={request.id}
            className="bg-white p-4 rounded-md shadow-sm border border-gray-200"
          >
            <div className="flex flex-col md:flex-row justify-between">
              <div>
                <h3 className="font-semibold text-lg">{request.memberName}</h3>
                <p className="text-sm text-gray-600">{request.memberEmail}</p>
                <p className="mt-2">
                  Requested to volunteer for: {formatDate(request.playDayDate)}
                </p>
                <p className="text-sm text-gray-600">
                  Requested on: {formatDate(request.createdAt)}
                </p>
              </div>

              <div className="flex gap-2 mt-4 md:mt-0">
                <form action={handleApprove}>
                  <input type="hidden" name="requestId" value={request.id} />
                  <ActionButton>Approve</ActionButton>
                </form>

                <form action={handleReject}>
                  <input type="hidden" name="requestId" value={request.id} />
                  <ActionButton>Reject</ActionButton>
                </form>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
