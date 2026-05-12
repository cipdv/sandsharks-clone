"use client";

import { useActionState } from "react";
import { submitContactForm } from "@/app/_actions";
import { ActionButton } from "./ActionButton";

const initialState = {
  success: false,
  message: "",
};

export default function ContactForm() {
  const [state, formAction] = useActionState(submitContactForm, initialState);
  const fieldClass =
    "w-full rounded-md border border-gray-300 bg-white px-3 py-2.5 text-base shadow-sm focus:border-sandsharks-magenta focus:outline-none focus:ring-2 focus:ring-sandsharks-lilac/60";
  const labelClass = "mb-1 block text-sm font-medium text-sandsharks-ink";

  return (
    <form
      action={formAction}
      className="mx-auto mt-6 w-full max-w-2xl rounded-lg border border-sandsharks-magenta/30 bg-blue-100 p-4 shadow-md sm:p-6 lg:p-8"
    >
      <h1 className="text-2xl font-bold">Contact Sandsharks</h1>

      <div className="mt-6 space-y-5">
        <div>
          <label htmlFor="name" className={labelClass}>
            Name
          </label>
          <input
            id="name"
            name="name"
            type="text"
            required
            maxLength={120}
            className={fieldClass}
          />
        </div>

        <div>
          <label htmlFor="email" className={labelClass}>
            Email Address
          </label>
          <input
            id="email"
            name="email"
            type="email"
            required
            maxLength={254}
            className={fieldClass}
          />
        </div>

        <div>
          <label htmlFor="message" className={labelClass}>
            Message
          </label>
          <textarea
            id="message"
            name="message"
            required
            rows={7}
            maxLength={5000}
            className={`${fieldClass} resize-y`}
          />
        </div>

        {state?.message && (
          <p
            className={`rounded-md p-3 text-sm font-medium ${
              state.success
                ? "bg-green-100 text-green-800"
                : "bg-red-100 text-red-800"
            }`}
            role="status"
          >
            {state.message}
          </p>
        )}

        <div className="flex justify-end">
          <ActionButton
            className="w-full sm:w-auto sm:min-w-36"
            loadingLabel="Sending . . ."
            loadingShortLabel="Sending . . ."
          >
            Send Message
          </ActionButton>
        </div>
      </div>
    </form>
  );
}
