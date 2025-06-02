"use client";

import Link from "next/link";
import Image from "next/image";
import { useState, useEffect, useRef } from "react";
import { handleLogout } from "@/app/_actions";
import { ActionButton } from "./ActionButton";

const Navbar = ({ currentUser }) => {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const menuRef = useRef(null);
  const buttonRef = useRef(null);

  // Handle click outside to close menu
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (
        isMenuOpen &&
        menuRef.current &&
        !menuRef.current.contains(event.target) &&
        buttonRef.current &&
        !buttonRef.current.contains(event.target)
      ) {
        setIsMenuOpen(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [isMenuOpen]);

  const toggleMenu = () => {
    setIsMenuOpen(!isMenuOpen);
  };

  const closeMenu = () => {
    setIsMenuOpen(false);
  };

  // Custom logout handler that closes menu before logging out
  const handleLogoutWithMenuClose = async (formData) => {
    closeMenu();
    await handleLogout(formData);
  };

  return (
    <div className="relative max-w-7xl mx-auto px-4 md:px-8 lg:px-12">
      <div className="flex justify-between items-center pt-4 pb-4 mb-4 md:mb-14">
        <Link href="/" onClick={closeMenu}>
          <div className="flex items-center">
            <Image
              src="/images/sandsharks-rainbow-icon.svg"
              alt="Toronto Sandsharks Logo"
              width={50}
              height={50}
              className="mr-1"
            />
            <div className="flex flex-col">
              <h1 className="text-lg md:text-xl font-bold leading-tight text-[#17677a]">
                Toronto Sandsharks
              </h1>
              <h2 className="text-sm md:text-base leading-tight text-[#17677a]">
                Beach Volleyball League
              </h2>
              <h3 className="text-xs md:text-xs leading-tight text-[#17677a]">
                Est. 1998
              </h3>
            </div>
          </div>
        </Link>

        {/* Right side navigation elements */}
        <div className="flex items-center space-x-4">
          {/* Donation button - visible only on medium screens and larger */}
          {currentUser && (
            <Link
              href="/dashboard/member/donations"
              className="hidden md:block"
            >
              <ActionButton className="bg-[#e376f1] hover:bg-[#d65ee3]">
                Make a donation
              </ActionButton>
            </Link>
          )}

          {/* Hamburger Menu Button (All screen sizes) */}
          <button
            ref={buttonRef}
            onClick={toggleMenu}
            className="flex flex-col justify-center items-center w-8 h-8 transition-transform duration-200 hover:scale-110"
            aria-label="Toggle menu"
          >
            <div
              className={`w-6 h-0.5 bg-[#17677a] mb-1.5 transition-transform ${
                isMenuOpen ? "transform rotate-45 translate-y-2" : ""
              }`}
            ></div>
            <div
              className={`w-6 h-0.5 bg-[#17677a] mb-1.5 transition-opacity ${
                isMenuOpen ? "opacity-0" : "opacity-100"
              }`}
            ></div>
            <div
              className={`w-6 h-0.5 bg-[#17677a] transition-transform ${
                isMenuOpen ? "transform -rotate-45 -translate-y-2" : ""
              }`}
            ></div>
          </button>
        </div>
      </div>

      {/* Menu Dropdown (for all screen sizes) */}
      {isMenuOpen && (
        <div
          ref={menuRef}
          className="absolute top-full right-0 w-64 bg-white z-50 shadow-lg rounded-b-lg"
        >
          <div className="flex flex-col p-4 space-y-4">
            {currentUser ? (
              <>
                {/* Donation button - visible only on small screens */}
                <Link
                  href="/dashboard/member/donations"
                  className="md:hidden py-2 rounded pl-2"
                  onClick={closeMenu}
                >
                  <ActionButton className="w-full text-left bg-[#e376f1] hover:bg-[#d65ee3]">
                    Make a donation
                  </ActionButton>
                </Link>

                <Link
                  href="/dashboard/member"
                  className="py-2 hover:bg-gray-100 rounded pl-2 font-medium"
                  onClick={closeMenu}
                >
                  Dashboard
                </Link>
                <Link
                  href="/dashboard/member/league-history"
                  className="py-2 hover:bg-gray-100 rounded pl-2"
                  onClick={closeMenu}
                >
                  League History
                </Link>
                <Link
                  href="/dashboard/member/rules"
                  className="py-2 hover:bg-gray-100 rounded pl-2"
                  onClick={closeMenu}
                >
                  Rules
                </Link>
                <Link
                  href="/dashboard/member/photo-gallery"
                  className="py-2 hover:bg-gray-100 rounded pl-2"
                  onClick={closeMenu}
                >
                  Photo Gallery
                </Link>
                <Link
                  href="/dashboard/member/members"
                  className="py-2 hover:bg-gray-100 rounded pl-2"
                  onClick={closeMenu}
                >
                  Members
                </Link>
                <Link
                  href="/dashboard/member/profile"
                  className="py-2 hover:bg-gray-100 rounded pl-2"
                  onClick={closeMenu}
                >
                  Profile
                </Link>

                {/* Only show "Become a Volunteer" link if user is not already a volunteer */}
                {currentUser?.resultObj?.memberType !== "volunteer" && (
                  <Link
                    href="/dashboard/member/volunteering"
                    className="py-2 hover:bg-gray-100 rounded pl-2"
                    onClick={closeMenu}
                  >
                    Become a Volunteer
                  </Link>
                )}

                <Link
                  href="/dashboard/member/become-a-sponsor"
                  className="py-2 hover:bg-gray-100 rounded pl-2"
                  onClick={closeMenu}
                >
                  Become a Sponsor
                </Link>

                {currentUser?.resultObj?.memberType === "volunteer" && (
                  <>
                    <div className="border-t border-gray-200 my-2"></div>
                    <div className="text-sm font-semibold text-gray-500 pl-2">
                      Volunteer
                    </div>
                    <Link
                      href="/dashboard/member/volunteer-guide"
                      className="py-2 hover:bg-gray-100 rounded pl-2"
                      onClick={closeMenu}
                    >
                      Volunteer Guide
                    </Link>
                  </>
                )}

                {currentUser?.resultObj?.memberType === "ultrashark" && (
                  <>
                    <div className="border-t border-gray-200 my-2"></div>
                    <div className="text-sm font-semibold text-gray-500 pl-2">
                      Admin
                    </div>
                    <Link
                      href="/dashboard/ultrashark/members"
                      className="py-2 hover:bg-gray-100 rounded pl-2"
                      onClick={closeMenu}
                    >
                      Manage Members
                    </Link>
                    <Link
                      href="/dashboard/ultrashark/photo-gallery"
                      className="py-2 hover:bg-gray-100 rounded pl-2"
                      onClick={closeMenu}
                    >
                      Manage Photos
                    </Link>
                    <Link
                      href="/dashboard/ultrashark/donations"
                      className="py-2 hover:bg-gray-100 rounded pl-2"
                      onClick={closeMenu}
                    >
                      Manage Donations
                    </Link>
                    <Link
                      href="/dashboard/ultrashark/sponsors"
                      className="py-2 hover:bg-gray-100 rounded pl-2"
                      onClick={closeMenu}
                    >
                      Manage Sponsors
                    </Link>
                  </>
                )}

                <form action={handleLogoutWithMenuClose}>
                  <ActionButton className="w-full text-left">
                    Sign out
                  </ActionButton>
                </form>
              </>
            ) : (
              <>
                <Link
                  href="/league-history"
                  className="py-2 hover:bg-gray-100 rounded pl-2"
                  onClick={closeMenu}
                >
                  League History
                </Link>
                {/* <Link
                  href="/donations"
                  className="py-2 hover:bg-gray-100 rounded pl-2"
                  onClick={closeMenu}
                >
                  Donations
                </Link> */}
                <Link
                  href="/rules"
                  className="py-2 hover:bg-gray-100 rounded pl-2"
                  onClick={closeMenu}
                >
                  Rules
                </Link>
                <Link
                  href="/signup"
                  className="py-2 hover:bg-gray-100 rounded pl-2"
                  onClick={closeMenu}
                >
                  Sign Up
                </Link>
                <Link
                  href="/signin"
                  className="py-2 hover:bg-gray-100 rounded pl-2"
                  onClick={closeMenu}
                >
                  <ActionButton className="w-full text-left">
                    Sign In
                  </ActionButton>
                </Link>
              </>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default Navbar;

// "use client";

// import Link from "next/link";
// import Image from "next/image";
// import { useState, useEffect, useRef } from "react";
// import { handleLogout } from "@/app/_actions";
// import { ActionButton } from "./ActionButton";

// const Navbar = ({ currentUser }) => {
//   const [isMenuOpen, setIsMenuOpen] = useState(false);
//   const menuRef = useRef(null);
//   const buttonRef = useRef(null);

//   // Handle click outside to close menu
//   useEffect(() => {
//     const handleClickOutside = (event) => {
//       if (
//         isMenuOpen &&
//         menuRef.current &&
//         !menuRef.current.contains(event.target) &&
//         buttonRef.current &&
//         !buttonRef.current.contains(event.target)
//       ) {
//         setIsMenuOpen(false);
//       }
//     };

//     document.addEventListener("mousedown", handleClickOutside);
//     return () => {
//       document.removeEventListener("mousedown", handleClickOutside);
//     };
//   }, [isMenuOpen]);

//   const toggleMenu = () => {
//     setIsMenuOpen(!isMenuOpen);
//   };

//   const closeMenu = () => {
//     setIsMenuOpen(false);
//   };

//   // Custom logout handler that closes menu before logging out
//   const handleLogoutWithMenuClose = async (formData) => {
//     closeMenu();
//     await handleLogout(formData);
//   };

//   return (
//     <div className="relative max-w-7xl mx-auto px-4 md:px-8 lg:px-12">
//       <div className="flex justify-between items-center pt-4 pb-4 mb-4 md:mb-14">
//         <Link href="/" onClick={closeMenu}>
//           <div className="flex items-center">
//             <Image
//               src="/images/sandsharks-rainbow-icon.svg"
//               alt="Toronto Sandsharks Logo"
//               width={50}
//               height={50}
//               className="mr-1"
//             />
//             <div className="flex flex-col">
//               <h1 className="text-lg md:text-xl font-bold leading-tight text-[#17677a]">
//                 Toronto Sandsharks
//               </h1>
//               <h2 className="text-sm md:text-base leading-tight text-[#17677a]">
//                 Beach Volleyball League
//               </h2>
//               <h3 className="text-xs md:text-xs leading-tight text-[#17677a]">
//                 Est. 1998
//               </h3>
//             </div>
//           </div>
//         </Link>

//         {/* Right side navigation elements */}
//         <div className="flex items-center space-x-4">
//           {/* Donation button - visible only on medium screens and larger */}
//           {currentUser && (
//             <Link
//               href="/dashboard/member/donations"
//               className="hidden md:block"
//             >
//               <ActionButton className="bg-[#e376f1] hover:bg-[#d65ee3]">
//                 Make a donation
//               </ActionButton>
//             </Link>
//           )}

//           {/* Hamburger Menu Button (All screen sizes) */}
//           <button
//             ref={buttonRef}
//             onClick={toggleMenu}
//             className="flex flex-col justify-center items-center w-8 h-8"
//             aria-label="Toggle menu"
//           >
//             <div
//               className={`w-6 h-0.5 bg-[#17677a] mb-1.5 transition-transform ${
//                 isMenuOpen ? "transform rotate-45 translate-y-2" : ""
//               }`}
//             ></div>
//             <div
//               className={`w-6 h-0.5 bg-[#17677a] mb-1.5 transition-opacity ${isMenuOpen ? "opacity-0" : "opacity-100"}`}
//             ></div>
//             <div
//               className={`w-6 h-0.5 bg-[#17677a] transition-transform ${
//                 isMenuOpen ? "transform -rotate-45 -translate-y-2" : ""
//               }`}
//             ></div>
//           </button>
//         </div>
//       </div>

//       {/* Menu Dropdown (for all screen sizes) */}
//       {isMenuOpen && (
//         <div
//           ref={menuRef}
//           className="absolute top-full right-0 w-64 bg-white z-50 shadow-lg rounded-b-lg"
//         >
//           <div className="flex flex-col p-4 space-y-4">
//             {currentUser ? (
//               <>
//                 {/* Donation button - visible only on small screens */}
//                 <Link
//                   href="/dashboard/member/donations"
//                   className="md:hidden py-2 rounded pl-2"
//                   onClick={closeMenu}
//                 >
//                   <ActionButton className="w-full text-left bg-[#e376f1] hover:bg-[#d65ee3]">
//                     Make a donation
//                   </ActionButton>
//                 </Link>

//                 <Link
//                   href="/dashboard/member"
//                   className="py-2 hover:bg-gray-100 rounded pl-2 font-medium"
//                   onClick={closeMenu}
//                 >
//                   Dashboard
//                 </Link>
//                 <Link
//                   href="/dashboard/member/league-history"
//                   className="py-2 hover:bg-gray-100 rounded pl-2"
//                   onClick={closeMenu}
//                 >
//                   League History
//                 </Link>
//                 <Link
//                   href="/dashboard/member/rules"
//                   className="py-2 hover:bg-gray-100 rounded pl-2"
//                   onClick={closeMenu}
//                 >
//                   Rules
//                 </Link>
//                 <Link
//                   href="/dashboard/member/members"
//                   className="py-2 hover:bg-gray-100 rounded pl-2"
//                   onClick={closeMenu}
//                 >
//                   Members
//                 </Link>
//                 <Link
//                   href="/dashboard/member/profile"
//                   className="py-2 hover:bg-gray-100 rounded pl-2"
//                   onClick={closeMenu}
//                 >
//                   Profile
//                 </Link>
//                 <Link
//                   href="/dashboard/member/volunteering"
//                   className="py-2 hover:bg-gray-100 rounded pl-2"
//                   onClick={closeMenu}
//                 >
//                   Become a Volunteer
//                 </Link>
//                 <Link
//                   href="/dashboard/member/become-a-sponsor"
//                   className="py-2 hover:bg-gray-100 rounded pl-2"
//                   onClick={closeMenu}
//                 >
//                   Become a Sponsor
//                 </Link>

//                 {currentUser?.resultObj?.memberType === "volunteer" && (
//                   <>
//                     <div className="border-t border-gray-200 my-2"></div>
//                     <div className="text-sm font-semibold text-gray-500 pl-2">
//                       Volunteer
//                     </div>
//                     <Link
//                       href="/dashboard/member/volunteer-guide"
//                       className="py-2 hover:bg-gray-100 rounded pl-2"
//                       onClick={closeMenu}
//                     >
//                       Volunteer Guide
//                     </Link>
//                   </>
//                 )}

//                 {currentUser?.resultObj?.memberType === "ultrashark" && (
//                   <>
//                     <div className="border-t border-gray-200 my-2"></div>
//                     <div className="text-sm font-semibold text-gray-500 pl-2">
//                       Admin
//                     </div>
//                     <Link
//                       href="/dashboard/ultrashark/members"
//                       className="py-2 hover:bg-gray-100 rounded pl-2"
//                       onClick={closeMenu}
//                     >
//                       Manage Members
//                     </Link>
//                     <Link
//                       href="/dashboard/ultrashark/donations"
//                       className="py-2 hover:bg-gray-100 rounded pl-2"
//                       onClick={closeMenu}
//                     >
//                       Manage Donations
//                     </Link>
//                     <Link
//                       href="/dashboard/ultrashark/sponsors"
//                       className="py-2 hover:bg-gray-100 rounded pl-2"
//                       onClick={closeMenu}
//                     >
//                       Manage Sponsors
//                     </Link>
//                   </>
//                 )}

//                 <form action={handleLogoutWithMenuClose}>
//                   <ActionButton className="w-full text-left">
//                     Sign out
//                   </ActionButton>
//                 </form>
//               </>
//             ) : (
//               <>
//                 <Link
//                   href="/league-history"
//                   className="py-2 hover:bg-gray-100 rounded pl-2"
//                   onClick={closeMenu}
//                 >
//                   League History
//                 </Link>
//                 <Link
//                   href="/rules"
//                   className="py-2 hover:bg-gray-100 rounded pl-2"
//                   onClick={closeMenu}
//                 >
//                   Rules
//                 </Link>
//                 <Link
//                   href="/signup"
//                   className="py-2 hover:bg-gray-100 rounded pl-2"
//                   onClick={closeMenu}
//                 >
//                   Sign Up
//                 </Link>
//                 <Link
//                   href="/signin"
//                   className="py-2 hover:bg-gray-100 rounded pl-2"
//                   onClick={closeMenu}
//                 >
//                   <ActionButton className="w-full text-left">
//                     Sign In
//                   </ActionButton>
//                 </Link>
//               </>
//             )}
//           </div>
//         </div>
//       )}
//     </div>
//   );
// };

// export default Navbar;
