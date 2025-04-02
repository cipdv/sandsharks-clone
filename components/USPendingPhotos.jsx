"use client";

import { useState } from "react";
import Image from "next/image";
import { approveProfilePic, rejectProfilePic } from "@/app/_actions";

export default function USPendingPhotos({ members }) {
  const [pendingActions, setPendingActions] = useState({});

  const handleApprove = async (memberId) => {
    setPendingActions((prev) => ({ ...prev, [memberId]: "approving" }));
    try {
      await approveProfilePic(memberId);
      setPendingActions((prev) => ({ ...prev, [memberId]: "approved" }));
    } catch (error) {
      console.error("Error approving photo:", error);
      setPendingActions((prev) => ({ ...prev, [memberId]: "error" }));
    }
  };

  const handleReject = async (memberId) => {
    setPendingActions((prev) => ({ ...prev, [memberId]: "rejecting" }));
    try {
      await rejectProfilePic(memberId);
      setPendingActions((prev) => ({ ...prev, [memberId]: "rejected" }));
    } catch (error) {
      console.error("Error rejecting photo:", error);
      setPendingActions((prev) => ({ ...prev, [memberId]: "error" }));
    }
  };

  if (members.length === 0) {
    return (
      <p className="text-gray-500">No pending profile photos to approve</p>
    );
  }

  return (
    <div className="max-w-5xl mx-auto grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
      {members.map((member) => (
        <div
          key={member.id}
          className="border rounded-lg overflow-hidden bg-white"
        >
          <div className="relative h-64 w-full">
            <Image
              src={member.profilePicUrl || "/placeholder.svg"}
              alt={`${member.firstName}'s profile`}
              fill
              className="object-cover"
            />
          </div>
          <div className="p-4">
            <h3 className="font-bold text-lg">
              {member.firstName} {member.lastName}
            </h3>
            <p className="text-gray-600">{member.email}</p>

            <div className="mt-4 flex gap-2">
              {pendingActions[member.id] === "approved" ? (
                <span className="text-green-600">Photo Approved</span>
              ) : pendingActions[member.id] === "rejected" ? (
                <span className="text-red-600">Photo Rejected</span>
              ) : (
                <>
                  <button
                    onClick={() => handleApprove(member.id)}
                    disabled={pendingActions[member.id]}
                    className="px-3 py-1 bg-green-600 text-white rounded-md hover:bg-green-700 disabled:opacity-50 flex-1"
                  >
                    {pendingActions[member.id] === "approving"
                      ? "Approving..."
                      : "Approve"}
                  </button>
                  <button
                    onClick={() => handleReject(member.id)}
                    disabled={pendingActions[member.id]}
                    className="px-3 py-1 bg-red-600 text-white rounded-md hover:bg-red-700 disabled:opacity-50 flex-1"
                  >
                    {pendingActions[member.id] === "rejecting"
                      ? "Rejecting..."
                      : "Reject"}
                  </button>
                </>
              )}
            </div>
            {pendingActions[member.id] === "error" && (
              <p className="text-red-600 text-sm mt-2">Error occurred</p>
            )}
          </div>
        </div>
      ))}
    </div>
  );
}
