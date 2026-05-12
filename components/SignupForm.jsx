"use client";

import { useState } from "react";
import { registerNewMember } from "@/app/_actions";
import { useActionState } from "react";
import Image from "next/image";
import { ActionButton } from "./ActionButton";
import { ImageUploader } from "./ImageUploader";

const initialState = {
  success: null,
  message: "",
  firstName: "",
  lastName: "",
  email: "",
  pronouns: "",
  password: "",
  confirmPassword: "",
  formData: null,
};

const SignupForm = () => {
  const [state, formAction] = useActionState(registerNewMember, initialState);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [profilePicFile, setProfilePicFile] = useState(null);
  const [profilePicDataUrl, setProfilePicDataUrl] = useState("");
  const fieldClass =
    "w-full rounded-md border border-gray-300 bg-white px-3 py-2.5 text-base shadow-sm focus:border-sandsharks-magenta focus:outline-none focus:ring-2 focus:ring-sandsharks-lilac/60";
  const labelClass = "mb-1 block text-sm font-medium text-sandsharks-ink";

  // Use form data from state if available, otherwise use empty strings
  const formData = state?.formData || {};

  const togglePasswordVisibility = () => {
    setShowPassword(!showPassword);
  };

  const toggleConfirmPasswordVisibility = () => {
    setShowConfirmPassword(!showConfirmPassword);
  };

  const handleFileChange = (file) => {
    setProfilePicFile(file);

    // If the file is a data URL (base64), store it directly
    if (typeof file === "string" && file.startsWith("data:")) {
      setProfilePicDataUrl(file);
    }
    // If it's a File object, convert it to a data URL
    else if (file instanceof File) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setProfilePicDataUrl(reader.result);
      };
      reader.readAsDataURL(file);
    }
  };

  return (
    <form
      action={formAction}
      className="mx-auto mt-6 w-full max-w-3xl rounded-lg border border-sandsharks-magenta/30 bg-blue-100 p-4 shadow-md sm:p-6 lg:p-8"
    >
      <h1 className="text-2xl font-bold">Become a Sandsharks Member</h1>
      <div className="glassmorphism mt-6 space-y-8">
        <div>
          <h2 className="mb-4 text-lg font-semibold">Personal information</h2>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div>
              <label htmlFor="firstName" className={labelClass}>
                First Name
              </label>
              <input
                type="text"
                id="firstName"
                name="firstName"
                placeholder="The name you go by"
                defaultValue={formData.firstName || ""}
                required
                className={fieldClass}
              />
            </div>

            <div>
              <label htmlFor="lastName" className={labelClass}>
                Last Name
              </label>
              <input
                type="text"
                id="lastName"
                name="lastName"
                placeholder="Full last name"
                defaultValue={formData.lastName || ""}
                required
                className={fieldClass}
              />
            </div>

            <div>
              <label htmlFor="pronouns" className={labelClass}>
                Pronouns
              </label>
              <select
                id="pronouns"
                name="pronouns"
                defaultValue={formData.pronouns || ""}
                key={`pronouns-${formData.pronouns || "empty"}`} // Force re-render when formData changes
                required
                className={fieldClass}
              >
                <option value="" disabled="disabled">
                  Select
                </option>
                <option value="they/them">They/them</option>
                <option value="she/her">She/her</option>
                <option value="he/him">He/him</option>
                <option value="other">Other</option>
              </select>
            </div>
          </div>
        </div>

        <div>
          <label
            htmlFor="instagramHandle"
            className={labelClass}
          >
            Instagram Handle{" "}
            <span className="text-gray-500 text-xs">(Optional)</span>
          </label>
          <div className="flex items-center">
            <div className="self-stretch rounded-l-md border border-r-0 border-gray-300 bg-white px-3 py-2.5">
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
                <rect x="2" y="2" width="20" height="20" rx="5" ry="5"></rect>
                <path d="M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z"></path>
                <line x1="17.5" y1="6.5" x2="17.51" y2="6.5"></line>
              </svg>
            </div>
            <input
              type="text"
              id="instagramHandle"
              name="instagramHandle"
              placeholder="yourusername"
              defaultValue={formData.instagramHandle || ""}
              className="w-full rounded-r-md border border-gray-300 bg-white px-3 py-2.5 text-base shadow-sm focus:border-sandsharks-magenta focus:outline-none focus:ring-2 focus:ring-sandsharks-lilac/60"
            />
          </div>
          <p className="text-xs text-gray-500 mt-1">
            Just enter your username without the @ symbol
          </p>
        </div>

        <div>
          <label className="block text-sm font-medium mb-2">
            Profile Picture{" "}
            <span className="text-gray-500 text-xs">(Optional)</span>
          </label>
          <div className="mb-2 text-sm text-gray-600">
            Upload a profile picture now or add one later from your profile
            page.
          </div>
          <div className="max-w-[150px]">
            <ImageUploader
              initialImage={null}
              onFileChange={handleFileChange}
              aspectRatio="1:1"
              maxSizeMB={5}
              previewSize="small"
            />
          </div>

          {/* Hidden input to store the profile picture data URL */}
          <input
            type="hidden"
            name="profilePictureDataUrl"
            value={profilePicDataUrl}
          />
        </div>

        <div>
          <h2 className="mb-4 text-lg font-semibold">Login information</h2>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div className="sm:col-span-2">
              <label htmlFor="email" className={labelClass}>
                Email
              </label>
              <input
                type="email"
                id="email"
                name="email"
                placeholder="Will be used as login"
                defaultValue={formData.email || ""}
                required
                className={fieldClass}
              />
              {state?.email && (
                <p className="mt-2 text-sm font-bold text-red-500" role="alert">
                  {state.email}
                </p>
              )}
            </div>

            <div>
              <label htmlFor="password" className={labelClass}>
                Password
              </label>
              <div className="relative">
                <input
                  type={showPassword ? "text" : "password"}
                  id="password"
                  name="password"
                  placeholder="6 characters minimum"
                  key={state?.password ? "password-error" : "password-normal"} // Force re-render to clear on error
                  required
                  className={`${fieldClass} pr-11`}
                />
                <button
                  type="button"
                  onClick={togglePasswordVisibility}
                  className="absolute inset-y-0 right-0 flex w-10 items-center justify-center"
                  aria-label={showPassword ? "Hide password" : "Show password"}
                >
                  {showPassword ? (
                    <Image
                      src="/images/icons8-hide-16.png"
                      alt="Hide password"
                      width={16}
                      height={16}
                      unoptimized
                    />
                  ) : (
                    <Image
                      src="/images/icons8-eye-16.png"
                      alt="Show password"
                      width={16}
                      height={16}
                      unoptimized
                    />
                  )}
                </button>
              </div>
              {state?.password && (
                <p className="mt-2 text-sm font-bold text-red-500" role="alert">
                  {state.password}
                </p>
              )}
            </div>

            <div>
              <label htmlFor="confirmPassword" className={labelClass}>
                Confirm Password
              </label>
              <div className="relative">
                <input
                  type={showConfirmPassword ? "text" : "password"}
                  id="confirmPassword"
                  name="confirmPassword"
                  placeholder="Confirm password"
                  key={
                    state?.confirmPassword
                      ? "confirm-password-error"
                      : "confirm-password-normal"
                  } // Force re-render to clear on error
                  required
                  className={`${fieldClass} pr-11`}
                />
                <button
                  type="button"
                  onClick={toggleConfirmPasswordVisibility}
                  className="absolute inset-y-0 right-0 flex w-10 items-center justify-center"
                  aria-label={
                    showConfirmPassword
                      ? "Hide confirm password"
                      : "Show confirm password"
                  }
                >
                  {showConfirmPassword ? (
                    <Image
                      src="/images/icons8-hide-16.png"
                      alt="Hide password"
                      width={16}
                      height={16}
                      unoptimized
                    />
                  ) : (
                    <Image
                      src="/images/icons8-eye-16.png"
                      alt="Show password"
                      width={16}
                      height={16}
                      unoptimized
                    />
                  )}
                </button>
              </div>
              {state?.confirmPassword && (
                <p className="mt-2 text-sm font-bold text-red-500" role="alert">
                  {state.confirmPassword}
                </p>
              )}
            </div>
          </div>
        </div>

        {state?.message && (
          <p className="text-red-500 text-lg font-bold" role="alert">
            {state.message}
          </p>
        )}

        <div className="flex justify-end">
          <ActionButton className="w-full sm:w-auto sm:min-w-36">
            Sign up
          </ActionButton>
        </div>
      </div>
    </form>
  );
};

export default SignupForm;

// "use client";

// import { useState } from "react";
// import { registerNewMember } from "@/app/_actions";
// import { useActionState } from "react";
// import { ActionButton } from "./ActionButton";
// import { ImageUploader } from "./ImageUploader";

// const initialState = {
//   success: null,
//   message: "",
//   firstName: "",
//   lastName: "",
//   email: "",
//   pronouns: "",
//   password: "",
//   confirmPassword: "",
// };

// const SignupForm = () => {
//   const [state, formAction] = useActionState(registerNewMember, initialState);
//   const [showPassword, setShowPassword] = useState(false);
//   const [showConfirmPassword, setShowConfirmPassword] = useState(false);
//   const [profilePicFile, setProfilePicFile] = useState(null);
//   const [profilePicDataUrl, setProfilePicDataUrl] = useState("");

//   const togglePasswordVisibility = () => {
//     setShowPassword(!showPassword);
//   };

//   const toggleConfirmPasswordVisibility = () => {
//     setShowConfirmPassword(!showConfirmPassword);
//   };

//   const handleFileChange = (file) => {
//     setProfilePicFile(file);

//     // If the file is a data URL (base64), store it directly
//     if (typeof file === "string" && file.startsWith("data:")) {
//       setProfilePicDataUrl(file);
//     }
//     // If it's a File object, convert it to a data URL
//     else if (file instanceof File) {
//       const reader = new FileReader();
//       reader.onloadend = () => {
//         setProfilePicDataUrl(reader.result);
//       };
//       reader.readAsDataURL(file);
//     }
//   };

//   return (
//     <form
//       action={formAction}
//       className="bg-blue-100 p-4 rounded-md mt-6 w-full lg:w-2/5 mx-auto"
//     >
//       <h1 className="text-2xl font-bold">Become a Sandsharks Member</h1>
//       <div className="flex flex-col gap-3 glassmorphism mt-4">
//         <h1>Personal information</h1>
//         <label htmlFor="firstName">First Name</label>
//         <input
//           type="text"
//           id="firstName"
//           name="firstName"
//           placeholder="The name you go by"
//           required
//           className="bg-gray-100 p-2 rounded-l-md border border-r-0 border-gray-300"
//         />

//         <label htmlFor="lastName">Last Name</label>
//         <input
//           type="text"
//           id="lastName"
//           name="lastName"
//           placeholder="Full last name"
//           required
//           className="bg-gray-100 p-2 rounded-l-md border border-r-0 border-gray-300"
//         />

//         <label htmlFor="pronouns">Pronouns</label>
//         <select
//           id="pronouns"
//           name="pronouns"
//           defaultValue={""}
//           required
//           className="bg-gray-100 p-2 rounded-l-md border border-r-0 border-gray-300"
//         >
//           <option value="" disabled="disabled">
//             Select
//           </option>
//           <option value="they/them">They/them</option>
//           <option value="she/her">She/her</option>
//           <option value="he/him">He/him</option>
//           <option value="other">Other</option>
//         </select>

//         <div className="mt-2">
//           <label
//             htmlFor="instagramHandle"
//             className="block text-sm font-medium mb-1"
//           >
//             Instagram Handle{" "}
//             <span className="text-gray-500 text-xs">(Optional)</span>
//           </label>
//           <div className="flex items-center">
//             <div className="bg-gray-100 p-2 rounded-l-md border border-r-0 border-gray-300">
//               <svg
//                 xmlns="http://www.w3.org/2000/svg"
//                 width="20"
//                 height="20"
//                 viewBox="0 0 24 24"
//                 fill="none"
//                 stroke="currentColor"
//                 strokeWidth="2"
//                 strokeLinecap="round"
//                 strokeLinejoin="round"
//                 className="text-pink-600"
//               >
//                 <rect x="2" y="2" width="20" height="20" rx="5" ry="5"></rect>
//                 <path d="M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z"></path>
//                 <line x1="17.5" y1="6.5" x2="17.51" y2="6.5"></line>
//               </svg>
//             </div>
//             <input
//               type="text"
//               id="instagramHandle"
//               name="instagramHandle"
//               placeholder="yourusername"
//               className="w-full p-2 border border-gray-300 rounded-r-md"
//             />
//           </div>
//           <p className="text-xs text-gray-500 mt-1">
//             Just enter your username without the @ symbol
//           </p>
//         </div>

//         <div className="mt-4">
//           <label className="block text-sm font-medium mb-2">
//             Profile Picture{" "}
//             <span className="text-gray-500 text-xs">(Optional)</span>
//           </label>
//           <div className="mb-2 text-sm text-gray-600">
//             Upload a profile picture now or add one later from your profile
//             page.
//           </div>
//           <div className="max-w-[150px]">
//             <ImageUploader
//               initialImage={null}
//               onFileChange={handleFileChange}
//               aspectRatio="1:1"
//               maxSizeMB={5}
//               previewSize="small"
//             />
//           </div>

//           {/* Hidden input to store the profile picture data URL */}
//           <input
//             type="hidden"
//             name="profilePictureDataUrl"
//             value={profilePicDataUrl}
//           />
//         </div>

//         <h1 className="mt-4">Login information</h1>
//         <label htmlFor="email">Email</label>
//         <input
//           type="email"
//           id="email"
//           name="email"
//           placeholder="Will be used as login"
//           required
//           className="bg-gray-100 p-2 rounded-l-md border border-r-0 border-gray-300"
//         />
//         {state?.email && (
//           <p className="text-red-500 text-lg font-bold" role="alert">
//             {state.email}
//           </p>
//         )}

//         <label htmlFor="password">Password</label>
//         <div className="flex items-center">
//           <input
//             type={showPassword ? "text" : "password"}
//             id="password"
//             name="password"
//             placeholder="6 characters minimum"
//             required
//             className="bg-gray-100 p-2 rounded-l-md border border-r-0 border-gray-300"
//           />
//           <button
//             type="button"
//             onClick={togglePasswordVisibility}
//             className="ml-2"
//             aria-label={showPassword ? "Hide password" : "Show password"}
//           >
//             {showPassword ? (
//               <img src="/images/icons8-hide-16.png" alt="Hide password" />
//             ) : (
//               <img src="/images/icons8-eye-16.png" alt="Show password" />
//             )}
//           </button>
//         </div>
//         {state?.password && (
//           <p className="text-red-500 text-lg font-bold" role="alert">
//             {state.password}
//           </p>
//         )}

//         <label htmlFor="confirmPassword">Confirm Password</label>
//         <div className="flex items-center mb-4">
//           <input
//             type={showConfirmPassword ? "text" : "password"}
//             id="confirmPassword"
//             name="confirmPassword"
//             placeholder="Confirm password"
//             required
//             className="bg-gray-100 p-2 rounded-l-md border border-r-0 border-gray-300"
//           />
//           <button
//             type="button"
//             onClick={toggleConfirmPasswordVisibility}
//             className="ml-2"
//             aria-label={
//               showConfirmPassword
//                 ? "Hide confirm password"
//                 : "Show confirm password"
//             }
//           >
//             {showConfirmPassword ? (
//               <img src="/images/icons8-hide-16.png" alt="Hide password" />
//             ) : (
//               <img src="/images/icons8-eye-16.png" alt="Show password" />
//             )}
//           </button>
//         </div>
//         {state?.confirmPassword && (
//           <p className="text-red-500 text-lg font-bold" role="alert">
//             {state.confirmPassword}
//           </p>
//         )}

//         {state?.message && (
//           <p className="text-red-500 text-lg font-bold" role="alert">
//             {state.message}
//           </p>
//         )}

//         <ActionButton className="w-2/5">Sign up</ActionButton>
//       </div>
//     </form>
//   );
// };

// export default SignupForm;
