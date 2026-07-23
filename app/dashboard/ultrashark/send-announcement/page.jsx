import { sql } from "@vercel/postgres";
import { getSession } from "@/app/lib/auth";
import { redirect } from "next/navigation";
import SendAnnouncementForm from "./send-announcement-form";
import UltrasharkPageShell from "@/components/UltrasharkPageShell";

export default async function SendAnnouncementPage() {
  const session = await getSession();
  const user = session?.resultObj;

  if (!user || user.memberType !== "ultrashark") {
    redirect("/dashboard");
  }

  // Get upcoming play days - using your actual table structure
  const playDaysResult = await sql`
    SELECT id, title, date, start_time, end_time, description, courts
    FROM play_days
    WHERE date >= CURRENT_DATE
    AND is_cancelled = false
    ORDER BY date ASC, start_time ASC
  `;

  const playDays = playDaysResult.rows;

  return (
    <UltrasharkPageShell title="Send Play Day Announcement">
      <div className="mx-auto max-w-2xl">
        {playDays.length === 0 ? (
          <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-6">
            <p className="text-yellow-800">
              No upcoming play days found. Create a play day first before
              sending announcements.
            </p>
          </div>
        ) : (
          <SendAnnouncementForm playDays={playDays} />
        )}
      </div>
    </UltrasharkPageShell>
  );
}
