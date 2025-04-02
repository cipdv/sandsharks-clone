"use client";

import { useState } from "react";
import { signUpForVolunteering } from "@/app/_actions";
import Link from "next/link";
import Image from "next/image";

export default function VolunteerSection({ user }) {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [result, setResult] = useState(null);

  async function handleVolunteerSignup() {
    if (!user) {
      setResult({
        success: false,
        message:
          "You must be logged in to volunteer. Please log in and try again.",
      });
      return;
    }

    setIsSubmitting(true);
    try {
      const response = await signUpForVolunteering();
      setResult(response);
    } catch (error) {
      setResult({
        success: false,
        message: "Something went wrong. Please try again later.",
      });
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <div className="max-w-4xl mx-auto">
      <div className="text-center mb-10">
        <h1 className="text-3xl md:text-4xl font-bold mb-4">
          Volunteer with Sandsharks
        </h1>
        <p className="text-lg text-gray-600">
          Help make our beach volleyball community thrive!
        </p>
      </div>

      <div className="mb-12 relative">
        <div className="h-64 md:h-80 relative rounded-lg overflow-hidden">
          <Image
            src="/images/sandsharks-rainbow-icon.svg"
            alt="Sandsharks volunteers on the beach"
            fill
            className="object-cover"
          />
        </div>
      </div>

      <div className="prose max-w-none mb-10">
        <h2 className="text-2xl font-bold mb-4">What Volunteering Involves</h2>
        <p>
          Volunteering with Sandsharks is a rewarding way to contribute to our
          beach volleyball community. Our volunteers are essential to creating a
          fun, welcoming, and organized experience for all players.
        </p>

        <h3 className="text-xl font-semibold mt-6 mb-3">
          Volunteer Responsibilities:
        </h3>
        <ul className="list-disc pl-6 space-y-2">
          <li>Picking up equipment at the storage locker near the beach</li>
          <li>Setting up nets, boundary lines, and other equipment</li>
          <li>Monitoring the sign-up sheet for game management</li>
          <li>
            Welcoming new players and helping them find games at their level
          </li>
          <li>Taking down equipment at the end of the day</li>
          <li>Returning equipment to the storage locker</li>
        </ul>

        <h3 className="text-xl font-semibold mt-6 mb-3">How It Works:</h3>
        <p>
          Volunteering is ideally done with two people, making it more
          manageable and fun. Don't worry if you're new to this - you'll be
          shown how to do everything you need to run a successful Sandsharks
          beach volleyball day.
        </p>

        <h3 className="text-xl font-semibold mt-6 mb-3">
          Benefits of Volunteering:
        </h3>
        <ul className="list-disc pl-6 space-y-2">
          <li>Get to know more members of our community</li>
          <li>Help create a positive experience for everyone</li>
          <li>Learn organizational and leadership skills</li>
          <li>Give back to the community you enjoy</li>
        </ul>
      </div>

      {result ? (
        <div
          className={`p-4 mb-8 rounded-lg ${
            result.success
              ? "bg-green-100 text-green-800"
              : "bg-red-100 text-red-800"
          }`}
        >
          <p className="font-medium">{result.message}</p>
          {result.success && (
            <p className="mt-2">
              Thank you for volunteering! We'll be in touch soon with more
              details.
            </p>
          )}
          {!result.success && user && (
            <button
              onClick={() => setResult(null)}
              className="mt-2 text-blue-600 underline"
            >
              Try again
            </button>
          )}
          {!user && (
            <div className="mt-4">
              <Link
                href="/login"
                className="bg-sandsharks-blue text-white px-4 py-2 rounded-md hover:bg-opacity-90"
              >
                Log in to volunteer
              </Link>
            </div>
          )}
        </div>
      ) : (
        <div className="bg-blue-50 p-6 rounded-lg shadow-sm mb-10">
          <h3 className="text-xl font-bold mb-3">Ready to Help Out?</h3>
          <p className="mb-4">
            Click the button below to let us know you're interested in
            volunteering. We'll reach out with more information about upcoming
            opportunities.
          </p>
          <button
            onClick={handleVolunteerSignup}
            disabled={isSubmitting || !user}
            className={`px-6 py-3 rounded-md font-medium ${
              !user
                ? "bg-gray-300 text-gray-600 cursor-not-allowed"
                : "bg-sandsharks-blue text-white hover:bg-opacity-90"
            }`}
          >
            {isSubmitting ? "Submitting..." : "I'd like to volunteer"}
          </button>
          {!user && (
            <p className="mt-3 text-sm text-gray-600">
              You need to be{" "}
              <Link href="/login" className="text-blue-600 underline">
                logged in
              </Link>{" "}
              to volunteer.
            </p>
          )}
        </div>
      )}

      <div className="border-t border-gray-200 pt-8 mt-8">
        <h3 className="text-xl font-semibold mb-4">
          Questions About Volunteering?
        </h3>
        <p>
          If you have any questions about volunteering with Sandsharks, please
          email us at{" "}
          <a
            href="mailto:sandsharks.org@gmail.com"
            className="text-blue-600 hover:underline"
          >
            sandsharks.org@gmail.com
          </a>
        </p>
      </div>
    </div>
  );
}
