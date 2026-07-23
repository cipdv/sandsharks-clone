import {
  getMembers,
  getUltrasharkEvents,
} from "@/app/_actions";
import { getSession } from "@/app/lib/auth";
import UltrasharkEventsManagement from "@/components/UltrasharkEventsManagement";
import UltrasharkPageShell from "@/components/UltrasharkPageShell";

export default async function UltrasharkEventsPage() {
  const session = await getSession();
  const user = session?.resultObj;

  if (!user || user.memberType !== "ultrashark") {
    return (
      <UltrasharkPageShell title="Events">
        <p>You do not have permission to view this page.</p>
      </UltrasharkPageShell>
    );
  }

  const [members, eventsResult] = await Promise.all([
    getMembers(),
    getUltrasharkEvents(),
  ]);

  return (
    <UltrasharkPageShell title="Events">
      {eventsResult.success ? (
        <UltrasharkEventsManagement
          events={eventsResult.events}
          members={members}
        />
      ) : (
        <div className="rounded-md bg-red-100 p-4 text-red-800">
          {eventsResult.message || "Failed to load events"}
        </div>
      )}
    </UltrasharkPageShell>
  );
}
