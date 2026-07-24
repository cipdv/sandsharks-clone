"use client";

import { useState } from "react";
import { registerGuestForEvent, registerGuestOnly } from "@/app/_actions";
import { useRouter } from "next/navigation";
import { loadStripe } from "@stripe/stripe-js";
import {
  CardCvcElement,
  CardExpiryElement,
  CardNumberElement,
  Elements,
  useStripe,
  useElements,
} from "@stripe/react-stripe-js";
import { Lock, ShieldCheck } from "lucide-react";
import Link from "next/link";

const stripePromise = loadStripe(
  process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY
);

const stripeElementOptions = {
  style: {
    base: {
      fontSize: "16px",
      color: "#424770",
      "::placeholder": { color: "#aab7c4" },
    },
  },
};

// Main form component that handles both registration and donation
function GuestSignupFormContent({
  eventId,
  eventTitle,
  eventDateLabel,
  eventTimeLabel,
  compact = false,
}) {
  const router = useRouter();
  const stripe = useStripe();
  const elements = useElements();

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState("");
  const [registrationComplete, setRegistrationComplete] = useState(false);
  const [donationComplete, setDonationComplete] = useState(false);
  const [waiverAgreement, setWaiverAgreement] = useState(false);
  const [showFullWaiver, setShowFullWaiver] = useState(false);
  const [includeDonation, setIncludeDonation] = useState(false);
  const [donationAmount, setDonationAmount] = useState("20");

  const handleSubmit = async (event) => {
    event.preventDefault();
    setError("");
    setRegistrationComplete(false);
    setDonationComplete(false);

    if (!waiverAgreement) {
      setError(
        "You must consent to the waiver, code of conduct, and photo consent policies before registering.",
      );
      return;
    }

    setIsSubmitting(true);

    try {
      const formData = new FormData(event.target);
      formData.set("photoConsent", "on");
      const firstName = formData.get("firstName");
      const lastName = formData.get("lastName");
      const email = formData.get("email");

      console.log("Starting registration process...");

      if (eventId) {
        formData.append("eventId", eventId);
      }

      // Step 1: Register the guest first
      const registrationResult = eventId
        ? await registerGuestForEvent(null, formData)
        : await registerGuestOnly(null, formData);

      if (!registrationResult.success) {
        setError(registrationResult.message);
        return;
      }

      console.log("Guest registered successfully:", registrationResult.guestId);

      // Step 2: Process donation if included
      if (includeDonation && stripe && elements) {
        console.log("Processing donation...");

        // Import the server action dynamically to avoid import issues
        const { createGuestPaymentIntent, recordGuestDonation } = await import(
          "@/app/_actions"
        );

        const guestInfo = {
          guestId: registrationResult.guestId,
          name: `${firstName} ${lastName}`,
          email: email,
        };

        // Create payment intent
        const { clientSecret } = await createGuestPaymentIntent(
          donationAmount,
          guestInfo
        );
        console.log("Payment intent created");

        // Confirm payment with Stripe
        const { error: paymentError, paymentIntent } =
          await stripe.confirmCardPayment(clientSecret, {
            payment_method: {
              card: elements.getElement(CardNumberElement),
              billing_details: {
                name: guestInfo.name,
                email: guestInfo.email,
              },
            },
          });

        if (paymentError) {
          console.error("Payment failed:", paymentError);
          setError(`Payment failed: ${paymentError.message}`);
          return;
        }

        if (paymentIntent.status === "succeeded") {
          console.log("Payment succeeded, recording donation...");

          // Record the donation
          const donationResult = await recordGuestDonation(paymentIntent.id);

          if (!donationResult.success) {
            console.error("Failed to record donation:", donationResult.message);
            // Don't fail the entire process if donation recording fails
          }

          if (eventId) {
            setDonationComplete(true);
            setRegistrationComplete(true);
            router.refresh();
          } else {
            const params = new URLSearchParams({
              donated: "true",
              amount: donationAmount,
            });
            router.push(`/guest-signup/success?${params.toString()}`);
          }
        } else {
          setError("Payment was not completed successfully");
          return;
        }
      } else {
        if (eventId) {
          setRegistrationComplete(true);
          router.refresh();
        } else {
          router.push("/guest-signup/success");
        }
      }
    } catch (error) {
      console.error("Form submission error:", error);
      setError(
        error.message || "An unexpected error occurred. Please try again."
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  const isFormValid = !includeDonation || (stripe && elements);

  if (eventId && registrationComplete) {
    return (
      <div className="mt-6 rounded-md border border-green-200 bg-green-50 p-5 text-green-900">
        <h2 className="text-xl font-bold">
          You are registered for this event. Thank you.
        </h2>
        {donationComplete ? (
          <p className="mt-2 text-sm">Thank you for your donation.</p>
        ) : null}
        <Link
          href="/events"
          className="mt-4 inline-flex rounded-md bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700"
        >
          Back to events
        </Link>
      </div>
    );
  }

  return (
    <form
      onSubmit={handleSubmit}
      className={`mt-6 w-full rounded-md bg-blue-100 p-4 ${
        compact ? "mx-0" : "mx-auto lg:w-2/5"
      }`}
    >
      <h1 className="text-2xl font-bold">
        {eventTitle ? `${eventTitle} Registration` : "TSVL x Sandsharks Registration"}
      </h1>
      <p className="text-gray-700 mt-2 mb-4">
        {eventTitle
          ? "Register as a non-member guest for this Sandsharks event."
          : "Toronto Sandsharks would like to welcome TSVL players to the beach! If you've never played with Sandsharks before, we're very chill, very friendly, and very welcoming to new players."}
      </p>
      {eventDateLabel ? (
        <h1 className="text-lg font-bold">{eventDateLabel}</h1>
      ) : (
        <h1 className="text-lg font-bold">June 12, 2026</h1>
      )}
      <p className="text-gray-700 mt-2 mb-4">{eventTimeLabel || "4-8pm"}</p>
      {!eventTitle ? (
        <p className="text-gray-700 mt-2 mb-4">
          If you'd like to become a regular member,{" "}
          <Link href="/signup" className="text-blue-500">
            sign up here
          </Link>
          .
        </p>
      ) : null}
      <div className="flex flex-col gap-4 glassmorphism mt-4">
        {/* Personal Information */}
        <div className="space-y-3">
          <h2 className="text-lg font-semibold">Personal Information</h2>

          <div>
            <label
              htmlFor="firstName"
              className="block text-sm font-medium text-gray-700 mb-1"
            >
              First Name *
            </label>
            <input
              type="text"
              id="firstName"
              name="firstName"
              placeholder="Your first name"
              required
              className="w-full bg-gray-100 p-2 rounded-md border border-gray-300 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            />
          </div>

          <div>
            <label
              htmlFor="lastName"
              className="block text-sm font-medium text-gray-700 mb-1"
            >
              Last Name *
            </label>
            <input
              type="text"
              id="lastName"
              name="lastName"
              placeholder="Your last name"
              required
              className="w-full bg-gray-100 p-2 rounded-md border border-gray-300 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            />
          </div>

          <div>
            <label
              htmlFor="email"
              className="block text-sm font-medium text-gray-700 mb-1"
            >
              Email Address *
            </label>
            <input
              type="email"
              id="email"
              name="email"
              placeholder="your.email@example.com"
              required
              className="w-full bg-gray-100 p-2 rounded-md border border-gray-300 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            />
          </div>
        </div>

        <div className="p-4 bg-white rounded-md border">
          <h3 className="text-lg font-semibold mb-2">Optional Donation</h3>
          <p className="text-sm text-gray-600 mb-3">
            Help support Sandsharks with a voluntary donation. All donations are
            pay-what-you-can, with a suggested amount of $20 for this event.
            Your contribution helps cover court rentals, equipment, and other
            expenses.
          </p>

          <label className="flex items-center mb-3">
            <input
              type="checkbox"
              id="includeDonation"
              name="includeDonation"
              checked={includeDonation}
              onChange={(e) => setIncludeDonation(e.target.checked)}
              className="mr-2 h-4 w-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
            />
            <span className="text-sm font-medium">
              I'd like to make a donation
            </span>
          </label>

          {includeDonation && (
            <div className="space-y-4">
              <div>
                <label
                  htmlFor="donationAmount"
                  className="block text-sm font-medium text-gray-700 mb-2"
                >
                  Donation Amount (CAD)
                </label>
                <div className="flex items-center gap-2">
                  <div className="relative w-32">
                    <div className="absolute inset-y-0 left-0 flex items-center pl-3 pointer-events-none">
                      <span className="text-gray-700 text-lg font-medium">
                        $
                      </span>
                    </div>
                    <input
                      type="number"
                      name="donationAmount"
                      id="donationAmount"
                      value={donationAmount}
                      onChange={(e) => setDonationAmount(e.target.value)}
                      min="1"
                      step="1"
                      className="w-full pl-8 pr-3 py-2 text-lg font-medium border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
                      required={includeDonation}
                    />
                  </div>
                  <span className="text-sm text-gray-500">
                    Set your donation amount
                  </span>
                </div>
              </div>

              <div className="space-y-4">
                <div className="flex items-center justify-between bg-gray-50 p-3 border border-gray-200 rounded-t-md">
                  <div className="flex items-center">
                    <Lock className="h-5 w-5 text-green-600 mr-2" />
                    <h4 className="text-lg font-medium text-gray-800">
                      Secure Payment
                    </h4>
                  </div>
                  <div className="text-sm text-gray-500">Powered by Stripe</div>
                </div>

                <div className="p-4 border border-gray-200 border-t-0 rounded-b-md bg-white">
                  <label className="block text-sm font-medium text-gray-700 mb-2">
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
                  <div className="flex items-center mt-2 text-sm text-gray-500">
                    <ShieldCheck className="h-4 w-4 text-green-600 mr-1" />
                    <span>
                      Your payment information is encrypted and secure
                    </span>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>

        {eventId ? (
          <div className="p-4 bg-white rounded-md border">
            <label className="flex items-start gap-2 text-sm text-gray-700">
              <input
                type="checkbox"
                name="wantsToVolunteer"
                className="mt-1 h-4 w-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
              />
              <span>I&apos;d like to volunteer to help out at this event</span>
            </label>
          </div>
        ) : null}

        {/* Waiver and Code of Conduct */}
        <div className="p-4 bg-white rounded-md border">
          <h3 className="text-lg font-semibold mb-3">
            Waiver and Code of Conduct
          </h3>

          <div className="mb-3 p-3 bg-gray-100 rounded-md">
            <p className="text-sm text-gray-700 mb-2">
              <strong>Summary:</strong> By participating as a guest, you agree
              to our code of conduct promoting a safe, welcoming LGBTQ+
              environment and acknowledge the inherent risks of beach
              volleyball. You also agree to our privacy policy regarding data
              collection and use, and consent to the photo consent policy.
            </p>
            <button
              type="button"
              onClick={() => setShowFullWaiver(!showFullWaiver)}
              className="text-blue-600 hover:text-blue-800 text-sm font-medium"
            >
              {showFullWaiver
                ? "Hide Full Text ▲"
                : "Read Full Waiver & Code of Conduct ▼"}
            </button>
          </div>

          {showFullWaiver && (
            <div className="border-t pt-4 space-y-6 text-sm max-h-96 overflow-y-auto bg-gray-100 p-3">
              {/* Code of Conduct */}
              <div>
                <h4 className="font-bold text-base mb-2">Code of Conduct</h4>
                <p className="mb-3">
                  Sandsharks is organized to be fun, safe, and welcoming to all
                  LGBTQ+ people. We will not tolerate discrimination, hate
                  speech, verbal or physical harassment of any kind. Our goal is
                  to have fun in a friendly competitive setting.
                </p>
                <p className="mb-3">
                  To be a Sandshark, read this oath and keep it in mind while
                  playing with us:
                </p>
                <ul className="ml-4 space-y-2 mb-3 font-medium">
                  <li>
                    • I will treat all members of the group with respect and
                    kindness.
                  </li>
                  <li>
                    • I will be welcoming to new players of all skill levels and
                    help them in any way that I can to be part of the group.
                  </li>
                  <li>
                    • I will be careful with my language and comments to avoid
                    making others feel uncomfortable or unwelcome.
                  </li>
                  <li>
                    • I will play to have fun and do my best to keep my cool
                    during games.
                  </li>
                </ul>
                <p>
                  If you feel that someone is making you uncomfortable with
                  their words or actions, you don't need to put up with it;
                  please let Cip know either in person or by{" "}
                  <a
                    href="mailto:info@sandsharks.org"
                    className="text-blue-700 hover:text-blue-500"
                  >
                    email
                  </a>
                  .
                </p>
              </div>

              {/* Liability Waiver */}
              <div>
                <h4 className="font-bold text-base mb-2">Liability Waiver</h4>
                <p className="mb-3">
                  By clicking agree,{" "}
                  <strong>
                    I hereby release and forever discharge Toronto SandSharks,
                    its players, organizers, and agents, from all liabilities,
                    actions, cause of actions, claims, demands for damages, loss
                    or personal injuries,{" "}
                  </strong>
                  however so arising and including, but not limited to injuries
                  arising from the negligence of Toronto SandSharks, its
                  players, organizers, and agents which hereto may have been or
                  may hereafter be sustained by me in consequence of my
                  participation.
                </p>
                <p className="mb-3">
                  I acknowledge that no warranties or conditions are made,
                  expressed or implied, that activities have been, are, or will
                  be conducted so as to prevent or minimize the risk of personal
                  injury. I acknowledge that I am solely responsible for
                  inspecting and clearing my own court and surrounding area of
                  potential hazards, securing my own belongings, and preventing
                  injury to myself and to others. I acknowledge that Toronto
                  SandSharks makes no representation whatsoever as to the
                  competence or ability of its players to participate in the
                  league activities in a safe manner.
                </p>
                <p className="mb-3">
                  I further acknowledge that I voluntarily assume all risk of
                  personal injury from participation, and that I have taken
                  appropriate measures to make myself aware of all risks
                  involved in the performance of such activities prior to
                  signing this Waiver. I fully understand, having read the
                  above, that the nature and effect of this document is to
                  release Toronto SandSharks, its players, organizers, and
                  agents, from all liability.
                </p>
              </div>

              {/* Privacy Policy */}
              <div>
                <h4 className="font-bold text-base mb-2">Privacy Policy</h4>
                <p className="mb-3">
                  Toronto SandSharks is committed to protecting your privacy.
                  The information you share on this form will only be stored for
                  the purposes of maintaining a record of your agreement to the
                  waiver, photo release consent, and code of conduct policy. We
                  will never share your information with any third parties. The
                  website uses cookies solely for the purpose of maintaining
                  login sessions. No cookies will be stored by completing this
                  form.
                </p>
                <p className="mb-3">
                  By clicking agree,{" "}
                  <strong>
                    I agree that Toronto SandSharks may collect and store my
                    personal information for the above mentioned purposes.
                  </strong>
                </p>
              </div>

              <div>
                <h4 className="font-bold text-base mb-2">
                  Photo Consent Policy
                </h4>
                <p className="mb-3">
                  Sometimes we take photos during Sandsharks events. Some photos
                  may be used on our website and social media accounts. Due to
                  the nature of this being a public beach, your photo may also
                  be taken at any time by anyone that is outside of the control
                  of Sandsharks. By checking the photo consent policy below, you
                  are agreeing to allow Sandsharks to use photos that you are in
                  for these purposes, and acknowledging that Sandsharks is not
                  responsible for photos taken by others outside of our control.
                </p>
                <p>
                  However, this doesn't mean you cannot ask for photos of
                  yourself to be removed from our website and social media. If
                  you find a photo that you are in that you'd like removed from
                  our website or social media, please notify us at
                  sandsharks.org@gmail.com so that we can remove the photo.
                </p>
              </div>

            </div>
          )}

          <div className="mt-4 space-y-3">
            <div className="flex items-start">
              <input
                type="checkbox"
                id="waiverAgreement"
                name="waiverAgreement"
                checked={waiverAgreement}
                onChange={(e) => setWaiverAgreement(e.target.checked)}
                className="h-4 w-4 mt-1 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
              />
              <label htmlFor="waiverAgreement" className="ml-2 block text-sm">
                <strong>
                  I have read and agree to the waiver, code of conduct, and
                  photo consent policies.
                </strong>{" "}
                <span className="text-red-500">*</span>
              </label>
            </div>
          </div>
        </div>

        {/* Error Messages */}
        {error && (
          <div className="p-3 bg-red-100 text-red-700 rounded-md">{error}</div>
        )}

        {/* Submit Button */}
        <button
          type="submit"
          disabled={!isFormValid || isSubmitting}
          className={`bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center w-full`}
        >
          {isSubmitting ? (
            <>
              <svg
                className="animate-spin -ml-1 mr-3 h-5 w-5 text-white"
                xmlns="http://www.w3.org/2000/svg"
                fill="none"
                viewBox="0 0 24 24"
              >
                <circle
                  className="opacity-25"
                  cx="12"
                  cy="12"
                  r="10"
                  stroke="currentColor"
                  strokeWidth="4"
                ></circle>
                <path
                  className="opacity-75"
                  fill="currentColor"
                  d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                ></path>
              </svg>
              {includeDonation
                ? "Processing Registration & Payment..."
                : "Processing Registration..."}
            </>
          ) : (
            <>{includeDonation ? "Register & Donate" : "Register as Guest"}</>
          )}
        </button>

        <p className="text-xs text-gray-500 text-center">
          {includeDonation &&
            "Your payment information is processed securely. We do not store your credit card details."}
        </p>
      </div>
    </form>
  );
}

// Wrapper component that provides Stripe Elements context
const GuestSignupForm = (props) => {
  return (
    <Elements stripe={stripePromise}>
      <GuestSignupFormContent {...props} />
    </Elements>
  );
};

export default GuestSignupForm;
