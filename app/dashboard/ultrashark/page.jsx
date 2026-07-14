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
import DashboardSection from "@/components/DashboardSection";
import Link from "next/link";

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
        <DashboardSection title="Surveys" defaultOpen={false}>
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <p className="text-gray-700">
              Edit the current member survey and choose whether it is visible.
            </p>
            <div className="flex flex-wrap gap-2">
              <Link
                href="/dashboard/ultrashark/surveys"
                className="inline-flex justify-center rounded-md bg-blue-600 px-4 py-2 font-medium text-white hover:bg-blue-700"
              >
                Manage Survey
              </Link>
              <Link
                href="/dashboard/ultrashark/surveys/results"
                className="inline-flex justify-center rounded-md border border-gray-300 px-4 py-2 font-medium hover:bg-gray-50"
              >
                View Results
              </Link>
            </div>
          </div>
        </DashboardSection>

        <DashboardSection title="Volunteer Requests" defaultOpen={false}>
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
        </DashboardSection>

        <DashboardSection title="Play Days" defaultOpen={false}>
          <UltraPostsEditable
            existingPlayDays={playDays}
            sponsors={sponsors}
            members={members}
          />
        </DashboardSection>

        <DashboardSection title="Sponsors" defaultOpen={false}>
          <SponsorsManagement sponsors={sponsors} members={members} />
        </DashboardSection>

        <DashboardSection title="Email Blast" defaultOpen={false}>
          <EmailBlast
            previousBlasts={emailBlasts}
            playDays={playDays}
            showHeading={false}
          />
        </DashboardSection>

        <DashboardSection title="Sponsorship Requests" defaultOpen={false}>
          {sponsorRequestsResult.success ? (
            <SponsorRequestsAdmin requests={sponsorRequestsResult.requests} />
          ) : (
            <div className="bg-red-100 p-4 rounded-md text-red-800">
              {sponsorRequestsResult.message ||
                "Failed to load sponsorship requests"}
            </div>
          )}
        </DashboardSection>
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
