"use client";

import { useState } from "react";
import { addPlayDayUpdate } from "@/app/lib/admin-actions";

export default function AddUpdateForm({ postId }) {
  const [content, setContent] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!content.trim()) {
      return;
    }

    setIsSubmitting(true);
    setError("");
    setSuccess("");

    try {
      const result = await addPlayDayUpdate({ postId, content });

      if (result.success) {
        setSuccess(result.message);
        setContent("");
      } else {
        setError(result.message);
      }
    } catch (error) {
      setError("An unexpected error occurred");
      console.error(error);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="bg-blue-50 p-4 rounded-lg mb-6">
      <h3 className="text-lg font-semibold mb-3">Add Play Day Update</h3>

      {error && (
        <div className="bg-red-50 text-red-600 p-3 rounded mb-4">{error}</div>
      )}

      {success && (
        <div className="bg-green-50 text-green-600 p-3 rounded mb-4">
          {success}
        </div>
      )}

      <div className="mb-4">
        <label className="block text-sm font-medium text-gray-700 mb-1">
          Update Content
        </label>
        <textarea
          value={content}
          onChange={(e) => setContent(e.target.value)}
          rows={4}
          className="w-full px-3 py-2 border border-gray-300 rounded-md"
          placeholder="Share important information about this play day..."
          required
        />
      </div>

      <button
        type="submit"
        disabled={isSubmitting || !content.trim()}
        className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50"
      >
        {isSubmitting ? "Posting..." : "Post Update"}
      </button>
    </form>
  );
}
