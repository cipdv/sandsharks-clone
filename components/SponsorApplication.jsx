"use client";

import { useState } from "react";
import { createSponsorRequest } from "@/app/_actions";
import { useRouter } from "next/navigation";

export default function SponsorApplication({ userId }) {
  const router = useRouter();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [message, setMessage] = useState(null);
  const [logoFile, setLogoFile] = useState(null);
  const [logoPreview, setLogoPreview] = useState(null);

  const handleLogoChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      setLogoFile(file);
      const reader = new FileReader();
      reader.onload = (e) => {
        setLogoPreview(e.target.result);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsSubmitting(true);
    setMessage(null);

    try {
      const formData = new FormData(e.target);

      // Add the logo file if one was selected
      if (logoFile) {
        formData.set("logo", logoFile);
      }

      // Add the user ID
      formData.set("memberId", userId);

      const result = await createSponsorRequest(formData);

      if (result.success) {
        setMessage({
          type: "success",
          text: "Your sponsorship application has been submitted successfully! We'll review it and get back to you soon.",
        });
        // Reset form
        e.target.reset();
        setLogoFile(null);
        setLogoPreview(null);

        // Redirect after a delay
        setTimeout(() => {
          router.push("/dashboard/member");
          router.refresh();
        }, 3000);
      } else {
        setMessage({
          type: "error",
          text: result.message || "Something went wrong. Please try again.",
        });
      }
    } catch (error) {
      console.error("Error submitting form:", error);
      setMessage({
        type: "error",
        text: "An unexpected error occurred. Please try again.",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div>
        <label
          htmlFor="name"
          className="block text-sm font-medium text-gray-700 mb-1"
        >
          Organization/Business Name *
        </label>
        <input
          type="text"
          id="name"
          name="name"
          required
          className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
        />
      </div>

      <div>
        <label
          htmlFor="description"
          className="block text-sm font-medium text-gray-700 mb-1"
        >
          Description
        </label>
        <textarea
          id="description"
          name="description"
          rows="4"
          className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
          placeholder="Tell us about your organization or business..."
        ></textarea>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div>
          <label
            htmlFor="websiteUrl"
            className="block text-sm font-medium text-gray-700 mb-1"
          >
            Website URL
          </label>
          <input
            type="url"
            id="websiteUrl"
            name="websiteUrl"
            className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
            placeholder="https://example.com"
          />
        </div>

        <div>
          <label
            htmlFor="instagramUrl"
            className="block text-sm font-medium text-gray-700 mb-1"
          >
            Instagram URL
          </label>
          <input
            type="url"
            id="instagramUrl"
            name="instagramUrl"
            className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
            placeholder="https://instagram.com/youraccount"
          />
        </div>
      </div>

      <div>
        <label
          htmlFor="otherUrl"
          className="block text-sm font-medium text-gray-700 mb-1"
        >
          Other URL
        </label>
        <input
          type="url"
          id="otherUrl"
          name="otherUrl"
          className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
          placeholder="https://other-site.com"
        />
      </div>

      <div>
        <label
          htmlFor="logo"
          className="block text-sm font-medium text-gray-700 mb-1"
        >
          Logo
        </label>
        <input
          type="file"
          id="logo"
          name="logo"
          accept="image/*"
          onChange={handleLogoChange}
          className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
        />
        <p className="mt-1 text-sm text-gray-500">
          Upload your logo (PNG, JPG, or SVG recommended, max 5MB)
        </p>

        {logoPreview && (
          <div className="mt-2">
            <p className="text-sm font-medium text-gray-700 mb-1">Preview:</p>
            <div className="w-40 h-40 relative border border-gray-200 rounded-md overflow-hidden">
              <img
                src={logoPreview || "/placeholder.svg"}
                alt="Logo preview"
                className="absolute inset-0 w-full h-full object-contain"
              />
            </div>
          </div>
        )}
      </div>

      {message && (
        <div
          className={`p-4 rounded-md ${
            message.type === "success"
              ? "bg-green-50 text-green-800"
              : "bg-red-50 text-red-800"
          }`}
        >
          {message.text}
        </div>
      )}

      <div className="flex justify-end">
        <button
          type="submit"
          disabled={isSubmitting}
          className={`px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 ${
            isSubmitting ? "opacity-75 cursor-not-allowed" : ""
          }`}
        >
          {isSubmitting ? "Submitting..." : "Submit Application"}
        </button>
      </div>
    </form>
  );
}
