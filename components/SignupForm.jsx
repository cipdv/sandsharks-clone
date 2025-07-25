"use client";

import { useState } from "react";
import { registerNewMember } from "@/app/_actions";
import { useActionState } from "react";
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
      className="bg-blue-100 p-4 rounded-md mt-6 w-full lg:w-2/5 mx-auto"
    >
      <h1 className="text-2xl font-bold">Become a Sandsharks Member</h1>
      <div className="flex flex-col gap-3 glassmorphism mt-4">
        <h1>Personal information</h1>
        <label htmlFor="firstName">First Name</label>
        <input
          type="text"
          id="firstName"
          name="firstName"
          placeholder="The name you go by"
          defaultValue={formData.firstName || ""}
          required
          className="bg-gray-100 p-2 rounded-l-md border border-r-0 border-gray-300"
        />

        <label htmlFor="lastName">Last Name</label>
        <input
          type="text"
          id="lastName"
          name="lastName"
          placeholder="Full last name"
          defaultValue={formData.lastName || ""}
          required
          className="bg-gray-100 p-2 rounded-l-md border border-r-0 border-gray-300"
        />

        <label htmlFor="pronouns">Pronouns</label>
        <select
          id="pronouns"
          name="pronouns"
          defaultValue={formData.pronouns || ""}
          key={`pronouns-${formData.pronouns || "empty"}`} // Force re-render when formData changes
          required
          className="bg-gray-100 p-2 rounded-l-md border border-r-0 border-gray-300"
        >
          <option value="" disabled="disabled">
            Select
          </option>
          <option value="they/them">They/them</option>
          <option value="she/her">She/her</option>
          <option value="he/him">He/him</option>
          <option value="other">Other</option>
        </select>

        <div className="mt-2">
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
              className="w-full p-2 border border-gray-300 rounded-r-md"
            />
          </div>
          <p className="text-xs text-gray-500 mt-1">
            Just enter your username without the @ symbol
          </p>
        </div>

        <div className="mt-4">
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

        <h1 className="mt-4">Login information</h1>
        <label htmlFor="email">Email</label>
        <input
          type="email"
          id="email"
          name="email"
          placeholder="Will be used as login"
          defaultValue={formData.email || ""}
          required
          className="bg-gray-100 p-2 rounded-l-md border border-r-0 border-gray-300"
        />
        {state?.email && (
          <p className="text-red-500 text-lg font-bold" role="alert">
            {state.email}
          </p>
        )}

        <label htmlFor="password">Password</label>
        <div className="flex items-center">
          <input
            type={showPassword ? "text" : "password"}
            id="password"
            name="password"
            placeholder="6 characters minimum"
            key={state?.password ? "password-error" : "password-normal"} // Force re-render to clear on error
            required
            className="bg-gray-100 p-2 rounded-l-md border border-r-0 border-gray-300"
          />
          <button
            type="button"
            onClick={togglePasswordVisibility}
            className="ml-2"
            aria-label={showPassword ? "Hide password" : "Show password"}
          >
            {showPassword ? (
              <img src="/images/icons8-hide-16.png" alt="Hide password" />
            ) : (
              <img src="/images/icons8-eye-16.png" alt="Show password" />
            )}
          </button>
        </div>
        {state?.password && (
          <p className="text-red-500 text-lg font-bold" role="alert">
            {state.password}
          </p>
        )}

        <label htmlFor="confirmPassword">Confirm Password</label>
        <div className="flex items-center mb-4">
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
            className="bg-gray-100 p-2 rounded-l-md border border-r-0 border-gray-300"
          />
          <button
            type="button"
            onClick={toggleConfirmPasswordVisibility}
            className="ml-2"
            aria-label={
              showConfirmPassword
                ? "Hide confirm password"
                : "Show confirm password"
            }
          >
            {showConfirmPassword ? (
              <img src="/images/icons8-hide-16.png" alt="Hide password" />
            ) : (
              <img src="/images/icons8-eye-16.png" alt="Show password" />
            )}
          </button>
        </div>
        {state?.confirmPassword && (
          <p className="text-red-500 text-lg font-bold" role="alert">
            {state.confirmPassword}
          </p>
        )}

        {state?.message && (
          <p className="text-red-500 text-lg font-bold" role="alert">
            {state.message}
          </p>
        )}

        <ActionButton className="w-2/5">Sign up</ActionButton>
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
