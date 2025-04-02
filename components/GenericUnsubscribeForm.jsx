"use client";

import { useState } from "react";
import { unsubscribeByEmail } from "@/app/_actions";
import { ActionButton } from "./ActionButton";
import { useActionState } from "react";

export default function GenericUnsubscribeForm() {
  const [email, setEmail] = useState("");
  const [state, formAction] = useActionState(unsubscribeByEmail, {
    success: false,
    message: "",
  });

  return (
    <div>
      {state.success ? (
        <div className="text-center">
          <div className="text-green-500 text-5xl mb-4">
            <svg
              xmlns="http://www.w3.org/2000/svg"
              className="h-16 w-16 mx-auto"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M5 13l4 4L19 7"
              />
            </svg>
          </div>
          <p className="mb-6">{state.message}</p>
          <a href="/" className="btn">
            Return to Homepage
          </a>
        </div>
      ) : (
        <form action={formAction} className="space-y-4">
          <div>
            <label
              htmlFor="email"
              className="block text-sm font-medium text-gray-700 mb-1"
            >
              Email Address
            </label>
            <input
              type="email"
              id="email"
              name="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full p-2 border border-gray-300 rounded-md"
              placeholder="your.email@example.com"
              required
            />
          </div>

          <ActionButton type="submit" className="w-full">
            Unsubscribe
          </ActionButton>

          {state.message && !state.success && (
            <div className="p-3 bg-red-100 text-red-800 rounded-md text-sm">
              {state.message}
            </div>
          )}
        </form>
      )}
    </div>
  );
}
