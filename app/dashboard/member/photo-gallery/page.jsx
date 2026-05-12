import { getPhotoYears, getPhotosByYear } from "@/app/_actions";
import PhotoGallery from "@/components/PhotoGallery";

export default async function PhotoPage() {
  const currentYear = new Date().getFullYear();
  const [years, initialPhotos] = await Promise.all([
    getPhotoYears(),
    getPhotosByYear(currentYear),
  ]);

  return (
    <div className="container mx-auto px-4 py-6">
      <PhotoGallery
        years={years}
        currentYear={currentYear}
        initialPhotos={initialPhotos}
      />
    </div>
  );
}
