import { getSponsors, getMembers } from "@/app/_actions.js";
import SponsorsManagement from "@/components/SponsorsManagement";

export default async function SponsorsPage() {
  const sponsors = await getSponsors();
  const members = await getMembers();

  console.log("members", members);

  return (
    <div className="container mx-auto p-4">
      <h1 className="text-3xl font-bold mb-6">Sponsor Management</h1>
      <SponsorsManagement sponsors={sponsors} members={members} />
    </div>
  );
}
