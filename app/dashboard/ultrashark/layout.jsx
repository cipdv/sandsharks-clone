import { getSession } from "@/app/lib/auth";
import { getDashboardPathForMemberType } from "@/app/lib/dashboard-path";
import { redirect } from "next/navigation";

export default async function UltrasharkDashboardLayout({ children }) {
  const session = await getSession();
  const memberType = session?.resultObj?.memberType;
  const dashboardPath = getDashboardPathForMemberType(memberType);

  if (!session?.resultObj) {
    redirect("/signin?redirectTo=/dashboard/ultrashark");
  }

  if (dashboardPath !== "/dashboard/ultrashark") {
    redirect(dashboardPath);
  }

  return children;
}
