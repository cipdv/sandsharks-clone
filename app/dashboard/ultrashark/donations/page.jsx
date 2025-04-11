import { getAllDonations } from "@/app/_actions";
import { getSession } from "@/app/lib/auth"; // Adjust based on your session management

export default async function AdminDonationsPage() {
  const session = await getSession();
  const user = session?.resultObj;

  // Check if user is an admin
  if (!user || user.memberType !== "ultrashark") {
    return (
      <div className="container mx-auto py-6 px-4">
        <h1 className="text-2xl font-bold mb-6">Donations Management</h1>
        <p>You don't have permission to view this page.</p>
      </div>
    );
  }

  const donations = await getAllDonations();

  // Calculate total donations amount and count
  const totalDonations = donations.reduce(
    (sum, donation) => sum + Number(donation.amount),
    0
  );
  const donationCount = donations.length;

  return (
    <div className="container mx-auto py-6 px-4">
      <h1 className="text-2xl font-bold mb-6">All Donations</h1>

      {donations.length === 0 ? (
        <p className="text-gray-600">No donations have been made yet.</p>
      ) : (
        <>
          {/* Donation Summary Section */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
            <div className="bg-white border border-blue-200 rounded-lg p-4 shadow-sm">
              <h2 className="text-lg font-semibold text-gray-700">
                Total Donations
              </h2>
              <p className="text-3xl font-bold text-blue-600">
                ${totalDonations.toFixed(2)}
              </p>
            </div>
            <div className="bg-white border border-blue-200 rounded-lg p-4 shadow-sm">
              <h2 className="text-lg font-semibold text-gray-700">
                Number of Donations
              </h2>
              <p className="text-3xl font-bold text-blue-600">
                {donationCount}
              </p>
            </div>
          </div>

          <div className="bg-blue-100 rounded-md p-4 overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-300">
              <thead>
                <tr>
                  <th className="px-3 py-3.5 text-left text-sm font-semibold text-gray-900">
                    Date
                  </th>
                  <th className="px-3 py-3.5 text-left text-sm font-semibold text-gray-900">
                    Member
                  </th>
                  <th className="px-3 py-3.5 text-left text-sm font-semibold text-gray-900">
                    Amount
                  </th>
                  <th className="px-3 py-3.5 text-left text-sm font-semibold text-gray-900">
                    Status
                  </th>
                  <th className="px-3 py-3.5 text-left text-sm font-semibold text-gray-900">
                    Notes
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {donations.map((donation) => (
                  <tr key={donation.id}>
                    <td className="whitespace-nowrap px-3 py-4 text-sm text-gray-900">
                      {new Date(donation.created_at).toLocaleDateString()}
                    </td>
                    <td className="whitespace-nowrap px-3 py-4 text-sm text-gray-900">
                      {donation.first_name} {donation.last_name}
                    </td>
                    <td className="whitespace-nowrap px-3 py-4 text-sm text-gray-900">
                      ${Number.parseFloat(donation.amount).toFixed(2)}
                    </td>
                    <td className="whitespace-nowrap px-3 py-4 text-sm text-gray-900">
                      <span
                        className={`px-2 py-1 rounded-full text-xs ${
                          donation.status === "completed"
                            ? "bg-green-100 text-green-800"
                            : "bg-yellow-100 text-yellow-800"
                        }`}
                      >
                        {donation.status}
                      </span>
                    </td>
                    <td className="px-3 py-4 text-sm text-gray-900">
                      {donation.notes || "-"}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </>
      )}
    </div>
  );
}

// import { getAllDonations } from "@/app/_actions";
// import { getSession } from "@/app/lib/auth"; // Adjust based on your session management

// export default async function AdminDonationsPage() {
//   const session = await getSession();
//   const user = session?.resultObj;

//   // Check if user is an admin
//   if (!user || user.memberType !== "ultrashark") {
//     return (
//       <div className="container mx-auto py-6 px-4">
//         <h1 className="text-2xl font-bold mb-6">Donations Management</h1>
//         <p>You don't have permission to view this page.</p>
//       </div>
//     );
//   }

//   const donations = await getAllDonations();

//   return (
//     <div className="container mx-auto py-6 px-4">
//       <h1 className="text-2xl font-bold mb-6">All Donations</h1>

//       {donations.length === 0 ? (
//         <p className="text-gray-600">No donations have been made yet.</p>
//       ) : (
//         <div className="bg-blue-100 rounded-md p-4 overflow-x-auto">
//           <table className="min-w-full divide-y divide-gray-300">
//             <thead>
//               <tr>
//                 <th className="px-3 py-3.5 text-left text-sm font-semibold text-gray-900">
//                   Date
//                 </th>
//                 <th className="px-3 py-3.5 text-left text-sm font-semibold text-gray-900">
//                   Member
//                 </th>
//                 <th className="px-3 py-3.5 text-left text-sm font-semibold text-gray-900">
//                   Amount
//                 </th>
//                 <th className="px-3 py-3.5 text-left text-sm font-semibold text-gray-900">
//                   Status
//                 </th>
//                 <th className="px-3 py-3.5 text-left text-sm font-semibold text-gray-900">
//                   Notes
//                 </th>
//               </tr>
//             </thead>
//             <tbody className="divide-y divide-gray-200">
//               {donations.map((donation) => (
//                 <tr key={donation.id}>
//                   <td className="whitespace-nowrap px-3 py-4 text-sm text-gray-900">
//                     {new Date(donation.created_at).toLocaleDateString()}
//                   </td>
//                   <td className="whitespace-nowrap px-3 py-4 text-sm text-gray-900">
//                     {donation.first_name} {donation.last_name}
//                   </td>
//                   <td className="whitespace-nowrap px-3 py-4 text-sm text-gray-900">
//                     ${Number.parseFloat(donation.amount).toFixed(2)}
//                   </td>
//                   <td className="whitespace-nowrap px-3 py-4 text-sm text-gray-900">
//                     <span
//                       className={`px-2 py-1 rounded-full text-xs ${
//                         donation.status === "completed"
//                           ? "bg-green-100 text-green-800"
//                           : "bg-yellow-100 text-yellow-800"
//                       }`}
//                     >
//                       {donation.status}
//                     </span>
//                   </td>
//                   <td className="px-3 py-4 text-sm text-gray-900">
//                     {donation.notes || "-"}
//                   </td>
//                 </tr>
//               ))}
//             </tbody>
//           </table>
//         </div>
//       )}
//     </div>
//   );
// }
