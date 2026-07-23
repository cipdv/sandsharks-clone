import { getMemberById } from "@/app/_actions";
import MemberProfile from "@/components/MemberProfile";
import UltrasharkPageShell from "@/components/UltrasharkPageShell";
import { notFound } from "next/navigation";

export default async function MemberPage({ params }) {
  // Await the params object first
  const resolvedParams = await params;
  const id = resolvedParams.id;

  // Now use the extracted id
  const member = await getMemberById(id);

  if (member.error) {
    notFound();
  }

  return (
    <UltrasharkPageShell showDashboardLink={false}>
      <MemberProfile member={member} />
    </UltrasharkPageShell>
  );
}
