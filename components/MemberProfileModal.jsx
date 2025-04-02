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
