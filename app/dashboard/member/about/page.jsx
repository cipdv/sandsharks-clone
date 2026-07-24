import Link from "next/link";
import Rules from "@/components/Rules";

const AboutDashboardPage = () => {
  const sectionClass =
    "rounded-md border border-sandsharks-magenta/20 p-5 shadow-sm";

  return (
    <div className="mx-auto flex w-full max-w-6xl flex-col gap-8 px-4 py-6 sm:px-6 lg:px-8">
      <div className={sectionClass}>
        <h1 className="mb-4 text-3xl font-bold">Location</h1>
        <div className="space-y-4 text-sandsharks-ink">
          <p>
            We play at{" "}
            <Link
              href="https://www.toronto.ca/explore-enjoy/parks-recreation/places-spaces/parks-and-recreation-facilities/location/?id=311&title=Woodbine-Beach-Park"
              target="_blank"
              rel="noreferrer"
              className="text-blue-700 underline hover:text-blue-500"
            >
              Ashbridges Bay at Woodbine Beach Park
            </Link>
            . This is a public beach, so please do your best to familiarize
            yourself with and follow the rules of the beach so that we keep our
            good reputation with all beach goers.
          </p>
          <p>
            The volleyball courts are numbered at the top of the posts so you
            can find which courts we'll be playing on.
          </p>
          <p>
            There is paid parking available at the park, and lots of places to
            lock up bikes. The Lakeshore bike path will take you right there!
          </p>
          <div className="aspect-video w-full max-w-2xl overflow-hidden rounded-md border border-sandsharks-magenta/20 shadow-sm">
            <iframe
              src="https://www.google.com/maps?q=1210%20Lake%20Shore%20Blvd%20E%2C%20Toronto%20ON&output=embed"
              title="Map to Ashbridges Bay at Woodbine Beach Park"
              className="h-full w-full"
              loading="lazy"
              referrerPolicy="no-referrer-when-downgrade"
            />
          </div>
        </div>
      </div>

      <Rules embedVideo variant="dashboard" />
    </div>
  );
};

export default AboutDashboardPage;
