import { getSponsors, getMembers, getSponsorRequests } from "@/app/_actions.js";
import SponsorsManagement from "@/components/SponsorsManagement";
import UltrasharkPageShell from "@/components/UltrasharkPageShell";

export default async function SponsorsPage() {
  const sponsors = await getSponsors();
  const members = await getMembers();
  const sponsorRequestsResult = await getSponsorRequests();

  return (
    <UltrasharkPageShell title="Sponsor Management">
      <SponsorsManagement
        sponsors={sponsors}
        members={members}
        requests={
          sponsorRequestsResult.success ? sponsorRequestsResult.requests : []
        }
      />
    </UltrasharkPageShell>
  );
}
