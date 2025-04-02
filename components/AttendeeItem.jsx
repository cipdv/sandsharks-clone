"use client";

import { useState, useRef, useEffect } from "react";
import Image from "next/image";

// Global state to track hover states and active modal
const hoverStates = new Map();
let activeModalId = null;

// Reusable attendee item component with hover effects
const AttendeeItem = ({ reply, showFirstNameOnly = false }) => {
  const [showModal, setShowModal] = useState(false);
  const [modalPosition, setModalPosition] = useState({ top: 0, left: 0 });
  const [isMobile, setIsMobile] = useState(false);
  const itemRef = useRef(null);
  const modalRef = useRef(null);
  const uniqueId = useRef(
    `member-${reply?._id || reply?.id || Math.random().toString(36).substring(2, 9)}`
  ).current;
  const closeTimeoutRef = useRef(null);

  // Check if we're on mobile on mount (client-side only)
  useEffect(() => {
    setIsMobile(window.innerWidth < 640);

    const handleResize = () => {
      setIsMobile(window.innerWidth < 640);
      if (showModal) {
        calculateAndSetModalPosition();
      }
    };

    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, [showModal]);

  // Get the appropriate name to display
  const fullName =
    reply?.firstName || reply?.first_name || reply?.name || "Attendee";
  const displayName =
    showFirstNameOnly && fullName.includes(" ")
      ? fullName.split(" ")[0]
      : fullName;

  // Extract Instagram handle if available - check all possible property paths
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

  // Check all possible property paths for Instagram handle
  const instagramHandle =
    reply?.instagramHandle ||
    reply?.instagram_handle ||
    reply?.instagram ||
    null;

  // Check all possible property paths for about text
  const aboutText = reply?.about || reply?.bio || reply?.description || null;

  // Reset hover state when component unmounts
  useEffect(() => {
    return () => {
      hoverStates.delete(uniqueId);
      if (activeModalId === uniqueId) {
        activeModalId = null;
      }
      if (closeTimeoutRef.current) {
        clearTimeout(closeTimeoutRef.current);
      }
    };
  }, [uniqueId]);

  // Calculate and set modal position
  const calculateAndSetModalPosition = () => {
    if (!itemRef.current) return;

    const position = getModalPosition();
    setModalPosition(position);
  };

  // Handle scroll events to close modal
  useEffect(() => {
    const handleScroll = () => {
      if (showModal) {
        setShowModal(false);
        hoverStates.delete(uniqueId);
        if (activeModalId === uniqueId) {
          activeModalId = null;
        }
        if (closeTimeoutRef.current) {
          clearTimeout(closeTimeoutRef.current);
        }
      }
    };

    window.addEventListener("scroll", handleScroll, { passive: true });
    return () => window.removeEventListener("scroll", handleScroll);
  }, [showModal, uniqueId]);

  // Handle click outside to close modal
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (
        showModal &&
        modalRef.current &&
        !modalRef.current.contains(event.target) &&
        itemRef.current &&
        !itemRef.current.contains(event.target)
      ) {
        setShowModal(false);
        hoverStates.delete(uniqueId);
        if (activeModalId === uniqueId) {
          activeModalId = null;
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
  }, [showModal, uniqueId]);

  // Calculate position for the modal
  const getModalPosition = () => {
    if (!itemRef.current) return { top: 0, left: 0 };

    const rect = itemRef.current.getBoundingClientRect();
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

    return { top, left };
  };

  // Handle mouse enter with delay
  const handleMouseEnter = () => {
    if (isMobile) return; // Skip on mobile

    // Clear any pending close timeout
    if (closeTimeoutRef.current) {
      clearTimeout(closeTimeoutRef.current);
      closeTimeoutRef.current = null;
    }

    // Set hover state for this item
    hoverStates.set(uniqueId, true);

    // If another modal is open, close it first
    if (activeModalId && activeModalId !== uniqueId) {
      document.querySelectorAll(".member-modal").forEach((modal) => {
        if (modal.dataset.id !== uniqueId) {
          modal.style.display = "none";
        }
      });

      // Reset the previous active modal's state
      if (hoverStates.has(activeModalId)) {
        hoverStates.delete(activeModalId);
      }
    }

    // Set a delay before showing the modal
    setTimeout(() => {
      // Only show if we're still hovering
      if (hoverStates.get(uniqueId)) {
        // Calculate position before showing modal to prevent flicker
        const position = getModalPosition();
        setModalPosition(position);

        // Then show the modal
        setShowModal(true);
        activeModalId = uniqueId;
      }
    }, 300); // 300ms delay before showing
  };

  // Handle mouse leave - with a short delay for closing
  const handleMouseLeave = () => {
    if (isMobile) return; // Skip on mobile

    // Remove hover state for this item
    hoverStates.delete(uniqueId);

    // Set a short delay before closing to allow moving to the modal
    closeTimeoutRef.current = setTimeout(() => {
      // Only close if we're not hovering over the item or its modal
      if (!hoverStates.get(uniqueId) && activeModalId === uniqueId) {
        setShowModal(false);
        activeModalId = null;
      }
    }, 150); // 150ms delay - short but enough to reach the modal
  };

  // Handle modal mouse enter
  const handleModalMouseEnter = () => {
    if (isMobile) return; // Skip on mobile

    // Clear any pending close timeout
    if (closeTimeoutRef.current) {
      clearTimeout(closeTimeoutRef.current);
      closeTimeoutRef.current = null;
    }

    hoverStates.set(uniqueId, true);
  };

  // Handle modal mouse leave - with a short delay for closing
  const handleModalMouseLeave = () => {
    if (isMobile) return; // Skip on mobile
    hoverStates.delete(uniqueId);

    // Set a short delay before closing
    closeTimeoutRef.current = setTimeout(() => {
      if (!hoverStates.get(uniqueId) && activeModalId === uniqueId) {
        setShowModal(false);
        activeModalId = null;
      }
    }, 150); // 150ms delay - short but enough to move back to profile if needed
  };

  // Handle click/tap for mobile
  const handleClick = (e) => {
    if (!isMobile) return; // Only handle clicks on mobile

    e.stopPropagation(); // Stop event from bubbling

    // For mobile: close any other open modals
    if (activeModalId && activeModalId !== uniqueId) {
      document.querySelectorAll(".member-modal").forEach((modal) => {
        if (modal.dataset.id !== uniqueId) {
          modal.style.display = "none";
        }
      });

      // Reset the previous active modal
      if (activeModalId) {
        activeModalId = null;
      }
    }

    // Calculate position before toggling
    const position = getModalPosition();
    setModalPosition(position);

    // Toggle modal
    const newState = !showModal;
    setShowModal(newState);

    if (newState) {
      activeModalId = uniqueId;
    } else {
      if (activeModalId === uniqueId) {
        activeModalId = null;
      }
    }
  };

  // Get profile picture URL from various possible sources
  const getProfilePicUrl = () => {
    return (
      (reply?.profilePicStatus === "approved" && reply?.profilePicUrl) ||
      (reply?.profile_pic_status === "approved" && reply?.profile_pic_url) ||
      (reply?.profilePic?.status === "approved" && reply?.profilePic?.url) ||
      reply?.pic ||
      "/images/sandsharks-rainbow-icon.svg"
    );
  };

  return (
    <div
      ref={itemRef}
      className="flex flex-col items-center group cursor-pointer"
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
      onClick={isMobile ? handleClick : undefined}
    >
      <div
        className="relative rounded-full overflow-hidden transition-all duration-200 group-hover:scale-110"
        style={{
          width: "40px",
          height: "40px",
          position: "relative",
        }}
      >
        <div style={{ paddingTop: "100%" }}>
          <Image
            src={getProfilePicUrl() || "/placeholder.svg"}
            alt={fullName}
            fill={true}
            className="absolute top-0 left-0 object-cover object-center"
          />
        </div>
      </div>
      <div className="text-center mt-1 text-xs w-[70px] text-blue-800">
        {displayName}
      </div>

      {/* Modal */}
      {showModal && (
        <div
          ref={modalRef}
          data-id={uniqueId}
          className="fixed z-50 bg-white rounded-lg shadow-xl overflow-hidden w-[300px] member-modal"
          style={{
            top: `${modalPosition.top}px`,
            left: `${modalPosition.left}px`,
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
                setShowModal(false);
                if (activeModalId === uniqueId) {
                  activeModalId = null;
                }
                hoverStates.delete(uniqueId);
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
              <div className="flex items-center gap-4">
                <div className="relative w-24 h-24 rounded-full overflow-hidden border-2 border-blue-200 flex-shrink-0">
                  <Image
                    src={getProfilePicUrl() || "/placeholder.svg"}
                    alt={`${fullName}'s profile photo`}
                    fill={true}
                    className="object-cover"
                    sizes="96px"
                  />
                </div>

                <div>
                  <h2 className="text-lg font-bold">{fullName}</h2>

                  {reply?.pronouns && (
                    <p className="text-gray-600 text-sm">{reply.pronouns}</p>
                  )}
                </div>
              </div>

              {/* About Section */}
              {aboutText && (
                <div>
                  {/* <h3 className="text-md font-semibold mb-1">About</h3> */}
                  <p className="text-gray-700 text-sm">{aboutText}</p>
                </div>
              )}

              {/* Instagram Handle */}
              {instagramHandle && (
                <div>
                  <a
                    href={`https://instagram.com/${getInstagramHandle(instagramHandle)}`}
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
                    <span>{getInstagramHandle(instagramHandle)}</span>
                  </a>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AttendeeItem;
