import AboutTheLeague from "@/components/AboutTheLeague";
import Image from "next/image";
import MembershipButton from "@/components/MembershipButton";

export default async function Page() {
  return (
    <div className="max-w-6xl mx-auto md:px-8 lg:px-12">
      <section className="flex flex-col items-center mt-2">
        <h1 className="text-3xl font-bold text-center">
          Toronto SandSharks is a beach volleyball league for LGBTQ+ folks and
          allies.
        </h1>
        <div className="mt-4 w-full rounded-md border border-sandsharks-magenta/70 p-1.5 shadow-sm ring-1 ring-sandsharks-magenta/10">
          <div className="relative aspect-[16/9] overflow-hidden rounded-sm">
            <Image
              src="/images/2025-sandsharks-group-photo.jpg"
              fill
              sizes="(max-width: 768px) 100vw, 1200px"
              className="object-cover"
              alt="Sandsharks group photo"
              priority
            />
          </div>
        </div>
        <AboutTheLeague />
        <div className="flex justify-center w-full mt-6">
          <MembershipButton />
        </div>
      </section>
    </div>
  );
}

// import AboutTheLeague from "@/components/AboutTheLeague";
// import Image from "next/image";
// import MembershipButton from "@/components/MembershipButton";

// export default async function Page() {
//   return (
//     <div className="max-w-6xl mx-auto md:px-8 lg:px-12">
//       <section className="flex flex-col items-center mt-2">
//         <h1 className="text-3xl font-bold text-center">
//           Toronto SandSharks is a beach volleyball league for LGBTQ+ folks and
//           allies.
//         </h1>
//         <Image
//           src="/images/2024-09-08-sandsharks-group-photo.png"
//           width={100}
//           height={100}
//           className="w-full object-cover mt-4"
//           alt="Sandsharks group photo"
//           unoptimized
//         />
//         <AboutTheLeague />
//         <div className="flex justify-center w-full mt-6">
//           <MembershipButton />
//         </div>
//       </section>
//     </div>
//   );
// }
