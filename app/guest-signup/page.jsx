import GuestSignupForm from "@/components/GuestSignupForm";

export default function GuestSignupPage() {
  return (
    <div className="container mx-auto py-6 px-4">
      {/* Stylish Header */}
      <div className="text-center mb-8">
        <div className="space-y-2">
          <h1 className="text-4xl md:text-5xl lg:text-6xl font-black bg-gradient-to-r from-blue-600 via-purple-600 to-pink-600 bg-clip-text text-transparent tracking-tight">
            Toronto Sandsharks
          </h1>
          <div className="flex items-center justify-center">
            <span className="text-2xl md:text-3xl font-bold text-gray-600 mx-2">
              ×
            </span>
          </div>
          <h2 className="text-4xl md:text-5xl lg:text-6xl font-black bg-gradient-to-r from-blue-600 via-purple-600 to-pink-600 bg-clip-text text-transparent tracking-tight">
            TSVL
          </h2>
          <div className="mt-4">
            <p className="text-xl md:text-2xl font-semibold text-gray-700">
              August 4, 2025
            </p>
            <p className="text-lg md:text-xl font-medium text-gray-600">
              9am - 3pm
            </p>
          </div>
        </div>
      </div>

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
