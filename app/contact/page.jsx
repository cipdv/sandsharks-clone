import ContactForm from "@/components/ContactForm";

export const metadata = {
  title: "Contact Sandsharks",
  description: "Contact Toronto Sandsharks Beach Volleyball League.",
};

export default function ContactPage() {
  return (
    <section className="mx-auto max-w-6xl px-4 md:px-8 lg:px-12">
      <ContactForm />
    </section>
  );
}
