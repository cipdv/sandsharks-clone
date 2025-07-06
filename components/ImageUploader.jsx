"use client";

import { useState, useRef } from "react";
import NextImage from "next/image"; // Rename the Next.js Image import

const ImageUploader = ({
  initialImage = null,
  onFileChange,
  aspectRatio = "1:1",
  maxSizeMB = 5,
  previewSize = "medium",
}) => {
  const [preview, setPreview] = useState(initialImage);
  const [isDragging, setIsDragging] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const fileInputRef = useRef(null);

  // Get preview size classes
  const getPreviewSizeClasses = () => {
    switch (previewSize) {
      case "small":
        return "w-24 h-24";
      case "large":
        return "w-48 h-48";
      default:
        return "w-32 h-32";
    }
  };

  // Compress image function using native browser Image API
  const compressImage = (file, maxSizeMB = 1, quality = 0.8) => {
    return new Promise((resolve) => {
      const canvas = document.createElement("canvas");
      const ctx = canvas.getContext("2d");

      // Use native browser Image constructor (not Next.js Image component)
      const img = new window.Image(); // Explicitly use window.Image to avoid confusion

      img.onload = () => {
        // Calculate new dimensions while maintaining aspect ratio
        let { width, height } = img;
        const maxDimension = 800; // Max width or height

        if (width > height) {
          if (width > maxDimension) {
            height = (height * maxDimension) / width;
            width = maxDimension;
          }
        } else {
          if (height > maxDimension) {
            width = (width * maxDimension) / height;
            height = maxDimension;
          }
        }

        canvas.width = width;
        canvas.height = height;

        // Draw and compress
        ctx.drawImage(img, 0, 0, width, height);

        canvas.toBlob(
          (blob) => {
            // Check if compression achieved target size
            if (blob.size <= maxSizeMB * 1024 * 1024) {
              resolve(blob);
            } else if (quality > 0.1) {
              // Try with lower quality
              canvas.toBlob(resolve, "image/jpeg", quality - 0.1);
            } else {
              resolve(blob); // Return as is if can't compress further
            }
          },
          "image/jpeg",
          quality
        );
      };

      img.onerror = () => {
        resolve(file); // Return original file if processing fails
      };

      img.src = URL.createObjectURL(file);
    });
  };

  const handleFileChange = async (event) => {
    const file = event.target.files?.[0];
    if (!file) return;

    // Validate file type
    if (!file.type.startsWith("image/")) {
      alert("Please select an image file");
      return;
    }

    // Validate file size (before compression)
    if (file.size > maxSizeMB * 1024 * 1024 * 2) {
      // Allow 2x the target size before compression
      alert(`File size should be less than ${maxSizeMB * 2}MB`);
      return;
    }

    setIsProcessing(true);

    try {
      // Compress the image
      const compressedFile = await compressImage(file, maxSizeMB);

      // Create preview URL
      const previewUrl = URL.createObjectURL(compressedFile);
      setPreview(previewUrl);

      // Convert to data URL for form submission
      const reader = new FileReader();
      reader.onloadend = () => {
        onFileChange(reader.result); // Pass data URL to parent
      };
      reader.readAsDataURL(compressedFile);
    } catch (error) {
      console.error("Error processing image:", error);
      alert("Error processing image. Please try again.");
    } finally {
      setIsProcessing(false);
    }
  };

  const handleDragOver = (event) => {
    event.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = (event) => {
    event.preventDefault();
    setIsDragging(false);
  };

  const handleDrop = (event) => {
    event.preventDefault();
    setIsDragging(false);

    const files = event.dataTransfer.files;
    if (files.length > 0) {
      // Create a synthetic event object for handleFileChange
      const syntheticEvent = {
        target: { files: [files[0]] },
      };
      handleFileChange(syntheticEvent);
    }
  };

  const removeImage = () => {
    setPreview(null);
    onFileChange(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  return (
    <div className="w-full">
      <div
        className={`
          relative border-2 border-dashed rounded-lg p-4 text-center cursor-pointer transition-colors
          ${
            isDragging
              ? "border-blue-400 bg-blue-50"
              : "border-gray-300 hover:border-gray-400"
          }
          ${preview ? "border-solid border-gray-200" : ""}
        `}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
        onClick={() => !isProcessing && fileInputRef.current?.click()}
      >
        {isProcessing ? (
          <div className="flex flex-col items-center justify-center py-8">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mb-2"></div>
            <p className="text-sm text-gray-600">Processing image...</p>
          </div>
        ) : preview ? (
          <div className="relative">
            <div
              className={`${getPreviewSizeClasses()} mx-auto relative rounded-lg overflow-hidden`}
            >
              <NextImage
                src={preview}
                alt="Preview"
                fill
                className="object-cover"
                sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
              />
            </div>
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                removeImage();
              }}
              className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full w-6 h-6 flex items-center justify-center text-sm hover:bg-red-600 transition-colors"
              aria-label="Remove image"
            >
              ×
            </button>
          </div>
        ) : (
          <div className="py-8">
            <div className="mx-auto w-12 h-12 text-gray-400 mb-4">
              <svg fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12"
                />
              </svg>
            </div>
            <p className="text-sm text-gray-600 mb-2">
              Click to upload or drag and drop
            </p>
            <p className="text-xs text-gray-500">
              PNG, JPG up to {maxSizeMB}MB
            </p>
          </div>
        )}

        <input
          ref={fileInputRef}
          type="file"
          accept="image/*"
          onChange={handleFileChange}
          className="hidden"
          disabled={isProcessing}
        />
      </div>
    </div>
  );
};

export { ImageUploader };

// "use client";

// import { useState, useEffect } from "react";
// import Image from "next/image";

// export default function ImageUploader({
//   onFileChange,
//   initialImage = null,
//   className = "",
//   maxSizeMB = 5,
//   aspectRatio = "1:1",
//   label = "Upload Image",
// }) {
//   const [previewUrl, setPreviewUrl] = useState(initialImage || "");
//   const [error, setError] = useState("");
//   const [isCompressing, setIsCompressing] = useState(false);

//   // Clean up object URL when component unmounts or when previewUrl changes
//   useEffect(() => {
//     return () => {
//       if (previewUrl && previewUrl.startsWith("blob:")) {
//         URL.revokeObjectURL(previewUrl);
//       }
//     };
//   }, [previewUrl]);

//   // Update preview if initialImage changes
//   useEffect(() => {
//     if (initialImage) {
//       setPreviewUrl(initialImage);
//     }
//   }, [initialImage]);

//   // Function to compress image
//   const compressImage = async (file) => {
//     setIsCompressing(true);

//     try {
//       // Create a new image element
//       const img = new Image();
//       img.src = URL.createObjectURL(file);

//       // Wait for the image to load
//       await new Promise((resolve) => {
//         img.onload = resolve;
//       });

//       // Create a canvas element
//       const canvas = document.createElement("canvas");

//       // Calculate dimensions while maintaining aspect ratio
//       let width = img.width;
//       let height = img.height;

//       // Limit max dimensions to 1200px (good balance between quality and size)
//       const maxDimension = 1200;
//       if (width > maxDimension || height > maxDimension) {
//         if (width > height) {
//           height = Math.round((height * maxDimension) / width);
//           width = maxDimension;
//         } else {
//           width = Math.round((width * maxDimension) / height);
//           height = maxDimension;
//         }
//       }

//       // Set canvas dimensions
//       canvas.width = width;
//       canvas.height = height;

//       // Draw image on canvas
//       const ctx = canvas.getContext("2d");
//       ctx.drawImage(img, 0, 0, width, height);

//       // Convert canvas to blob
//       const blob = await new Promise((resolve) => {
//         canvas.toBlob(resolve, file.type, 0.8); // 0.8 quality (80%) - adjust as needed
//       });

//       // Create a new file from the blob
//       const compressedFile = new File([blob], file.name, {
//         type: file.type,
//         lastModified: Date.now(),
//       });

//       // Clean up
//       URL.revokeObjectURL(img.src);

//       return compressedFile;
//     } catch (error) {
//       console.error("Error compressing image:", error);
//       return file; // Return original file if compression fails
//     } finally {
//       setIsCompressing(false);
//     }
//   };

//   const handleFileChange = async (e) => {
//     const file = e.target.files[0];
//     if (!file) return;

//     // Validate file type
//     if (!file.type.startsWith("image/")) {
//       setError("Please upload an image file (JPEG, PNG, etc.)");
//       return;
//     }

//     // Validate file size
//     if (file.size > maxSizeMB * 1024 * 1024) {
//       setError(
//         `File size exceeds ${maxSizeMB}MB limit. The file will be compressed.`
//       );
//     }

//     // Clean up previous preview URL
//     if (previewUrl && previewUrl.startsWith("blob:")) {
//       URL.revokeObjectURL(previewUrl);
//     }

//     try {
//       // Compress the image if it's larger than 1MB
//       const processedFile =
//         file.size > 1024 * 1024 ? await compressImage(file) : file;

//       // Create new preview URL
//       const fileUrl = URL.createObjectURL(processedFile);
//       setPreviewUrl(fileUrl);
//       setError("");

//       // Call the callback with the processed file
//       if (onFileChange) {
//         onFileChange(processedFile);
//       }

//       // Show compression result
//       if (file.size > 1024 * 1024 && processedFile.size < file.size) {
//         const originalSizeMB = (file.size / (1024 * 1024)).toFixed(2);
//         const newSizeMB = (processedFile.size / (1024 * 1024)).toFixed(2);
//         setError(`Image compressed from ${originalSizeMB}MB to ${newSizeMB}MB`);
//       }
//     } catch (error) {
//       console.error("Error processing image:", error);
//       setError("Error processing image. Please try another file.");
//     }
//   };

//   // Calculate aspect ratio styles
//   const getAspectRatioStyle = () => {
//     if (aspectRatio === "1:1") return "aspect-square";
//     if (aspectRatio === "16:9") return "aspect-video";
//     if (aspectRatio === "4:3") return "aspect-[4/3]";
//     return "aspect-square"; // Default to square
//   };

//   return (
//     <div className={`${className}`}>
//       <div className="mt-1 flex flex-col items-center">
//         {previewUrl ? (
//           <div
//             className={`relative w-full max-w-xs overflow-hidden rounded-lg ${getAspectRatioStyle()} mb-3`}
//           >
//             <Image
//               src={previewUrl || "/placeholder.svg"}
//               alt="Image preview"
//               fill
//               className="object-cover"
//             />
//           </div>
//         ) : (
//           <div
//             className={`flex items-center justify-center w-full max-w-xs ${getAspectRatioStyle()} bg-gray-100 rounded-lg mb-3`}
//           >
//             <span className="text-gray-400">No image selected</span>
//           </div>
//         )}

//         <input
//           type="file"
//           onChange={handleFileChange}
//           accept="image/*"
//           className="block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-md file:border-0 file:text-sm file:font-semibold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100"
//           disabled={isCompressing}
//         />

//         {isCompressing && (
//           <p className="mt-1 text-sm text-blue-600">Compressing image...</p>
//         )}
//         {error && (
//           <p
//             className={`mt-1 text-sm ${
//               error.includes("compressed") ? "text-green-600" : "text-red-600"
//             }`}
//           >
//             {error}
//           </p>
//         )}

//         <p className="mt-1 text-xs text-gray-500">
//           Maximum file size: {maxSizeMB}MB. Large images will be automatically
//           compressed.
//         </p>
//       </div>
//     </div>
//   );
// }

// // Export named for easier imports
// export { ImageUploader };
