import {
  getPhotoYears,
  getMembersForTagging,
  getCurrentYear,
} from "@/app/_actions";
import PhotoGallery from "@/components/PhotoGallery";

export default async function PhotoPage() {
  // Fetch all data on the server
  const years = await getPhotoYears();
  const currentYear = await getCurrentYear();

  return (
    <div className="container mx-auto px-4 py-6">
      <PhotoGallery years={years} currentYear={currentYear} />
    </div>
  );
}
