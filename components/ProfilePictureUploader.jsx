"use client";

import { useState } from "react";
import { uploadProfilePicture } from "@/app/_actions";
import ImageUploader from "./ImageUploader";

export default function ProfilePictureUploader({
  currentProfilePic = null,
  onSuccess,
}) {
  const [file, setFile] = useState(null);
  const [isUploading, setIsUploading] = useState(false);
  const [message, setMessage] = useState(null);

  const handleFileChange = (newFile) => {
    setFile(newFile);
    setMessage(null);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!file) {
      setMessage({ type: "error", text: "Please select an image to upload" });
      return;
    }

    setIsUploading(true);
    setMessage(null);

    try {
      const formData = new FormData();
      formData.append("profilePicture", file);

      const result = await uploadProfilePicture(formData);

      if (result.success) {
        setMessage({ type: "success", text: result.message });
        setFile(null);

        if (onSuccess) {
          onSuccess(result.url);
        }
      } else {
        setMessage({ type: "error", text: result.message });
      }
    } catch (error) {
      console.error("Error uploading profile picture:", error);
      setMessage({ type: "error", text: "An unexpected error occurred" });
    } finally {
      setIsUploading(false);
    }
  };

  return (
    <div className="bg-white p-6 rounded-lg shadow-md">
      <h2 className="text-xl font-semibold mb-4">Update Profile Picture</h2>

      {message && (
        <div
          className={`mb-4 p-3 rounded-md ${
            message.type === "success"
              ? "bg-green-100 text-green-800"
              : "bg-red-100 text-red-800"
          }`}
        >
          {message.text}
        </div>
      )}

      <form onSubmit={handleSubmit}>
        <ImageUploader
          onFileChange={handleFileChange}
          initialImage={currentProfilePic}
          label="Profile Picture"
          maxSizeMB={5}
          aspectRatio="1:1"
          className="mb-4"
        />

        <button
          type="submit"
          disabled={isUploading || !file}
          className="w-full bg-blue-600 text-white py-2 px-4 rounded-md hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed"
        >
          {isUploading ? "Uploading..." : "Upload Profile Picture"}
        </button>

        <p className="mt-2 text-sm text-gray-500">
          Note: Your profile picture will be reviewed by an admin before it
          becomes visible to others.
        </p>
      </form>
    </div>
  );
}
