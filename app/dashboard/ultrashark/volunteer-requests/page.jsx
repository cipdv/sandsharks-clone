import { getVolunteerRequests } from "@/app/_actions";
import VolunteerRequestsAdmin from "@/components/VolunteerRequestsAdmin";
import UltrasharkPageShell from "@/components/UltrasharkPageShell";

export default async function VolunteerRequestsPage() {
  const result = await getVolunteerRequests();

  return (
    <UltrasharkPageShell title="Volunteer Requests">
      {result.success ? (
        <VolunteerRequestsAdmin requests={result.requests} />
      ) : (
        <div className="bg-red-100 p-4 rounded-md text-red-800">
          {result.message || "Failed to load volunteer requests"}
        </div>
      )}
    </UltrasharkPageShell>
  );
}
