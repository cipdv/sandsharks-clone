export function getDashboardPathForMemberType(memberType) {
  const normalizedMemberType = String(memberType || "")
    .trim()
    .toLowerCase();

  if (normalizedMemberType === "ultrashark" || normalizedMemberType === "admin") {
    return "/dashboard/ultrashark";
  }

  return "/dashboard/member";
}

export function isDashboardPath(path) {
  return path === "/dashboard" || path?.startsWith("/dashboard/");
}
