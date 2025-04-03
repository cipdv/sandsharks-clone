import { getCurrentUser } from "@/app/_actions";
import SponsorApplication from "@/components/SponsorApplication";

export const metadata = {
  title: "Become a Sponsor | Sandsharks",
  description: "Support Sandsharks by becoming a sponsor",
};

export default async function BecomeSponsorPage() {
  const user = await getCurrentUser();

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="max-w-4xl mx-auto">
        <div className="text-center mb-10">
          <h1 className="text-3xl md:text-4xl font-bold mb-4">
            Become a Sponsor
          </h1>
          <p className="text-lg text-gray-600">
            Support Sandsharks and connect with our beach volleyball community
          </p>
        </div>

        <div className="bg-blue-50 p-6 rounded-lg shadow-sm mb-10">
          <h2 className="text-2xl font-bold mb-4">Why Sponsor Sandsharks?</h2>
          <p className="mb-4">
            By sponsoring Sandsharks Beach Volleyball, your business will get
            exposure to our active community of over 300 beach volleyball
            players!
          </p>
          <p className="mb-4">
            Your sponsorship helps us cover costs of court rentals, maintaining
            and replacing equipment, storage, website costs, and more.
          </p>
          <h3 className="text-xl font-semibold mt-6 mb-3">Benefits include:</h3>
          <ul className="list-disc pl-6 space-y-2">
            <li>
              Your logo, information and website/social media links displayed on
              our website
            </li>
            <li>Mentions in our email communications</li>
            <li>
              Special promotion on a specific beach volleyball day of your
              choosing
            </li>
          </ul>
          <h3 className="text-xl font-semibold mt-6 mb-3">
            Cost of Sponsorship:
          </h3>
          <p className="mb-4">
            To sponsor Sandsharks, we're asking for a $200 donation to cover the
            cost of running a day of beach volleyball for the group (permit
            rentals, insurance, equipment storage).
          </p>
        </div>

        <div className="bg-blue-100 p-6 rounded-lg shadow-md">
          <h2 className="text-xl font-semibold border-b pb-2 mb-4">
            Sponsorship Application
          </h2>
          <SponsorApplication userId={user?._id} />
        </div>

        <div className="border-t border-gray-200 pt-8 mt-8">
          <h3 className="text-xl font-semibold mb-4">
            Questions About Sponsorship?
          </h3>
          <p>
            If you have any questions about sponsoring Sandsharks, please email
            us at{" "}
            <a
              href="mailto:sandsharks.org@gmail.com"
              className="text-blue-600 hover:underline"
            >
              sandsharks.org@gmail.com
            </a>
          </p>
        </div>
      </div>
    </div>
  );
}
