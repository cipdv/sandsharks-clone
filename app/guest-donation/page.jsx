"use client";

import { useState, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { loadStripe } from "@stripe/stripe-js";
import {
  Elements,
  CardElement,
  useStripe,
  useElements,
} from "@stripe/react-stripe-js";
import { createGuestPaymentIntent, recordGuestDonation } from "@/app/_actions";
import { Lock } from "lucide-react";
import LoadingSpinner from "@/components/LoadingSpinner";

const stripePromise = loadStripe(
  process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY
);

function GuestCheckoutForm({ guestInfo, amount, onSuccess, onError }) {
  const stripe = useStripe();
  const elements = useElements();
  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");

  const handleSubmit = async (event) => {
    event.preventDefault();

    if (!stripe || !elements) return;

    setIsLoading(true);
    setErrorMessage("");

    try {
      const amountInCents = Math.round(Number.parseFloat(amount) * 100);
      const { clientSecret } = await createGuestPaymentIntent(
        amountInCents,
        "",
        guestInfo
      );

      const result = await stripe.confirmCardPayment(clientSecret, {
        payment_method: {
          card: elements.getElement(CardElement),
          billing_details: {
            name: guestInfo.guestName,
            email: guestInfo.guestEmail,
          },
        },
      });

      if (result.error) {
        setErrorMessage(result.error.message);
        onError(result.error.message);
      } else if (result.paymentIntent.status === "succeeded") {
        await recordGuestDonation(result.paymentIntent.id);
        onSuccess(result.paymentIntent.id);
      }
    } catch (error) {
      setErrorMessage(error.message || "An error occurred");
      onError(error.message);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="p-4 border border-gray-200 rounded-md bg-white">
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Credit or Debit Card
        </label>
        <div className="border border-gray-300 rounded-md p-3">
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
      </div>

      {errorMessage && (
        <div className="p-3 bg-red-100 text-red-700 rounded-md">
          {errorMessage}
        </div>
      )}

      <button
        type="submit"
        disabled={isLoading || !stripe}
        className="btn w-full py-3 text-lg font-medium flex items-center justify-center"
      >
        {isLoading ? (
          "Processing..."
        ) : (
          <>
            <Lock className="h-5 w-5 mr-2" />
            {`Donate $${amount}`}
          </>
        )}
      </button>
    </form>
  );
}

function GuestDonationContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [paymentStatus, setPaymentStatus] = useState("initial");

  const guestInfo = {
    guestId: searchParams.get("guestId"),
    guestName: searchParams.get("name"),
    guestEmail: searchParams.get("email"),
  };
  const amount = searchParams.get("amount") || "40";

  const handlePaymentSuccess = () => {
    setPaymentStatus("success");
    setTimeout(() => {
      router.push("/guest-signup/success");
    }, 2000);
  };

  const handlePaymentError = (error) => {
    setPaymentStatus("error");
  };

  return (
    <div className="container mx-auto py-6 px-4 flex flex-col items-center">
      <h1 className="text-2xl font-bold mb-4 text-center">
        Complete Your Donation
      </h1>
      <p className="text-center text-gray-600 mb-6 max-w-md">
        Thank you for registering as a guest and choosing to support Sandsharks!
      </p>

      <div className="max-w-md mx-auto bg-blue-100 p-6 rounded-md shadow-md">
        {paymentStatus === "success" ? (
          <div className="p-6 bg-green-100 text-green-700 rounded-md text-center">
            <h2 className="text-xl font-bold mb-2">Thank You!</h2>
            <p>Your donation was successful. Redirecting...</p>
          </div>
        ) : (
          <Elements stripe={stripePromise}>
            <GuestCheckoutForm
              guestInfo={guestInfo}
              amount={amount}
              onSuccess={handlePaymentSuccess}
              onError={handlePaymentError}
            />
          </Elements>
        )}
      </div>
    </div>
  );
}

export default function GuestDonationPage() {
  return (
    <Suspense fallback={<LoadingSpinner />}>
      <GuestDonationContent />
    </Suspense>
  );
}
