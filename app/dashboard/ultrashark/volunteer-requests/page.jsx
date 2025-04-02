import { getVolunteerRequests } from "@/app/_actions";
import VolunteerRequestsAdmin from "@/components/VolunteerRequestsAdmin";

export default async function VolunteerRequestsPage() {
  const result = await getVolunteerRequests();

  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="text-2xl font-bold mb-6">Volunteer Requests</h1>

      {result.success ? (
        <VolunteerRequestsAdmin requests={result.requests} />
      ) : (
        <div className="bg-red-100 p-4 rounded-md text-red-800">
          {result.message || "Failed to load volunteer requests"}
        </div>
      )}
    </div>
  );
}
