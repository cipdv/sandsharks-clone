"use client";
import { useState } from "react";
import { useActionState } from "react";
import { useFormStatus } from "react-dom";
import { setNewPassword } from "@/app/_actions";
import Link from "next/link";
import { use } from "react"; // Add this import

const initialState = {
  message: "",
  error: "",
};

function SubmitButton() {
  const { pending } = useFormStatus();

  return (
    <button type="submit" aria-disabled={pending} className="btn mt-4">
      {pending ? "Submitting..." : "Set new password"}
    </button>
  );
}

const setNewPasswordPage = ({ params }) => {
  // Unwrap params with React.use()
  const resolvedParams = use(params);
  const token = resolvedParams.token;

  const [state, formAction, isPending] = useActionState(
    setNewPassword,
    initialState
  );
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  const togglePasswordVisibility = () => {
    setShowPassword(!showPassword);
  };

  const toggleConfirmPasswordVisibility = () => {
    setShowConfirmPassword(!showConfirmPassword);
  };

  return (
    <section>
      <form
        action={formAction}
        className="bg-blue-100 p-4 rounded-md mt-6 w-full sm:w-4/5 md:w-3/5 lg:w-2/5 xl:w-1/3 mx-auto max-w-md"
      >
        <input type="hidden" name="token" value={token} />
        <label htmlFor="password">New password</label>
        <div className="flex items-center mb-4 mt-2">
          <input
            type={showPassword ? "text" : "password"}
            id="password"
            name="password"
            placeholder="Must be at least 6 characters long"
            required
            className="block mr-2 flex-grow p-2"
          />
          <button
            type="button"
            onClick={togglePasswordVisibility}
            className="ml-2"
          >
            {showPassword ? "Hide password" : "Show password"}
          </button>
        </div>
        <label htmlFor="confirmPassword">Confirm new password</label>
        <div className="flex items-center mb-4 mt-2">
          <input
            type={showConfirmPassword ? "text" : "password"}
            id="confirmPassword"
            name="confirmPassword"
            placeholder="Must be at least 6 characters long"
            required
            className="block mr-2 flex-grow p-2"
          />
          <button
            type="button"
            onClick={toggleConfirmPasswordVisibility}
            className="ml-2"
          >
            {showConfirmPassword ? "Hide password" : "Show password"}
          </button>
        </div>
        {state?.message ? (
          <>
            <h1 className="text-green-500">{state?.message}</h1>
            <h1>
              <Link href="/signin">Click here to sign in.</Link>
            </h1>
          </>
        ) : (
          <>
            {state?.error && <h1 className="text-red-500">{state?.error}</h1>}
            {state?.error?.includes(
              "Password reset token is invalid or has expired"
            ) && (
              <h1>
                <Link href="/password-reset">
                  Click here to send a new token.
                </Link>
              </h1>
            )}
            <SubmitButton />
          </>
        )}
      </form>
    </section>
  );
};

export default setNewPasswordPage;

// "use client";
// import { useState } from "react";
// import { useActionState } from "react";
// import { useFormStatus } from "react-dom";
// import { setNewPassword } from "@/app/_actions";
// import Link from "next/link";
// import { use } from "react"; // Add this import

// const initialState = {
//   message: "",
//   error: "",
// };

// function SubmitButton() {
//   const { pending } = useFormStatus();

//   return (
//     <button type="submit" aria-disabled={pending} className="btn mt-4">
//       {pending ? "Submitting..." : "Set new password"}
//     </button>
//   );
// }

// const setNewPasswordPage = ({ params }) => {
//   // Unwrap params with React.use()
//   const resolvedParams = use(params);
//   const token = resolvedParams.token;

//   const [state, formAction, isPending] = useActionState(
//     setNewPassword,
//     initialState
//   );
//   const [showPassword, setShowPassword] = useState(false);
//   const [showConfirmPassword, setShowConfirmPassword] = useState(false);

//   const togglePasswordVisibility = () => {
//     setShowPassword(!showPassword);
//   };

//   const toggleConfirmPasswordVisibility = () => {
//     setShowConfirmPassword(!showConfirmPassword);
//   };

//   return (
//     <section>
//       <form
//         action={formAction}
//         className="bg-blue-100 p-4 rounded-md mt-6 w-full lg:w-3/5 mx-auto"
//       >
//         <input type="hidden" name="token" value={token} />
//         <label htmlFor="password">New password</label>
//         <div className="flex items-center mb-4">
//           <input
//             type={showPassword ? "text" : "password"}
//             id="password"
//             name="password"
//             placeholder="Must be at least 6 characters long"
//             required
//             className="block mr-2 flex-grow p-2"
//           />
//           <button
//             type="button"
//             onClick={togglePasswordVisibility}
//             className="ml-2"
//           >
//             {showPassword ? "Hide password" : "Show password"}
//           </button>
//         </div>
//         <label htmlFor="confirmPassword">Confirm new password</label>
//         <div className="flex items-center mb-4">
//           <input
//             type={showConfirmPassword ? "text" : "password"}
//             id="confirmPassword"
//             name="confirmPassword"
//             placeholder="Must be at least 6 characters long"
//             required
//             className="block mr-2 flex-grow p-2"
//           />
//           <button
//             type="button"
//             onClick={toggleConfirmPasswordVisibility}
//             className="ml-2"
//           >
//             {showConfirmPassword ? "Hide password" : "Show password"}
//           </button>
//         </div>
//         {state?.message ? (
//           <>
//             <h1 className="text-green-500">{state?.message}</h1>
//             <h1>
//               <Link href="/signin">Click here to sign in.</Link>
//             </h1>
//           </>
//         ) : (
//           <>
//             {state?.error && <h1 className="text-red-500">{state?.error}</h1>}
//             {state?.error?.includes(
//               "Password reset token is invalid or has expired"
//             ) && (
//               <h1>
//                 <Link href="/password-reset">
//                   Click here to send a new token.
//                 </Link>
//               </h1>
//             )}
//             <SubmitButton />
//           </>
//         )}
//       </form>
//     </section>
//   );
// };

// export default setNewPasswordPage;
