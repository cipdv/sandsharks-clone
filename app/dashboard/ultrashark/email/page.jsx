import {
  getAllMembers,
  getEmailBlasts,
  getPendingLocalDevelopmentEmailJobs,
  getPlayDays,
} from "@/app/_actions";
import DashboardSection from "@/components/DashboardSection";
import EmailBlast from "@/components/EmailBlast";
import LocalEmailSend from "@/components/LocalEmailSend";
import UltrasharkPageShell from "@/components/UltrasharkPageShell";

export default async function UltrasharkEmailPage() {
  const [emailBlasts, playDays] = await Promise.all([
    getEmailBlasts(),
    getPlayDays(),
  ]);
  const isDevelopment = process.env.NODE_ENV === "development";
  const [members, pendingJobs] = isDevelopment
    ? await Promise.all([
        getAllMembers(),
        getPendingLocalDevelopmentEmailJobs(),
      ])
    : [[], []];
  const activeMembers = Array.isArray(members)
    ? members.filter(
        (member) =>
          member.memberType !== "pending" &&
          typeof member.email === "string" &&
          member.email.trim(),
      )
    : [];

  return (
    <UltrasharkPageShell title="Emails">
      <EmailBlast previousBlasts={emailBlasts} playDays={playDays} />

      <div className="mt-8">
        <DashboardSection
          title="Send email using local server"
          defaultOpen={false}
        >
          {!isDevelopment ? (
            <div className="rounded-xl border border-amber-200 bg-amber-50 p-4 text-amber-900">
              This page is only available when the app is running in development
              mode.
            </div>
          ) : Array.isArray(members) ? (
            <LocalEmailSend
              members={activeMembers}
              pendingJobs={pendingJobs}
            />
          ) : (
            <div className="rounded-xl border border-rose-200 bg-rose-50 p-4 text-rose-900">
              {members?.error || members?.message || "Failed to load members."}
            </div>
          )}
        </DashboardSection>
      </div>
    </UltrasharkPageShell>
  );
}
