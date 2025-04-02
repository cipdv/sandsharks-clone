import GenericUnsubscribeForm from "@/components/GenericUnsubscribeForm";

export const metadata = {
  title: "Unsubscribe from Sandsharks Emails",
  description:
    "Unsubscribe from Sandsharks Beach Volleyball email communications",
};

export default function UnsubscribePage() {
  return (
    <div className="container mx-auto py-8 px-4">
      <div className="bg-blue-100 p-6 rounded-md w-full max-w-md mx-auto">
        <h1 className="text-2xl font-bold mb-6 text-center">
          Unsubscribe from Emails
        </h1>
        <p className="mb-6 text-gray-700">
          Enter your email address below to unsubscribe from Sandsharks Beach
          Volleyball emails.
        </p>

        <GenericUnsubscribeForm />
      </div>
    </div>
  );
}
