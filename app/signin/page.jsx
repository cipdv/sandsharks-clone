"use client";

import { useSearchParams } from "next/navigation";
import SignInForm from "@/components/SignInForm";

const SignInPage = () => {
  const searchParams = useSearchParams();
  const redirectTo = searchParams.get("redirectTo");

  return (
    <section>
      <SignInForm redirectTo={redirectTo} />
    </section>
  );
};

export default SignInPage;

// import SignInForm from "@/components/SignInForm";

// const signInPage = () => {
//   return (
//     <section>
//       <SignInForm />;
//     </section>
//   );
// };

// export default signInPage;
