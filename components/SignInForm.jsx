"use client";

import { login } from "@/app/lib/auth";
import { useActionState } from "react";
import Link from "next/link";
import { useState } from "react";
import { ActionButton } from "./ActionButton";

const initialState = {
  email: "",
  password: "",
  message: "",
};

const SignInForm = ({ redirectTo }) => {
  const [state, formAction] = useActionState(login, initialState);
  const [showPassword, setShowPassword] = useState(false);

  const togglePasswordVisibility = () => {
    setShowPassword(!showPassword);
  };

  // Create a wrapper function to handle the form submission
  const handleFormAction = async (formData) => {
    // If redirectTo exists, add it to the formData
    if (redirectTo) {
      formData.append("redirectTo", redirectTo);
    }

    // Call the original formAction
    return formAction(formData);
  };

  return (
    <form
      action={handleFormAction}
      className="bg-blue-100 p-4 rounded-md mt-6 w-full lg:w-2/5 mx-auto"
    >
      <h1 className="text-2xl font-bold mb-4">Sign in</h1>
      <input
        type="email"
        placeholder="Email"
        name="email"
        required
        className="block mb-4 p-2"
      />

      <div className="flex items-center">
        <input
          type={showPassword ? "text" : "password"}
          placeholder="Password"
          name="password"
          required
          className="block mr-2 p-2"
        />
        <button
          type="button"
          onClick={togglePasswordVisibility}
          className="ml-2"
        >
          {showPassword ? (
            <img src="/images/icons8-hide-16.png" alt="Hide password" />
          ) : (
            <img src="/images/icons8-eye-16.png" alt="Show password" />
          )}
        </button>
      </div>
      {state?.email && (
        <p className="text-red-500 text-lg text-bold">{state?.email}</p>
      )}
      {state?.password && (
        <p className="text-red-500 text-lg text-bold">{state?.password}</p>
      )}
      {state?.message && (
        <p className="text-red-500 text-lg text-bold">{state?.message}</p>
      )}
      <ActionButton className="mt-4">Sign in</ActionButton>
      <h2 className="mt-4">
        <Link href="/signup">
          Haven't signed up yet? Click here to sign up.
        </Link>
      </h2>
      <h2 className="mt-4 text-black">
        <Link href="/password-reset">Forgot your password? Click here.</Link>
      </h2>

      {/* If there's a redirectTo, add a hidden input to preserve it */}
      {redirectTo && (
        <input type="hidden" name="redirectTo" value={redirectTo} />
      )}
    </form>
  );
};

export default SignInForm;

// "use client";

// import { login } from "@/app/lib/auth";
// import { useActionState } from "react"; // Updated import
// import Link from "next/link";
// import { useState } from "react";
// import { ActionButton } from "./ActionButton";

// const initialState = {
//   email: "",
//   password: "",
//   message: "",
// };

// const SignInForm = () => {
//   // Changed from useFormState to useActionState
//   const [state, formAction] = useActionState(login, initialState);

//   const [showPassword, setShowPassword] = useState(false);

//   const togglePasswordVisibility = () => {
//     setShowPassword(!showPassword);
//   };

//   return (
//     <form
//       action={formAction}
//       className="bg-blue-100 p-4 rounded-md mt-6 w-full lg:w-2/5 mx-auto"
//     >
//       <h1 className="text-2xl font-bold mb-4">Sign in</h1>
//       <input
//         type="email"
//         placeholder="Email"
//         name="email"
//         required
//         className="block mb-4 p-2"
//       />

//       <div className="flex items-center">
//         <input
//           type={showPassword ? "text" : "password"}
//           placeholder="Password"
//           name="password"
//           required
//           className="block mr-2 p-2"
//         />
//         <button
//           type="button"
//           onClick={togglePasswordVisibility}
//           className="ml-2"
//         >
//           {showPassword ? (
//             <img src="/images/icons8-hide-16.png" alt="Hide password" />
//           ) : (
//             <img src="/images/icons8-eye-16.png" alt="Show password" />
//           )}
//         </button>
//       </div>
//       {state?.email && (
//         <p className="text-red-500 text-lg text-bold">{state?.email}</p>
//       )}
//       {state?.password && (
//         <p className="text-red-500 text-lg text-bold">{state?.password}</p>
//       )}
//       {state?.message && (
//         <p className="text-red-500 text-lg text-bold">{state?.message}</p>
//       )}
//       <ActionButton className="mt-4">Sign in</ActionButton>
//       <h2 className="mt-4">
//         <Link href="/signup">
//           Haven't signed up yet? Click here to sign up.
//         </Link>
//       </h2>
//       <h2 className="mt-4 text-black">
//         <Link href="/password-reset">Forgot your password? Click here.</Link>
//       </h2>
//     </form>
//   );
// };

// export default SignInForm;

// // "use client";

// // import { login } from "@/app/lib/auth";
// // import { useActionState } from "react"; // Updated import
// // import { useFormStatus } from "react-dom"; // This is still from react-dom
// // import Link from "next/link";
// // import { useState } from "react";

// // const initialState = {
// //   email: "",
// //   password: "",
// //   message: "",
// // };

// // function SubmitButton() {
// //   const { pending } = useFormStatus();

// //   return (
// //     <button type="submit" aria-disabled={pending} className="btn mt-4">
// //       {pending ? "Signing in..." : "Sign in"}
// //     </button>
// //   );
// // }

// // const SignInForm = () => {
// //   // Changed from useFormState to useActionState
// //   const [state, formAction] = useActionState(login, initialState);

// //   const [showPassword, setShowPassword] = useState(false);

// //   const togglePasswordVisibility = () => {
// //     setShowPassword(!showPassword);
// //   };

// //   return (
// //     <form
// //       action={formAction}
// //       className="bg-blue-100 p-4 rounded-md mt-6 w-full lg:w-2/5 mx-auto"
// //     >
// //       <h1 className="text-2xl font-bold mb-4">Sign in</h1>
// //       <input
// //         type="email"
// //         placeholder="Email"
// //         name="email"
// //         required
// //         className="block mb-4 p-2"
// //       />

// //       <div className="flex items-center">
// //         <input
// //           type={showPassword ? "text" : "password"}
// //           placeholder="Password"
// //           name="password"
// //           required
// //           className="block mr-2 p-2"
// //         />
// //         <button
// //           type="button"
// //           onClick={togglePasswordVisibility}
// //           className="ml-2"
// //         >
// //           {showPassword ? (
// //             <img src="/images/icons8-hide-16.png" alt="Hide password" />
// //           ) : (
// //             <img src="/images/icons8-eye-16.png" alt="Show password" />
// //           )}
// //         </button>
// //       </div>
// //       {state?.email && (
// //         <p className="text-red-500 text-lg text-bold">{state?.email}</p>
// //       )}
// //       {state?.password && (
// //         <p className="text-red-500 text-lg text-bold">{state?.password}</p>
// //       )}
// //       {state?.message && (
// //         <p className="text-red-500 text-lg text-bold">{state?.message}</p>
// //       )}
// //       <SubmitButton />
// //       <h2 className="mt-4">
// //         <Link href="/signup">
// //           Haven't signed up yet? Click here to sign up.
// //         </Link>
// //       </h2>
// //       <h2 className="mt-4 text-black">
// //         <Link href="/password-reset">Forgot your password? Click here.</Link>
// //       </h2>
// //     </form>
// //   );
// // };

// // export default SignInForm;
