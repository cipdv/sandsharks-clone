"use client";

import { useState } from "react";
import { registerGuestOnly } from "@/app/_actions";
import { useRouter } from "next/navigation";
import { loadStripe } from "@stripe/stripe-js";
import {
  Elements,
  CardElement,
  useStripe,
  useElements,
} from "@stripe/react-stripe-js";
import { Lock, ShieldCheck } from "lucide-react";
import Link from "next/link";

const stripePromise = loadStripe(
  process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY
);

// Main form component that handles both registration and donation
function GuestSignupFormContent() {
  const router = useRouter();
  const stripe = useStripe();
  const elements = useElements();

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState("");
  const [waiverAgreement, setWaiverAgreement] = useState(false);
  const [photoConsent, setPhotoConsent] = useState(true);
  const [showFullWaiver, setShowFullWaiver] = useState(false);
  const [includeDonation, setIncludeDonation] = useState(false);
  const [donationAmount, setDonationAmount] = useState("10");
  const [participationType, setParticipationType] = useState("");
  const [attendLearnToPlay, setAttendLearnToPlay] = useState(false);
  const [volleyballLevel, setVolleyballLevel] = useState("");
  const [competitivePool, setCompetitivePool] = useState("");

  const handleSubmit = async (event) => {
    event.preventDefault();
    setError("");
    setIsSubmitting(true);

    try {
      const formData = new FormData(event.target);
      const firstName = formData.get("firstName");
      const lastName = formData.get("lastName");
      const email = formData.get("email");

      console.log("Starting registration process...");

      // Step 1: Register the guest first
      const registrationResult = await registerGuestOnly(null, formData);

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
              card: elements.getElement(CardElement),
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

          // Redirect to success page with donation info
          const params = new URLSearchParams({
            donated: "true",
            amount: donationAmount,
          });
          router.push(`/guest-signup/success?${params.toString()}`);
        } else {
          setError("Payment was not completed successfully");
          return;
        }
      } else {
        // No donation, just redirect to success page
        router.push("/guest-signup/success");
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

  const isFormValid =
    waiverAgreement &&
    participationType &&
    volleyballLevel &&
    (!includeDonation || (stripe && elements));

  return (
    <form
      onSubmit={handleSubmit}
      className="bg-blue-100 p-4 rounded-md mt-6 w-full lg:w-2/5 mx-auto"
    >
      <h1 className="text-2xl font-bold">TSVL x Sandsharks Registration</h1>
      <p className="text-gray-700 mt-2 mb-4">
        Toronto Sandsharks would like to welcome TSVL players to the beach! If
        you've never played with Sandsharks before, we're very chill, very
        friendly, and very welcoming to new players.
      </p>
      <h1 className="text-lg font-bold">
        Want to learn how to play 2 vs 2 beach volleyball?
      </h1>
      <p className="text-gray-700 mt-2 mb-4">
        Learn-to-Play from 10am - 12pm for any indoor players who want to learn
        how to apply their skills to 2 vs 2 beach volleyball.
      </p>
      <h1 className="text-lg font-bold mt-4">
        Just want to pop by for a few games?
      </h1>
      <p className="text-gray-700 mt-2 mb-4">
        We’ll have open play from 9am - 3pm. Stop by anytime and play as many
        games as you like.
      </p>
      <h1 className="text-lg font-bold mt-4">
        Want to challenge yourself in a fun, friendly way?
      </h1>
      <p className="text-gray-700 mt-2 mb-4">
        We’ll be running a tournament, Sandsharks style!
      </p>
      <p className="text-gray-700 mt-2 mb-4">Here’s how it’ll work:</p>{" "}
      <p className="text-gray-700 mt-2 mb-4">
        Every game you’ll be randomly assigned a partner - at the end of every
        game each player will record the points their team earned that game.
      </p>{" "}
      <p className="text-gray-700 mt-2 mb-4">
        At the end of all the games, the individual players with the most
        average points per game will battle it out for the top spot in a round
        of “queens” style best of 3 series (4 players total, each player plays
        one game with each other player for a total of 3 games). The player with
        the most total points from those 3 games will become the winner and
        crowned the first-ever SuperShark!
      </p>
      <h1 className="text-lg font-bold">
        Use this form to take part in our crossover event on August 4.
      </h1>
      <p className="text-gray-700 mt-2 mb-4">
        If you'd like to become a regular member,{" "}
        <Link href="/signup" className="text-blue-500">
          sign up here
        </Link>
        .
      </p>
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

        {/* Participation Type */}
        <div className="p-4 bg-white rounded-md border">
          <h3 className="text-lg font-semibold mb-3">
            How do you plan to participate?
          </h3>

          <div className="space-y-3">
            <div className="flex items-start">
              <input
                type="radio"
                id="tournament"
                name="participationType"
                value="tournament"
                checked={participationType === "tournament"}
                onChange={(e) => setParticipationType(e.target.value)}
                className="h-4 w-4 mt-1 text-blue-600 focus:ring-blue-500 border-gray-300"
                required
              />
              <label htmlFor="tournament" className="ml-3 block text-sm">
                <span className="font-medium">
                  I want to play in this tournament
                </span>
                <p className="text-gray-500 text-xs mt-1">
                  Participate in the organized tournament format with structured
                  matches
                </p>
              </label>
            </div>

            <div className="flex items-start">
              <input
                type="radio"
                id="dropIn"
                name="participationType"
                value="dropIn"
                checked={participationType === "dropIn"}
                onChange={(e) => setParticipationType(e.target.value)}
                className="h-4 w-4 mt-1 text-blue-600 focus:ring-blue-500 border-gray-300"
                required
              />
              <label htmlFor="dropIn" className="ml-3 block text-sm">
                <span className="font-medium">
                  I just want to play a few drop-in games
                </span>
                <p className="text-gray-500 text-xs mt-1">
                  Play casual games at your own pace without tournament
                  commitment
                </p>
              </label>
            </div>
          </div>

          {!participationType && (
            <p className="text-red-500 text-sm mt-2">
              * Please select how you plan to participate
            </p>
          )}
        </div>

        {/* Learn to Play Session */}
        <div className="p-4 bg-white rounded-md border">
          <h3 className="text-lg font-semibold mb-3">Learn to Play Session</h3>
          <p className="text-sm text-gray-600 mb-4">
            We offer a "Learn to Play" session for anyone wanting to learn how
            to apply their skills to 2 vs 2 beach volleyball from 10am - 12pm.
          </p>

          <div className="flex items-start">
            <input
              type="checkbox"
              id="attendLearnToPlay"
              name="attendLearnToPlay"
              checked={attendLearnToPlay}
              onChange={(e) => setAttendLearnToPlay(e.target.checked)}
              className="h-4 w-4 mt-1 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
            />
            <label htmlFor="attendLearnToPlay" className="ml-3 block text-sm">
              <span className="font-medium">
                I would like to attend the "Learn to Play" session
              </span>
            </label>
          </div>
        </div>

        {/* Volleyball Experience */}
        <div className="p-4 bg-white rounded-md border">
          <h3 className="text-lg font-semibold mb-3">Volleyball Experience</h3>
          <p className="text-sm text-gray-600 mb-4">
            Please let us know your volleyball experience level so we can better
            organize games and matches.
          </p>

          <div className="space-y-3">
            <div className="flex items-start">
              <input
                type="radio"
                id="recreational"
                name="volleyballLevel"
                value="recreational"
                checked={volleyballLevel === "recreational"}
                onChange={(e) => {
                  setVolleyballLevel(e.target.value);
                  setCompetitivePool(""); // Clear competitive pool when changing levels
                }}
                className="h-4 w-4 mt-1 text-blue-600 focus:ring-blue-500 border-gray-300"
                required
              />
              <label htmlFor="recreational" className="ml-3 block text-sm">
                <span className="font-medium">Recreational</span>
              </label>
            </div>

            <div className="flex items-start">
              <input
                type="radio"
                id="intermediate"
                name="volleyballLevel"
                value="intermediate"
                checked={volleyballLevel === "intermediate"}
                onChange={(e) => {
                  setVolleyballLevel(e.target.value);
                  setCompetitivePool(""); // Clear competitive pool when changing levels
                }}
                className="h-4 w-4 mt-1 text-blue-600 focus:ring-blue-500 border-gray-300"
                required
              />
              <label htmlFor="intermediate" className="ml-3 block text-sm">
                <span className="font-medium">Intermediate</span>
              </label>
            </div>

            <div className="flex items-start">
              <input
                type="radio"
                id="competitive"
                name="volleyballLevel"
                value="competitive"
                checked={volleyballLevel === "competitive"}
                onChange={(e) => {
                  setVolleyballLevel(e.target.value);
                  setCompetitivePool(""); // Clear competitive pool when changing levels
                }}
                className="h-4 w-4 mt-1 text-blue-600 focus:ring-blue-500 border-gray-300"
                required
              />
              <label htmlFor="competitive" className="ml-3 block text-sm">
                <span className="font-medium">Competitive</span>
              </label>
            </div>
          </div>

          {/* Competitive Pool Selection */}
          {volleyballLevel === "competitive" && (
            <div className="mt-4 p-3 bg-gray-50 rounded-md border">
              <h4 className="text-md font-medium mb-3">Highest Pool Played</h4>
              <p className="text-sm text-gray-600 mb-3">
                What's the highest competitive pool/division you've played in?
              </p>

              <div className="w-full max-w-xs">
                <label
                  htmlFor="competitivePool"
                  className="block text-sm font-medium text-gray-700 mb-2"
                >
                  Select Pool *
                </label>
                <select
                  id="competitivePool"
                  name="competitivePool"
                  value={competitivePool}
                  onChange={(e) => setCompetitivePool(e.target.value)}
                  className="w-full p-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  required={volleyballLevel === "competitive"}
                >
                  <option value="">Choose a pool...</option>
                  {[
                    "A",
                    "B",
                    "C",
                    "D",
                    "E",
                    "F",
                    "G",
                    "H",
                    "I",
                    "J",
                    "K",
                    "L",
                  ].map((pool) => (
                    <option key={pool} value={pool}>
                      {pool} Pool
                    </option>
                  ))}
                </select>
              </div>

              {volleyballLevel === "competitive" && !competitivePool && (
                <p className="text-red-500 text-sm mt-2">
                  * Please select your highest pool played
                </p>
              )}
            </div>
          )}

          {!volleyballLevel && (
            <p className="text-red-500 text-sm mt-2">
              * Please select your volleyball experience level
            </p>
          )}
        </div>

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
              collection and use, and optionally consent to photo usage on our
              website and social media.
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
                  may be used on our website and social media accounts. By
                  checking the photo consent policy below, you are agreeing to
                  allow Sandsharks to use photos that you are in for these
                  purposes. You can revoke your consent at anytime by logging in
                  to sandsharks.ca and updating your preferences in your
                  profile.
                </p>
                <p>
                  If you find a photo that you are in and haven't given consent,
                  please notify us at sandsharks.org@gmail.com so that we can
                  remove the photo.
                </p>
              </div>

              {/* Photo Consent Policy */}
              <div>
                <h4 className="font-bold text-base mb-2">
                  Photo Consent Policy
                </h4>
                <p className="mb-3">
                  Sometimes we take photos during Sandsharks events. Some photos
                  may be used on our website and social media accounts. By
                  checking the photo consent policy below, you are agreeing to
                  allow Sandsharks to use photos that you are in for these
                  purposes. You can revoke your consent at anytime by logging in
                  to sandsharks.ca and updating your preferences in your
                  profile.
                </p>
                <p>
                  If you find a photo that you are in and haven't given consent,
                  please notify us at sandsharks.org@gmail.com so that we can
                  remove the photo.
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
                required
              />
              <label htmlFor="waiverAgreement" className="ml-2 block text-sm">
                <strong>
                  I have read and agree to the waiver and code of conduct
                  policies.
                </strong>{" "}
                <span className="text-red-500">*</span>
              </label>
            </div>

            <div className="flex items-start">
              <input
                type="checkbox"
                id="photoConsent"
                name="photoConsent"
                checked={photoConsent}
                onChange={(e) => setPhotoConsent(e.target.checked)}
                className="h-4 w-4 mt-1 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
              />
              <label htmlFor="photoConsent" className="ml-2 block text-sm">
                I agree to the photo consent policy. Photos taken during events
                may be used on the website and social media.
              </label>
            </div>
          </div>
        </div>

        {/* Optional Donation */}
        <div className="p-4 bg-white rounded-md border">
          <h3 className="text-lg font-semibold mb-2">Optional Donation</h3>
          <p className="text-sm text-gray-600 mb-3">
            Help support Sandsharks with a voluntary donation. All donations are
            pay-what-you-can. Your contribution helps cover court rentals,
            equipment, and other expenses.
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

              {/* Payment Form */}
              <div className="space-y-4">
                {/* Payment Header */}
                <div className="flex items-center justify-between bg-gray-50 p-3 border border-gray-200 rounded-t-md">
                  <div className="flex items-center">
                    <Lock className="h-5 w-5 text-green-600 mr-2" />
                    <h4 className="text-lg font-medium text-gray-800">
                      Secure Payment
                    </h4>
                  </div>
                  <div className="text-sm text-gray-500">Powered by Stripe</div>
                </div>

                {/* Card Input */}
                <div className="p-4 border border-gray-200 border-t-0 rounded-b-md bg-white">
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Credit or Debit Card
                  </label>
                  <div className="border border-gray-300 rounded-md p-3 focus-within:ring-2 focus-within:ring-blue-500 focus-within:border-blue-500">
                    <CardElement
                      options={{
                        style: {
                          base: {
                            fontSize: "16px",
                            color: "#424770",
                            "::placeholder": { color: "#aab7c4" },
                          },
                        },
                        hidePostalCode: true,
                      }}
                    />
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
const GuestSignupForm = () => {
  return (
    <Elements stripe={stripePromise}>
      <GuestSignupFormContent />
    </Elements>
  );
};

export default GuestSignupForm;
