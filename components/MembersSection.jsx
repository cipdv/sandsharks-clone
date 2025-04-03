"use client";

import { useState, useEffect, useRef, useMemo } from "react";
import Image from "next/image";
import { useSearchParams } from "next/navigation";
import MemberProfileModal, { hoverState } from "./MemberProfileModal";

const MembersSection = ({ members, user }) => {
  const searchParams = useSearchParams();
  const initialMemberId = searchParams.get("memberId");

  const [searchTerm, setSearchTerm] = useState("");
  const [showScrollTop, setShowScrollTop] = useState(false);
  const [selectedMember, setSelectedMember] = useState(null);
  const [hoveredMember, setHoveredMember] = useState(null);
  const [modalPosition, setModalPosition] = useState({ top: 0, left: 0 });
  const [isMobile, setIsMobile] = useState(false);
  const profileRef = useRef(null);
  const headerRef = useRef(null);
  const memberRefs = useRef({});
  const closeTimeoutRef = useRef(null);
  const lastScrollY = useRef(0);

  // Use useMemo to prevent recalculating filteredMembers on every render
  const filteredMembers = useMemo(() => {
    // Create a map to deduplicate members by ID
    const uniqueMembers = new Map();

    members.forEach((member) => {
      const id = member.id || member._id;
      if (id && !uniqueMembers.has(id)) {
        uniqueMembers.set(id, member);
      }
    });

    // Convert back to array and filter/sort
    return [...uniqueMembers.values()]
      .filter(
        (member) =>
          (member.memberType === "member" ||
            member.memberType === "supershark" ||
            member.memberType === "ultrashark") &&
          (searchTerm === "" ||
            member.firstName.toLowerCase().includes(searchTerm.toLowerCase()) ||
            (member.lastName &&
              member.lastName.toLowerCase().includes(searchTerm.toLowerCase())))
      )
      .sort((a, b) => a.firstName.localeCompare(b.firstName));
  }, [members, searchTerm]);

  // Check if we're on mobile on mount (client-side only)
  useEffect(() => {
    setIsMobile(window.innerWidth < 640);

    const handleResize = () => {
      setIsMobile(window.innerWidth < 640);
      if (hoveredMember) {
        calculateAndSetModalPosition(hoveredMember.id || hoveredMember._id);
      }
    };

    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, [hoveredMember]);

  // Set selected member from URL param on initial load
  useEffect(() => {
    if (initialMemberId && members.length > 0) {
      const member = members.find(
        (m) =>
          m.id === initialMemberId ||
          m._id === initialMemberId ||
          String(m.id) === initialMemberId ||
          String(m._id) === initialMemberId
      );

      if (member) {
        setSelectedMember(member);
        // Scroll to profile section after a short delay to ensure it's rendered
        setTimeout(() => {
          scrollToProfile();
        }, 300);
      }
    }
  }, [initialMemberId, members]);

  // Function to scroll to profile with offset to keep header visible
  const scrollToProfile = () => {
    if (profileRef.current && headerRef.current) {
      const headerHeight = headerRef.current.offsetHeight;
      const profileTop = profileRef.current.getBoundingClientRect().top;
      const offsetPosition =
        profileTop + window.pageYOffset - headerHeight - 20; // 20px extra padding

      window.scrollTo({
        top: offsetPosition,
        behavior: "smooth",
      });
    }
  };

  // Handle scroll direction detection
  useEffect(() => {
    const handleScroll = () => {
      const currentScrollY = window.scrollY;

      // Show button when scrolling up and not at the top
      if (currentScrollY < lastScrollY.current && currentScrollY > 300) {
        setShowScrollTop(true);
      } else {
        setShowScrollTop(false);
      }

      lastScrollY.current = currentScrollY;
    };

    window.addEventListener("scroll", handleScroll, { passive: true });

    return () => {
      window.removeEventListener("scroll", handleScroll);
    };
  }, []);

  const scrollToTop = () => {
    window.scrollTo({
      top: 0,
      behavior: "smooth",
    });
  };

  const handleMemberClick = (member) => {
    setSelectedMember(member);
    // Scroll to profile section
    setTimeout(() => {
      scrollToProfile();
    }, 100);

    // Update URL with member ID without refreshing the page
    const url = new URL(window.location);
    url.searchParams.set("memberId", member.id || member._id);
    window.history.pushState({}, "", url);
  };

  // Calculate and set modal position
  const calculateAndSetModalPosition = (memberId) => {
    if (!memberRefs.current[memberId]) return;

    const itemRef = memberRefs.current[memberId];
    const rect = itemRef.getBoundingClientRect();
    const viewportWidth = window.innerWidth;
    const viewportHeight = window.innerHeight;
    const modalWidth = 300; // Width for the modal
    const modalHeight = 400; // Estimated height for the modal

    let left, top;

    // On mobile (small screens), use a fixed position in the center of the screen
    if (isMobile) {
      // Center horizontally
      left = Math.max(
        10,
        Math.min(
          viewportWidth - modalWidth - 10,
          (viewportWidth - modalWidth) / 2
        )
      );

      // Position in the middle of the screen, but ensure it's fully visible
      top = Math.max(
        50,
        Math.min(
          (viewportHeight - modalHeight) / 2,
          viewportHeight - modalHeight - 20
        )
      );

      // Make sure it's not too close to the bottom
      if (top + modalHeight > viewportHeight - 20) {
        top = viewportHeight - modalHeight - 20;
      }
    } else {
      // For desktop, position closer to the avatar (reduced from 10px to 5px gap)
      left = rect.right + 5;

      // If it would go off the right edge, position to the left instead
      if (left + modalWidth > viewportWidth) {
        left = Math.max(5, rect.left - modalWidth - 5);
      }

      // Check if the modal would go off the bottom of the screen
      if (rect.top + modalHeight > viewportHeight) {
        // Position the modal above the viewport's bottom edge
        top = Math.max(5, viewportHeight - modalHeight - 5);
      } else {
        // Position closer to the avatar vertically (reduced from -20px to -10px offset)
        top = rect.top - 10;

        // Ensure it stays within the viewport
        top = Math.max(5, Math.min(viewportHeight - modalHeight - 5, top));
      }
    }

    setModalPosition({ top, left });
  };

  // Handle mouse enter with delay
  const handleMouseEnter = (member) => {
    if (isMobile) return; // Skip on mobile

    const memberId = member.id || member._id;
    const uniqueId = `member-${memberId}`;

    // Clear any pending close timeout
    if (closeTimeoutRef.current) {
      clearTimeout(closeTimeoutRef.current);
      closeTimeoutRef.current = null;
    }

    // Set hover state for this item
    hoverState.hoverStates.set(uniqueId, true);

    // If another modal is open, close it first
    if (hoverState.activeModalId && hoverState.activeModalId !== uniqueId) {
      // Reset the previous active modal's state
      if (hoverState.hoverStates.has(hoverState.activeModalId)) {
        hoverState.hoverStates.delete(hoverState.activeModalId);
      }
    }

    // Set a delay before showing the modal
    setTimeout(() => {
      // Only show if we're still hovering
      if (hoverState.hoverStates.get(uniqueId)) {
        // Calculate position before showing modal to prevent flicker
        calculateAndSetModalPosition(memberId);

        // Then show the modal
        setHoveredMember(member);
        hoverState.activeModalId = uniqueId;
      }
    }, 300); // 300ms delay before showing
  };

  // Handle mouse leave - with a short delay for closing
  const handleMouseLeave = (member) => {
    if (isMobile) return; // Skip on mobile

    const memberId = member.id || member._id;
    const uniqueId = `member-${memberId}`;

    // Remove hover state for this item
    hoverState.hoverStates.delete(uniqueId);

    // Set a short delay before closing to allow moving to the modal
    closeTimeoutRef.current = setTimeout(() => {
      // Only close if we're not hovering over the item or its modal
      if (
        !hoverState.hoverStates.get(uniqueId) &&
        hoverState.activeModalId === uniqueId
      ) {
        setHoveredMember(null);
        hoverState.activeModalId = null;
      }
    }, 150); // 150ms delay - short but enough to reach the modal
  };

  // Handle click/tap for mobile
  const handleMemberHoverClick = (e, member) => {
    if (!isMobile) return; // Only handle clicks on mobile

    e.stopPropagation(); // Stop event from bubbling
    const memberId = member.id || member._id;
    const uniqueId = `member-${memberId}`;

    // For mobile: close any other open modals
    if (hoverState.activeModalId && hoverState.activeModalId !== uniqueId) {
      // Reset the previous active modal
      hoverState.activeModalId = null;
    }

    // Calculate position before toggling
    calculateAndSetModalPosition(memberId);

    // Toggle modal
    if (
      hoveredMember &&
      (hoveredMember.id === memberId || hoveredMember._id === memberId)
    ) {
      setHoveredMember(null);
      if (hoverState.activeModalId === uniqueId) {
        hoverState.activeModalId = null;
      }
    } else {
      setHoveredMember(member);
      hoverState.activeModalId = uniqueId;
    }
  };

  // Close the modal
  const handleCloseModal = () => {
    setHoveredMember(null);
    hoverState.activeModalId = null;
  };

  // Generate a unique key for each member
  const getMemberUniqueKey = (member, index) => {
    // Use a combination of id/_id and index to ensure uniqueness
    const idPart = member.id || member._id || "";
    return `member-${idPart}-${index}`;
  };

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="max-w-6xl mx-auto">
        <div className="mb-8" ref={headerRef}>
          <h2 className="text-3xl font-bold text-center mb-2">
            Sandsharks Members
          </h2>
          <p className="text-center text-gray-600 mb-6">
            Connect with our community of beach volleyball enthusiasts
          </p>

          <div className="flex flex-col sm:flex-row justify-between items-center gap-4 mb-6">
            {/* Search bar */}
            <div className="relative w-full sm:w-64">
              <input
                type="text"
                placeholder="Search members..."
                className="w-full px-4 py-2 pr-8 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
              {searchTerm && (
                <button
                  className="absolute right-3 top-2.5 text-gray-400"
                  onClick={() => setSearchTerm("")}
                >
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    width="16"
                    height="16"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                  >
                    <line x1="18" y1="6" x2="6" y2="18"></line>
                    <line x1="6" y1="6" x2="18" y2="18"></line>
                  </svg>
                </button>
              )}
            </div>

            {/* Member count */}
            <p className="text-sm text-gray-500">
              Showing {filteredMembers.length} members
            </p>
          </div>
        </div>

        {/* Selected Member Profile */}
        {selectedMember && (
          <div
            ref={profileRef}
            className="bg-white rounded-lg shadow-lg overflow-hidden mb-10 transition-all duration-300"
          >
            <div className="p-6 flex flex-col md:flex-row gap-6">
              {/* Member Photo */}
              <div className="md:w-1/3 flex justify-center">
                <div className="relative w-48 h-48 rounded-full overflow-hidden border-4 border-blue-200">
                  <Image
                    src={
                      selectedMember.profilePicStatus === "approved" &&
                      selectedMember.profilePicUrl
                        ? selectedMember.profilePicUrl
                        : selectedMember.profilePic?.status === "approved" &&
                          selectedMember.profilePic?.url
                        ? selectedMember.profilePic.url
                        : "/images/sandsharks-rainbow-icon.svg"
                    }
                    alt={`${selectedMember.firstName}'s profile photo`}
                    fill={true}
                    className="object-cover"
                    sizes="(max-width: 768px) 100vw, 384px"
                  />
                </div>
              </div>

              {/* Member Info */}
              <div className="md:w-2/3">
                <div className="flex justify-between items-start">
                  <div>
                    <h2 className="text-2xl font-bold">
                      {selectedMember.firstName} {selectedMember.lastName}
                    </h2>
                    {selectedMember.pronouns && (
                      <p className="text-gray-600 mt-1">
                        {selectedMember.pronouns}
                      </p>
                    )}
                  </div>
                  <button
                    onClick={() => {
                      setSelectedMember(null);
                      // Remove memberId from URL
                      const url = new URL(window.location);
                      url.searchParams.delete("memberId");
                      window.history.pushState({}, "", url);
                    }}
                    className="text-gray-400 hover:text-gray-600"
                    aria-label="Close profile"
                  >
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      width="24"
                      height="24"
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
                </div>

                {selectedMember.about && (
                  <div className="mt-4">
                    <h3 className="text-lg font-semibold mb-2">About</h3>
                    <p className="text-gray-700">{selectedMember.about}</p>
                  </div>
                )}

                <div className="mt-6 flex flex-wrap gap-4">
                  {selectedMember.instagramHandle && (
                    <a
                      href={`https://instagram.com/${selectedMember.instagramHandle.replace("@", "")}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center text-blue-500 hover:text-blue-700"
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
                        className="mr-1"
                      >
                        <rect
                          x="2"
                          y="2"
                          width="20"
                          height="20"
                          rx="5"
                          ry="5"
                        ></rect>
                        <path d="M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z"></path>
                        <line x1="17.5" y1="6.5" x2="17.51" y2="6.5"></line>
                      </svg>
                      <span>
                        @{selectedMember.instagramHandle.replace("@", "")}
                      </span>
                    </a>
                  )}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Members Grid - Circular Photos */}
        <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-6 lg:grid-cols-8 gap-4 sm:gap-6">
          {filteredMembers.map((member, index) => {
            const memberId = member.id || member._id;
            const uniqueKey = getMemberUniqueKey(member, index);

            return (
              <div
                key={uniqueKey}
                ref={(el) => (memberRefs.current[memberId] = el)}
                className={`flex flex-col items-center cursor-pointer transition-transform duration-200 hover:scale-105 ${
                  selectedMember &&
                  (selectedMember.id === member.id ||
                    selectedMember._id === member._id)
                    ? "ring-4 ring-blue-400 rounded-full"
                    : ""
                }`}
                onClick={() => handleMemberClick(member)}
                onMouseEnter={() => handleMouseEnter(member)}
                onMouseLeave={() => handleMouseLeave(member)}
              >
                <div
                  className="relative w-16 h-16 sm:w-20 sm:h-20 md:w-24 md:h-24 rounded-full overflow-hidden border-2 border-blue-100"
                  onClick={(e) => {
                    e.stopPropagation();
                    handleMemberHoverClick(e, member);
                  }}
                >
                  <Image
                    src={
                      member.profilePicStatus === "approved" &&
                      member.profilePicUrl
                        ? member.profilePicUrl
                        : member.profilePic?.status === "approved" &&
                          member.profilePic?.url
                        ? member.profilePic.url
                        : "/images/sandsharks-rainbow-icon.svg"
                    }
                    alt={`${member.firstName}'s profile photo`}
                    fill={true}
                    className="object-cover"
                    sizes="(max-width: 640px) 64px, (max-width: 768px) 80px, 96px"
                  />
                </div>
                <p className="mt-2 text-center text-xs sm:text-sm font-medium text-blue-800">
                  {member.firstName}
                </p>
              </div>
            );
          })}
        </div>

        {/* Member Profile Modal */}
        {hoveredMember && (
          <MemberProfileModal
            member={hoveredMember}
            position={modalPosition}
            isVisible={!!hoveredMember}
            onClose={handleCloseModal}
            isMobile={isMobile}
            uniqueId={`member-${hoveredMember.id || hoveredMember._id}`}
          />
        )}

        {/* Show message if no results */}
        {filteredMembers.length === 0 && (
          <div className="text-center py-12 bg-gray-50 rounded-lg">
            <p className="text-gray-500 mb-2">
              No members found matching your search.
            </p>
            {searchTerm && (
              <button
                onClick={() => setSearchTerm("")}
                className="text-blue-500 hover:underline"
              >
                Clear search
              </button>
            )}
          </div>
        )}

        {/* Scroll to top button */}
        {showScrollTop && (
          <button
            onClick={scrollToTop}
            className="fixed bottom-6 right-6 bg-blue-600 text-white px-4 py-3 rounded-md shadow-lg hover:bg-opacity-90 transition-all z-50 flex items-center"
            aria-label="Scroll to top"
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
              className="mr-2"
            >
              <line x1="12" y1="19" x2="12" y2="5"></line>
              <polyline points="5 12 12 5 19 12"></polyline>
            </svg>
            Scroll to top
          </button>
        )}
      </div>
    </div>
  );
};

export default MembersSection;

// "use client"

// import { useState, useEffect, useRef, useMemo } from "react"
// import Image from "next/image"
// import { useSearchParams } from "next/navigation"
// import MemberProfileModal, { hoverState } from "./MemberProfileModal"

// const MembersSection = ({ members, user }) => {
//   const searchParams = useSearchParams()
//   const initialMemberId = searchParams.get("memberId")

//   const [searchTerm, setSearchTerm] = useState("")
//   const [showScrollTop, setShowScrollTop] = useState(false)
//   const [selectedMember, setSelectedMember] = useState(null)
//   const [hoveredMember, setHoveredMember] = useState(null)
//   const [modalPosition, setModalPosition] = useState({ top: 0, left: 0 })
//   const [isMobile, setIsMobile] = useState(false)
//   const profileRef = useRef(null)
//   const headerRef = useRef(null)
//   const memberRefs = useRef({})
//   const closeTimeoutRef = useRef(null)
//   const lastScrollY = useRef(0)

//   // Use useMemo to prevent recalculating filteredMembers on every render
//   const filteredMembers = useMemo(() => {
//     // Create a map to deduplicate members by ID
//     const uniqueMembers = new Map()

//     members.forEach((member) => {
//       const id = member.id || member._id
//       if (id && !uniqueMembers.has(id)) {
//         uniqueMembers.set(id, member)
//       }
//     })

//     // Convert back to array and filter/sort
//     return [...uniqueMembers.values()]
//       .filter(
//         (member) =>
//           (member.memberType === "member" ||
//             member.memberType === "supershark" ||
//             member.memberType === "ultrashark") &&
//           (searchTerm === "" ||
//             member.firstName.toLowerCase().includes(searchTerm.toLowerCase()) ||
//             (member.lastName && member.lastName.toLowerCase().includes(searchTerm.toLowerCase()))),
//       )
//       .sort((a, b) => a.firstName.localeCompare(b.firstName))
//   }, [members, searchTerm])

//   // Check if we're on mobile on mount (client-side only)
//   useEffect(() => {
//     setIsMobile(window.innerWidth < 640)

//     const handleResize = () => {
//       setIsMobile(window.innerWidth < 640)
//       if (hoveredMember) {
//         calculateAndSetModalPosition(hoveredMember.id || hoveredMember._id)
//       }
//     }

//     window.addEventListener("resize", handleResize)
//     return () => window.removeEventListener("resize", handleResize)
//   }, [hoveredMember])

//   // Set selected member from URL param on initial load
//   useEffect(() => {
//     if (initialMemberId && members.length > 0) {
//       const member = members.find(
//         (m) =>
//           m.id === initialMemberId ||
//           m._id === initialMemberId ||
//           String(m.id) === initialMemberId ||
//           String(m._id) === initialMemberId,
//       )

//       if (member) {
//         setSelectedMember(member)
//         // Scroll to profile section after a short delay to ensure it's rendered
//         setTimeout(() => {
//           scrollToProfile()
//         }, 300)
//       }
//     }
//   }, [initialMemberId, members])

//   // Function to scroll to profile with offset to keep header visible
//   const scrollToProfile = () => {
//     if (profileRef.current && headerRef.current) {
//       const headerHeight = headerRef.current.offsetHeight
//       const profileTop = profileRef.current.getBoundingClientRect().top
//       const offsetPosition = profileTop + window.pageYOffset - headerHeight - 20 // 20px extra padding

//       window.scrollTo({
//         top: offsetPosition,
//         behavior: "smooth",
//       })
//     }
//   }

//   // Handle scroll direction detection
//   useEffect(() => {
//     const handleScroll = () => {
//       const currentScrollY = window.scrollY

//       // Show button when scrolling up and not at the top
//       if (currentScrollY < lastScrollY.current && currentScrollY > 300) {
//         setShowScrollTop(true)
//       } else {
//         setShowScrollTop(false)
//       }

//       lastScrollY.current = currentScrollY
//     }

//     window.addEventListener("scroll", handleScroll, { passive: true })

//     return () => {
//       window.removeEventListener("scroll", handleScroll)
//     }
//   }, [])

//   const scrollToTop = () => {
//     window.scrollTo({
//       top: 0,
//       behavior: "smooth",
//     })
//   }

//   const handleMemberClick = (member) => {
//     setSelectedMember(member)
//     // Scroll to profile section
//     setTimeout(() => {
//       scrollToProfile()
//     }, 100)

//     // Update URL with member ID without refreshing the page
//     const url = new URL(window.location)
//     url.searchParams.set("memberId", member.id || member._id)
//     window.history.pushState({}, "", url)
//   }

//   // Calculate and set modal position
//   const calculateAndSetModalPosition = (memberId) => {
//     if (!memberRefs.current[memberId]) return

//     const itemRef = memberRefs.current[memberId]
//     const rect = itemRef.getBoundingClientRect()
//     const viewportWidth = window.innerWidth
//     const viewportHeight = window.innerHeight
//     const modalWidth = 320 // Slightly wider for the baseball card style
//     const modalHeight = 450 // Taller for the baseball card style

//     let left, top

//     // On mobile (small screens), use a fixed position in the center of the screen
//     if (isMobile) {
//       // Center horizontally
//       left = Math.max(10, Math.min(viewportWidth - modalWidth - 10, (viewportWidth - modalWidth) / 2))

//       // Position in the middle of the screen, but ensure it's fully visible
//       top = Math.max(50, Math.min((viewportHeight - modalHeight) / 2, viewportHeight - modalHeight - 20))

//       // Make sure it's not too close to the bottom
//       if (top + modalHeight > viewportHeight - 20) {
//         top = viewportHeight - modalHeight - 20
//       }
//     } else {
//       // For desktop, position closer to the avatar
//       left = rect.right + 10

//       // If it would go off the right edge, position to the left instead
//       if (left + modalWidth > viewportWidth) {
//         left = Math.max(5, rect.left - modalWidth - 10)
//       }

//       // Check if the modal would go off the bottom of the screen
//       if (rect.top + modalHeight > viewportHeight) {
//         // Position the modal above the viewport's bottom edge
//         top = Math.max(5, viewportHeight - modalHeight - 5)
//       } else {
//         // Position closer to the avatar vertically
//         top = rect.top - 10

//         // Ensure it stays within the viewport
//         top = Math.max(5, Math.min(viewportHeight - modalHeight - 5, top))
//       }
//     }

//     setModalPosition({ top, left })
//   }

//   // Handle mouse enter with delay
//   const handleMouseEnter = (member) => {
//     if (isMobile) return // Skip on mobile

//     const memberId = member.id || member._id
//     const uniqueId = `member-${memberId}`

//     // Clear any pending close timeout
//     if (closeTimeoutRef.current) {
//       clearTimeout(closeTimeoutRef.current)
//       closeTimeoutRef.current = null
//     }

//     // Set hover state for this item
//     hoverState.hoverStates.set(uniqueId, true)

//     // If another modal is open, close it first
//     if (hoverState.activeModalId && hoverState.activeModalId !== uniqueId) {
//       // Reset the previous active modal's state
//       if (hoverState.hoverStates.has(hoverState.activeModalId)) {
//         hoverState.hoverStates.delete(hoverState.activeModalId)
//       }
//     }

//     // Set a delay before showing the modal
//     setTimeout(() => {
//       // Only show if we're still hovering
//       if (hoverState.hoverStates.get(uniqueId)) {
//         // Calculate position before showing modal to prevent flicker
//         calculateAndSetModalPosition(memberId)

//         // Then show the modal
//         setHoveredMember(member)
//         hoverState.activeModalId = uniqueId
//       }
//     }, 300) // 300ms delay before showing
//   }

//   // Handle mouse leave - with a short delay for closing
//   const handleMouseLeave = (member) => {
//     if (isMobile) return // Skip on mobile

//     const memberId = member.id || member._id
//     const uniqueId = `member-${memberId}`

//     // Remove hover state for this item
//     hoverState.hoverStates.delete(uniqueId)

//     // Set a short delay before closing to allow moving to the modal
//     closeTimeoutRef.current = setTimeout(() => {
//       // Only close if we're not hovering over the item or its modal
//       if (!hoverState.hoverStates.get(uniqueId) && hoverState.activeModalId === uniqueId) {
//         setHoveredMember(null)
//         hoverState.activeModalId = null
//       }
//     }, 150) // 150ms delay - short but enough to reach the modal
//   }

//   // Handle click/tap for mobile
//   const handleMemberHoverClick = (e, member) => {
//     if (!isMobile) return // Only handle clicks on mobile

//     e.stopPropagation() // Stop event from bubbling
//     const memberId = member.id || member._id
//     const uniqueId = `member-${memberId}`

//     // For mobile: close any other open modals
//     if (hoverState.activeModalId && hoverState.activeModalId !== uniqueId) {
//       // Reset the previous active modal
//       hoverState.activeModalId = null
//     }

//     // Calculate position before toggling
//     calculateAndSetModalPosition(memberId)

//     // Toggle modal
//     if (hoveredMember && (hoveredMember.id === memberId || hoveredMember._id === memberId)) {
//       setHoveredMember(null)
//       if (hoverState.activeModalId === uniqueId) {
//         hoverState.activeModalId = null
//       }
//     } else {
//       setHoveredMember(member)
//       hoverState.activeModalId = uniqueId
//     }
//   }

//   // Close the modal
//   const handleCloseModal = () => {
//     setHoveredMember(null)
//     hoverState.activeModalId = null
//   }

//   // Generate a unique key for each member
//   const getMemberUniqueKey = (member, index) => {
//     // Use a combination of id/_id and index to ensure uniqueness
//     const idPart = member.id || member._id || ""
//     return `member-${idPart}-${index}`
//   }

//   return (
//     <div className="container mx-auto px-4 py-8">
//       <div className="max-w-6xl mx-auto">
//         <div className="mb-8" ref={headerRef}>
//           <h2 className="text-3xl font-bold text-center mb-2">Sandsharks Members</h2>
//           <p className="text-center text-gray-600 mb-6">Connect with our community of beach volleyball enthusiasts</p>

//           <div className="flex flex-col sm:flex-row justify-between items-center gap-4 mb-6">
//             {/* Search bar */}
//             <div className="relative w-full sm:w-64">
//               <input
//                 type="text"
//                 placeholder="Search members..."
//                 className="w-full px-4 py-2 pr-8 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
//                 value={searchTerm}
//                 onChange={(e) => setSearchTerm(e.target.value)}
//               />
//               {searchTerm && (
//                 <button className="absolute right-3 top-2.5 text-gray-400" onClick={() => setSearchTerm("")}>
//                   <svg
//                     xmlns="http://www.w3.org/2000/svg"
//                     width="16"
//                     height="16"
//                     viewBox="0 0 24 24"
//                     fill="none"
//                     stroke="currentColor"
//                     strokeWidth="2"
//                   >
//                     <line x1="18" y1="6" x2="6" y2="18"></line>
//                     <line x1="6" y1="6" x2="18" y2="18"></line>
//                   </svg>
//                 </button>
//               )}
//             </div>

//             {/* Member count */}
//             <p className="text-sm text-gray-500">Showing {filteredMembers.length} members</p>
//           </div>
//         </div>

//         {/* Selected Member Profile */}
//         {selectedMember && (
//           <div
//             ref={profileRef}
//             className="bg-white rounded-lg shadow-lg overflow-hidden mb-10 transition-all duration-300"
//           >
//             <div className="p-6 flex flex-col md:flex-row gap-6">
//               {/* Member Photo - Now in original proportions */}
//               <div className="md:w-1/3 flex justify-center">
//                 <div className="relative w-48 h-auto max-w-full border-4 border-blue-200 shadow-md">
//                   <div className="aspect-square relative">
//                     <Image
//                       src={
//                         selectedMember.profilePicStatus === "approved" && selectedMember.profilePicUrl
//                           ? selectedMember.profilePicUrl
//                           : selectedMember.profilePic?.status === "approved" && selectedMember.profilePic?.url
//                             ? selectedMember.profilePic.url
//                             : "/images/sandsharks-rainbow-icon.svg"
//                       }
//                       alt={`${selectedMember.firstName}'s profile photo`}
//                       fill={true}
//                       className="object-cover"
//                       sizes="(max-width: 768px) 100vw, 384px"
//                     />
//                   </div>
//                 </div>
//               </div>

//               {/* Member Info */}
//               <div className="md:w-2/3">
//                 <div className="flex justify-between items-start">
//                   <div>
//                     <h2 className="text-2xl font-bold">
//                       {selectedMember.firstName} {selectedMember.lastName}
//                     </h2>
//                     {selectedMember.pronouns && <p className="text-gray-600 mt-1">{selectedMember.pronouns}</p>}
//                   </div>
//                   <button
//                     onClick={() => {
//                       setSelectedMember(null)
//                       // Remove memberId from URL
//                       const url = new URL(window.location)
//                       url.searchParams.delete("memberId")
//                       window.history.pushState({}, "", url)
//                     }}
//                     className="text-gray-400 hover:text-gray-600"
//                     aria-label="Close profile"
//                   >
//                     <svg
//                       xmlns="http://www.w3.org/2000/svg"
//                       width="24"
//                       height="24"
//                       viewBox="0 0 24 24"
//                       fill="none"
//                       stroke="currentColor"
//                       strokeWidth="2"
//                       strokeLinecap="round"
//                       strokeLinejoin="round"
//                     >
//                       <line x1="18" y1="6" x2="6" y2="18"></line>
//                       <line x1="6" y1="6" x2="18" y2="18"></line>
//                     </svg>
//                   </button>
//                 </div>

//                 {selectedMember.about && (
//                   <div className="mt-4">
//                     <h3 className="text-lg font-semibold mb-2">About</h3>
//                     <p className="text-gray-700">{selectedMember.about}</p>
//                   </div>
//                 )}

//                 <div className="mt-6 flex flex-wrap gap-4">
//                   {selectedMember.instagramHandle && (
//                     <a
//                       href={`https://instagram.com/${selectedMember.instagramHandle.replace("@", "")}`}
//                       target="_blank"
//                       rel="noopener noreferrer"
//                       className="inline-flex items-center text-blue-500 hover:text-blue-700"
//                     >
//                       <svg
//                         xmlns="http://www.w3.org/2000/svg"
//                         width="16"
//                         height="16"
//                         viewBox="0 0 24 24"
//                         fill="none"
//                         stroke="currentColor"
//                         strokeWidth="2"
//                         strokeLinecap="round"
//                         strokeLinejoin="round"
//                         className="mr-1"
//                       >
//                         <rect x="2" y="2" width="20" height="20" rx="5" ry="5"></rect>
//                         <path d="M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z"></path>
//                         <line x1="17.5" y1="6.5" x2="17.51" y2="6.5"></line>
//                       </svg>
//                       <span>@{selectedMember.instagramHandle.replace("@", "")}</span>
//                     </a>
//                   )}
//                 </div>
//               </div>
//             </div>
//           </div>
//         )}

//         {/* Members Grid - Now with Square Photos */}
//         <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-6 lg:grid-cols-8 gap-4 sm:gap-6">
//           {filteredMembers.map((member, index) => {
//             const memberId = member.id || member._id
//             const uniqueKey = getMemberUniqueKey(member, index)

//             return (
//               <div
//                 key={uniqueKey}
//                 ref={(el) => (memberRefs.current[memberId] = el)}
//                 className={`flex flex-col items-center cursor-pointer transition-transform duration-200 hover:scale-105 ${
//                   selectedMember && (selectedMember.id === member.id || selectedMember._id === member._id)
//                     ? "ring-4 ring-blue-400"
//                     : ""
//                 }`}
//                 onClick={() => handleMemberClick(member)}
//                 onMouseEnter={() => handleMouseEnter(member)}
//                 onMouseLeave={() => handleMouseLeave(member)}
//               >
//                 <div
//                   className="relative w-16 h-16 sm:w-20 sm:h-20 md:w-24 md:h-24 overflow-hidden border-2 border-blue-100 shadow-sm"
//                   onClick={(e) => {
//                     e.stopPropagation()
//                     handleMemberHoverClick(e, member)
//                   }}
//                 >
//                   <Image
//                     src={
//                       member.profilePicStatus === "approved" && member.profilePicUrl
//                         ? member.profilePicUrl
//                         : member.profilePic?.status === "approved" && member.profilePic?.url
//                           ? member.profilePic.url
//                           : "/images/sandsharks-rainbow-icon.svg"
//                     }
//                     alt={`${member.firstName}'s profile photo`}
//                     fill={true}
//                     className="object-cover"
//                     sizes="(max-width: 640px) 64px, (max-width: 768px) 80px, 96px"
//                   />
//                 </div>
//                 <p className="mt-2 text-center text-xs sm:text-sm font-medium text-blue-800">{member.firstName}</p>
//               </div>
//             )
//           })}
//         </div>

//         {/* Member Profile Modal */}
//         {hoveredMember && (
//           <MemberProfileModal
//             member={hoveredMember}
//             position={modalPosition}
//             isVisible={!!hoveredMember}
//             onClose={handleCloseModal}
//             isMobile={isMobile}
//             uniqueId={`member-${hoveredMember.id || hoveredMember._id}`}
//           />
//         )}

//         {/* Show message if no results */}
//         {filteredMembers.length === 0 && (
//           <div className="text-center py-12 bg-gray-50 rounded-lg">
//             <p className="text-gray-500 mb-2">No members found matching your search.</p>
//             {searchTerm && (
//               <button onClick={() => setSearchTerm("")} className="text-blue-500 hover:underline">
//                 Clear search
//               </button>
//             )}
//           </div>
//         )}

//         {/* Scroll to top button */}
//         {showScrollTop && (
//           <button
//             onClick={scrollToTop}
//             className="fixed bottom-6 right-6 bg-blue-600 text-white px-4 py-3 rounded-md shadow-lg hover:bg-opacity-90 transition-all z-50 flex items-center"
//             aria-label="Scroll to top"
//           >
//             <svg
//               xmlns="http://www.w3.org/2000/svg"
//               width="16"
//               height="16"
//               viewBox="0 0 24 24"
//               fill="none"
//               stroke="currentColor"
//               strokeWidth="2"
//               strokeLinecap="round"
//               strokeLinejoin="round"
//               className="mr-2"
//             >
//               <line x1="12" y1="19" x2="12" y2="5"></line>
//               <polyline points="5 12 12 5 19 12"></polyline>
//             </svg>
//             Scroll to top
//           </button>
//         )}
//       </div>
//     </div>
//   )
// }

// export default MembersSection





//lazy loading - use this when members exceed 500
// "use client";

// import { useState, useEffect, useRef, useMemo } from "react";
// import Image from "next/image";
// import { useSearchParams } from "next/navigation";
// import MemberProfileModal, { hoverState } from "./MemberProfileModal";

// const MembersSection = ({ members, user }) => {
//   const searchParams = useSearchParams();
//   const initialMemberId = searchParams.get("memberId");

//   const [searchTerm, setSearchTerm] = useState("");
//   const [visibleMembers, setVisibleMembers] = useState([]);
//   const [loading, setLoading] = useState(false);
//   const [allLoaded, setAllLoaded] = useState(false);
//   const [showScrollTop, setShowScrollTop] = useState(false);
//   const [selectedMember, setSelectedMember] = useState(null);
//   const [hoveredMember, setHoveredMember] = useState(null);
//   const [modalPosition, setModalPosition] = useState({ top: 0, left: 0 });
//   const [isMobile, setIsMobile] = useState(false);
//   const loaderRef = useRef(null);
//   const profileRef = useRef(null);
//   const headerRef = useRef(null);
//   const memberRefs = useRef({});
//   const closeTimeoutRef = useRef(null);
//   const itemsPerLoad = 24;
//   const lastScrollY = useRef(0);
//   const loadedMemberIds = useRef(new Set()); // Track loaded member IDs to prevent duplicates

//   // Use useMemo to prevent recalculating filteredMembers on every render
//   const filteredMembers = useMemo(() => {
//     // Create a map to deduplicate members by ID
//     const uniqueMembers = new Map();

//     members.forEach((member) => {
//       const id = member.id || member._id;
//       if (id && !uniqueMembers.has(id)) {
//         uniqueMembers.set(id, member);
//       }
//     });

//     // Convert back to array and filter/sort
//     return [...uniqueMembers.values()]
//       .filter(
//         (member) =>
//           (member.memberType === "member" ||
//             member.memberType === "supershark" ||
//             member.memberType === "ultrashark") &&
//           (searchTerm === "" ||
//             member.firstName.toLowerCase().includes(searchTerm.toLowerCase()) ||
//             (member.lastName &&
//               member.lastName.toLowerCase().includes(searchTerm.toLowerCase())))
//       )
//       .sort((a, b) => a.firstName.localeCompare(b.firstName));
//   }, [members, searchTerm]);

//   // Check if we're on mobile on mount (client-side only)
//   useEffect(() => {
//     setIsMobile(window.innerWidth < 640);

//     const handleResize = () => {
//       setIsMobile(window.innerWidth < 640);
//       if (hoveredMember) {
//         calculateAndSetModalPosition(hoveredMember.id || hoveredMember._id);
//       }
//     };

//     window.addEventListener("resize", handleResize);
//     return () => window.removeEventListener("resize", handleResize);
//   }, [hoveredMember]);

//   // Set selected member from URL param on initial load
//   useEffect(() => {
//     if (initialMemberId && members.length > 0) {
//       const member = members.find(
//         (m) =>
//           m.id === initialMemberId ||
//           m._id === initialMemberId ||
//           String(m.id) === initialMemberId ||
//           String(m._id) === initialMemberId
//       );

//       if (member) {
//         setSelectedMember(member);
//         // Scroll to profile section after a short delay to ensure it's rendered
//         setTimeout(() => {
//           scrollToProfile();
//         }, 300);
//       }
//     }
//   }, [initialMemberId, members]);

//   // Function to scroll to profile with offset to keep header visible
//   const scrollToProfile = () => {
//     if (profileRef.current && headerRef.current) {
//       const headerHeight = headerRef.current.offsetHeight;
//       const profileTop = profileRef.current.getBoundingClientRect().top;
//       const offsetPosition =
//         profileTop + window.pageYOffset - headerHeight - 20; // 20px extra padding

//       window.scrollTo({
//         top: offsetPosition,
//         behavior: "smooth",
//       });
//     }
//   };

//   // Reset visible members when filtered members change
//   useEffect(() => {
//     // Reset tracking of loaded members
//     loadedMemberIds.current = new Set();
//     setVisibleMembers(filteredMembers.slice(0, itemsPerLoad));

//     // Add IDs to the set
//     filteredMembers.slice(0, itemsPerLoad).forEach((member) => {
//       const id = member.id || member._id;
//       if (id) loadedMemberIds.current.add(id);
//     });

//     setAllLoaded(filteredMembers.length <= itemsPerLoad);
//   }, [filteredMembers]);

//   // Load more members function
//   const loadMoreMembers = () => {
//     if (loading || allLoaded) return;

//     setLoading(true);

//     // Simulate loading delay
//     setTimeout(() => {
//       const currentCount = visibleMembers.length;
//       const nextBatch = [];
//       let i = currentCount;

//       // Add members that haven't been loaded yet
//       while (nextBatch.length < itemsPerLoad && i < filteredMembers.length) {
//         const member = filteredMembers[i];
//         const id = member.id || member._id;

//         if (!loadedMemberIds.current.has(id)) {
//           nextBatch.push(member);
//           loadedMemberIds.current.add(id);
//         }
//         i++;
//       }

//       setVisibleMembers((prev) => [...prev, ...nextBatch]);
//       setLoading(false);

//       if (currentCount + nextBatch.length >= filteredMembers.length) {
//         setAllLoaded(true);
//       }
//     }, 300);
//   };

//   // Set up intersection observer for infinite scroll
//   useEffect(() => {
//     const observer = new IntersectionObserver(
//       (entries) => {
//         if (entries[0].isIntersecting && !loading && !allLoaded) {
//           loadMoreMembers();
//         }
//       },
//       { threshold: 0.1 }
//     );

//     const currentLoader = loaderRef.current;
//     if (currentLoader) {
//       observer.observe(currentLoader);
//     }

//     return () => {
//       if (currentLoader) {
//         observer.unobserve(currentLoader);
//       }
//     };
//   }, [loading, allLoaded, visibleMembers.length, filteredMembers.length]);

//   // Handle scroll direction detection
//   useEffect(() => {
//     const handleScroll = () => {
//       const currentScrollY = window.scrollY;

//       // Show button when scrolling up and not at the top
//       if (currentScrollY < lastScrollY.current && currentScrollY > 300) {
//         setShowScrollTop(true);
//       } else {
//         setShowScrollTop(false);
//       }

//       lastScrollY.current = currentScrollY;
//     };

//     window.addEventListener("scroll", handleScroll, { passive: true });

//     return () => {
//       window.removeEventListener("scroll", handleScroll);
//     };
//   }, []);

//   const scrollToTop = () => {
//     window.scrollTo({
//       top: 0,
//       behavior: "smooth",
//     });
//   };

//   const handleMemberClick = (member) => {
//     setSelectedMember(member);
//     // Scroll to profile section
//     setTimeout(() => {
//       scrollToProfile();
//     }, 100);

//     // Update URL with member ID without refreshing the page
//     const url = new URL(window.location);
//     url.searchParams.set("memberId", member.id || member._id);
//     window.history.pushState({}, "", url);
//   };

//   // Calculate and set modal position
//   const calculateAndSetModalPosition = (memberId) => {
//     if (!memberRefs.current[memberId]) return;

//     const itemRef = memberRefs.current[memberId];
//     const rect = itemRef.getBoundingClientRect();
//     const viewportWidth = window.innerWidth;
//     const viewportHeight = window.innerHeight;
//     const modalWidth = 300; // Width for the modal
//     const modalHeight = 400; // Estimated height for the modal

//     let left, top;

//     // On mobile (small screens), use a fixed position in the center of the screen
//     if (isMobile) {
//       // Center horizontally
//       left = Math.max(
//         10,
//         Math.min(
//           viewportWidth - modalWidth - 10,
//           (viewportWidth - modalWidth) / 2
//         )
//       );

//       // Position in the middle of the screen, but ensure it's fully visible
//       top = Math.max(
//         50,
//         Math.min(
//           (viewportHeight - modalHeight) / 2,
//           viewportHeight - modalHeight - 20
//         )
//       );

//       // Make sure it's not too close to the bottom
//       if (top + modalHeight > viewportHeight - 20) {
//         top = viewportHeight - modalHeight - 20;
//       }
//     } else {
//       // For desktop, position closer to the avatar (reduced from 10px to 5px gap)
//       left = rect.right + 5;

//       // If it would go off the right edge, position to the left instead
//       if (left + modalWidth > viewportWidth) {
//         left = Math.max(5, rect.left - modalWidth - 5);
//       }

//       // Check if the modal would go off the bottom of the screen
//       if (rect.top + modalHeight > viewportHeight) {
//         // Position the modal above the viewport's bottom edge
//         top = Math.max(5, viewportHeight - modalHeight - 5);
//       } else {
//         // Position closer to the avatar vertically (reduced from -20px to -10px offset)
//         top = rect.top - 10;

//         // Ensure it stays within the viewport
//         top = Math.max(5, Math.min(viewportHeight - modalHeight - 5, top));
//       }
//     }

//     setModalPosition({ top, left });
//   };

//   // Handle mouse enter with delay
//   const handleMouseEnter = (member) => {
//     if (isMobile) return; // Skip on mobile

//     const memberId = member.id || member._id;
//     const uniqueId = `member-${memberId}`;

//     // Clear any pending close timeout
//     if (closeTimeoutRef.current) {
//       clearTimeout(closeTimeoutRef.current);
//       closeTimeoutRef.current = null;
//     }

//     // Set hover state for this item
//     hoverState.hoverStates.set(uniqueId, true);

//     // If another modal is open, close it first
//     if (hoverState.activeModalId && hoverState.activeModalId !== uniqueId) {
//       // Reset the previous active modal's state
//       if (hoverState.hoverStates.has(hoverState.activeModalId)) {
//         hoverState.hoverStates.delete(hoverState.activeModalId);
//       }
//     }

//     // Set a delay before showing the modal
//     setTimeout(() => {
//       // Only show if we're still hovering
//       if (hoverState.hoverStates.get(uniqueId)) {
//         // Calculate position before showing modal to prevent flicker
//         calculateAndSetModalPosition(memberId);

//         // Then show the modal
//         setHoveredMember(member);
//         hoverState.activeModalId = uniqueId;
//       }
//     }, 300); // 300ms delay before showing
//   };

//   // Handle mouse leave - with a short delay for closing
//   const handleMouseLeave = (member) => {
//     if (isMobile) return; // Skip on mobile

//     const memberId = member.id || member._id;
//     const uniqueId = `member-${memberId}`;

//     // Remove hover state for this item
//     hoverState.hoverStates.delete(uniqueId);

//     // Set a short delay before closing to allow moving to the modal
//     closeTimeoutRef.current = setTimeout(() => {
//       // Only close if we're not hovering over the item or its modal
//       if (
//         !hoverState.hoverStates.get(uniqueId) &&
//         hoverState.activeModalId === uniqueId
//       ) {
//         setHoveredMember(null);
//         hoverState.activeModalId = null;
//       }
//     }, 150); // 150ms delay - short but enough to reach the modal
//   };

//   // Handle click/tap for mobile
//   const handleMemberHoverClick = (e, member) => {
//     if (!isMobile) return; // Only handle clicks on mobile

//     e.stopPropagation(); // Stop event from bubbling
//     const memberId = member.id || member._id;
//     const uniqueId = `member-${memberId}`;

//     // For mobile: close any other open modals
//     if (hoverState.activeModalId && hoverState.activeModalId !== uniqueId) {
//       // Reset the previous active modal
//       hoverState.activeModalId = null;
//     }

//     // Calculate position before toggling
//     calculateAndSetModalPosition(memberId);

//     // Toggle modal
//     if (
//       hoveredMember &&
//       (hoveredMember.id === memberId || hoveredMember._id === memberId)
//     ) {
//       setHoveredMember(null);
//       if (hoverState.activeModalId === uniqueId) {
//         hoverState.activeModalId = null;
//       }
//     } else {
//       setHoveredMember(member);
//       hoverState.activeModalId = uniqueId;
//     }
//   };

//   // Close the modal
//   const handleCloseModal = () => {
//     setHoveredMember(null);
//     hoverState.activeModalId = null;
//   };

//   // Generate a unique key for each member
//   const getMemberUniqueKey = (member, index) => {
//     // Use a combination of id/_id and index to ensure uniqueness
//     const idPart = member.id || member._id || "";
//     return `member-${idPart}-${index}`;
//   };

//   return (
//     <div className="container mx-auto px-4 py-8">
//       <div className="max-w-6xl mx-auto">
//         <div className="mb-8" ref={headerRef}>
//           <h2 className="text-3xl font-bold text-center mb-2">
//             Sandsharks Members
//           </h2>
//           <p className="text-center text-gray-600 mb-6">
//             Connect with our community of beach volleyball enthusiasts
//           </p>

//           <div className="flex flex-col sm:flex-row justify-between items-center gap-4 mb-6">
//             {/* Search bar */}
//             <div className="relative w-full sm:w-64">
//               <input
//                 type="text"
//                 placeholder="Search members..."
//                 className="w-full px-4 py-2 pr-8 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
//                 value={searchTerm}
//                 onChange={(e) => setSearchTerm(e.target.value)}
//               />
//               {searchTerm && (
//                 <button
//                   className="absolute right-3 top-2.5 text-gray-400"
//                   onClick={() => setSearchTerm("")}
//                 >
//                   <svg
//                     xmlns="http://www.w3.org/2000/svg"
//                     width="16"
//                     height="16"
//                     viewBox="0 0 24 24"
//                     fill="none"
//                     stroke="currentColor"
//                     strokeWidth="2"
//                   >
//                     <line x1="18" y1="6" x2="6" y2="18"></line>
//                     <line x1="6" y1="6" x2="18" y2="18"></line>
//                   </svg>
//                 </button>
//               )}
//             </div>

//             {/* Member count */}
//             <p className="text-sm text-gray-500">
//               Showing {visibleMembers.length} of {filteredMembers.length}{" "}
//               members
//             </p>
//           </div>
//         </div>

//         {/* Selected Member Profile */}
//         {selectedMember && (
//           <div
//             ref={profileRef}
//             className="bg-white rounded-lg shadow-lg overflow-hidden mb-10 transition-all duration-300"
//           >
//             <div className="p-6 flex flex-col md:flex-row gap-6">
//               {/* Member Photo */}
//               <div className="md:w-1/3 flex justify-center">
//                 <div className="relative w-48 h-48 rounded-full overflow-hidden border-4 border-blue-200">
//                   <Image
//                     src={
//                       selectedMember.profilePicStatus === "approved" &&
//                       selectedMember.profilePicUrl
//                         ? selectedMember.profilePicUrl
//                         : selectedMember.profilePic?.status === "approved" &&
//                             selectedMember.profilePic?.url
//                           ? selectedMember.profilePic.url
//                           : "/images/sandsharks-rainbow-icon.svg"
//                     }
//                     alt={`${selectedMember.firstName}'s profile photo`}
//                     fill={true}
//                     className="object-cover"
//                     sizes="(max-width: 768px) 100vw, 384px"
//                   />
//                 </div>
//               </div>

//               {/* Member Info */}
//               <div className="md:w-2/3">
//                 <div className="flex justify-between items-start">
//                   <div>
//                     <h2 className="text-2xl font-bold">
//                       {selectedMember.firstName} {selectedMember.lastName}
//                     </h2>
//                     {selectedMember.pronouns && (
//                       <p className="text-gray-600 mt-1">
//                         {selectedMember.pronouns}
//                       </p>
//                     )}
//                   </div>
//                   <button
//                     onClick={() => {
//                       setSelectedMember(null);
//                       // Remove memberId from URL
//                       const url = new URL(window.location);
//                       url.searchParams.delete("memberId");
//                       window.history.pushState({}, "", url);
//                     }}
//                     className="text-gray-400 hover:text-gray-600"
//                     aria-label="Close profile"
//                   >
//                     <svg
//                       xmlns="http://www.w3.org/2000/svg"
//                       width="24"
//                       height="24"
//                       viewBox="0 0 24 24"
//                       fill="none"
//                       stroke="currentColor"
//                       strokeWidth="2"
//                       strokeLinecap="round"
//                       strokeLinejoin="round"
//                     >
//                       <line x1="18" y1="6" x2="6" y2="18"></line>
//                       <line x1="6" y1="6" x2="18" y2="18"></line>
//                     </svg>
//                   </button>
//                 </div>

//                 {selectedMember.about && (
//                   <div className="mt-4">
//                     <h3 className="text-lg font-semibold mb-2">About</h3>
//                     <p className="text-gray-700">{selectedMember.about}</p>
//                   </div>
//                 )}

//                 <div className="mt-6 flex flex-wrap gap-4">
//                   {selectedMember.instagramHandle && (
//                     <a
//                       href={`https://instagram.com/${selectedMember.instagramHandle.replace("@", "")}`}
//                       target="_blank"
//                       rel="noopener noreferrer"
//                       className="inline-flex items-center text-blue-500 hover:text-blue-700"
//                     >
//                       <svg
//                         xmlns="http://www.w3.org/2000/svg"
//                         width="16"
//                         height="16"
//                         viewBox="0 0 24 24"
//                         fill="none"
//                         stroke="currentColor"
//                         strokeWidth="2"
//                         strokeLinecap="round"
//                         strokeLinejoin="round"
//                         className="mr-1"
//                       >
//                         <rect
//                           x="2"
//                           y="2"
//                           width="20"
//                           height="20"
//                           rx="5"
//                           ry="5"
//                         ></rect>
//                         <path d="M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z"></path>
//                         <line x1="17.5" y1="6.5" x2="17.51" y2="6.5"></line>
//                       </svg>
//                       <span>
//                         @{selectedMember.instagramHandle.replace("@", "")}
//                       </span>
//                     </a>
//                   )}
//                 </div>
//               </div>
//             </div>
//           </div>
//         )}

//         {/* Members Grid - Circular Photos */}
//         <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-6 lg:grid-cols-8 gap-4 sm:gap-6">
//           {visibleMembers.map((member, index) => {
//             const memberId = member.id || member._id;
//             const uniqueKey = getMemberUniqueKey(member, index);

//             return (
//               <div
//                 key={uniqueKey}
//                 ref={(el) => (memberRefs.current[memberId] = el)}
//                 className={`flex flex-col items-center cursor-pointer transition-transform duration-200 hover:scale-105 ${
//                   selectedMember &&
//                   (selectedMember.id === member.id ||
//                     selectedMember._id === member._id)
//                     ? "ring-4 ring-blue-400 rounded-full"
//                     : ""
//                 }`}
//                 onClick={() => handleMemberClick(member)}
//                 onMouseEnter={() => handleMouseEnter(member)}
//                 onMouseLeave={() => handleMouseLeave(member)}
//               >
//                 <div
//                   className="relative w-16 h-16 sm:w-20 sm:h-20 md:w-24 md:h-24 rounded-full overflow-hidden border-2 border-blue-100"
//                   onClick={(e) => {
//                     e.stopPropagation();
//                     handleMemberHoverClick(e, member);
//                   }}
//                 >
//                   <Image
//                     src={
//                       member.profilePicStatus === "approved" &&
//                       member.profilePicUrl
//                         ? member.profilePicUrl
//                         : member.profilePic?.status === "approved" &&
//                             member.profilePic?.url
//                           ? member.profilePic.url
//                           : "/images/sandsharks-rainbow-icon.svg"
//                     }
//                     alt={`${member.firstName}'s profile photo`}
//                     fill={true}
//                     className="object-cover"
//                     sizes="(max-width: 640px) 64px, (max-width: 768px) 80px, 96px"
//                   />
//                 </div>
//                 <p className="mt-2 text-center text-xs sm:text-sm font-medium text-blue-800">
//                   {member.firstName}
//                 </p>
//               </div>
//             );
//           })}
//         </div>

//         {/* Member Profile Modal */}
//         {hoveredMember && (
//           <MemberProfileModal
//             member={hoveredMember}
//             position={modalPosition}
//             isVisible={!!hoveredMember}
//             onClose={handleCloseModal}
//             isMobile={isMobile}
//             uniqueId={`member-${hoveredMember.id || hoveredMember._id}`}
//           />
//         )}

//         {/* Loading indicator */}
//         {!allLoaded && filteredMembers.length > 0 && (
//           <div ref={loaderRef} className="text-center py-8">
//             {loading ? (
//               <div className="flex justify-center items-center">
//                 <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500"></div>
//               </div>
//             ) : (
//               <p className="text-gray-500">Scroll for more</p>
//             )}
//           </div>
//         )}

//         {/* Show message if no results */}
//         {filteredMembers.length === 0 && (
//           <div className="text-center py-12 bg-gray-50 rounded-lg">
//             <p className="text-gray-500 mb-2">
//               No members found matching your search.
//             </p>
//             {searchTerm && (
//               <button
//                 onClick={() => setSearchTerm("")}
//                 className="text-blue-500 hover:underline"
//               >
//                 Clear search
//               </button>
//             )}
//           </div>
//         )}

//         {/* Scroll to top button */}
//         {showScrollTop && (
//           <button
//             onClick={scrollToTop}
//             className="fixed bottom-6 right-6 bg-blue-600 text-white px-4 py-3 rounded-md shadow-lg hover:bg-opacity-90 transition-all z-50 flex items-center"
//             aria-label="Scroll to top"
//           >
//             <svg
//               xmlns="http://www.w3.org/2000/svg"
//               width="16"
//               height="16"
//               viewBox="0 0 24 24"
//               fill="none"
//               stroke="currentColor"
//               strokeWidth="2"
//               strokeLinecap="round"
//               strokeLinejoin="round"
//               className="mr-2"
//             >
//               <line x1="12" y1="19" x2="12" y2="5"></line>
//               <polyline points="5 12 12 5 19 12"></polyline>
//             </svg>
//             Scroll to top
//           </button>
//         )}
//       </div>
//     </div>
//   );
// };

// export default MembersSection;