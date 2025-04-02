import {
  getPlayDays,
  getSponsors,
  getMembers,
  getEmailBlasts,
  getVolunteerRequests,
  getSponsorRequests,
} from "@/app/_actions";
import SponsorsManagement from "@/components/SponsorsManagement";
import SponsorRequestsAdmin from "@/components/SponsorRequestsAdmin";
import UltraPostsEditable from "@/components/ultra-posts-editable";
import EmailBlast from "@/components/EmailBlast";
import VolunteerRequestsAdmin from "@/components/VolunteerRequestsAdmin";
import WeeklyNotesManagement from "@/components/WeeklyNotesManagement";

export default async function AdminDashboard() {
  const playDays = await getPlayDays();
  const sponsors = await getSponsors();
  const members = await getMembers();
  const emailBlasts = await getEmailBlasts();
  const volunteerRequestsResult = await getVolunteerRequests();
  const sponsorRequestsResult = await getSponsorRequests();

  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="text-3xl font-bold mb-8">Admin Dashboard</h1>

      <div className="grid grid-cols-1 gap-6">
        {/* Volunteer Requests Section */}
        <div className="bg-white rounded-lg shadow-md p-6">
          <h2 className="text-2xl font-bold mb-4">Volunteer Requests</h2>
          {volunteerRequestsResult.success ? (
            <VolunteerRequestsAdmin
              requests={volunteerRequestsResult.requests}
            />
          ) : (
            <div className="bg-red-100 p-4 rounded-md text-red-800">
              {volunteerRequestsResult.message ||
                "Failed to load volunteer requests"}
            </div>
          )}
        </div>

        {/* Weekly Notes Management Section */}
        <div className="bg-white rounded-lg shadow-md p-6">
          <h2 className="text-2xl font-bold mb-4">Weekly Email Notes</h2>
          <WeeklyNotesManagement />
        </div>

        <div className="bg-white rounded-lg shadow-md p-6">
          <h2 className="text-2xl font-bold mb-4">Play Days</h2>
          <UltraPostsEditable
            existingPlayDays={playDays}
            sponsors={sponsors}
            members={members}
          />
        </div>

        <div className="bg-white rounded-lg shadow-md p-6">
          <h2 className="text-2xl font-bold mb-4">Sponsors</h2>
          <SponsorsManagement sponsors={sponsors} members={members} />
        </div>

        <div className="bg-white rounded-lg shadow-md p-6">
          <EmailBlast previousBlasts={emailBlasts} />
        </div>
        {/* Sponsor Requests Section */}
        <div className="bg-white rounded-lg shadow-md p-6">
          <h2 className="text-2xl font-bold mb-4">Sponsorship Requests</h2>
          {sponsorRequestsResult.success ? (
            <SponsorRequestsAdmin requests={sponsorRequestsResult.requests} />
          ) : (
            <div className="bg-red-100 p-4 rounded-md text-red-800">
              {sponsorRequestsResult.message ||
                "Failed to load sponsorship requests"}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

// import {
//   getPlayDays,
//   getSponsors,
//   getMembers,
//   getEmailBlasts,
//   getVolunteerRequests,
//   getSponsorRequests,
// } from "@/app/_actions";
// import SponsorsManagement from "@/components/SponsorsManagement";
// import SponsorRequestsAdmin from "@/components/SponsorRequestsAdmin";
// import UltraPostsEditable from "@/components/ultra-posts-editable";
// import EmailBlast from "@/components/EmailBlast";
// import VolunteerRequestsAdmin from "@/components/VolunteerRequestsAdmin";

// export default async function AdminDashboard() {
//   const playDays = await getPlayDays();
//   const sponsors = await getSponsors();
//   const members = await getMembers();
//   const emailBlasts = await getEmailBlasts();
//   const volunteerRequestsResult = await getVolunteerRequests();
//   const sponsorRequestsResult = await getSponsorRequests();

//   return (
//     <div className="container mx-auto px-4 py-8">
//       <h1 className="text-3xl font-bold mb-8">Admin Dashboard</h1>

//       <div className="grid grid-cols-1 gap-6">
//         {/* Volunteer Requests Section */}
//         <div className="bg-white rounded-lg shadow-md p-6">
//           <h2 className="text-2xl font-bold mb-4">Volunteer Requests</h2>
//           {volunteerRequestsResult.success ? (
//             <VolunteerRequestsAdmin
//               requests={volunteerRequestsResult.requests}
//             />
//           ) : (
//             <div className="bg-red-100 p-4 rounded-md text-red-800">
//               {volunteerRequestsResult.message ||
//                 "Failed to load volunteer requests"}
//             </div>
//           )}
//         </div>

//         {/* Sponsor Requests Section - Added */}
//         <div className="bg-white rounded-lg shadow-md p-6">
//           <h2 className="text-2xl font-bold mb-4">Sponsorship Requests</h2>
//           {sponsorRequestsResult.success ? (
//             <SponsorRequestsAdmin requests={sponsorRequestsResult.requests} />
//           ) : (
//             <div className="bg-red-100 p-4 rounded-md text-red-800">
//               {sponsorRequestsResult.message ||
//                 "Failed to load sponsorship requests"}
//             </div>
//           )}
//         </div>

//         <div className="bg-white rounded-lg shadow-md p-6">
//           <h2 className="text-2xl font-bold mb-4">Play Days</h2>
//           <UltraPostsEditable
//             existingPlayDays={playDays}
//             sponsors={sponsors}
//             members={members}
//           />
//         </div>

//         <div className="bg-white rounded-lg shadow-md p-6">
//           <h2 className="text-2xl font-bold mb-4">Sponsors</h2>
//           <SponsorsManagement sponsors={sponsors} members={members} />
//         </div>

//         <div className="bg-white rounded-lg shadow-md p-6">
//           <EmailBlast previousBlasts={emailBlasts} />
//         </div>
//       </div>
//     </div>
//   );
// }
