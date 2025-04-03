"use client";

import { useState } from "react";
import { useActionState } from "react";
import { updateMemberProfile } from "@/app/_actions";
import { ImageUploader } from "./ImageUploader";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { ActionButton } from "./ActionButton";

const initialState = {
  success: false,
  message: "",
};

export default function MemberProfileUpdate({ user }) {
  

  console.log('user memberprofile', user)
  const router = useRouter();
  const [profilePicFile, setProfilePicFile] = useState(null);
  const [aboutCount, setAboutCount] = useState(
    user?.about ? user.about.length : 0
  );
  const [formLoading, setFormLoading] = useState(false);

  // Track checkbox states explicitly
  const [emailList, setEmailList] = useState(user?.emailList || false);
  const [photoConsent, setPhotoConsent] = useState(user?.photoConsent || false);

  // Create a wrapper for the server action that will handle the form data
  const updateProfileWithFormData = async (prevState, formData) => {
    // Show loading overlay
    setFormLoading(true);

    // If we have a profile picture file, append it to the form data
    if (profilePicFile) {
      formData.append("profilePicture", profilePicFile);
    }

    // Explicitly set the checkbox values
    formData.set("emailList", emailList.toString());
    formData.set("photoConsent", photoConsent.toString());

    // Call the original server action
    const result = await updateMemberProfile(prevState, formData);

    // If successful, redirect immediately
    if (result.success) {
      router.push("/dashboard/member");
    } else {
      // Only hide the loading overlay if there was an error
      setFormLoading(false);
    }

    return result;
  };

  const [state, formAction] = useActionState(
    updateProfileWithFormData,
    initialState
  );

  // Redirect to dashboard after successful profile update

  const handleAboutChange = (event) => {
    setAboutCount(event.target.value.length);
  };

  const handleFileChange = (file) => {
    setProfilePicFile(file);
  };

  const handleCancel = () => {
    router.push("/dashboard/member");
  };

  return (
    <div className="max-w-4xl mx-auto p-4">
      <h1 className="text-2xl font-bold mb-6">Update Your Profile</h1>

      {state.message && (
        <div
          className={`mb-6 p-4 rounded-md ${state.success ? "bg-green-100 text-green-800" : "bg-red-100 text-red-800"}`}
        >
          {state.message}
          {state.success && (
            <p className="mt-2">
              You will be redirected to the dashboard in a moment...
            </p>
          )}
        </div>
      )}

      <div className="bg-blue-100 p-6 rounded-lg shadow-md">
        <form action={formAction} className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Left column - Personal Information */}
            <div className="space-y-4">
              <h2 className="text-xl font-semibold border-b pb-2 mb-4">
                Personal Information
              </h2>

              <div>
                <label
                  htmlFor="firstName"
                  className="block text-sm font-medium mb-1"
                >
                  First Name
                </label>
                <input
                  type="text"
                  id="firstName"
                  name="firstName"
                  defaultValue={user?.firstName}
                  className="w-full p-2 border border-gray-300 rounded-md"
                  required
                />
              </div>

              <div>
                <label
                  htmlFor="lastName"
                  className="block text-sm font-medium mb-1"
                >
                  Last Name
                </label>
                <input
                  type="text"
                  id="lastName"
                  name="lastName"
                  defaultValue={user?.lastName}
                  className="w-full p-2 border border-gray-300 rounded-md"
                  required
                />
              </div>

              <div>
                <label
                  htmlFor="pronouns"
                  className="block text-sm font-medium mb-1"
                >
                  Pronouns
                </label>
                <select
                  id="pronouns"
                  name="pronouns"
                  defaultValue={user?.pronouns}
                  className="w-full p-2 border border-gray-300 rounded-md"
                  required
                >
                  <option value="" disabled>
                    Select
                  </option>
                  <option value="they/them">They/them</option>
                  <option value="she/her">She/her</option>
                  <option value="he/him">He/him</option>
                  <option value="other">Other</option>
                </select>
              </div>

              <div>
                <label
                  htmlFor="email"
                  className="block text-sm font-medium mb-1"
                >
                  Email Address
                </label>
                <p className="text-xs text-gray-500 mb-1">
                  This email is used for logging in. Changing it will change
                  your login credentials.
                </p>
                <input
                  type="email"
                  id="email"
                  name="email"
                  defaultValue={user?.email}
                  className="w-full p-2 border border-gray-300 rounded-md"
                  required
                />
              </div>

              <div>
                <label
                  htmlFor="instagramHandle"
                  className="block text-sm font-medium mb-1"
                >
                  Instagram Handle{" "}
                  <span className="text-gray-500 text-xs">(Optional)</span>
                </label>
                <div className="flex items-center">
                  <div className="bg-gray-100 p-2 rounded-l-md border border-r-0 border-gray-300">
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      width="20"
                      height="20"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="2"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      className="text-pink-600"
                    >
                      <rect
                        x="2"
                        y="2"
                        width="20"
                        height="20"
                        rx="5"
                        ry="5"
                      ></rect>
                      <path d="M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z"></path>
                      <line x1="17.5" y1="6.5" x2="17.51" y2="6.5"></line>
                    </svg>
                  </div>
                  <input
                    type="text"
                    id="instagramHandle"
                    name="instagramHandle"
                    defaultValue={user?.instagramHandle || ""}
                    placeholder="yourusername"
                    className="w-full p-2 border border-gray-300 rounded-r-md"
                  />
                </div>
                <p className="text-xs text-gray-500 mt-1">
                  Just enter your username without the @ symbol
                </p>
              </div>

              <div className="space-y-3 mt-6 p-4 bg-blue-50 rounded-md">
                <h3 className="text-md font-medium border-b pb-2 mb-2">
                  Communication Preferences
                </h3>

                <div className="flex items-center">
                  <input
                    type="checkbox"
                    id="emailList"
                    name="emailList"
                    checked={emailList}
                    onChange={(e) => setEmailList(e.target.checked)}
                    className="h-4 w-4 text-blue-600 border-gray-300 rounded"
                  />
                  <label htmlFor="emailList" className="ml-2 block text-sm">
                    Receive email updates and newsletters
                  </label>
                </div>

                <div className="flex items-center">
                  <input
                    type="checkbox"
                    id="photoConsent"
                    name="photoConsent"
                    checked={photoConsent}
                    onChange={(e) => setPhotoConsent(e.target.checked)}
                    className="h-4 w-4 text-blue-600 border-gray-300 rounded"
                  />
                  <label htmlFor="photoConsent" className="ml-2 block text-sm">
                    I consent to my photo being used in Sandsharks materials
                  </label>
                </div>
              </div>
            </div>

            {/* Right column - About & Profile Picture */}
            <div className="space-y-5">
              <h2 className="text-xl font-semibold border-b pb-2 mb-4">
                Profile Details
              </h2>

              <div>
                <div className="flex items-center justify-between mb-1">
                  <label htmlFor="about" className="block text-sm font-medium">
                    About Me
                  </label>
                  <span className="text-xs text-gray-500">
                    {300 - aboutCount} characters remaining
                  </span>
                </div>
                <textarea
                  id="about"
                  name="about"
                  rows="5"
                  maxLength="300"
                  defaultValue={user?.about}
                  onChange={handleAboutChange}
                  className="w-full p-2 border border-gray-300 rounded-md"
                  placeholder="Tell us something about yourself"
                />
              </div>

              <div className="mt-6">
                <label className="block text-sm font-medium mb-2">
                  Profile Picture
                </label>

                {user?.profilePic?.status === "pending" && (
                  <div className="mb-3 p-2 bg-yellow-100 text-yellow-800 rounded-md text-sm">
                    Your profile picture is pending approval.
                  </div>
                )}

                {user?.profilePic?.status === "disapproved" && (
                  <div className="mb-3 p-2 bg-red-100 text-red-800 rounded-md text-sm">
                    Your profile picture was disapproved. Please read our photo
                    guidelines and submit a new one.
                  </div>
                )}

                <ImageUploader
                  initialImage={user?.profilePic?.url}
                  onFileChange={handleFileChange}
                  aspectRatio="1:1"
                  maxSizeMB={5}
                />
              </div>

              <div className="pt-4 mt-4 border-t border-gray-200 space-y-3">
                <div className="flex items-center justify-between">
                  <Link
                    href="/dashboard/member/change-password"
                    className="text-blue-600 hover:text-blue-800 text-sm font-medium"
                  >
                    Change Password
                  </Link>
                  <Link
                    href="/dashboard/member/delete-account"
                    className="text-red-600 hover:text-red-800 text-sm font-medium"
                  >
                    Delete Account
                  </Link>
                </div>
              </div>
            </div>
          </div>

          <div className="pt-6 border-t border-gray-200 flex justify-between">
            <ActionButton
              onClick={handleCancel}
              className="bg-gray-200 hover:bg-gray-300 text-gray-800"
            >
              Cancel
            </ActionButton>
            <ActionButton className="btn">Update Profile</ActionButton>
          </div>
        </form>
      </div>
      {formLoading && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white p-6 rounded-lg shadow-lg flex flex-col items-center">
            <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-600 mb-4"></div>
            <p className="text-lg font-medium">Updating profile...</p>
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
// import { updateMemberProfile } from "@/app/_actions";
// import { ImageUploader } from "./ImageUploader";
// import { useRouter } from "next/navigation";
// import Link from "next/link";

// // Submit button component that uses the form's pending state
// function SubmitButton() {
//   const { pending } = useFormStatus();

//   return (
//     <button
//       type="submit"
//       disabled={pending}
//       className={`py-3 px-6 text-white font-medium rounded-md shadow-sm transition-all duration-200 ${
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
//           Submitting...
//         </span>
//       ) : (
//         "Update Profile"
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
//       className="py-3 px-6 bg-gray-200 hover:bg-gray-300 text-gray-800 font-medium rounded-md shadow-sm disabled:opacity-50"
//     >
//       Cancel
//     </button>
//   );
// }

// const initialState = {
//   success: false,
//   message: "",
// };

// export default function MemberProfileUpdate({ user }) {
//   const router = useRouter();
//   const [profilePicFile, setProfilePicFile] = useState(null);
//   const [aboutCount, setAboutCount] = useState(
//     user?.about ? user.about.length : 0
//   );
//   const [formLoading, setFormLoading] = useState(false);

//   // Track checkbox states explicitly
//   const [emailList, setEmailList] = useState(user?.emailList || false);
//   const [photoConsent, setPhotoConsent] = useState(user?.photoConsent || false);

//   // Create a wrapper for the server action that will handle the form data
//   const updateProfileWithFormData = async (prevState, formData) => {
//     // Show loading overlay
//     setFormLoading(true);

//     // If we have a profile picture file, append it to the form data
//     if (profilePicFile) {
//       formData.append("profilePicture", profilePicFile);
//     }

//     // Explicitly set the checkbox values
//     formData.set("emailList", emailList.toString());
//     formData.set("photoConsent", photoConsent.toString());

//     // Call the original server action
//     const result = await updateMemberProfile(prevState, formData);

//     // If successful, redirect immediately
//     if (result.success) {
//       router.push("/dashboard/member");
//     } else {
//       // Only hide the loading overlay if there was an error
//       setFormLoading(false);
//     }

//     return result;
//   };

//   const [state, formAction] = useActionState(
//     updateProfileWithFormData,
//     initialState
//   );

//   // Redirect to dashboard after successful profile update

//   const handleAboutChange = (event) => {
//     setAboutCount(event.target.value.length);
//   };

//   const handleFileChange = (file) => {
//     setProfilePicFile(file);
//   };

//   const handleCancel = () => {
//     router.push("/dashboard/member");
//   };

//   return (
//     <div className="max-w-4xl mx-auto p-4">
//       <h1 className="text-2xl font-bold mb-6">Update Your Profile</h1>

//       {state.message && (
//         <div
//           className={`mb-6 p-4 rounded-md ${
//             state.success
//               ? "bg-green-100 text-green-800"
//               : "bg-red-100 text-red-800"
//           }`}
//         >
//           {state.message}
//           {state.success && (
//             <p className="mt-2">
//               You will be redirected to the dashboard in a moment...
//             </p>
//           )}
//         </div>
//       )}

//       <div className="bg-blue-100 p-6 rounded-lg shadow-md">
//         <form action={formAction} className="space-y-6">
//           <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
//             {/* Left column - Personal Information */}
//             <div className="space-y-4">
//               <h2 className="text-xl font-semibold border-b pb-2 mb-4">
//                 Personal Information
//               </h2>

//               <div>
//                 <label
//                   htmlFor="firstName"
//                   className="block text-sm font-medium mb-1"
//                 >
//                   First Name
//                 </label>
//                 <input
//                   type="text"
//                   id="firstName"
//                   name="firstName"
//                   defaultValue={user?.firstName}
//                   className="w-full p-2 border border-gray-300 rounded-md"
//                   required
//                 />
//               </div>

//               <div>
//                 <label
//                   htmlFor="lastName"
//                   className="block text-sm font-medium mb-1"
//                 >
//                   Last Name
//                 </label>
//                 <input
//                   type="text"
//                   id="lastName"
//                   name="lastName"
//                   defaultValue={user?.lastName}
//                   className="w-full p-2 border border-gray-300 rounded-md"
//                   required
//                 />
//               </div>

//               <div>
//                 <label
//                   htmlFor="pronouns"
//                   className="block text-sm font-medium mb-1"
//                 >
//                   Pronouns
//                 </label>
//                 <select
//                   id="pronouns"
//                   name="pronouns"
//                   defaultValue={user?.pronouns}
//                   className="w-full p-2 border border-gray-300 rounded-md"
//                   required
//                 >
//                   <option value="" disabled>
//                     Select
//                   </option>
//                   <option value="they/them">They/them</option>
//                   <option value="she/her">She/her</option>
//                   <option value="he/him">He/him</option>
//                   <option value="other">Other</option>
//                 </select>
//               </div>

//               <div>
//                 <label
//                   htmlFor="email"
//                   className="block text-sm font-medium mb-1"
//                 >
//                   Email Address
//                 </label>
//                 <p className="text-xs text-gray-500 mb-1">
//                   This email is used for logging in. Changing it will change
//                   your login credentials.
//                 </p>
//                 <input
//                   type="email"
//                   id="email"
//                   name="email"
//                   defaultValue={user?.email}
//                   className="w-full p-2 border border-gray-300 rounded-md"
//                   required
//                 />
//               </div>

//               <div>
//                 <label
//                   htmlFor="instagramHandle"
//                   className="block text-sm font-medium mb-1"
//                 >
//                   Instagram Handle{" "}
//                   <span className="text-gray-500 text-xs">(Optional)</span>
//                 </label>
//                 <div className="flex items-center">
//                   <div className="bg-gray-100 p-2 rounded-l-md border border-r-0 border-gray-300">
//                     <svg
//                       xmlns="http://www.w3.org/2000/svg"
//                       width="20"
//                       height="20"
//                       viewBox="0 0 24 24"
//                       fill="none"
//                       stroke="currentColor"
//                       strokeWidth="2"
//                       strokeLinecap="round"
//                       strokeLinejoin="round"
//                       className="text-pink-600"
//                     >
//                       <rect
//                         x="2"
//                         y="2"
//                         width="20"
//                         height="20"
//                         rx="5"
//                         ry="5"
//                       ></rect>
//                       <path d="M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z"></path>
//                       <line x1="17.5" y1="6.5" x2="17.51" y2="6.5"></line>
//                     </svg>
//                   </div>
//                   <input
//                     type="text"
//                     id="instagramHandle"
//                     name="instagramHandle"
//                     defaultValue={user?.instagramHandle || ""}
//                     placeholder="yourusername"
//                     className="w-full p-2 border border-gray-300 rounded-r-md"
//                   />
//                 </div>
//                 <p className="text-xs text-gray-500 mt-1">
//                   Just enter your username without the @ symbol
//                 </p>
//               </div>

//               <div className="space-y-3 mt-6 p-4 bg-blue-50 rounded-md">
//                 <h3 className="text-md font-medium border-b pb-2 mb-2">
//                   Communication Preferences
//                 </h3>

//                 <div className="flex items-center">
//                   <input
//                     type="checkbox"
//                     id="emailList"
//                     name="emailList"
//                     checked={emailList}
//                     onChange={(e) => setEmailList(e.target.checked)}
//                     className="h-4 w-4 text-blue-600 border-gray-300 rounded"
//                   />
//                   <label htmlFor="emailList" className="ml-2 block text-sm">
//                     Receive email updates and newsletters
//                   </label>
//                 </div>

//                 <div className="flex items-center">
//                   <input
//                     type="checkbox"
//                     id="photoConsent"
//                     name="photoConsent"
//                     checked={photoConsent}
//                     onChange={(e) => setPhotoConsent(e.target.checked)}
//                     className="h-4 w-4 text-blue-600 border-gray-300 rounded"
//                   />
//                   <label htmlFor="photoConsent" className="ml-2 block text-sm">
//                     I consent to my photo being used in Sandsharks materials
//                   </label>
//                 </div>
//               </div>
//             </div>

//             {/* Right column - About & Profile Picture */}
//             <div className="space-y-5">
//               <h2 className="text-xl font-semibold border-b pb-2 mb-4">
//                 Profile Details
//               </h2>

//               <div>
//                 <div className="flex items-center justify-between mb-1">
//                   <label htmlFor="about" className="block text-sm font-medium">
//                     About Me
//                   </label>
//                   <span className="text-xs text-gray-500">
//                     {300 - aboutCount} characters remaining
//                   </span>
//                 </div>
//                 <textarea
//                   id="about"
//                   name="about"
//                   rows="5"
//                   maxLength="300"
//                   defaultValue={user?.about}
//                   onChange={handleAboutChange}
//                   className="w-full p-2 border border-gray-300 rounded-md"
//                   placeholder="Tell us something about yourself"
//                 />
//               </div>

//               <div className="mt-6">
//                 <label className="block text-sm font-medium mb-2">
//                   Profile Picture
//                 </label>

//                 {user?.profilePic?.status === "pending" && (
//                   <div className="mb-3 p-2 bg-yellow-100 text-yellow-800 rounded-md text-sm">
//                     Your profile picture is pending approval.
//                   </div>
//                 )}

//                 {user?.profilePic?.status === "disapproved" && (
//                   <div className="mb-3 p-2 bg-red-100 text-red-800 rounded-md text-sm">
//                     Your profile picture was disapproved. Please read our photo
//                     guidelines and submit a new one.
//                   </div>
//                 )}

//                 <ImageUploader
//                   initialImage={user?.profilePic?.url}
//                   onFileChange={handleFileChange}
//                   aspectRatio="1:1"
//                   maxSizeMB={5}
//                 />
//               </div>

//               <div className="pt-4 mt-4 border-t border-gray-200 space-y-3">
//                 <div className="flex items-center justify-between">
//                   <Link
//                     href="/dashboard/member/change-password"
//                     className="text-blue-600 hover:text-blue-800 text-sm font-medium"
//                   >
//                     Change Password
//                   </Link>
//                   <Link
//                     href="/dashboard/member/delete-account"
//                     className="text-red-600 hover:text-red-800 text-sm font-medium"
//                   >
//                     Delete Account
//                   </Link>
//                 </div>
//               </div>
//             </div>
//           </div>

//           <div className="pt-6 border-t border-gray-200 flex justify-between">
//             <CancelButton onClick={handleCancel} />
//             <SubmitButton />
//           </div>
//         </form>
//       </div>
//       {formLoading && (
//         <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
//           <div className="bg-white p-6 rounded-lg shadow-lg flex flex-col items-center">
//             <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-600 mb-4"></div>
//             <p className="text-lg font-medium">Updating profile...</p>
//           </div>
//         </div>
//       )}
//     </div>
//   );
// }
