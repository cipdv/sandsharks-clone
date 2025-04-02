import MembersSection from "@/components/MembersSection";
import { getAllMembers, getCurrentUser } from "@/app/_actions";
import { getSession } from "@/app/lib/auth";
import Link from "next/link";

const MembersPage = async () => {
  const members = await getAllMembers();
  const user = await getCurrentUser();

  return (
    <div>
      <MembersSection members={members} user={user} />
      <div className="mt-8 flex items-center justify-center">
        <Link href="/dashboard/member">
          <button className="btn">Return to dashboard</button>
        </Link>
      </div>
    </div>
  );
};

export default MembersPage;
