"use client";

import { useState } from "react";
import Image from "next/image";
import { approveSponsorRequest, rejectSponsorRequest } from "@/app/_actions";

export default function SponsorRequestsAdmin({ requests = [] }) {
  const [message, setMessage] = useState(null);
  const [rejectionData, setRejectionData] = useState({
    open: false,
    requestId: null,
  });

  const formatDate = (dateString) => {
    if (!dateString) return "No date specified";
    const date = new Date(dateString);
    return date.toLocaleDateString("en-US", {
      year: "numeric",
      month: "long",
      day: "numeric",
    });
  };

  const handleApprove = async (requestId) => {
    setMessage(null);

    try {
      const formData = new FormData();
      formData.append("requestId", requestId);

      const result = await approveSponsorRequest(formData);

      if (result.success) {
        setMessage({
          type: "success",
          text: result.message || "Sponsor request approved successfully",
        });

        // Remove the approved request from the list
        const requestElement = document.getElementById(
          `sponsor-request-${requestId}`
        );
        if (requestElement) {
          requestElement.classList.add("opacity-0");
          setTimeout(() => {
            requestElement.remove();

            // Check if there are no more requests
            const remainingRequests = document.querySelectorAll(
              '[id^="sponsor-request-"]'
            );
            if (remainingRequests.length === 0) {
              const requestsContainer = document.getElementById(
                "sponsor-requests-container"
              );
              if (requestsContainer) {
                requestsContainer.innerHTML =
                  '<div class="bg-blue-50 p-4 rounded-md"><p>No pending sponsorship requests at this time.</p></div>';
              }
            }
          }, 500);
        }
      } else {
        setMessage({
          type: "error",
          text: result.message || "Failed to approve sponsor request",
        });
      }
    } catch (error) {
      console.error("Error approving sponsor request:", error);
      setMessage({
        type: "error",
        text: "An unexpected error occurred",
      });
    }
  };

  const handleReject = async (e) => {
    e.preventDefault();
    setMessage(null);

    try {
      const formData = new FormData(e.target);

      const result = await rejectSponsorRequest(formData);

      if (result.success) {
        setMessage({
          type: "success",
          text: result.message || "Sponsor request rejected successfully",
        });

        // Close the rejection form
        setRejectionData({ open: false, requestId: null });

        // Remove the rejected request from the list
        const requestId = formData.get("requestId");
        const requestElement = document.getElementById(
          `sponsor-request-${requestId}`
        );
        if (requestElement) {
          requestElement.classList.add("opacity-0");
          setTimeout(() => {
            requestElement.remove();

            // Check if there are no more requests
            const remainingRequests = document.querySelectorAll(
              '[id^="sponsor-request-"]'
            );
            if (remainingRequests.length === 0) {
              const requestsContainer = document.getElementById(
                "sponsor-requests-container"
              );
              if (requestsContainer) {
                requestsContainer.innerHTML =
                  '<div class="bg-blue-50 p-4 rounded-md"><p>No pending sponsorship requests at this time.</p></div>';
              }
            }
          }, 500);
        }
      } else {
        setMessage({
          type: "error",
          text: result.message || "Failed to reject sponsor request",
        });
      }
    } catch (error) {
      console.error("Error rejecting sponsor request:", error);
      setMessage({
        type: "error",
        text: "An unexpected error occurred",
      });
    }
  };

  if (!requests || requests.length === 0) {
    return (
      <div className="bg-blue-50 p-4 rounded-md">
        <p>No pending sponsorship requests at this time.</p>
      </div>
    );
  }

  return (
    <div>
      {message && (
        <div
          className={`p-4 mb-4 rounded-md ${
            message.type === "success"
              ? "bg-green-100 text-green-800"
              : "bg-red-100 text-red-800"
          }`}
        >
          {message.text}
        </div>
      )}

      <div id="sponsor-requests-container" className="space-y-6">
        {requests.map((request) => (
          <div
            key={request.id}
            id={`sponsor-request-${request.id}`}
            className="bg-white p-6 rounded-md shadow-sm border border-gray-200 transition-opacity duration-500"
          >
            <div className="flex flex-col md:flex-row justify-between">
              <div className="mb-4 md:mb-0 md:pr-6 flex-grow">
                <h3 className="font-semibold text-lg">{request.name}</h3>
                <p className="text-sm text-gray-600">
                  Submitted by: {request.first_name} {request.last_name} (
                  {request.email})
                </p>
                <p className="text-sm text-gray-600">
                  Requested on: {formatDate(request.created_at)}
                </p>

                {request.description && (
                  <div className="mt-3">
                    <h4 className="font-medium text-sm">Description:</h4>
                    <p className="text-sm mt-1">{request.description}</p>
                  </div>
                )}

                <div className="mt-3 grid grid-cols-1 md:grid-cols-3 gap-3">
                  {request.website_url && (
                    <div>
                      <h4 className="font-medium text-sm">Website:</h4>
                      <a
                        href={request.website_url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-sm text-blue-600 hover:underline"
                      >
                        {request.website_url}
                      </a>
                    </div>
                  )}

                  {request.instagram_url && (
                    <div>
                      <h4 className="font-medium text-sm">Instagram:</h4>
                      <a
                        href={request.instagram_url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-sm text-blue-600 hover:underline"
                      >
                        {request.instagram_url}
                      </a>
                    </div>
                  )}

                  {request.other_url && (
                    <div>
                      <h4 className="font-medium text-sm">Other URL:</h4>
                      <a
                        href={request.other_url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-sm text-blue-600 hover:underline"
                      >
                        {request.other_url}
                      </a>
                    </div>
                  )}
                </div>

                {request.logo_url && (
                  <div className="mt-4">
                    <h4 className="font-medium text-sm">Logo:</h4>
                    <div className="mt-2 w-40 h-40 relative border border-gray-200 rounded-md overflow-hidden">
                      <Image
                        src={request.logo_url || "/placeholder.svg"}
                        alt={`${request.name} logo`}
                        fill
                        className="object-contain"
                      />
                    </div>
                  </div>
                )}
              </div>

              <div className="flex flex-col gap-2 md:min-w-[120px]">
                <button
                  onClick={() => handleApprove(request.id)}
                  className="px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500"
                >
                  Approve
                </button>

                <button
                  onClick={() =>
                    setRejectionData({ open: true, requestId: request.id })
                  }
                  className="px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500"
                >
                  Reject
                </button>
              </div>
            </div>

            {rejectionData.open && rejectionData.requestId === request.id && (
              <div className="mt-4 pt-4 border-t border-gray-200">
                <h4 className="font-medium mb-2">Rejection Reason:</h4>
                <form onSubmit={handleReject}>
                  <input type="hidden" name="requestId" value={request.id} />
                  <textarea
                    name="rejectionReason"
                    rows="3"
                    className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                    placeholder="Provide a reason for rejecting this sponsorship request..."
                    required
                  ></textarea>
                  <div className="mt-2 flex justify-end gap-2">
                    <button
                      type="button"
                      onClick={() =>
                        setRejectionData({ open: false, requestId: null })
                      }
                      className="px-3 py-1 bg-gray-200 text-gray-800 rounded-md hover:bg-gray-300 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-gray-500"
                    >
                      Cancel
                    </button>
                    <button
                      type="submit"
                      className="px-3 py-1 bg-red-600 text-white rounded-md hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500"
                    >
                      Confirm Rejection
                    </button>
                  </div>
                </form>
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
