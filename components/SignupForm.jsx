"use client";

import { useState } from "react";
import {
  createGuestPaymentIntent,
  recordGuestDonation,
  registerNewMember,
  validateNewMemberSignup,
} from "@/app/_actions";
import Image from "next/image";
import { ActionButton } from "./ActionButton";
import { ImageUploader } from "./ImageUploader";
import { loadStripe } from "@stripe/stripe-js";
import {
  CardCvcElement,
  CardExpiryElement,
  CardNumberElement,
  Elements,
  useElements,
  useStripe,
} from "@stripe/react-stripe-js";
import { Lock, ShieldCheck } from "lucide-react";

const stripePromise = loadStripe(
  process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY,
);

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

function SignupFormContent({ redirectTo }) {
  const stripe = useStripe();
  const elements = useElements();
  const [state, setState] = useState(initialState);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [profilePicFile, setProfilePicFile] = useState(null);
  const [profilePicDataUrl, setProfilePicDataUrl] = useState("");
  const [policyAgreement, setPolicyAgreement] = useState(false);
  const [showPolicies, setShowPolicies] = useState(false);
  const [includeDonation, setIncludeDonation] = useState(false);
  const [donationAmount, setDonationAmount] = useState("40");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const fieldClass =
    "w-full rounded-md border border-gray-300 bg-white px-3 py-2.5 text-base shadow-sm focus:border-sandsharks-magenta focus:outline-none focus:ring-2 focus:ring-sandsharks-lilac/60";
  const labelClass = "mb-1 block text-sm font-medium text-sandsharks-ink";
  const sectionClass = "w-full";
  const panelClass = "box-border w-full rounded-md border bg-white p-4";
  const stripeElementOptions = {
    style: {
      base: {
        fontSize: "16px",
        color: "#424770",
        "::placeholder": { color: "#aab7c4" },
      },
    },
  };

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

  async function handleSubmit(event) {
    event.preventDefault();
    const form = event.currentTarget;
    const nextFormData = new FormData(form);

    setState(initialState);

    if (!policyAgreement) {
      setState({
        ...initialState,
        message:
          "You must agree to the waiver, privacy policy, and photo consent policy before signing up.",
        formData: Object.fromEntries(nextFormData.entries()),
      });
      return;
    }

    if (includeDonation && (!stripe || !elements)) {
      setState({
        ...initialState,
        message: "The donation form is still loading. Please try again.",
        formData: Object.fromEntries(nextFormData.entries()),
      });
      return;
    }

    nextFormData.set("policyAgreement", "on");

    if (!includeDonation) {
      const confirmedNoDonation = window.confirm(
        'Please confirm that you would not like to make a donation at this time. Donations can be made anytime by logging into your dashboard and clicking the "make a donation" button.\n\nClick "OK" to confirm you do not want to donate at this time".\nClick "Cancel" to go back to make a donation now.',
      );

      if (!confirmedNoDonation) {
        return;
      }
    }

    setIsSubmitting(true);

    try {
      if (includeDonation) {
        const validationResult = await validateNewMemberSignup(nextFormData);

        if (!validationResult.success) {
          setState({
            ...initialState,
            ...validationResult,
          });
          return;
        }

        const firstName = String(nextFormData.get("firstName") || "").trim();
        const lastName = String(nextFormData.get("lastName") || "").trim();
        const email = String(nextFormData.get("email") || "").trim();
        const cardElement = elements.getElement(CardNumberElement);

        const { clientSecret } = await createGuestPaymentIntent(
          donationAmount,
          {
            name: `${firstName} ${lastName}`.trim(),
            email,
          },
        );
        const { error, paymentIntent } = await stripe.confirmCardPayment(
          clientSecret,
          {
            payment_method: {
              card: cardElement,
              billing_details: {
                name: `${firstName} ${lastName}`.trim(),
                email,
              },
            },
          },
        );

        if (error) {
          setState({
            ...initialState,
            message: `Payment failed: ${error.message}`,
            formData: Object.fromEntries(nextFormData.entries()),
          });
          return;
        }

        if (paymentIntent.status !== "succeeded") {
          setState({
            ...initialState,
            message: "Payment was not completed successfully.",
            formData: Object.fromEntries(nextFormData.entries()),
          });
          return;
        }

        const donationResult = await recordGuestDonation(paymentIntent.id);

        if (!donationResult.success) {
          setState({
            ...initialState,
            message:
              donationResult.message ||
              "Donation payment succeeded, but the donation could not be recorded. Please contact Sandsharks.",
            formData: Object.fromEntries(nextFormData.entries()),
          });
          return;
        }

        nextFormData.set(
          "registrationDonationPaymentIntentId",
          paymentIntent.id,
        );
      }

      const result = await registerNewMember(initialState, nextFormData);

      if (result) {
        setState({
          ...initialState,
          ...result,
        });
      }
    } catch (error) {
      if (String(error?.digest || "").startsWith("NEXT_REDIRECT")) {
        throw error;
      }

      setState({
        ...initialState,
        message:
          error?.message ||
          "Failed to complete signup. Please try again or contact Sandsharks.",
        formData: Object.fromEntries(nextFormData.entries()),
      });
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <form
      onSubmit={handleSubmit}
      className="box-border mx-auto mt-6 w-full max-w-3xl rounded-lg border border-sandsharks-magenta/30 bg-blue-100 p-4 shadow-md sm:p-6 lg:p-8"
    >
      <h1 className="text-2xl font-bold">Become a Sandsharks Member</h1>
      {redirectTo ? (
        <input type="hidden" name="redirectTo" value={redirectTo} />
      ) : null}
      <div className="glassmorphism mt-6 flex w-full flex-col gap-8">
        <div className={sectionClass}>
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

        <div className={sectionClass}>
          <label htmlFor="instagramHandle" className={labelClass}>
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

        <div className={sectionClass}>
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

        <div className={sectionClass}>
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

        <div className={sectionClass}>
          <h2 className="mb-4 text-lg font-semibold">
            Waiver, Online Privacy, and Photo Consent Policies
          </h2>
          <div className={panelClass}>
            <div className="mb-3 rounded-md bg-gray-100 p-3">
              <p className="mb-2 text-sm text-gray-700">
                <strong>Summary:</strong> By becoming a Sandsharks member, you
                agree to the liability waiver, privacy policy, and photo consent
                policy. You acknowledge the inherent risks of beach volleyball,
                agree that your information will be used to run the league, and
                consent to Sandsharks using photos that you are in on our
                website and social media.
              </p>
              <button
                type="button"
                onClick={() => setShowPolicies((currentValue) => !currentValue)}
                className="text-sm font-medium text-blue-600 hover:text-blue-800"
              >
                {showPolicies
                  ? "Hide full waiver, privacy, and photo consent policies"
                  : "Read full waiver, privacy, and photo consent policies"}
              </button>
            </div>

            {showPolicies ? (
              <div className="max-h-96 space-y-4 overflow-y-auto border-t bg-gray-100 p-3 pt-4 text-sm leading-relaxed text-gray-700">
                <div>
                  <h3 className="font-bold text-gray-900">Liability Waiver</h3>
                  <p className="mt-2">
                    By signing up, I release and forever discharge Toronto
                    SandSharks, its players, organizers, and agents, from all
                    liabilities, actions, cause of actions, claims, demands for
                    damages, loss or personal injuries, however so arising and
                    including, but not limited to injuries arising from
                    negligence, which may be sustained by me in consequence of
                    my participation.
                  </p>
                  <p className="mt-2">
                    I acknowledge that I voluntarily assume all risk of personal
                    injury from participation, and that I am responsible for
                    inspecting and clearing my own court and surrounding area of
                    potential hazards.
                  </p>
                </div>

                <div>
                  <h3 className="font-bold text-gray-900">Privacy Policy</h3>
                  <p className="mt-2">
                    Toronto SandSharks is committed to protecting your online
                    privacy. The information you share will only be used to run
                    the league, maintain your account, and contact you about
                    league events. We will never sell your information to third
                    parties. The website uses cookies solely for maintaining
                    login sessions.
                  </p>
                </div>

                <div>
                  <h3 className="font-bold text-gray-900">
                    Photo Consent Policy
                  </h3>
                  <p className="mt-2">
                    Sometimes we take photos during Sandsharks events. Some
                    photos may be used on our website and social media accounts.
                    Due to the nature of this being a public beach, your photo
                    may also be taken at any time by anyone that is outside of
                    the control of Sandsharks. By checking the photo consent
                    policy below, you are agreeing to allow Sandsharks to use
                    photos that you are in for these purposes, and acknowledging
                    that Sandsharks is not responsible for photos taken by
                    others outside of our control.
                  </p>
                  <p className="mt-2">
                    However, this doesn&apos;t mean you cannot ask for photos of
                    yourself to be removed from our website and social media. If
                    you find a photo that you are in that you&apos;d like
                    removed from our website or social media, please notify us
                    at sandsharks.org@gmail.com so that we can remove the photo.
                  </p>
                </div>
              </div>
            ) : null}

            <label className="mt-4 flex items-start gap-2 text-sm text-gray-800">
              <input
                type="checkbox"
                name="policyAgreement"
                checked={policyAgreement}
                onChange={(event) => setPolicyAgreement(event.target.checked)}
                className="mt-1 h-4 w-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
              />
              <span>
                I have read and agree to the waiver, online privacy, and photo
                consent policies. <span className="text-red-500">*</span>
              </span>
            </label>
          </div>
        </div>

        <div className={sectionClass}>
          <h2 className="mb-4 text-lg font-semibold">Donations</h2>
          <div className={panelClass}>
            <p className="text-sm text-gray-700">
              Sandsharks is run entirely with volunteers. No profit is being
              made by anyone.{" "}
              <b>
                Our costs are covered entirely by donations from members like
                you to help pay for court rentals, insurance, replacing worn out
                equipment, equipment storage, website fees and more.
              </b>
            </p>
            <p className="mt-2 text-sm text-gray-700">
              All donations are pay-what-you-can, with a suggested donation
              amount of $40 for the entire Summer.
            </p>

            <label className="mt-4 flex items-center gap-2 text-sm font-medium text-gray-800">
              <input
                type="checkbox"
                name="includeDonation"
                checked={includeDonation}
                onChange={(event) => setIncludeDonation(event.target.checked)}
                className="h-4 w-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
              />
              I&apos;d like to make a donation to Sandsharks
            </label>

            {includeDonation ? (
              <div className="mt-4 space-y-4">
                <div>
                  <label htmlFor="donationAmount" className={labelClass}>
                    Donation Amount (CAD)
                  </label>
                  <div className="flex flex-wrap items-center gap-2">
                    <div className="relative w-32">
                      <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3">
                        <span className="text-lg font-medium text-gray-700">
                          $
                        </span>
                      </div>
                      <input
                        type="number"
                        name="donationAmount"
                        id="donationAmount"
                        value={donationAmount}
                        onChange={(event) =>
                          setDonationAmount(event.target.value)
                        }
                        min="1"
                        step="1"
                        className="w-full rounded-md border border-gray-300 py-2 pl-8 pr-3 text-lg font-medium focus:border-blue-500 focus:ring-blue-500"
                      />
                    </div>
                    <span className="text-sm text-gray-500">
                      Set your donation amount
                    </span>
                  </div>
                </div>

                <div className="space-y-4">
                  <div className="flex flex-wrap items-center justify-between gap-2 rounded-t-md border border-gray-200 bg-gray-50 p-3">
                    <div className="flex items-center">
                      <Lock className="mr-2 h-5 w-5 text-green-600" />
                      <h3 className="text-base font-medium text-gray-800">
                        Secure Payment
                      </h3>
                    </div>
                    <div className="text-sm text-gray-500">
                      Powered by Stripe
                    </div>
                  </div>

                  <div className="rounded-b-md border border-t-0 border-gray-200 bg-white p-4">
                    <label className="mb-2 block text-sm font-medium text-gray-700">
                      Credit or Debit Card
                    </label>
                    <div className="grid grid-cols-1 gap-3 sm:grid-cols-[minmax(0,1fr)_8rem_7rem]">
                      <div>
                        <label className="mb-1 block text-xs font-medium text-gray-600">
                          Card Number
                        </label>
                        <div className="min-h-11 rounded-md border border-gray-300 p-3 focus-within:border-blue-500 focus-within:ring-2 focus-within:ring-blue-500">
                          <CardNumberElement
                            options={{
                              ...stripeElementOptions,
                              showIcon: true,
                            }}
                          />
                        </div>
                      </div>
                      <div>
                        <label className="mb-1 block text-xs font-medium text-gray-600">
                          MM / YY
                        </label>
                        <div className="min-h-11 rounded-md border border-gray-300 p-3 focus-within:border-blue-500 focus-within:ring-2 focus-within:ring-blue-500">
                          <CardExpiryElement options={stripeElementOptions} />
                        </div>
                      </div>
                      <div>
                        <label className="mb-1 block text-xs font-medium text-gray-600">
                          CVC
                        </label>
                        <div className="min-h-11 rounded-md border border-gray-300 p-3 focus-within:border-blue-500 focus-within:ring-2 focus-within:ring-blue-500">
                          <CardCvcElement options={stripeElementOptions} />
                        </div>
                      </div>
                    </div>
                    <div className="mt-2 flex items-center text-sm text-gray-500">
                      <ShieldCheck className="mr-1 h-4 w-4 text-green-600" />
                      <span>
                        Your payment information is encrypted and secure
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            ) : null}
          </div>
        </div>

        {state?.message && (
          <p className="text-red-500 text-lg font-bold" role="alert">
            {state.message}
          </p>
        )}

        <div className="flex justify-start">
          <ActionButton
            disabled={isSubmitting}
            className="w-full sm:w-auto sm:min-w-36"
          >
            {isSubmitting
              ? includeDonation
                ? "Processing..."
                : "Signing up..."
              : includeDonation
                ? "Donate & Sign up"
                : "Sign up"}
          </ActionButton>
        </div>
      </div>
    </form>
  );
}

const SignupForm = (props) => {
  return (
    <Elements stripe={stripePromise}>
      <SignupFormContent {...props} />
    </Elements>
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
