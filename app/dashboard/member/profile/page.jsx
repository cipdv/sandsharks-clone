import { getCurrentUser } from "@/app/_actions";
import MemberProfileUpdate from "@/components/MemberProfileUpdate";
import Link from "next/link";

export default async function ProfilePage() {
  const user = await getCurrentUser();

  return (
    <div className="container mx-auto py-8">
      <MemberProfileUpdate user={user} />
    </div>
  );
}
