import { getMembers, getPlayDays, getSponsors } from "@/app/_actions";
import UltraPostsEditable from "@/components/ultra-posts-editable";
import UltrasharkPageShell from "@/components/UltrasharkPageShell";

export default async function UltrasharkSchedulePage() {
  const playDays = await getPlayDays();
  const sponsors = await getSponsors();
  const members = await getMembers();

  return (
    <UltrasharkPageShell
      title="Schedule"
      description="Create, edit, cancel, and review play days."
    >
      <UltraPostsEditable
        existingPlayDays={playDays}
        sponsors={sponsors}
        members={members}
      />
    </UltrasharkPageShell>
  );
}
