import { getSession } from "@/app/lib/auth";
import { redirect } from "next/navigation";

export default async function MemberDashboardLayout({ children }) {
  const session = await getSession();

  if (!session?.resultObj) {
    redirect("/signin?redirectTo=/dashboard/member");
  }

  return children;
}
