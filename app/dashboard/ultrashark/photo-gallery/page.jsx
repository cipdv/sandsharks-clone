import {
  getPhotoYears,
  getMembersForTagging,
  getCurrentYear,
} from "@/app/_actions";
import PhotoUpload from "@/components/PhotoUpload";
import PhotoGalleryWithTags from "@/components/PhotoGalleryWithTags";
import UltrasharkPageShell from "@/components/UltrasharkPageShell";

export default async function PhotoPage() {
  // Fetch all data on the server
  const years = await getPhotoYears();
  const currentYear = await getCurrentYear();
  const members = await getMembersForTagging();

  return (
    <UltrasharkPageShell title="Photo Gallery">
      {/* Gallery Component */}
      <PhotoGalleryWithTags years={years} />

      {/* Upload Component */}
      <PhotoUpload years={years} currentYear={currentYear} members={members} />
    </UltrasharkPageShell>
  );
}
