"use client";

import { useState } from "react";
import { getPhotosByYear, getPhotoTags, deletePhoto } from "@/app/_actions";
import TaggingModal from "./TaggingModal";

export default function PhotoGalleryWithTags({ years }) {
  const [selectedYear, setSelectedYear] = useState("");
  const [photos, setPhotos] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [lightboxPhoto, setLightboxPhoto] = useState(null);
  const [lightboxTags, setLightboxTags] = useState([]);
  const [taggingPhoto, setTaggingPhoto] = useState(null);
  const [isDeletingPhoto, setIsDeletingPhoto] = useState(false);
  const [deleteMessage, setDeleteMessage] = useState(null);

  const handleYearChange = async (year) => {
    setSelectedYear(year);
    if (!year) {
      setPhotos([]);
      return;
    }

    setIsLoading(true);
    try {
      const photosData = await getPhotosByYear(Number.parseInt(year));

      // Fetch tags for each photo
      const photosWithTags = await Promise.all(
        (photosData || []).map(async (photo) => {
          try {
            const tags = await getPhotoTags(photo.id);
            return { ...photo, tags: tags || [] };
          } catch (error) {
            console.error(`Error fetching tags for photo ${photo.id}:`, error);
            return { ...photo, tags: [] };
          }
        })
      );

      setPhotos(photosWithTags);
    } catch (error) {
      console.error("Error fetching photos:", error);
      setPhotos([]);
    } finally {
      setIsLoading(false);
    }
  };

  const openLightbox = async (photo) => {
    setLightboxPhoto(photo);
    setLightboxTags(photo.tags || []);
    setDeleteMessage(null); // Clear any previous delete messages
  };

  const openTaggingModal = (photo, e) => {
    e.stopPropagation(); // Prevent lightbox from opening
    setTaggingPhoto(photo);
  };

  const handleDeletePhoto = async () => {
    if (!lightboxPhoto) return;

    const confirmDelete = window.confirm(
      `Are you sure you want to delete this photo? This action cannot be undone.`
    );

    if (!confirmDelete) return;

    setIsDeletingPhoto(true);
    setDeleteMessage(null);

    try {
      const result = await deletePhoto(lightboxPhoto.id);

      if (result.success) {
        // Remove the photo from the photos array
        setPhotos((prevPhotos) =>
          prevPhotos.filter((photo) => photo.id !== lightboxPhoto.id)
        );

        // Close the lightbox
        setLightboxPhoto(null);
        setLightboxTags([]);

        setDeleteMessage({
          success: true,
          message: "Photo deleted successfully",
        });
      } else {
        setDeleteMessage({
          success: false,
          message: result.message || "Failed to delete photo",
        });
      }
    } catch (error) {
      console.error("Error deleting photo:", error);
      setDeleteMessage({ success: false, message: "Failed to delete photo" });
    } finally {
      setIsDeletingPhoto(false);
    }
  };

  const refreshPhotoTags = async () => {
    if (taggingPhoto) {
      try {
        const updatedTags = await getPhotoTags(taggingPhoto.id);
        const updatedPhoto = { ...taggingPhoto, tags: updatedTags || [] };

        // Update the photo in the photos array
        setPhotos((prevPhotos) =>
          prevPhotos.map((photo) =>
            photo.id === taggingPhoto.id ? updatedPhoto : photo
          )
        );

        // Update tagging modal photo
        setTaggingPhoto(updatedPhoto);

        // Update lightbox if it's the same photo
        if (lightboxPhoto && lightboxPhoto.id === taggingPhoto.id) {
          setLightboxPhoto(updatedPhoto);
          setLightboxTags(updatedTags || []);
        }
      } catch (error) {
        console.error("Error refreshing photo tags:", error);
      }
    }
  };

  const formatTaggedPeople = (tags) => {
    if (!tags || tags.length === 0) return "No one tagged";

    const names = tags
      .map((tag) => {
        if (tag.member_id && tag.first_name && tag.last_name) {
          return `${tag.first_name} ${tag.last_name}`;
        } else if (tag.custom_name) {
          return tag.custom_name;
        }
        return null;
      })
      .filter(Boolean);

    if (names.length === 0) return "No one tagged";
    if (names.length === 1) return names[0];
    if (names.length === 2) return `${names[0]} and ${names[1]}`;
    return `${names.slice(0, -1).join(", ")}, and ${names[names.length - 1]}`;
  };

  return (
    <div className="w-3/4 mx-auto mb-12">
      <h2 className="text-2xl font-bold text-sandsharks-blue mb-4">
        Photo Gallery with Tags
      </h2>

      {/* Delete message (outside lightbox) */}
      {deleteMessage?.message && (
        <div
          className={`mb-4 p-3 rounded-md text-sm ${
            deleteMessage.success
              ? "bg-green-50 text-green-800"
              : "bg-red-50 text-red-800"
          }`}
        >
          {deleteMessage.message}
        </div>
      )}

      {/* Year selector */}
      <div className="mb-6">
        <label
          htmlFor="year-select-tags"
          className="block text-sm font-medium text-gray-700 mb-2"
        >
          Select Year:
        </label>
        <select
          id="year-select-tags"
          value={selectedYear}
          onChange={(e) => handleYearChange(e.target.value)}
          className="px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-sandsharks-blue focus:border-sandsharks-blue"
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
          <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-sandsharks-blue"></div>
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
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
          {photos.map((photo) => (
            <div
              key={photo.id}
              className="bg-white rounded-lg shadow-md overflow-hidden hover:shadow-xl transition-shadow duration-300 cursor-pointer"
              onClick={() => openLightbox(photo)}
            >
              <div className="aspect-square relative group">
                <img
                  src={photo.url || "/placeholder.svg"}
                  alt={photo.filename || "Photo"}
                  className="w-full h-full object-cover"
                  loading="lazy"
                />
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

                {/* Tag button */}
                <button
                  onClick={(e) => openTaggingModal(photo, e)}
                  className="absolute top-2 right-2 bg-sandsharks-blue text-white p-2 rounded-full opacity-0 group-hover:opacity-100 transition-opacity duration-300 hover:bg-blue-700"
                  title="Tag people"
                >
                  <svg
                    className="w-4 h-4"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M7 7h.01M7 3h5c.512 0 1.024.195 1.414.586l7 7a2 2 0 010 2.828l-7 7a2 2 0 01-2.828 0l-7-7A1.994 1.994 0 013 12V7a4 4 0 014-4z"
                    />
                  </svg>
                </button>
              </div>

              {/* Tagged people info */}
              <div className="p-4">
                <div className="text-sm text-gray-600 mb-2">
                  <span className="font-medium">Tagged:</span>{" "}
                  {formatTaggedPeople(photo.tags)}
                </div>
                <div className="text-xs text-gray-500">
                  {photo.tags && photo.tags.length > 0
                    ? `${photo.tags.length} person${
                        photo.tags.length !== 1 ? "s" : ""
                      }`
                    : "No tags"}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Lightbox with tags and delete functionality */}
      {lightboxPhoto && (
        <div
          className="fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center z-50 p-4"
          onClick={() => setLightboxPhoto(null)}
        >
          <div className="max-w-6xl max-h-full flex flex-col md:flex-row bg-white rounded-lg overflow-hidden">
            {/* Image */}
            <div className="flex-1 flex items-center justify-center bg-black">
              <img
                src={lightboxPhoto.url || "/placeholder.svg"}
                alt={lightboxPhoto.filename || "Photo"}
                className="max-w-full max-h-full object-contain"
                onClick={(e) => e.stopPropagation()}
              />
            </div>

            {/* Sidebar with tags and actions */}
            <div className="w-full md:w-80 bg-white p-6 overflow-y-auto">
              <div className="flex justify-between items-start mb-4">
                <h3 className="text-lg font-semibold text-gray-900">
                  Photo Details
                </h3>
                <button
                  onClick={() => setLightboxPhoto(null)}
                  className="text-gray-400 hover:text-gray-600 text-2xl"
                >
                  ×
                </button>
              </div>

              {/* Delete message (inside lightbox) */}
              {deleteMessage?.message && (
                <div
                  className={`mb-4 p-3 rounded-md text-sm ${
                    deleteMessage.success
                      ? "bg-green-50 text-green-800"
                      : "bg-red-50 text-red-800"
                  }`}
                >
                  {deleteMessage.message}
                </div>
              )}

              <div className="space-y-4">
                <div>
                  <h4 className="text-sm font-medium text-gray-700 mb-2">
                    Year:
                  </h4>
                  <p className="text-sm text-gray-600">{lightboxPhoto.year}</p>
                </div>

                <div>
                  <div className="flex justify-between items-center mb-2">
                    <h4 className="text-sm font-medium text-gray-700">
                      Tagged People:
                    </h4>
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        setTaggingPhoto(lightboxPhoto);
                      }}
                      className="text-sandsharks-blue hover:text-blue-800 text-sm font-medium"
                    >
                      Edit Tags
                    </button>
                  </div>
                  {lightboxTags && lightboxTags.length > 0 ? (
                    <div className="space-y-2">
                      {lightboxTags.map((tag, index) => (
                        <div
                          key={index}
                          className="flex items-center space-x-2"
                        >
                          {tag.member_id && tag.profile_pic_url && (
                            <img
                              src={tag.profile_pic_url || "/placeholder.svg"}
                              alt={`${tag.first_name || ""} ${
                                tag.last_name || ""
                              }`}
                              className="w-6 h-6 rounded-full object-cover"
                            />
                          )}
                          <span className="text-sm text-gray-600">
                            {tag.member_id && tag.first_name && tag.last_name
                              ? `${tag.first_name} ${tag.last_name}`
                              : tag.custom_name || "Unknown"}
                          </span>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <p className="text-sm text-gray-500 italic">
                      No one tagged in this photo
                    </p>
                  )}
                </div>

                {/* Action buttons */}
                <div className="pt-4 border-t space-y-3">
                  <a
                    href={lightboxPhoto.url}
                    download={lightboxPhoto.filename}
                    className="inline-flex items-center w-full justify-center px-4 py-2 bg-sandsharks-blue text-white text-sm font-medium rounded-md hover:bg-blue-700 transition-colors"
                    onClick={(e) => e.stopPropagation()}
                  >
                    <svg
                      className="w-4 h-4 mr-2"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
                      />
                    </svg>
                    Download Photo
                  </a>

                  <button
                    onClick={handleDeletePhoto}
                    disabled={isDeletingPhoto}
                    className="inline-flex items-center w-full justify-center px-4 py-2 bg-red-600 text-white text-sm font-medium rounded-md hover:bg-red-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {isDeletingPhoto ? (
                      <>
                        <div className="animate-spin rounded-full h-4 w-4 border-t-2 border-b-2 border-white mr-2"></div>
                        Deleting...
                      </>
                    ) : (
                      <>
                        <svg
                          className="w-4 h-4 mr-2"
                          fill="none"
                          stroke="currentColor"
                          viewBox="0 0 24 24"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2}
                            d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"
                          />
                        </svg>
                        Delete Photo
                      </>
                    )}
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Tagging Modal */}
      <TaggingModal
        photo={taggingPhoto}
        isOpen={!!taggingPhoto}
        onClose={() => setTaggingPhoto(null)}
        onTagsUpdated={refreshPhotoTags}
      />
    </div>
  );
}
