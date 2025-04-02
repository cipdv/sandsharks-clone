"use client";

import { useState, useEffect } from "react";
import { createSponsor } from "@/app/_actions.js";
import Image from "next/image";

const SponsorForm = ({ members = [], onSuccess }) => {
  const [formError, setFormError] = useState("");
  const [formSuccess, setFormSuccess] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const [formData, setFormData] = useState({
    name: "",
    memberId: "",
    websiteUrl: "",
    instagramUrl: "",
    otherUrl: "",
    description: "",
  });
  const [logoFile, setLogoFile] = useState(null);
  const [previewUrl, setPreviewUrl] = useState("");

  // Process members data when it changes
  useEffect(() => {
    console.log("Members data:", members);
  }, [members]);

  // Clean up object URL when component unmounts or when previewUrl changes
  useEffect(() => {
    return () => {
      if (previewUrl && previewUrl.startsWith("blob:")) {
        URL.revokeObjectURL(previewUrl);
      }
    };
  }, [previewUrl]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData({
      ...formData,
      [name]: value,
    });
  };

  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      // Validate file type
      if (!file.type.startsWith("image/")) {
        setFormError("Please upload an image file (JPEG, PNG, etc.)");
        return;
      }

      // Validate file size (limit to 5MB)
      if (file.size > 5 * 1024 * 1024) {
        setFormError("File size exceeds 5MB limit");
        return;
      }

      setLogoFile(file);

      // Create a preview URL
      if (previewUrl) {
        URL.revokeObjectURL(previewUrl);
      }
      const fileUrl = URL.createObjectURL(file);
      setPreviewUrl(fileUrl);
      setFormError("");
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setFormError("");
    setFormSuccess("");
    setIsSubmitting(true);

    try {
      // Create FormData object to match the server action expectations
      const formDataToSubmit = new FormData();
      formDataToSubmit.append("name", formData.name);
      formDataToSubmit.append("memberId", formData.memberId);
      formDataToSubmit.append("websiteUrl", formData.websiteUrl);
      formDataToSubmit.append("instagramUrl", formData.instagramUrl);
      formDataToSubmit.append("otherUrl", formData.otherUrl);
      formDataToSubmit.append("description", formData.description);

      // Add logo file if selected
      if (logoFile) {
        formDataToSubmit.append("logo", logoFile);
      }

      // Call the server action directly
      const result = await createSponsor(formDataToSubmit);

      if (result.success) {
        setFormSuccess(result.message || "Sponsor created successfully!");
        // Reset form
        setFormData({
          name: "",
          memberId: "",
          websiteUrl: "",
          instagramUrl: "",
          otherUrl: "",
          description: "",
        });
        setLogoFile(null);

        // Clean up the preview URL
        if (previewUrl) {
          URL.revokeObjectURL(previewUrl);
          setPreviewUrl("");
        }

        // Call onSuccess callback if provided
        if (onSuccess) {
          setTimeout(() => {
            onSuccess();
          }, 1500);
        }
      } else {
        setFormError(result.message || "Failed to create sponsor");
      }
    } catch (error) {
      console.error("Error submitting form:", error);
      setFormError("An unexpected error occurred");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="bg-blue-100 p-4 rounded-md">
      <h3 className="text-xl font-bold mb-4">Create New Sponsor</h3>

      {formError && (
        <div className="bg-red-50 text-red-600 p-3 rounded mb-4">
          {formError}
        </div>
      )}

      {formSuccess && (
        <div className="bg-green-50 text-green-600 p-3 rounded mb-4">
          {formSuccess}
        </div>
      )}

      <form onSubmit={handleSubmit}>
        <div className="mb-4">
          <label className="block mb-1">Sponsor Name</label>
          <input
            type="text"
            name="name"
            value={formData.name}
            onChange={handleChange}
            className="w-full p-2 border border-gray-300 rounded"
            required
          />
        </div>

        <div className="mb-4">
          <label className="block mb-1">Associated Member</label>
          <select
            name="memberId"
            value={formData.memberId}
            onChange={handleChange}
            className="w-full p-2 border border-gray-300 rounded"
          >
            <option value="">Select a Member (Optional)</option>
            {Array.isArray(members) && members.length > 0 ? (
              members.map((member) => (
                <option key={member.id} value={member.id}>
                  {member.first_name} {member.last_name}
                </option>
              ))
            ) : (
              <option disabled>No members available</option>
            )}
          </select>
        </div>

        <div className="mb-4">
          <label className="block mb-1">Logo</label>
          <input
            type="file"
            name="logo"
            onChange={handleFileChange}
            accept="image/*"
            className="w-full p-2 border border-gray-300 rounded"
          />
          {previewUrl && (
            <div className="mt-2 relative h-32 w-32">
              <Image
                src={previewUrl || "/placeholder.svg"}
                alt="Logo preview"
                fill
                className="object-contain"
              />
            </div>
          )}
          <p className="text-xs text-gray-500 mt-1">
            Maximum file size: 5MB. Recommended dimensions: 200x200 pixels.
          </p>
        </div>

        <div className="mb-4">
          <label className="block mb-1">Website URL</label>
          <input
            type="url"
            name="websiteUrl"
            value={formData.websiteUrl}
            onChange={handleChange}
            className="w-full p-2 border border-gray-300 rounded"
            placeholder="https://example.com"
          />
        </div>

        <div className="mb-4">
          <label className="block mb-1">Instagram URL</label>
          <input
            type="url"
            name="instagramUrl"
            value={formData.instagramUrl}
            onChange={handleChange}
            className="w-full p-2 border border-gray-300 rounded"
            placeholder="https://instagram.com/username"
          />
        </div>

        <div className="mb-4">
          <label className="block mb-1">Other URL</label>
          <input
            type="url"
            name="otherUrl"
            value={formData.otherUrl}
            onChange={handleChange}
            className="w-full p-2 border border-gray-300 rounded"
            placeholder="https://other-site.com"
          />
        </div>

        <div className="mb-4">
          <label className="block mb-1">Description</label>
          <textarea
            name="description"
            value={formData.description}
            onChange={handleChange}
            className="w-full p-2 border border-gray-300 rounded"
            rows="3"
          />
        </div>

        <button
          type="submit"
          disabled={isSubmitting}
          className="w-full bg-blue-500 text-white p-2 rounded hover:bg-blue-600 disabled:bg-gray-400"
        >
          {isSubmitting ? "Submitting..." : "Create Sponsor"}
        </button>
      </form>
    </div>
  );
};

export default SponsorForm;
