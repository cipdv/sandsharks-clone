"use client";

import { useState } from "react";
import { approveMember, rejectMember } from "@/app/_actions";

export default function USPendingMembers({ members }) {
  const [pendingActions, setPendingActions] = useState({});

  const handleApprove = async (memberId) => {
    setPendingActions((prev) => ({ ...prev, [memberId]: "approving" }));
    try {
      await approveMember(memberId);
      setPendingActions((prev) => ({ ...prev, [memberId]: "approved" }));
    } catch (error) {
      console.error("Error approving member:", error);
      setPendingActions((prev) => ({ ...prev, [memberId]: "error" }));
    }
  };

  const handleReject = async (memberId) => {
    setPendingActions((prev) => ({ ...prev, [memberId]: "rejecting" }));
    try {
      await rejectMember(memberId);
      setPendingActions((prev) => ({ ...prev, [memberId]: "rejected" }));
    } catch (error) {
      console.error("Error rejecting member:", error);
      setPendingActions((prev) => ({ ...prev, [memberId]: "error" }));
    }
  };

  if (members.length === 0) {
    return <p className="text-gray-500">No pending members to approve</p>;
  }

  return (
    <div className="max-w-5xl mx-auto overflow-x-auto">
      <table className="min-w-full bg-white border border-gray-200">
        <thead className="bg-gray-100">
          <tr>
            <th className="py-2 px-4 border-b text-left">Name</th>
            <th className="py-2 px-4 border-b text-left">Email</th>
            <th className="py-2 px-4 border-b text-left">Pronouns</th>
            <th className="py-2 px-4 border-b text-left">Joined</th>
            <th className="py-2 px-4 border-b text-left">Actions</th>
          </tr>
        </thead>
        <tbody>
          {members.map((member) => (
            <tr key={member.id} className="hover:bg-gray-50">
              <td className="py-2 px-4 border-b">
                {member.firstName} {member.lastName}
              </td>
              <td className="py-2 px-4 border-b">{member.email}</td>
              <td className="py-2 px-4 border-b">{member.pronouns || "—"}</td>
              <td className="py-2 px-4 border-b">
                {new Date(member.createdAt).toLocaleDateString()}
              </td>
              <td className="py-2 px-4 border-b">
                {pendingActions[member.id] === "approved" ||
                pendingActions[member.id] === "rejected" ? (
                  <span className="text-green-600">
                    {pendingActions[member.id] === "approved"
                      ? "Approved"
                      : "Rejected"}
                  </span>
                ) : (
                  <div className="flex gap-2">
                    <button
                      onClick={() => handleApprove(member.id)}
                      disabled={pendingActions[member.id]}
                      className="px-3 py-1 bg-green-600 text-white rounded-md hover:bg-green-700 disabled:opacity-50"
                    >
                      {pendingActions[member.id] === "approving"
                        ? "Approving..."
                        : "Approve"}
                    </button>
                    <button
                      onClick={() => handleReject(member.id)}
                      disabled={pendingActions[member.id]}
                      className="px-3 py-1 bg-red-600 text-white rounded-md hover:bg-red-700 disabled:opacity-50"
                    >
                      {pendingActions[member.id] === "rejecting"
                        ? "Rejecting..."
                        : "Reject"}
                    </button>
                  </div>
                )}
                {pendingActions[member.id] === "error" && (
                  <span className="text-red-600 text-sm">Error occurred</span>
                )}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
