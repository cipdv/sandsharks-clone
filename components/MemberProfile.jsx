"use client";

import { useState } from "react";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { updateMemberType, deleteMember } from "@/app/_actions";

export default function MemberProfile({ member }) {
  const router = useRouter();
  const [isDeleting, setIsDeleting] = useState(false);
  const [isUpdating, setIsUpdating] = useState(false);
  const [message, setMessage] = useState(null);

  const handleMakeVolunteer = async () => {
    if (member.memberType === "volunteer") {
      setMessage({ type: "info", text: "This member is already a volunteer" });
      return;
    }

    setIsUpdating(true);
    setMessage(null);

    try {
      const result = await updateMemberType(member.id, "volunteer");

      if (result.success) {
        setMessage({ type: "success", text: result.message });
        // Refresh the page to show updated data
        router.refresh();
      } else {
        setMessage({ type: "error", text: result.message });
      }
    } catch (error) {
      setMessage({
        type: "error",
        text: "An error occurred while updating member type",
      });
    } finally {
      setIsUpdating(false);
    }
  };

  const handleRevokeVolunteer = async () => {
    if (member.memberType !== "volunteer") {
      setMessage({ type: "info", text: "This member is not a volunteer" });
      return;
    }

    if (
      !window.confirm(
        `Are you sure you want to revoke volunteer status from ${member.firstName} ${member.lastName}?`
      )
    ) {
      return;
    }

    setIsUpdating(true);
    setMessage(null);

    try {
      const result = await updateMemberType(member.id, "member");

      if (result.success) {
        setMessage({ type: "success", text: result.message });
        // Refresh the page to show updated data
        router.refresh();
      } else {
        setMessage({ type: "error", text: result.message });
      }
    } catch (error) {
      setMessage({
        type: "error",
        text: "An error occurred while updating member type",
      });
    } finally {
      setIsUpdating(false);
    }
  };

  const handleDeleteMember = async () => {
    if (
      !window.confirm(
        `Are you sure you want to delete ${member.firstName} ${member.lastName}? This action cannot be undone.`
      )
    ) {
      return;
    }

    setIsDeleting(true);
    setMessage(null);

    try {
      const result = await deleteMember(member.id);

      if (result.success) {
        setMessage({ type: "success", text: result.message });
        // Redirect back to members list after successful deletion
        setTimeout(() => {
          router.push("/dashboard/ultrashark/members");
        }, 1500);
      } else {
        setMessage({ type: "error", text: result.message });
        setIsDeleting(false);
      }
    } catch (error) {
      setMessage({
        type: "error",
        text: "An error occurred while deleting the member",
      });
      setIsDeleting(false);
    }
  };

  const formatDate = (dateString) => {
    if (!dateString) return "—";

    // Create date object
    const date = new Date(dateString);

    // Format with explicit options and locale to ensure consistency
    return date.toLocaleDateString("en-US", {
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
    });
  };

  return (
    <div className="max-w-4xl mx-auto bg-white rounded-lg shadow-md overflow-hidden">
      <div className="p-6">
        <div className="flex justify-between items-start">
          <button
            onClick={() => router.push("/dashboard/ultrashark/members")}
            className="mb-4 text-blue-600 hover:underline flex items-center"
          >
            ← Back to Members
          </button>
        </div>

        {message && (
          <div
            className={`mb-4 p-3 rounded-md ${
              message.type === "success"
                ? "bg-green-100 text-green-800"
                : message.type === "error"
                ? "bg-red-100 text-red-800"
                : "bg-blue-100 text-blue-800"
            }`}
          >
            {message.text}
          </div>
        )}

        <div className="flex flex-col md:flex-row gap-6">
          <div className="md:w-1/3">
            <div className="relative h-48 w-48 mx-auto md:mx-0 rounded-lg overflow-hidden bg-gray-200">
              {member.profilePicUrl ? (
                <Image
                  src={member.profilePicUrl || "/placeholder.svg"}
                  alt={`${member.firstName}'s profile`}
                  fill
                  className="object-cover"
                />
              ) : (
                <div className="h-full w-full flex items-center justify-center">
                  <span className="text-gray-500 text-4xl">
                    {member.firstName.charAt(0)}
                    {member.lastName.charAt(0)}
                  </span>
                </div>
              )}
            </div>

            <div className="mt-4 text-center md:text-left">
              <h1 className="text-2xl font-bold">
                {member.firstName} {member.lastName}
              </h1>
              <p className="text-gray-600">{member.email}</p>
              <p className="text-gray-600">
                {member.pronouns || "No pronouns specified"}
              </p>

              <div className="mt-4">
                <span
                  className={`inline-block px-3 py-1 rounded-full text-sm ${
                    member.memberType === "ultrashark"
                      ? "bg-purple-100 text-purple-800"
                      : member.memberType === "admin"
                      ? "bg-indigo-100 text-indigo-800"
                      : member.memberType === "volunteer"
                      ? "bg-blue-100 text-blue-800"
                      : "bg-gray-100 text-gray-800"
                  }`}
                >
                  {member.memberType.charAt(0).toUpperCase() +
                    member.memberType.slice(1)}
                </span>
              </div>
            </div>
          </div>

          <div className="md:w-2/3">
            <div className="bg-gray-50 p-4 rounded-lg">
              <h2 className="text-lg font-semibold mb-3">Member Details</h2>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <p className="text-sm text-gray-500">Member Since</p>
                  <p>{formatDate(member.createdAt)}</p>
                </div>

                <div>
                  <p className="text-sm text-gray-500">Last Donation</p>
                  <p>{formatDate(member.lastDonationDate)}</p>
                </div>

                <div>
                  <p className="text-sm text-gray-500">Email Subscription</p>
                  <p>{member.emailList ? "Subscribed" : "Not subscribed"}</p>
                </div>

                <div>
                  <p className="text-sm text-gray-500">Photo Consent</p>
                  <p>{member.photoConsent ? "Yes" : "No"}</p>
                </div>
              </div>
            </div>

            {member.sponsors.length > 0 && (
              <div className="mt-4 bg-gray-50 p-4 rounded-lg">
                <h2 className="text-lg font-semibold mb-3">Sponsorships</h2>
                <ul className="space-y-2">
                  {member.sponsors.map((sponsor) => (
                    <li key={sponsor.id} className="flex items-center gap-2">
                      {sponsor.logoUrl ? (
                        <div className="relative h-8 w-8 rounded overflow-hidden">
                          <Image
                            src={sponsor.logoUrl || "/placeholder.svg"}
                            alt={sponsor.name}
                            fill
                            className="object-cover"
                          />
                        </div>
                      ) : (
                        <div className="h-8 w-8 bg-gray-200 rounded flex items-center justify-center">
                          <span className="text-xs">
                            {sponsor.name.charAt(0)}
                          </span>
                        </div>
                      )}
                      <span>{sponsor.name}</span>
                    </li>
                  ))}
                </ul>
              </div>
            )}

            <div className="mt-6 flex flex-col gap-3">
              <h2 className="text-lg font-semibold">Actions</h2>

              {member.memberType !== "volunteer" &&
                member.memberType !== "admin" &&
                member.memberType !== "ultrashark" && (
                  <button
                    onClick={handleMakeVolunteer}
                    disabled={isUpdating}
                    className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {isUpdating ? "Updating..." : "Make Volunteer"}
                  </button>
                )}

              {member.memberType === "volunteer" && (
                <button
                  onClick={handleRevokeVolunteer}
                  disabled={isUpdating}
                  className="px-4 py-2 bg-orange-600 text-white rounded-md hover:bg-orange-700 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {isUpdating ? "Updating..." : "Revoke Volunteer Status"}
                </button>
              )}

              <button
                onClick={handleDeleteMember}
                disabled={isDeleting}
                className="px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700 disabled:opacity-50"
              >
                {isDeleting ? "Deleting..." : "Delete Member"}
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
