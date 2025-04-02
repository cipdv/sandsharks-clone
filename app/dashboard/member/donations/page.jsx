// app/dashboard/member/donations/page.jsx
"use client";

import { useState, Suspense } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import { loadStripe } from "@stripe/stripe-js";
import {
  Elements,
  CardElement,
  useStripe,
  useElements,
} from "@stripe/react-stripe-js";
import { createPaymentIntent } from "@/app/_actions";
import { Lock, ShieldCheck } from "lucide-react";
import LoadingSpinner from "@/components/LoadingSpinner";

// Load Stripe outside of component render
const stripePromise = loadStripe(
  process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY
);

// The form that collects payment details
function CheckoutForm({ amount, notes, onSuccess, onError }) {
  const stripe = useStripe();
  const elements = useElements();
  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");

  const handleSubmit = async (event) => {
    event.preventDefault();

    if (!stripe || !elements) {
      return;
    }

    setIsLoading(true);
    setErrorMessage("");

    try {
      const amountInCents = Math.round(Number.parseFloat(amount) * 100);
      const { clientSecret } = await createPaymentIntent(amountInCents, notes);

      const result = await stripe.confirmCardPayment(clientSecret, {
        payment_method: {
          card: elements.getElement(CardElement),
          billing_details: {
            // You can collect name and email here if needed
          },
        },
      });

      if (result.error) {
        setErrorMessage(result.error.message);
        onError(result.error.message);
      } else if (result.paymentIntent.status === "succeeded") {
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
      {/* Secure Payment Header */}
      <div className="flex items-center justify-between bg-gray-50 p-4 border border-gray-200 rounded-t-md">
        <div className="flex items-center">
          <Lock className="h-5 w-5 text-green-600 mr-2" />
          <h3 className="text-lg font-medium text-gray-800">Secure Payment</h3>
        </div>
        <div className="flex items-center">
          <span className="text-sm text-gray-500 mr-2">
            Powered by{" "}
            <a
              href="https://stripe.com"
              target="_blank"
              rel="noopener noreferrer"
              className="text-blue-500 hover:underline"
            >
              Stripe
            </a>
          </span>
          <a
            href="https://stripe.com"
            target="_blank"
            rel="noopener noreferrer"
            className="text-blue-500 hover:underline"
          >
            <Image
              src="/images/payment/stripe-logo.png"
              alt="Stripe"
              width={60}
              height={25}
            />
          </a>
        </div>
      </div>

      {/* Card Element */}
      <div className="p-5 border border-gray-200 border-t-0 rounded-b-md bg-white">
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
                  "::placeholder": {
                    color: "#aab7c4",
                  },
                  iconColor: "#666EE8",
                },
                invalid: {
                  color: "#9e2146",
                  iconColor: "#FFC7EE",
                },
              },
              hidePostalCode: true,
            }}
          />
        </div>
        <div className="flex items-center mt-2 text-sm text-gray-500">
          <ShieldCheck className="h-4 w-4 text-green-600 mr-1" />
          <span>Your card information is encrypted and secure</span>
        </div>
      </div>

      {/* Payment Logos */}
      <div className="flex justify-center items-center space-x-4 py-3 bg-white rounded-md">
        <Image
          src="/images/payment/visa-logo.svg"
          alt="Visa"
          width={50}
          height={30}
          className="h-8 w-auto object-contain"
        />
        <Image
          src="/images/payment/Mastercard-logo.svg.png"
          alt="Mastercard"
          width={50}
          height={30}
          className="h-8 w-auto object-contain"
        />
        <Image
          src="/images/payment/interac-logo.png"
          alt="Interac"
          width={50}
          height={30}
          className="h-8 w-auto object-contain"
        />
      </div>

      {/* Security Badges */}
      <div className="flex justify-center space-x-4 py-2 border-t border-gray-200">
        <div className="flex items-center">
          <Lock className="h-4 w-4 text-green-600 mr-1" />
          <span className="text-xs text-gray-600">SSL Secure</span>
        </div>
        <div className="flex items-center">
          <ShieldCheck className="h-4 w-4 text-green-600 mr-1" />
          <span className="text-xs text-gray-600">PCI Compliant</span>
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
          <span className="flex items-center">
            <div className="rotating-logo mr-2">
              <Image
                src="/images/sandsharks-rainbow-icon.svg"
                alt=""
                width={20}
                height={20}
                className="object-contain"
              />
            </div>
            Processing...
          </span>
        ) : (
          <>
            <Lock className="h-5 w-5 mr-2" />
            <span>{`Securely Donate $${amount}`}</span>
          </>
        )}
      </button>

      <p className="text-xs text-gray-500 text-center">
        Your payment information is processed securely. We do not store your
        credit card details.
      </p>
    </form>
  );
}

// Stripe Elements wrapper component with Suspense
function StripeElementsWithSuspense({ children }) {
  return (
    <Suspense fallback={<LoadingSpinner />}>
      <Elements stripe={stripePromise}>{children}</Elements>
    </Suspense>
  );
}

// Main donation page component
export default function DonationsPage() {
  const router = useRouter();
  const [amount, setAmount] = useState("40");
  const [notes, setNotes] = useState("");
  const [paymentStatus, setPaymentStatus] = useState("initial");
  const [paymentError, setPaymentError] = useState("");

  const handlePaymentSuccess = (paymentIntentId) => {
    setPaymentStatus("success");
    setTimeout(() => {
      router.push(
        `/dashboard/member/donation-success?payment_intent=${paymentIntentId}`
      );
    }, 1500);
  };

  const handlePaymentError = (error) => {
    setPaymentStatus("error");
    setPaymentError(error);
  };

  return (
    <div className="container mx-auto py-6 px-4 flex flex-col items-center">
      <h1 className="text-2xl font-bold mb-2 text-center">
        Make a Donation to Sandsharks
      </h1>
      <p className="text-center text-gray-600 mb-6 max-w-md">
        Your donation will help cover the costs of beach court rentals,
        insurance, maintaining and replacing worn out equipment, equipment
        storage, website costs, and more.
      </p>
      <p className="text-center text-gray-600 mb-6 max-w-md">
        All donations are pay-what-you-can, with a suggested amount of
        $40/player for the entire Summer. You can change the donation amount
        below to a lower or higher number depending on how much you'd like to
        contribute.
      </p>

      <div className="max-w-md mx-auto bg-blue-100 p-6 rounded-md shadow-md">
        {paymentStatus === "success" ? (
          <div className="p-6 bg-green-100 text-green-700 rounded-md text-center">
            <h2 className="text-xl font-bold mb-2">Thank You!</h2>
            <p>
              Your donation was successful. Redirecting to confirmation page...
            </p>
          </div>
        ) : (
          <>
            <div className="bg-white p-5 rounded-md shadow-sm mb-6">
              <div className="flex flex-col gap-3">
                <label
                  htmlFor="amount"
                  className="block text-lg font-medium text-gray-800"
                >
                  Donation Amount (CAD)
                </label>

                <div className="flex items-center justify-center">
                  <div className="relative w-48 mx-auto">
                    <div className="absolute inset-y-0 left-0 flex items-center pl-4 pointer-events-none">
                      <span className="text-gray-700 text-2xl font-medium ">
                        $
                      </span>
                    </div>
                    <input
                      type="text"
                      name="amount"
                      id="amount"
                      value={amount}
                      onChange={(e) => setAmount(e.target.value)}
                      className="border-2 block w-full h-16 pl-10 pr-4 text-3xl font-bold text-center text-gray-900 border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
                      required
                    />
                  </div>
                </div>
              </div>

              <div className="mt-4">
                <label
                  htmlFor="notes"
                  className="block text-sm font-medium text-gray-700"
                >
                  Notes (Optional)
                </label>
                <textarea
                  id="notes"
                  name="notes"
                  rows="2"
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  placeholder="Add any notes about your donation"
                  className="p-3 w-full rounded-md text-base border-gray-300 mt-1"
                />
              </div>
            </div>

            <div className="mt-6">
              <StripeElementsWithSuspense>
                <CheckoutForm
                  amount={amount}
                  notes={notes}
                  onSuccess={handlePaymentSuccess}
                  onError={handlePaymentError}
                />
              </StripeElementsWithSuspense>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
