// components/LoadingSpinner.jsx
import Image from "next/image";

export default function LoadingSpinner() {
  return (
    <div className="flex justify-center items-center h-64">
      <div className="rotating-logo">
        {/* <Image
          src="/images/sandsharks-rainbow-icon.svg"
          alt="Loading..."
          width={60}
          height={60}
          className="object-contain"
          priority
        /> */}
        <Image
          src="/images/sandsharks-outline-icon.svg"
          alt="Loading..."
          width={60}
          height={60}
          className="object-contain"
          priority
        />
      </div>
    </div>
  );
}

// // components/LoadingSpinner.jsx
// import Image from "next/image";

// export default function LoadingSpinner() {
//   return (
//     <div className="flex justify-center items-center h-64">
//       <div className="animate-spin">
//         <Image
//           src="/images/sandsharks-rainbow-icon.svg"
//           alt="Loading..."
//           width={60}
//           height={60}
//           className="object-contain"
//           priority
//         />
//       </div>
//     </div>
//   );
// }
