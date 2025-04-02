import VolunteerSection from "@/components/VolunteerSection";
import { getCurrentUser } from "@/app/_actions";

export const metadata = {
  title: "Volunteer with Sandsharks",
  description:
    "Learn about volunteering opportunities with Sandsharks beach volleyball community",
};

export default async function VolunteerPage() {
  const user = await getCurrentUser();

  return (
    <div className="container mx-auto px-4 py-8">
      <VolunteerSection user={user} />
    </div>
  );
}
