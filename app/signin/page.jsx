"use client";

import { useSearchParams } from "next/navigation";
import SignInForm from "@/components/SignInForm";

const SignInPage = () => {
  const searchParams = useSearchParams();
  const redirectTo = searchParams.get("redirectTo");
  const emailTarget = searchParams.get("emailTarget");

  return (
    <section>
      <SignInForm redirectTo={redirectTo} emailTarget={emailTarget} />
    </section>
  );
};

export default SignInPage;

// "use client";

// import { useSearchParams } from "next/navigation";
// import SignInForm from "@/components/SignInForm";

// const SignInPage = () => {
//   const searchParams = useSearchParams();
//   const redirectTo = searchParams.get("redirectTo");

//   return (
//     <section>
//       <SignInForm redirectTo={redirectTo} />
//     </section>
//   );
// };

// export default SignInPage;
