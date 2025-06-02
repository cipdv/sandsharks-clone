"use client";

import { useState, useEffect } from "react";
import { getPhotosByYear } from "@/app/_actions";
import LoadingSpinner from "@/components/LoadingSpinner";

export default function PhotoGallery({ years, currentYear }) {
  const [selectedYear, setSelectedYear] = useState("");
  const [photos, setPhotos] = useState([]);
  const [isLoading, setIsLoading] = useState(true); // Start with loading true
  const [lightboxPhoto, setLightboxPhoto] = useState(null);
  const [hasLoadedDefault, setHasLoadedDefault] = useState(false);

  // Load photos for current year on component mount - only once
  useEffect(() => {
    if (!hasLoadedDefault && currentYear && years.includes(currentYear)) {
      setSelectedYear(currentYear.toString());
      loadPhotosForYear(currentYear.toString());
      setHasLoadedDefault(true);
    } else if (!hasLoadedDefault) {
      // If no current year, just stop loading
      setIsLoading(false);
      setHasLoadedDefault(true);
    }
  }, [currentYear, years, hasLoadedDefault]);

  const loadPhotosForYear = async (year) => {
    setIsLoading(true);

    if (!year) {
      setPhotos([]);
      setIsLoading(false);
      return;
    }

    try {
      const photosData = await getPhotosByYear(Number.parseInt(year));
      setPhotos(photosData || []);
    } catch (error) {
      console.error("Error fetching photos:", error);
      setPhotos([]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleYearChange = async (year) => {
    setSelectedYear(year);
    await loadPhotosForYear(year);
  };

  // Don't render anything until initial load is complete
  if (isLoading && !hasLoadedDefault) {
    return (
      <div className="w-3/4 mx-auto mb-12">
        <div className="flex justify-center items-center h-64">
          <LoadingSpinner />
        </div>
      </div>
    );
  }

  return (
    <div className="w-3/4 mx-auto mb-12">
      <h2 className="text-2xl font-bold text-sandsharks-blue mb-4">
        Photo Gallery
      </h2>

      {/* Year selector */}
      <div className="mb-6">
        <label
          htmlFor="year-select"
          className="block text-sm font-medium text-gray-700 mb-2"
        >
          Select Year:
        </label>
        <select
          id="year-select"
          value={selectedYear}
          onChange={(e) => handleYearChange(e.target.value)}
          className="px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-sandsharks-blue focus:border-sandsharks-blue"
          disabled={isLoading}
        >
          <option value="">Select a year</option>
          {years.map((year) => (
            <option key={year} value={year}>
              {year}
            </option>
          ))}
        </select>
      </div>

      {/* Photos */}
      {isLoading ? (
        <div className="flex justify-center items-center h-32">
          <LoadingSpinner />
        </div>
      ) : photos.length === 0 ? (
        <div className="bg-gray-50 rounded-lg p-8 text-center">
          <p className="text-gray-600">
            {selectedYear
              ? `No photos found for ${selectedYear}`
              : "Select a year to view photos"}
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
          {photos.map((photo) => (
            <div
              key={photo.id}
              className="relative group cursor-pointer rounded-lg overflow-hidden shadow-md hover:shadow-xl transition-shadow duration-300"
              onClick={() => setLightboxPhoto(photo)}
            >
              <div className="aspect-square">
                <img
                  src={photo.url || "/placeholder.svg?height=400&width=400"}
                  alt={photo.filename || "Photo"}
                  className="w-full h-full object-cover"
                  loading="lazy"
                />
              </div>
              <div className="absolute inset-0 bg-black bg-opacity-0 group-hover:bg-opacity-20 transition-opacity duration-300 flex items-center justify-center">
                <div className="opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                  <svg
                    className="w-10 h-10 text-white"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
                    />
                  </svg>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Lightbox */}
      {lightboxPhoto && (
        <div
          className="fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center z-50 p-4"
          onClick={() => setLightboxPhoto(null)}
        >
          <div className="relative max-w-4xl max-h-full">
            <img
              src={lightboxPhoto.url || "/placeholder.svg?height=800&width=800"}
              alt={lightboxPhoto.filename || "Photo"}
              className="max-w-full max-h-[90vh] object-contain"
              onClick={(e) => e.stopPropagation()}
            />
            <button
              onClick={() => setLightboxPhoto(null)}
              className="absolute top-4 right-4 text-white text-2xl hover:text-gray-300 bg-black bg-opacity-50 rounded-full w-10 h-10 flex items-center justify-center"
            >
              ×
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
