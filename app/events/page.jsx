import { getPublicUpcomingEvents } from "@/app/_actions";
import { getSession } from "@/app/lib/auth";
import PublicEventsList from "@/components/PublicEventsList";

export default async function EventsPage() {
  const session = await getSession();
  const events = await getPublicUpcomingEvents(
    session?.resultObj?._id || session?.resultObj?.id || null,
  );

  return (
    <main className="container mx-auto px-4 py-8">
      <div className="mx-auto mb-8 max-w-3xl">
        <h1 className="bg-gradient-to-r from-blue-600 via-purple-600 to-pink-600 bg-clip-text text-5xl font-black tracking-tight text-transparent sm:text-6xl">
          Events
        </h1>
        <p className="mt-3 text-gray-700">
          Upcoming Sandsharks events and registration details.
        </p>
      </div>

      <PublicEventsList
        events={events}
        currentUser={session?.resultObj || null}
      />
    </main>
  );
}
