"use client";

import { useState } from "react";
import { useFormStatus } from "react-dom";
import { createPlayDayUpdate } from "@/app/_actions";

function SubmitButton() {
  const { pending } = useFormStatus();

  return (
    <button
      type="submit"
      disabled={pending}
      className={`btn mt-2 ${pending ? "opacity-80" : ""}`}
    >
      {pending ? (
        <span className="flex items-center justify-center">
          <svg
            className="animate-spin -ml-1 mr-2 h-4 w-4 text-current"
            xmlns="http://www.w3.org/2000/svg"
            fill="none"
            viewBox="0 0 24 24"
          >
            <circle
              className="opacity-25"
              cx="12"
              cy="12"
              r="10"
              stroke="currentColor"
              strokeWidth="4"
            ></circle>
            <path
              className="opacity-75"
              fill="currentColor"
              d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
            ></path>
          </svg>
          Posting...
        </span>
      ) : (
        "Post Update"
      )}
    </button>
  );
}

export function UpdateForm({ playDayId }) {
  const [content, setContent] = useState("");
  const [message, setMessage] = useState("");

  // For debugging
  console.log("Rendering UpdateForm for play day:", playDayId);

  async function handleSubmit(formData) {
    const result = await createPlayDayUpdate(formData);

    if (result.success) {
      setContent("");
      setMessage("Update posted successfully!");

      // Clear the success message after 3 seconds
      setTimeout(() => {
        setMessage("");
      }, 3000);
    } else {
      setMessage(result.message || "Failed to post update. Please try again.");
    }
  }

  return (
    <form action={handleSubmit}>
      <input type="hidden" name="playDayId" value={playDayId} />
      <textarea
        name="content"
        value={content}
        onChange={(e) => setContent(e.target.value)}
        className="w-full p-2 border border-blue-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
        rows={3}
        placeholder="Share an update about this play day..."
        required
      ></textarea>
      <div className="flex justify-between items-center">
        <SubmitButton />
        {message && (
          <p
            className={`text-sm ${
              message.includes("success") ? "text-green-600" : "text-red-600"
            }`}
          >
            {message}
          </p>
        )}
      </div>
    </form>
  );
}
