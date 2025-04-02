import { getMemberById } from "@/app/_actions";
import MemberProfile from "@/components/MemberProfile";
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
    <div className="container mx-auto px-4 py-8">
      <MemberProfile member={member} />
    </div>
  );
}
