"use client";

import { useRef, useEffect } from "react";
import Image from "next/image";

// Define shared state directly in this file - using a mutable object instead of primitive
export const hoverState = {
  hoverStates: new Map(),
  activeModalId: null,
};

const MemberProfileModal = ({
  member,
  position,
  isVisible,
  onClose,
  isMobile,
  uniqueId,
}) => {
  const modalRef = useRef(null);
  const closeTimeoutRef = useRef(null);

  // Handle click outside to close modal
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (
        isVisible &&
        modalRef.current &&
        !modalRef.current.contains(event.target)
      ) {
        onClose();
        hoverState.hoverStates.delete(uniqueId);
        if (hoverState.activeModalId === uniqueId) {
          hoverState.activeModalId = null;
        }
        if (closeTimeoutRef.current) {
          clearTimeout(closeTimeoutRef.current);
        }
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    document.addEventListener("touchstart", handleClickOutside, {
      passive: true,
    });

    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
      document.removeEventListener("touchstart", handleClickOutside);
    };
  }, [isVisible, uniqueId, onClose]);

  // Handle scroll events to close modal
  useEffect(() => {
    const handleScroll = () => {
      if (isVisible) {
        onClose();
        hoverState.hoverStates.delete(uniqueId);
        if (hoverState.activeModalId === uniqueId) {
          hoverState.activeModalId = null;
        }
        if (closeTimeoutRef.current) {
          clearTimeout(closeTimeoutRef.current);
        }
      }
    };

    window.addEventListener("scroll", handleScroll, { passive: true });
    return () => window.removeEventListener("scroll", handleScroll);
  }, [isVisible, uniqueId, onClose]);

  // Handle modal mouse enter
  const handleModalMouseEnter = () => {
    if (isMobile) return; // Skip on mobile

    // Clear any pending close timeout
    if (closeTimeoutRef.current) {
      clearTimeout(closeTimeoutRef.current);
      closeTimeoutRef.current = null;
    }

    hoverState.hoverStates.set(uniqueId, true);
  };

  // Handle modal mouse leave - with a short delay for closing
  const handleModalMouseLeave = () => {
    if (isMobile) return; // Skip on mobile
    hoverState.hoverStates.delete(uniqueId);

    // Set a short delay before closing
    closeTimeoutRef.current = setTimeout(() => {
      if (
        !hoverState.hoverStates.get(uniqueId) &&
        hoverState.activeModalId === uniqueId
      ) {
        onClose();
        hoverState.activeModalId = null;
      }
    }, 150); // 150ms delay - short but enough to move back to profile if needed
  };

  // Get Instagram handle if available
  const getInstagramHandle = (instagramUrl) => {
    if (!instagramUrl) return null;

    // If it's already a handle (no http/https), just return it
    if (!instagramUrl.includes("http")) {
      return instagramUrl.replace("@", "");
    }

    try {
      // Try to extract from URL
      const url = new URL(instagramUrl);
      return url.pathname.replace(/^\/|\/$/g, "");
    } catch (e) {
      // If not a valid URL, just return as is (might already be a handle)
      return instagramUrl.replace("@", "");
    }
  };

  // Get profile picture URL
  const getProfilePicUrl = () => {
    return (
      (member?.profilePicStatus === "approved" && member?.profilePicUrl) ||
      (member?.profile_pic_status === "approved" && member?.profile_pic_url) ||
      (member?.profilePic?.status === "approved" && member?.profilePic?.url) ||
      member?.pic ||
      "/images/sandsharks-rainbow-icon.svg"
    );
  };

  if (!isVisible) return null;

  return (
    <div
      ref={modalRef}
      data-id={uniqueId}
      className="fixed z-50 bg-white rounded-lg shadow-xl overflow-hidden w-[300px] sm:w-[350px] member-modal"
      style={{
        top: `${position.top}px`,
        left: `${position.left}px`,
        maxHeight: "80vh",
      }}
      onMouseEnter={handleModalMouseEnter}
      onMouseLeave={handleModalMouseLeave}
      onClick={(e) => e.stopPropagation()} // Prevent clicks from bubbling to parent
    >
      {/* Mobile close button */}
      {isMobile && (
        <button
          className="absolute top-2 right-2 z-10 bg-gray-200 rounded-full p-1"
          onClick={(e) => {
            e.stopPropagation();
            onClose();
            if (hoverState.activeModalId === uniqueId) {
              hoverState.activeModalId = null;
            }
            hoverState.hoverStates.delete(uniqueId);
            if (closeTimeoutRef.current) {
              clearTimeout(closeTimeoutRef.current);
            }
          }}
        >
          <svg
            xmlns="http://www.w3.org/2000/svg"
            width="16"
            height="16"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <line x1="18" y1="6" x2="6" y2="18"></line>
            <line x1="6" y1="6" x2="18" y2="18"></line>
          </svg>
        </button>
      )}

      {/* Content */}
      <div className="overflow-y-auto p-4">
        <div className="flex flex-col gap-4">
          {/* Member Photo and Name */}
          <div className="flex flex-col sm:flex-row items-center gap-4">
            <div className="relative w-40 h-40 sm:w-48 sm:h-48 rounded-full overflow-hidden border-2 border-blue-200 flex-shrink-0">
              <Image
                src={getProfilePicUrl() || "/placeholder.svg"}
                alt={`${member?.firstName}'s profile photo`}
                fill={true}
                className="object-cover"
                sizes="(max-width: 640px) 160px, 192px"
              />
            </div>

            <div className="text-center sm:text-left mt-3 sm:mt-0">
              <h2 className="text-lg font-bold">
                {member?.firstName} {member?.lastName}
              </h2>

              {member?.pronouns && (
                <p className="text-gray-600 text-sm">{member.pronouns}</p>
              )}
            </div>
          </div>

          {/* About Section */}
          {member?.about && (
            <div>
              <p className="text-gray-700 text-sm">{member.about}</p>
            </div>
          )}

          {/* Instagram Handle */}
          {member?.instagramHandle && (
            <div>
              <a
                href={`https://instagram.com/${getInstagramHandle(member.instagramHandle)}`}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center text-blue-500 hover:text-blue-700 text-sm"
                onClick={(e) => e.stopPropagation()}
              >
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  width="14"
                  height="14"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  className="mr-1"
                >
                  <rect x="2" y="2" width="20" height="20" rx="5" ry="5"></rect>
                  <path d="M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z"></path>
                  <line x1="17.5" y1="6.5" x2="17.51" y2="6.5"></line>
                </svg>
                <span>{getInstagramHandle(member.instagramHandle)}</span>
              </a>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default MemberProfileModal;

// "use client"

// import { useState, useEffect, useRef } from "react"
// import Image from "next/image"

// // Shared hover state to coordinate between components
// export const hoverState = {
//   hoverStates: new Map(),
//   activeModalId: null,
// }

// const MemberProfileModal = ({ member, position, isVisible, onClose, isMobile, uniqueId }) => {
//   const modalRef = useRef(null)
//   const [isHovering, setIsHovering] = useState(false)

//   // Handle mouse enter/leave for the modal itself
//   const handleMouseEnter = () => {
//     setIsHovering(true)
//     hoverState.hoverStates.set(uniqueId, true)
//   }

//   const handleMouseLeave = () => {
//     setIsHovering(false)
//     hoverState.hoverStates.delete(uniqueId)

//     // Small delay before checking if we should close
//     setTimeout(() => {
//       if (!hoverState.hoverStates.get(uniqueId)) {
//         onClose()
//       }
//     }, 100)
//   }

//   // Handle clicks outside the modal on mobile
//   useEffect(() => {
//     if (!isMobile) return

//     const handleClickOutside = (event) => {
//       if (modalRef.current && !modalRef.current.contains(event.target)) {
//         onClose()
//       }
//     }

//     if (isVisible) {
//       document.addEventListener("mousedown", handleClickOutside)
//     }

//     return () => {
//       document.removeEventListener("mousedown", handleClickOutside)
//     }
//   }, [isVisible, onClose, isMobile])

//   if (!isVisible) return null

//   // Get the profile picture URL
//   const profilePicUrl =
//     member.profilePicStatus === "approved" && member.profilePicUrl
//       ? member.profilePicUrl
//       : member.profilePic?.status === "approved" && member.profilePic?.url
//         ? member.profilePic.url
//         : null // Set to null if no valid profile pic

//   // Check if member has a profile picture
//   const hasProfilePic = !!profilePicUrl

//   return (
//     <div
//       ref={modalRef}
//       className="fixed z-50 bg-white shadow-xl border border-gray-200"
//       style={{
//         top: `${position.top}px`,
//         left: `${position.left}px`,
//         width: "320px", // Wider for baseball card style
//         maxWidth: "90vw",
//         transform: "translateZ(0)", // Force GPU acceleration
//       }}
//       onMouseEnter={handleMouseEnter}
//       onMouseLeave={handleMouseLeave}
//     >
//       {/* Baseball card style modal */}
//       <div className="relative p-4 bg-white">
//         {/* Close button for mobile */}
//         {isMobile && (
//           <button
//             onClick={onClose}
//             className="absolute top-2 right-2 z-10 text-gray-500 hover:text-gray-700"
//             aria-label="Close"
//           >
//             <svg
//               xmlns="http://www.w3.org/2000/svg"
//               width="20"
//               height="20"
//               viewBox="0 0 24 24"
//               fill="none"
//               stroke="currentColor"
//               strokeWidth="2"
//               strokeLinecap="round"
//               strokeLinejoin="round"
//             >
//               <line x1="18" y1="6" x2="6" y2="18"></line>
//               <line x1="6" y1="6" x2="18" y2="18"></line>
//             </svg>
//           </button>
//         )}

//         {/* Baseball card style container with new background color */}
//         <div className="border-4 border-[#e376f1] bg-[#ffe8ce] p-3 rounded-sm shadow-md">
//           {/* Member name header with new background color */}
//           <div className="flex items-center mb-3 bg-[#e376f1] text-white py-2 px-3 -mx-3 -mt-3 rounded-t-sm">
//             {/* Sandsharks logo */}
//             <div className="w-10 h-10 mr-2 flex-shrink-0">
//               <Image src="/images/sandsharks-rainbow-icon.svg" alt="Sandsharks Logo" width={40} height={40} />
//             </div>
//             <div>
//               <h3 className="font-bold text-xl">
//                 {member.firstName} {member.lastName}
//               </h3>
//               {member.pronouns && <p className="text-sm text-white">{member.pronouns}</p>}
//             </div>
//           </div>

//           {/* Photo in original proportions */}
//           <div className="relative w-full mb-3 bg-white p-2 border border-gray-200 shadow-sm">
//             <div className="relative aspect-auto w-full" style={{ height: "200px" }}>
//               {hasProfilePic ? (
//                 <Image
//                   src={profilePicUrl || "/placeholder.svg"}
//                   alt={`${member.firstName}'s profile`}
//                   fill={true}
//                   className="object-contain" // This preserves aspect ratio
//                   sizes="(max-width: 640px) 90vw, 300px"
//                 />
//               ) : (
//                 <div className="absolute inset-0 flex items-center justify-center bg-gray-100">
//                   <p className="text-gray-500 text-lg font-medium">No Photo</p>
//                 </div>
//               )}
//             </div>
//           </div>

//           {/* Member details */}
//           <div className="text-sm">
//             {member.about && (
//               <div className="mb-3">
//                 <h4 className="font-semibold text-[#e376f1] border-b border-[#e376f1] pb-1 mb-1">About</h4>
//                 <p className="text-gray-700">{member.about}</p>
//               </div>
//             )}

//             {member.instagramHandle && (
//               <div className="mt-2">
//                 <h4 className="font-semibold text-[#e376f1] border-b border-[#e376f1] pb-1 mb-1">Connect</h4>
//                 <a
//                   href={`https://instagram.com/${member.instagramHandle.replace("@", "")}`}
//                   target="_blank"
//                   rel="noopener noreferrer"
//                   className="inline-flex items-center text-[#e376f1] hover:text-[#d65ee3]"
//                 >
//                   <svg
//                     xmlns="http://www.w3.org/2000/svg"
//                     width="14"
//                     height="14"
//                     viewBox="0 0 24 24"
//                     fill="none"
//                     stroke="currentColor"
//                     strokeWidth="2"
//                     strokeLinecap="round"
//                     strokeLinejoin="round"
//                     className="mr-1"
//                   >
//                     <rect x="2" y="2" width="20" height="20" rx="5" ry="5"></rect>
//                     <path d="M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z"></path>
//                     <line x1="17.5" y1="6.5" x2="17.51" y2="6.5"></line>
//                   </svg>
//                   <span>@{member.instagramHandle.replace("@", "")}</span>
//                 </a>
//               </div>
//             )}
//           </div>
//         </div>
//       </div>
//     </div>
//   )
// }

// export default MemberProfileModal






