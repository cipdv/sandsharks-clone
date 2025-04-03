"use client";

import { useState } from "react";
import { useActionState } from "react";
import { updatePassword } from "@/app/_actions";
import { useRouter } from "next/navigation";
import { ActionButton } from "@/components/ActionButton";

// Cancel button component
function CancelButton({ onClick }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="py-2 px-4 bg-gray-200 hover:bg-gray-300 text-gray-800 font-medium rounded-md shadow-sm"
    >
      Cancel
    </button>
  );
}

const initialState = {
  success: false,
  message: "",
};

export default function PasswordChangeForm({ user }) {
  const router = useRouter();
  const [showPassword, setShowPassword] = useState({
    current: false,
    new: false,
    confirm: false,
  });

  const [formLoading, setFormLoading] = useState(false);

  // Replace the existing state and formAction with:
  const [state, action] = useActionState(async (prevState, formData) => {
    // Show loading overlay
    setFormLoading(true);

    // Call the original server action
    const result = await updatePassword(formData);

    // If successful, redirect immediately
    if (result.success) {
      router.push("/dashboard/member/profile");
    } else {
      // Only hide the loading overlay if there was an error
      setFormLoading(false);
    }

    return result;
  }, initialState);

  const togglePasswordVisibility = (field) => {
    setShowPassword((prev) => ({
      ...prev,
      [field]: !prev[field],
    }));
  };

  const handleCancel = () => {
    router.push("/dashboard/member/profile");
  };

  return (
    <div className="max-w-md mx-auto bg-blue-100 p-6 rounded-lg shadow-md">
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
              You will be redirected back to your profile in a moment...
            </p>
          )}
        </div>
      )}

      <form action={action} className="space-y-4">
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

        <div className="flex justify-between pt-4">
          <CancelButton onClick={handleCancel} />
          <ActionButton className="bg-[#e376f1] hover:bg-[#d65ee3] text-white">
            Change Password
          </ActionButton>
        </div>
      </form>
      {formLoading && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white p-6 rounded-lg shadow-lg flex flex-col items-center">
            <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-[#e376f1] mb-4"></div>
            <p className="text-lg font-medium">Changing password...</p>
          </div>
        </div>
      )}
    </div>
  );
}

// "use client";

// import { useState } from "react";
// import { useActionState } from "react";
// import { useFormStatus } from "react-dom";
// import { updatePassword } from "@/app/_actions";
// import { useRouter } from "next/navigation";

// // Add formLoading state at the top of the component
// // Submit button component that uses the form's pending state
// function SubmitButton() {
//   const { pending } = useFormStatus();

//   return (
//     <button
//       type="submit"
//       disabled={pending}
//       className={`py-2 px-4 text-white font-medium rounded-md shadow-sm transition-all duration-200 ${
//         pending ? "bg-blue-400 cursor-wait" : "bg-blue-600 hover:bg-blue-700"
//       }`}
//     >
//       {pending ? (
//         <span className="flex items-center justify-center">
//           <svg
//             className="animate-spin mr-2 h-5 w-5 text-white"
//             xmlns="http://www.w3.org/2000/svg"
//             fill="none"
//             viewBox="0 0 24 24"
//           >
//             <circle
//               className="opacity-25"
//               cx="12"
//               cy="12"
//               r="10"
//               stroke="currentColor"
//               strokeWidth="4"
//             ></circle>
//             <path
//               className="opacity-75"
//               fill="currentColor"
//               d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
//             ></path>
//           </svg>
//           Changing Password...
//         </span>
//       ) : (
//         "Change Password"
//       )}
//     </button>
//   );
// }

// // Cancel button component
// function CancelButton({ onClick }) {
//   const { pending } = useFormStatus();

//   return (
//     <button
//       type="button"
//       onClick={onClick}
//       disabled={pending}
//       className="py-2 px-4 bg-gray-200 hover:bg-gray-300 text-gray-800 font-medium rounded-md shadow-sm disabled:opacity-50"
//     >
//       Cancel
//     </button>
//   );
// }

// const initialState = {
//   success: false,
//   message: "",
// };

// export default function PasswordChangeForm({ user }) {
//   const router = useRouter();
//   const [showPassword, setShowPassword] = useState({
//     current: false,
//     new: false,
//     confirm: false,
//   });

//   const [formLoading, setFormLoading] = useState(false);

//   // Replace the existing state and formAction with:
//   const [state, action] = useActionState(async (prevState, formData) => {
//     // Show loading overlay
//     setFormLoading(true);

//     // Call the original server action
//     const result = await updatePassword(formData);

//     // If successful, redirect immediately
//     if (result.success) {
//       router.push("/dashboard/member/profile");
//     } else {
//       // Only hide the loading overlay if there was an error
//       setFormLoading(false);
//     }

//     return result;
//   }, initialState);

//   const togglePasswordVisibility = (field) => {
//     setShowPassword((prev) => ({
//       ...prev,
//       [field]: !prev[field],
//     }));
//   };

//   const handleCancel = () => {
//     router.push("/dashboard/member/profile");
//   };

//   // Remove the redirect code that used setTimeout:
//   // Remove these lines:
//   // if (state?.success) {
//   //   setTimeout(() => {
//   //     router.push("/dashboard/member/profile")
//   //   }, 2000)
//   // }

//   return (
//     <div className="max-w-md mx-auto bg-blue-100 p-6 rounded-lg shadow-md">
//       {state?.message && (
//         <div
//           className={`mb-4 p-3 rounded-md text-sm ${
//             state.success
//               ? "bg-green-100 text-green-800"
//               : "bg-red-100 text-red-800"
//           }`}
//         >
//           {state.message}
//           {state.success && (
//             <p className="mt-2 font-medium">
//               You will be redirected back to your profile in a moment...
//             </p>
//           )}
//         </div>
//       )}

//       <form action={action} className="space-y-4">
//         <div>
//           <label
//             htmlFor="currentPassword"
//             className="block text-sm font-medium mb-1"
//           >
//             Current Password
//           </label>
//           <div className="relative">
//             <input
//               type={showPassword.current ? "text" : "password"}
//               id="currentPassword"
//               name="currentPassword"
//               required
//               className="w-full p-2 pr-10 border border-gray-300 rounded-md"
//             />
//             <button
//               type="button"
//               className="absolute inset-y-0 right-0 pr-3 flex items-center"
//               onClick={() => togglePasswordVisibility("current")}
//             >
//               <span className="text-xs text-gray-600">
//                 {showPassword.current ? "Hide" : "Show"}
//               </span>
//             </button>
//           </div>
//         </div>

//         <div>
//           <label
//             htmlFor="newPassword"
//             className="block text-sm font-medium mb-1"
//           >
//             New Password
//           </label>
//           <div className="relative">
//             <input
//               type={showPassword.new ? "text" : "password"}
//               id="newPassword"
//               name="newPassword"
//               required
//               minLength={6}
//               className="w-full p-2 pr-10 border border-gray-300 rounded-md"
//             />
//             <button
//               type="button"
//               className="absolute inset-y-0 right-0 pr-3 flex items-center"
//               onClick={() => togglePasswordVisibility("new")}
//             >
//               <span className="text-xs text-gray-600">
//                 {showPassword.new ? "Hide" : "Show"}
//               </span>
//             </button>
//           </div>
//           <p className="text-xs text-gray-500 mt-1">
//             Must be at least 6 characters
//           </p>
//         </div>

//         <div>
//           <label
//             htmlFor="confirmPassword"
//             className="block text-sm font-medium mb-1"
//           >
//             Confirm New Password
//           </label>
//           <div className="relative">
//             <input
//               type={showPassword.confirm ? "text" : "password"}
//               id="confirmPassword"
//               name="confirmPassword"
//               required
//               minLength={6}
//               className="w-full p-2 pr-10 border border-gray-300 rounded-md"
//             />
//             <button
//               type="button"
//               className="absolute inset-y-0 right-0 pr-3 flex items-center"
//               onClick={() => togglePasswordVisibility("confirm")}
//             >
//               <span className="text-xs text-gray-600">
//                 {showPassword.confirm ? "Hide" : "Show"}
//               </span>
//             </button>
//           </div>
//         </div>

//         <div className="flex justify-between pt-4">
//           <CancelButton onClick={handleCancel} />
//           <SubmitButton />
//         </div>
//       </form>
//       {formLoading && (
//         <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
//           <div className="bg-white p-6 rounded-lg shadow-lg flex flex-col items-center">
//             <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-600 mb-4"></div>
//             <p className="text-lg font-medium">Changing password...</p>
//           </div>
//         </div>
//       )}
//     </div>
//   );
// }
