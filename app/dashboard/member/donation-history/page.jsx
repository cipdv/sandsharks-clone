import { getDonationsByMember } from "@/app/_actions";
import { getSession } from "@/app/lib/auth"; // Adjust based on your session management

export default async function DonationHistoryPage() {
  const session = await getSession();
  const user = session?.resultObj;

  if (!user) {
    return (
      <div className="container mx-auto py-6 px-4">
        <h1 className="text-2xl font-bold mb-6">Donation History</h1>
        <p>Please log in to view your donation history.</p>
      </div>
    );
  }

  const donations = await getDonationsByMember(user.id || user._id);

  return (
    <div className="container mx-auto py-6 px-4">
      <h1 className="text-2xl font-bold mb-6">Your Donation History</h1>

      {donations.length === 0 ? (
        <p className="text-gray-600">You haven't made any donations yet.</p>
      ) : (
        <div className="bg-blue-100 rounded-md p-4">
          <table className="min-w-full divide-y divide-gray-300">
            <thead>
              <tr>
                <th className="px-3 py-3.5 text-left text-sm font-semibold text-gray-900">
                  Date
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
      )}
    </div>
  );
}
