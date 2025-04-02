"use client";

import { useState } from "react";
import { useActionState } from "react";
import { useFormStatus } from "react-dom";
import { deleteAccount } from "@/app/_actions";
import { useRouter } from "next/navigation";

// Submit button component that uses the form's pending state
function SubmitButton({ isConfirmed }) {
  const { pending } = useFormStatus();

  return (
    <button
      type="submit"
      disabled={!isConfirmed || pending}
      className={`py-2 px-4 text-white font-medium rounded-md shadow-sm transition-all duration-200 ${
        pending ? "bg-red-400 cursor-wait" : "bg-red-600 hover:bg-red-700"
      }`}
    >
      {pending ? (
        <span className="flex items-center justify-center">
          <svg
            className="animate-spin mr-2 h-5 w-5 text-white"
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
          Deleting Account...
        </span>
      ) : (
        "Delete My Account"
      )}
    </button>
  );
}

// Cancel button component
function CancelButton({ onClick }) {
  const { pending } = useFormStatus();

  return (
    <button
      type="button"
      onClick={onClick}
      disabled={pending}
      className="py-2 px-4 bg-gray-200 hover:bg-gray-300 text-gray-800 font-medium rounded-md shadow-sm disabled:opacity-50"
    >
      Cancel
    </button>
  );
}

const initialState = {
  success: false,
  message: "",
};

export default function DeleteAccountForm({ user, standalone = true }) {
  const router = useRouter();
  const [showPassword, setShowPassword] = useState(false);
  const [isConfirmed, setIsConfirmed] = useState(false);
  // Add formLoading state at the top of the component
  const [formLoading, setFormLoading] = useState(false);

  // Replace the existing state and formAction with:
  const [state, action] = useActionState(async (prevState, formData) => {
    // Show loading overlay
    setFormLoading(true);

    // Call the original server action
    const result = await deleteAccount(formData);

    // If successful, redirect immediately
    if (result.success) {
      router.push("/");
    } else {
      // Only hide the loading overlay if there was an error
      setFormLoading(false);
    }

    return result;
  }, initialState);

  // Remove the redirect code that used setTimeout:
  // Remove these lines:
  // if (state?.success) {
  //   setTimeout(() => {
  //     router.push("/")
  //   }, 3000)
  // }

  const handleCancel = () => {
    router.push("/dashboard/member/profile");
  };

  return (
    <div className="max-w-md mx-auto bg-red-50 p-6 rounded-lg shadow-md border border-red-200">
      <h3 className="text-lg font-medium mb-3 text-red-800">
        Delete Your Account
      </h3>

      <p className="text-sm text-red-700 mb-4">
        Warning: This action cannot be undone. All your data will be permanently
        deleted.
      </p>

      {state?.message && (
        <div
          className={`mb-4 p-3 rounded-md text-sm ${
            state.success
              ? "bg-green-100 text-green-800"
              : "bg-red-100 text-red-800"
          }`}
        >
          {state.message}
          {state.success && (
            <p className="mt-2 font-medium">
              You will be redirected to the home page in a few seconds...
            </p>
          )}
        </div>
      )}

      <form action={action} className="space-y-4">
        <div>
          <label htmlFor="password" className="block text-sm font-medium mb-1">
            Enter Your Password to Confirm
          </label>
          <div className="relative">
            <input
              type={showPassword ? "text" : "password"}
              id="password"
              name="password"
              required
              className="w-full p-2 pr-10 border border-red-300 rounded-md"
            />
            <button
              type="button"
              className="absolute inset-y-0 right-0 pr-3 flex items-center"
              onClick={() => setShowPassword(!showPassword)}
            >
              <span className="text-xs text-gray-600">
                {showPassword ? "Hide" : "Show"}
              </span>
            </button>
          </div>
        </div>

        <div className="flex items-center">
          <input
            type="checkbox"
            id="confirmDelete"
            required
            checked={isConfirmed}
            onChange={() => setIsConfirmed(!isConfirmed)}
            className="h-4 w-4 text-red-600 border-red-300 rounded"
          />
          <label
            htmlFor="confirmDelete"
            className="ml-2 block text-sm text-red-700"
          >
            I understand that this action cannot be undone
          </label>
        </div>

        <div className="flex justify-between pt-4">
          <CancelButton onClick={handleCancel} />
          <SubmitButton isConfirmed={isConfirmed} />
        </div>
      </form>
      {formLoading && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white p-6 rounded-lg shadow-lg flex flex-col items-center">
            <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-red-600 mb-4"></div>
            <p className="text-lg font-medium">Deleting account...</p>
          </div>
        </div>
      )}
    </div>
  );
}
