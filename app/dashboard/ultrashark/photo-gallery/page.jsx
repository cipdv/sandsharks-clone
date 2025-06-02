import {
  getPhotoYears,
  getMembersForTagging,
  getCurrentYear,
} from "@/app/_actions";
import PhotoUpload from "@/components/PhotoUpload";
import PhotoGalleryWithTags from "@/components/PhotoGalleryWithTags";

export default async function PhotoPage() {
  // Fetch all data on the server
  const years = await getPhotoYears();
  const currentYear = await getCurrentYear();
  const members = await getMembersForTagging();

  return (
    <div className="container mx-auto px-4 py-6">
      {/* Gallery Component */}
      <PhotoGalleryWithTags years={years} />

      {/* Upload Component */}
      <PhotoUpload years={years} currentYear={currentYear} members={members} />
    </div>
  );
}
