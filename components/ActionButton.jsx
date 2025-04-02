// components/ActionButton.jsx
"use client";

import { useFormStatus } from "react-dom";
import { useState, useEffect } from "react";
import Image from "next/image";

export function ActionButton({
  children,
  className = "",
  onClick,
  disabled = false,
}) {
  const { pending } = useFormStatus();
  const [isLoading, setIsLoading] = useState(false);

  // Reset loading state when pending changes
  useEffect(() => {
    if (!pending) {
      setIsLoading(false);
    }
  }, [pending]);

  const handleClick = async (e) => {
    if (onClick) {
      setIsLoading(true);
      onClick(e);
    }
  };

  const isButtonLoading = pending || isLoading;
  const isDisabled = isButtonLoading || disabled;

  return (
    <button
      type={onClick ? "button" : "submit"}
      disabled={isDisabled}
      className={`btn ${className} ${isDisabled ? "opacity-80" : ""}`}
      onClick={onClick ? handleClick : undefined}
    >
      {isButtonLoading ? (
        <span className="flex items-center justify-center">
          <div className="rotating-logo -ml-1 mr-2">
            <Image
              src="/images/sandsharks-outline-icon.svg"
              alt=""
              width={16}
              height={16}
              className="object-contain"
            />
          </div>
          <span className="hidden sm:inline">Loading...</span>
          <span className="sm:hidden">...</span>
        </span>
      ) : (
        children
      )}
    </button>
  );
}

// "use client";

// import { useFormStatus } from "react-dom";

// export function ActionButton({ children, className = "" }) {
//   const { pending } = useFormStatus();

//   return (
//     <button
//       type="submit"
//       disabled={pending}
//       className={`btn ${className} ${pending ? "opacity-80" : ""}`}
//     >
//       {pending ? (
//         <span className="flex items-center justify-center">
//           <svg
//             className="animate-spin -ml-1 mr-2 h-4 w-4 text-current"
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
//           <span className="hidden sm:inline">Loading...</span>
//           <span className="sm:hidden">...</span>
//         </span>
//       ) : (
//         children
//       )}
//     </button>
//   );
// }
