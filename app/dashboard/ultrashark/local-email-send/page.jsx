import { getSession } from "@/app/lib/auth";
import {
  getAllMembers,
  getPendingLocalDevelopmentEmailJobs,
} from "@/app/_actions";
import { redirect } from "next/navigation";
import LocalEmailSend from "@/components/LocalEmailSend";
import UltrasharkPageShell from "@/components/UltrasharkPageShell";

export default async function LocalEmailSendPage() {
  const session = await getSession();
  const user = session?.resultObj;

  if (!user || user.memberType !== "ultrashark") {
    redirect("/dashboard");
  }

  if (process.env.NODE_ENV !== "development") {
    return (
      <UltrasharkPageShell showDashboardLink={false}>
        <div className="mx-auto max-w-2xl rounded-xl border border-amber-200 bg-amber-50 p-6 text-amber-900">
          <h1 className="text-2xl font-bold">Local Email Send</h1>
          <p className="mt-2">
            This page is only available when the app is running in development
            mode.
          </p>
        </div>
      </UltrasharkPageShell>
    );
  }

  const members = await getAllMembers();
  const pendingJobs = await getPendingLocalDevelopmentEmailJobs();

  if (!Array.isArray(members)) {
    return (
      <UltrasharkPageShell showDashboardLink={false}>
        <div className="mx-auto max-w-2xl rounded-xl border border-rose-200 bg-rose-50 p-6 text-rose-900">
          <h1 className="text-2xl font-bold">Local Email Send</h1>
          <p className="mt-2">
            {members?.error || members?.message || "Failed to load members."}
          </p>
        </div>
      </UltrasharkPageShell>
    );
  }

  const activeMembers = members.filter(
    (member) =>
      member.memberType !== "pending" &&
      typeof member.email === "string" &&
      member.email.trim(),
  );

  return (
    <UltrasharkPageShell
      title="Local Email Send"
      description="Development-only Gmail sender for local testing. This does not use Resend and does not affect the production email flows."
    >
      <LocalEmailSend members={activeMembers} pendingJobs={pendingJobs} />
    </UltrasharkPageShell>
  );
}
