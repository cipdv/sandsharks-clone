import { getSession } from "@/app/lib/auth";
import { getDashboardPathForMemberType } from "@/app/lib/dashboard-path";
import { redirect } from "next/navigation";

export default async function DashboardRedirectPage() {
  const session = await getSession();

  if (!session?.resultObj) {
    redirect("/signin?redirectTo=/dashboard");
  }

  redirect(getDashboardPathForMemberType(session.resultObj.memberType));
}
