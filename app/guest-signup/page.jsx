import GuestSignupForm from "@/components/GuestSignupForm";

export default function GuestSignupPage() {
  return (
    <div className="container mx-auto py-6 px-4">
      {/* <div className="text-center mb-6">
        <h1 className="text-3xl font-bold">
          Join Us for our Pride Beach Volleyball Weekend!
        </h1>
        <h1 className="text-2xl font-bold mt-4">June 28: 9am - 3pm</h1>
        <h1 className="text-2xl font-bold">June 29: 11am - 3pm</h1>
      </div> */}

      <GuestSignupForm />

      <div className="mt-8 text-center text-sm text-gray-500">
        <p>
          Questions? Contact us at{" "}
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
