"use client";

import { useState } from "react";
import Image from "next/image";
import { useRouter } from "next/navigation";

export default function USMemberManagement({ members }) {
  const router = useRouter();
  const [searchTerm, setSearchTerm] = useState("");
  const [filterVolunteers, setFilterVolunteers] = useState(false);
  const [filterSponsors, setFilterSponsors] = useState(false);

  // Filter members based on search and filters
  const filteredMembers = members.filter((member) => {
    const matchesSearch =
      searchTerm === "" ||
      member.firstName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      member.lastName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      member.email.toLowerCase().includes(searchTerm.toLowerCase());

    const matchesVolunteerFilter = !filterVolunteers || member.isVolunteer;
    const matchesSponsorFilter = !filterSponsors || member.sponsors.length > 0;

    return matchesSearch && matchesVolunteerFilter && matchesSponsorFilter;
  });

  const handleRowClick = (memberId) => {
    router.push(`/dashboard/ultrashark/members/${memberId}`);
  };

  return (
    <div className="max-w-5xl mx-auto">
      <div className="mb-4 flex flex-wrap gap-4 items-center">
        <div className="flex-grow">
          <input
            type="text"
            placeholder="Search by name or email..."
            className="w-full px-3 py-2 border border-gray-300 rounded-md"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
        <div className="flex items-center gap-4">
          <label className="flex items-center gap-2">
            <input
              type="checkbox"
              checked={filterVolunteers}
              onChange={() => setFilterVolunteers(!filterVolunteers)}
            />
            Volunteers Only
          </label>
          <label className="flex items-center gap-2">
            <input
              type="checkbox"
              checked={filterSponsors}
              onChange={() => setFilterSponsors(!filterSponsors)}
            />
            Sponsors Only
          </label>
        </div>
      </div>

      <div className="overflow-x-auto">
        <table className="min-w-full bg-white border border-gray-200">
          <thead className="bg-gray-100">
            <tr>
              <th className="py-2 px-4 border-b text-left">Profile</th>
              <th className="py-2 px-4 border-b text-left">Name</th>
              <th className="py-2 px-4 border-b text-left">Email</th>
              <th className="py-2 px-4 border-b text-left">Pronouns</th>
              <th className="py-2 px-4 border-b text-left">Volunteer</th>
              <th className="py-2 px-4 border-b text-left">Sponsor</th>
            </tr>
          </thead>
          <tbody>
            {filteredMembers.map((member) => (
              <tr
                key={member.id}
                className="hover:bg-gray-50 cursor-pointer"
                onClick={() => handleRowClick(member.id)}
              >
                <td className="py-2 px-4 border-b">
                  {member.profilePicUrl ? (
                    <div className="relative h-12 w-12 rounded-full overflow-hidden">
                      <Image
                        src={member.profilePicUrl || "/placeholder.svg"}
                        alt={`${member.firstName}'s profile`}
                        fill
                        className="object-cover"
                      />
                    </div>
                  ) : (
                    <div className="h-12 w-12 rounded-full bg-gray-200 flex items-center justify-center">
                      <span className="text-gray-500 text-lg">
                        {member.firstName.charAt(0)}
                        {member.lastName.charAt(0)}
                      </span>
                    </div>
                  )}
                </td>
                <td className="py-2 px-4 border-b">
                  {member.firstName} {member.lastName}
                </td>
                <td className="py-2 px-4 border-b">{member.email}</td>
                <td className="py-2 px-4 border-b">{member.pronouns || "—"}</td>
                <td className="py-2 px-4 border-b">
                  <span
                    className={`inline-block px-2 py-1 rounded-full text-xs ${
                      member.isVolunteer
                        ? "bg-blue-100 text-blue-800"
                        : "bg-gray-100 text-gray-800"
                    }`}
                  >
                    {member.isVolunteer ? "Yes" : "No"}
                  </span>
                </td>
                <td className="py-2 px-4 border-b">
                  {member.sponsors.length > 0 ? (
                    <div className="flex flex-col gap-1">
                      {member.sponsors.map((sponsor) => (
                        <span key={sponsor.id} className="text-blue-600">
                          {sponsor.name}
                        </span>
                      ))}
                    </div>
                  ) : (
                    "—"
                  )}
                </td>
              </tr>
            ))}
            {filteredMembers.length === 0 && (
              <tr>
                <td colSpan="6" className="py-4 text-center text-gray-500">
                  No members found matching your criteria
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
      <div className="mt-4 text-sm text-gray-500">
        Showing {filteredMembers.length} of {members.length} members
      </div>
    </div>
  );
}
