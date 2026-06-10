import { sql } from "@vercel/postgres";
import { getSession } from "@/app/lib/auth";

export default async function UltrasharkEventsPage() {
  const session = await getSession();
  const user = session?.resultObj;

  if (!user || user.memberType !== "ultrashark") {
    return (
      <div className="container mx-auto py-6 px-4">
        <h1 className="text-2xl font-bold mb-6">Guest Sign Up</h1>
        <p>You don't have permission to view this page.</p>
      </div>
    );
  }

  const result = await sql`
    SELECT first_name, last_name, email, photo_release, created_at
    FROM guests
    WHERE created_at >= '2026-01-01'
      AND created_at < '2027-01-01'
    ORDER BY last_name ASC, first_name ASC, email ASC
  `;

  const guests = result.rows;
  const photoReleaseGuests = guests.filter((guest) => guest.photo_release);
  const noPhotoReleaseGuests = guests.filter((guest) => !guest.photo_release);

  return (
    <div className="container mx-auto py-6 px-4">
      <h1 className="text-2xl font-bold mb-2">Guest Sign Up</h1>
      <p className="text-gray-600 mb-6">Guests registered in 2026</p>

      <GuestList
        title="Photo release: false"
        guests={noPhotoReleaseGuests}
        emptyMessage="No guests without photo release."
      />

      <GuestList
        title="Photo release: true"
        guests={photoReleaseGuests}
        emptyMessage="No guests with photo release."
      />
    </div>
  );
}

function GuestList({ title, guests, emptyMessage }) {
  return (
    <section className="mb-8">
      <h2 className="text-xl font-semibold mb-3">
        {title} ({guests.length})
      </h2>

      {guests.length === 0 ? (
        <p className="text-gray-600">{emptyMessage}</p>
      ) : (
        <div className="overflow-x-auto rounded-md border bg-white">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-4 py-3 text-left text-sm font-semibold text-gray-900">
                  Name
                </th>
                <th className="px-4 py-3 text-left text-sm font-semibold text-gray-900">
                  Email
                </th>
                <th className="px-4 py-3 text-left text-sm font-semibold text-gray-900">
                  Photo Release
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {guests.map((guest) => (
                <tr key={`${guest.email}-${guest.created_at}`}>
                  <td className="px-4 py-3 text-sm text-gray-900">
                    {guest.first_name} {guest.last_name}
                  </td>
                  <td className="px-4 py-3 text-sm text-gray-900">
                    {guest.email}
                  </td>
                  <td className="px-4 py-3 text-sm text-gray-900">
                    {guest.photo_release ? "true" : "false"}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </section>
  );
}
