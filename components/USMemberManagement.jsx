"use client";

import { useState } from "react";
import Image from "next/image";
import { useRouter } from "next/navigation";

export default function USMemberManagement({ members }) {
  const router = useRouter();
  const [searchTerm, setSearchTerm] = useState("");
  const [filterVolunteers, setFilterVolunteers] = useState(false);
  const [filterSponsors, setFilterSponsors] = useState(false);
  const [filterPhotoConsent, setFilterPhotoConsent] = useState(false);
  const [filterEmailList, setFilterEmailList] = useState(false);
  const [filterWaiverConfirmed, setFilterWaiverConfirmed] = useState(false);

  // Filter members based on search and filters
  const filteredMembers = members.filter((member) => {
    const matchesSearch =
      searchTerm === "" ||
      member.firstName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      member.lastName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      member.email.toLowerCase().includes(searchTerm.toLowerCase());

    const matchesVolunteerFilter = !filterVolunteers || member.isVolunteer;
    const matchesSponsorFilter = !filterSponsors || member.sponsors.length > 0;

    // Updated photo consent filter to only show members who have confirmed their waiver
    // but have not given photo consent
    const matchesPhotoConsentFilter =
      !filterPhotoConsent ||
      (member.photoConsent === false && member.waiverConfirmedAt !== null);

    const matchesEmailListFilter =
      !filterEmailList ||
      member.emailList === false ||
      member.emailList === null ||
      member.emailList === undefined;

    const matchesWaiverConfirmedFilter =
      !filterWaiverConfirmed ||
      member.waiverConfirmed === false ||
      member.waiverConfirmed === null ||
      member.waiverConfirmed === undefined;

    return (
      matchesSearch &&
      matchesVolunteerFilter &&
      matchesSponsorFilter &&
      matchesPhotoConsentFilter &&
      matchesEmailListFilter &&
      matchesWaiverConfirmedFilter
    );
  });

  const handleRowClick = (memberId) => {
    router.push(`/dashboard/ultrashark/members/${memberId}`);
  };

  // Count members with no photo consent but with waiver confirmed
  const noPhotoConsentWithWaiverCount = members.filter(
    (member) =>
      member.photoConsent === false && member.waiverConfirmedAt !== null
  ).length;

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
        <div className="flex items-center gap-4 flex-wrap">
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
          <label
            className="flex items-center gap-2 tooltip"
            title="Shows members who have confirmed their waiver but have not given photo consent"
          >
            <input
              type="checkbox"
              checked={filterPhotoConsent}
              onChange={() => setFilterPhotoConsent(!filterPhotoConsent)}
            />
            <span>
              No Photo Consent (with Waiver){" "}
              <span className="ml-1 px-2 py-0.5 bg-yellow-100 text-yellow-800 text-xs rounded-full">
                {noPhotoConsentWithWaiverCount}
              </span>
            </span>
          </label>
          <label className="flex items-center gap-2">
            <input
              type="checkbox"
              checked={filterEmailList}
              onChange={() => setFilterEmailList(!filterEmailList)}
            />
            Not on Email List
          </label>
          <label className="flex items-center gap-2">
            <input
              type="checkbox"
              checked={filterWaiverConfirmed}
              onChange={() => setFilterWaiverConfirmed(!filterWaiverConfirmed)}
            />
            No Waiver Confirmed
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
              <th className="py-2 px-4 border-b text-left">Photo Consent</th>
              <th className="py-2 px-4 border-b text-left">Email List</th>
              <th className="py-2 px-4 border-b text-left">Waiver</th>
              <th className="py-2 px-4 border-b text-left">Waiver Date</th>
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
                  {member.profilePicUrl &&
                  member.profilePicUrl !== "NULL" &&
                  member.profilePicUrl !== "null" ? (
                    <div className="relative h-12 w-12 rounded-full overflow-hidden">
                      <Image
                        src={
                          member.profilePicUrl.startsWith("http")
                            ? member.profilePicUrl
                            : "/placeholder.svg"
                        }
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
                <td className="py-2 px-4 border-b">
                  <span
                    className={`inline-block px-2 py-1 rounded-full text-xs ${
                      member.photoConsent
                        ? "bg-green-100 text-green-800"
                        : "bg-red-100 text-red-800"
                    }`}
                  >
                    {member.photoConsent ? "Yes" : "No"}
                  </span>
                </td>
                <td className="py-2 px-4 border-b">
                  <span
                    className={`inline-block px-2 py-1 rounded-full text-xs ${
                      member.emailList
                        ? "bg-green-100 text-green-800"
                        : "bg-red-100 text-red-800"
                    }`}
                  >
                    {member.emailList ? "Yes" : "No"}
                  </span>
                </td>
                <td className="py-2 px-4 border-b">
                  <span
                    className={`inline-block px-2 py-1 rounded-full text-xs ${
                      member.waiverConfirmed
                        ? "bg-green-100 text-green-800"
                        : "bg-red-100 text-red-800"
                    }`}
                  >
                    {member.waiverConfirmed ? "Yes" : "No"}
                  </span>
                </td>
                <td className="py-2 px-4 border-b">
                  {member.waiverConfirmedAt ? (
                    <span className="text-xs">
                      {new Date(member.waiverConfirmedAt).toLocaleDateString()}
                    </span>
                  ) : (
                    "—"
                  )}
                </td>
              </tr>
            ))}
            {filteredMembers.length === 0 && (
              <tr>
                <td colSpan="10" className="py-4 text-center text-gray-500">
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

// "use client";

// import { useState } from "react";
// import Image from "next/image";
// import { useRouter } from "next/navigation";

// export default function USMemberManagement({ members }) {
//   const router = useRouter();
//   const [searchTerm, setSearchTerm] = useState("");
//   const [filterVolunteers, setFilterVolunteers] = useState(false);
//   const [filterSponsors, setFilterSponsors] = useState(false);

//   // Filter members based on search and filters
//   const filteredMembers = members.filter((member) => {
//     const matchesSearch =
//       searchTerm === "" ||
//       member.firstName.toLowerCase().includes(searchTerm.toLowerCase()) ||
//       member.lastName.toLowerCase().includes(searchTerm.toLowerCase()) ||
//       member.email.toLowerCase().includes(searchTerm.toLowerCase());

//     const matchesVolunteerFilter = !filterVolunteers || member.isVolunteer;
//     const matchesSponsorFilter = !filterSponsors || member.sponsors.length > 0;

//     return matchesSearch && matchesVolunteerFilter && matchesSponsorFilter;
//   });

//   const handleRowClick = (memberId) => {
//     router.push(`/dashboard/ultrashark/members/${memberId}`);
//   };

//   return (
//     <div className="max-w-5xl mx-auto">
//       <div className="mb-4 flex flex-wrap gap-4 items-center">
//         <div className="flex-grow">
//           <input
//             type="text"
//             placeholder="Search by name or email..."
//             className="w-full px-3 py-2 border border-gray-300 rounded-md"
//             value={searchTerm}
//             onChange={(e) => setSearchTerm(e.target.value)}
//           />
//         </div>
//         <div className="flex items-center gap-4">
//           <label className="flex items-center gap-2">
//             <input
//               type="checkbox"
//               checked={filterVolunteers}
//               onChange={() => setFilterVolunteers(!filterVolunteers)}
//             />
//             Volunteers Only
//           </label>
//           <label className="flex items-center gap-2">
//             <input
//               type="checkbox"
//               checked={filterSponsors}
//               onChange={() => setFilterSponsors(!filterSponsors)}
//             />
//             Sponsors Only
//           </label>
//         </div>
//       </div>

//       <div className="overflow-x-auto">
//         <table className="min-w-full bg-white border border-gray-200">
//           <thead className="bg-gray-100">
//             <tr>
//               <th className="py-2 px-4 border-b text-left">Profile</th>
//               <th className="py-2 px-4 border-b text-left">Name</th>
//               <th className="py-2 px-4 border-b text-left">Email</th>
//               <th className="py-2 px-4 border-b text-left">Pronouns</th>
//               <th className="py-2 px-4 border-b text-left">Volunteer</th>
//               <th className="py-2 px-4 border-b text-left">Sponsor</th>
//             </tr>
//           </thead>
//           <tbody>
//             {filteredMembers.map((member) => (
//               <tr
//                 key={member.id}
//                 className="hover:bg-gray-50 cursor-pointer"
//                 onClick={() => handleRowClick(member.id)}
//               >
//                 <td className="py-2 px-4 border-b">
//                   {member.profilePicUrl ? (
//                     <div className="relative h-12 w-12 rounded-full overflow-hidden">
//                       <Image
//                         src={member.profilePicUrl || "/placeholder.svg"}
//                         alt={`${member.firstName}'s profile`}
//                         fill
//                         className="object-cover"
//                       />
//                     </div>
//                   ) : (
//                     <div className="h-12 w-12 rounded-full bg-gray-200 flex items-center justify-center">
//                       <span className="text-gray-500 text-lg">
//                         {member.firstName.charAt(0)}
//                         {member.lastName.charAt(0)}
//                       </span>
//                     </div>
//                   )}
//                 </td>
//                 <td className="py-2 px-4 border-b">
//                   {member.firstName} {member.lastName}
//                 </td>
//                 <td className="py-2 px-4 border-b">{member.email}</td>
//                 <td className="py-2 px-4 border-b">{member.pronouns || "—"}</td>
//                 <td className="py-2 px-4 border-b">
//                   <span
//                     className={`inline-block px-2 py-1 rounded-full text-xs ${
//                       member.isVolunteer
//                         ? "bg-blue-100 text-blue-800"
//                         : "bg-gray-100 text-gray-800"
//                     }`}
//                   >
//                     {member.isVolunteer ? "Yes" : "No"}
//                   </span>
//                 </td>
//                 <td className="py-2 px-4 border-b">
//                   {member.sponsors.length > 0 ? (
//                     <div className="flex flex-col gap-1">
//                       {member.sponsors.map((sponsor) => (
//                         <span key={sponsor.id} className="text-blue-600">
//                           {sponsor.name}
//                         </span>
//                       ))}
//                     </div>
//                   ) : (
//                     "—"
//                   )}
//                 </td>
//               </tr>
//             ))}
//             {filteredMembers.length === 0 && (
//               <tr>
//                 <td colSpan="6" className="py-4 text-center text-gray-500">
//                   No members found matching your criteria
//                 </td>
//               </tr>
//             )}
//           </tbody>
//         </table>
//       </div>
//       <div className="mt-4 text-sm text-gray-500">
//         Showing {filteredMembers.length} of {members.length} members
//       </div>
//     </div>
//   );
// }
