"use client";

import { useState, useTransition } from "react";
import { useActionState } from "react";
import { updatePassword } from "@/app/_actions";

const initialState = {
  success: false,
  message: "",
};

export default function PasswordUpdateForm({ userId }) {
  const [isPending, startTransition] = useTransition();
  const [showPassword, setShowPassword] = useState({
    current: false,
    new: false,
    confirm: false,
  });
  const [formData, setFormData] = useState({
    currentPassword: "",
    newPassword: "",
    confirmPassword: "",
  });

  // Create a separate action function that will be used with useActionState
  const submitAction = async (prevState, formData) => {
    return await updatePassword(formData);
  };

  const [state, formAction] = useActionState(submitAction, initialState);

  const togglePasswordVisibility = (field) => {
    setShowPassword((prev) => ({
      ...prev,
      [field]: !prev[field],
    }));
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleSubmit = (e) => {
    e.preventDefault();

    // Validate form data on the client side
    if (
      !formData.currentPassword ||
      !formData.newPassword ||
      !formData.confirmPassword
    ) {
      return; // Don't submit if fields are empty
    }

    // Use startTransition to wrap the action call
    startTransition(() => {
      formAction(formData);
    });
  };

  return (
    <div className="bg-gray-50 p-4 rounded-md">
      <h3 className="text-lg font-medium mb-3">Change Password</h3>

      {state?.message && (
        <div
          className={`mb-4 p-2 rounded-md text-sm ${
            state.success
              ? "bg-green-100 text-green-800"
              : "bg-red-100 text-red-800"
          }`}
        >
          {state.message}
        </div>
      )}

      <div className="space-y-3">
        <div>
          <label
            htmlFor="currentPassword"
            className="block text-sm font-medium mb-1"
          >
            Current Password
          </label>
          <div className="relative">
            <input
              type={showPassword.current ? "text" : "password"}
              id="currentPassword"
              name="currentPassword"
              value={formData.currentPassword}
              onChange={handleChange}
              required
              className="w-full p-2 pr-10 border border-gray-300 rounded-md"
            />
            <button
              type="button"
              className="absolute inset-y-0 right-0 pr-3 flex items-center"
              onClick={() => togglePasswordVisibility("current")}
            >
              <span className="text-xs text-gray-600">
                {showPassword.current ? "Hide" : "Show"}
              </span>
            </button>
          </div>
        </div>

        <div>
          <label
            htmlFor="newPassword"
            className="block text-sm font-medium mb-1"
          >
            New Password
          </label>
          <div className="relative">
            <input
              type={showPassword.new ? "text" : "password"}
              id="newPassword"
              name="newPassword"
              value={formData.newPassword}
              onChange={handleChange}
              required
              minLength={6}
              className="w-full p-2 pr-10 border border-gray-300 rounded-md"
            />
            <button
              type="button"
              className="absolute inset-y-0 right-0 pr-3 flex items-center"
              onClick={() => togglePasswordVisibility("new")}
            >
              <span className="text-xs text-gray-600">
                {showPassword.new ? "Hide" : "Show"}
              </span>
            </button>
          </div>
          <p className="text-xs text-gray-500 mt-1">
            Must be at least 6 characters
          </p>
        </div>

        <div>
          <label
            htmlFor="confirmPassword"
            className="block text-sm font-medium mb-1"
          >
            Confirm New Password
          </label>
          <div className="relative">
            <input
              type={showPassword.confirm ? "text" : "password"}
              id="confirmPassword"
              name="confirmPassword"
              value={formData.confirmPassword}
              onChange={handleChange}
              required
              minLength={6}
              className="w-full p-2 pr-10 border border-gray-300 rounded-md"
            />
            <button
              type="button"
              className="absolute inset-y-0 right-0 pr-3 flex items-center"
              onClick={() => togglePasswordVisibility("confirm")}
            >
              <span className="text-xs text-gray-600">
                {showPassword.confirm ? "Hide" : "Show"}
              </span>
            </button>
          </div>
        </div>

        <button
          type="button"
          onClick={handleSubmit}
          disabled={
            isPending ||
            !formData.currentPassword ||
            !formData.newPassword ||
            !formData.confirmPassword
          }
          className="w-full py-2 px-4 bg-blue-600 hover:bg-blue-700 text-white font-medium rounded-md shadow-sm disabled:opacity-50"
        >
          {isPending ? "Updating..." : "Update Password"}
        </button>
      </div>
    </div>
  );
}
