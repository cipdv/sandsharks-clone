"use client";

import { useState, useEffect } from "react";
import Image from "next/image";

export default function ImageUploader({
  onFileChange,
  initialImage = null,
  className = "",
  maxSizeMB = 5,
  aspectRatio = "1:1",
  label = "Upload Image",
}) {
  const [previewUrl, setPreviewUrl] = useState(initialImage || "");
  const [error, setError] = useState("");
  const [isCompressing, setIsCompressing] = useState(false);

  // Clean up object URL when component unmounts or when previewUrl changes
  useEffect(() => {
    return () => {
      if (previewUrl && previewUrl.startsWith("blob:")) {
        URL.revokeObjectURL(previewUrl);
      }
    };
  }, [previewUrl]);

  // Update preview if initialImage changes
  useEffect(() => {
    if (initialImage) {
      setPreviewUrl(initialImage);
    }
  }, [initialImage]);

  // Function to compress image
  const compressImage = async (file) => {
    setIsCompressing(true);

    try {
      // Create a new image element
      const img = new Image();
      img.src = URL.createObjectURL(file);

      // Wait for the image to load
      await new Promise((resolve) => {
        img.onload = resolve;
      });

      // Create a canvas element
      const canvas = document.createElement("canvas");

      // Calculate dimensions while maintaining aspect ratio
      let width = img.width;
      let height = img.height;

      // Limit max dimensions to 1200px (good balance between quality and size)
      const maxDimension = 1200;
      if (width > maxDimension || height > maxDimension) {
        if (width > height) {
          height = Math.round((height * maxDimension) / width);
          width = maxDimension;
        } else {
          width = Math.round((width * maxDimension) / height);
          height = maxDimension;
        }
      }

      // Set canvas dimensions
      canvas.width = width;
      canvas.height = height;

      // Draw image on canvas
      const ctx = canvas.getContext("2d");
      ctx.drawImage(img, 0, 0, width, height);

      // Convert canvas to blob
      const blob = await new Promise((resolve) => {
        canvas.toBlob(resolve, file.type, 0.8); // 0.8 quality (80%) - adjust as needed
      });

      // Create a new file from the blob
      const compressedFile = new File([blob], file.name, {
        type: file.type,
        lastModified: Date.now(),
      });

      // Clean up
      URL.revokeObjectURL(img.src);

      return compressedFile;
    } catch (error) {
      console.error("Error compressing image:", error);
      return file; // Return original file if compression fails
    } finally {
      setIsCompressing(false);
    }
  };

  const handleFileChange = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    // Validate file type
    if (!file.type.startsWith("image/")) {
      setError("Please upload an image file (JPEG, PNG, etc.)");
      return;
    }

    // Validate file size
    if (file.size > maxSizeMB * 1024 * 1024) {
      setError(
        `File size exceeds ${maxSizeMB}MB limit. The file will be compressed.`
      );
    }

    // Clean up previous preview URL
    if (previewUrl && previewUrl.startsWith("blob:")) {
      URL.revokeObjectURL(previewUrl);
    }

    try {
      // Compress the image if it's larger than 1MB
      const processedFile =
        file.size > 1024 * 1024 ? await compressImage(file) : file;

      // Create new preview URL
      const fileUrl = URL.createObjectURL(processedFile);
      setPreviewUrl(fileUrl);
      setError("");

      // Call the callback with the processed file
      if (onFileChange) {
        onFileChange(processedFile);
      }

      // Show compression result
      if (file.size > 1024 * 1024 && processedFile.size < file.size) {
        const originalSizeMB = (file.size / (1024 * 1024)).toFixed(2);
        const newSizeMB = (processedFile.size / (1024 * 1024)).toFixed(2);
        setError(`Image compressed from ${originalSizeMB}MB to ${newSizeMB}MB`);
      }
    } catch (error) {
      console.error("Error processing image:", error);
      setError("Error processing image. Please try another file.");
    }
  };

  // Calculate aspect ratio styles
  const getAspectRatioStyle = () => {
    if (aspectRatio === "1:1") return "aspect-square";
    if (aspectRatio === "16:9") return "aspect-video";
    if (aspectRatio === "4:3") return "aspect-[4/3]";
    return "aspect-square"; // Default to square
  };

  return (
    <div className={`${className}`}>
      <div className="mt-1 flex flex-col items-center">
        {previewUrl ? (
          <div
            className={`relative w-full max-w-xs overflow-hidden rounded-lg ${getAspectRatioStyle()} mb-3`}
          >
            <Image
              src={previewUrl || "/placeholder.svg"}
              alt="Image preview"
              fill
              className="object-cover"
            />
          </div>
        ) : (
          <div
            className={`flex items-center justify-center w-full max-w-xs ${getAspectRatioStyle()} bg-gray-100 rounded-lg mb-3`}
          >
            <span className="text-gray-400">No image selected</span>
          </div>
        )}

        <input
          type="file"
          onChange={handleFileChange}
          accept="image/*"
          className="block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-md file:border-0 file:text-sm file:font-semibold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100"
          disabled={isCompressing}
        />

        {isCompressing && (
          <p className="mt-1 text-sm text-blue-600">Compressing image...</p>
        )}
        {error && (
          <p
            className={`mt-1 text-sm ${
              error.includes("compressed") ? "text-green-600" : "text-red-600"
            }`}
          >
            {error}
          </p>
        )}

        <p className="mt-1 text-xs text-gray-500">
          Maximum file size: {maxSizeMB}MB. Large images will be automatically
          compressed.
        </p>
      </div>
    </div>
  );
}

// Export named for easier imports
export { ImageUploader };
