"use client";

import { useState } from "react";
import Image from "next/image";
import {
  replyToPlayDay,
  replyToClinic,
  requestToVolunteer,
  cancelVolunteerRequest,
} from "@/app/_actions";
import { ActionButton } from "./ActionButton";
import { UpdateForm } from "./UpdateForm";
import AttendeeItem from "./AttendeeItem";

const PlayDays = ({ playDays, user }) => {
  // Ensure we're working with plain objects (not Proxy objects)
  playDays = JSON.parse(JSON.stringify(playDays));
  user = JSON.parse(JSON.stringify(user));

  function convertTo12Hour(time) {
    if (!time) {
      return "N/A";
    }
    const [hour, minute] = time.split(":");
    return new Date(1970, 0, 1, hour, minute).toLocaleTimeString("en-US", {
      hour: "numeric",
      minute: "numeric",
      hour12: true,
    });
  }

  const formatDate = (dateString) => {
    if (!dateString) return "No date specified";

    const [year, month, day] = dateString.split("-");
    const date = new Date(year, month - 1, day);
    return `${date.toLocaleString("en-US", {
      month: "long",
    })} ${date.getDate()}, ${date.getFullYear()}`;
  };

  // Format date consistently for both server and client
  const formatUpdateDate = (dateString) => {
    if (!dateString) return "";
    const date = new Date(dateString);
    return date.toLocaleDateString("en-US", {
      year: "numeric",
      month: "numeric",
      day: "numeric",
    });
  };

  // Helper function to extract domain from URL
  const extractDomain = (url) => {
    if (!url) return "";
    try {
      const domain = new URL(url).hostname.replace("www.", "");
      return domain;
    } catch (e) {
      return url;
    }
  };

  // Helper function to extract Instagram handle from URL
  const extractInstagramHandle = (url) => {
    if (!url) return "";
    try {
      const path = new URL(url).pathname;
      // Remove leading slash and trailing slash if present
      return path.replace(/^\/|\/$/g, "");
    } catch (e) {
      return url;
    }
  };

  // Helper function to check if a play day is still active for RSVPs
  const isPlayDayActive = (dateString) => {
    if (!dateString) return false;

    // Parse the date string (YYYY-MM-DD)
    const [year, month, day] = dateString.split("-");

    // Create date objects for the play day and today
    // Set the play day time to 23:59:59 to include the entire day
    const playDayDate = new Date(year, month - 1, day, 23, 59, 59);
    const today = new Date();

    // Return true if the play day is today or in the future
    return playDayDate >= today;
  };

  // Check if user is a volunteer
  const isVolunteer =
    user?.memberType === "volunteer" || user?.memberType === "ultrashark";

  return (
    <div>
      <h3 className="text-xl font-bold mb-4">Upcoming Play Days</h3>
      {playDays?.length === 0 && (
        <div className="bg-blue-100 rounded-md p-4">
          <p>No upcoming play days scheduled. Check back soon!</p>
        </div>
      )}
      <ul className="space-y-10">
        {playDays?.map((playDay) => {
          // Check if user is attending this play day - directly compare userId strings
          const userIsAttending = playDay.replies?.some(
            (reply) => reply.userId === user._id
          );

          // Check if user is attending the clinic - directly compare userId strings
          const userIsAttendingClinic =
            playDay.beginnerClinic?.beginnerClinicReplies?.some(
              (reply) => reply.userId === user._id
            );

          // Check if user is the main volunteer - try multiple possible property names
          // and convert both to strings for comparison
          const userIdStr = String(user._id);
          const mainVolunteerIdStr = playDay.mainVolunteerId
            ? String(playDay.mainVolunteerId)
            : null;
          const helperVolunteerIdStr = playDay.helperVolunteerId
            ? String(playDay.helperVolunteerId)
            : null;

          // Check if user is already a volunteer for this play day
          const userIsVolunteer =
            mainVolunteerIdStr === userIdStr ||
            helperVolunteerIdStr === userIdStr;

          // Check if user has requested to volunteer for this play day
          const userHasRequestedToVolunteer = playDay.volunteerRequests?.some(
            (request) =>
              String(request.memberId) === userIdStr &&
              request.status === "pending"
          );

          // Count how many volunteer positions are filled
          const volunteerCount =
            (mainVolunteerIdStr ? 1 : 0) + (helperVolunteerIdStr ? 1 : 0);

          // Check if there's room for more volunteers (less than 2)
          const hasVolunteerSpace = volunteerCount < 2;

          // Check multiple conditions for being a main volunteer (for update form)
          const isMainVolunteer =
            mainVolunteerIdStr === userIdStr ||
            (playDay.mainVolunteer &&
              String(playDay.mainVolunteer.id) === userIdStr) ||
            user.memberType === "ultrashark"; // Allow ultrashark members to post updates to any play day

          return (
            <div
              className="rounded-md overflow-hidden shadow-sm"
              key={playDay.id}
            >
              {/* SECTION 1: Header with Date, Time, Volunteers, Court */}
              <div className="bg-blue-200 p-3 sm:p-4">
                <div className="flex flex-col sm:flex-row justify-between items-start gap-3">
                  <div>
                    <h1 className="font-bold text-3xl sm:text-3xl mb-4">
                      {formatDate(playDay.date)}
                    </h1>
                    <p className="mt-1">
                      {convertTo12Hour(playDay.startTime)} -{" "}
                      {convertTo12Hour(playDay.endTime)}
                    </p>

                    {(playDay.mainVolunteer || playDay.helperVolunteer) && (
                      <p className="mt-1">
                        Volunteers:{" "}
                        {playDay.mainVolunteer
                          ? `${playDay.mainVolunteer.first_name} ${playDay.mainVolunteer.last_name}`
                          : ""}
                        {playDay.mainVolunteer && playDay.helperVolunteer
                          ? ", "
                          : ""}
                        {playDay.helperVolunteer
                          ? `${playDay.helperVolunteer.first_name} ${playDay.helperVolunteer.last_name}`
                          : ""}
                      </p>
                    )}

                    <p className="mt-1">
                      Home court: {playDay.courts || "TBD"}
                    </p>
                  </div>

                  {/* RSVP and Volunteer Buttons */}
                  {isPlayDayActive(playDay.date) && (
                    <div className="flex flex-col gap-2 mt-2 sm:mt-0 items-start sm:items-end">
                      {/* Only show RSVP button if user is not a volunteer */}
                      {!userIsVolunteer && (
                        <div className="flex items-center gap-2">
                          {userIsAttending && (
                            <div className="flex items-center text-green-700 bg-green-100 px-3 py-1 rounded-md">
                              <span className="font-medium">Going</span>
                              <span className="ml-1 text-green-600 font-bold">
                                ✓
                              </span>
                            </div>
                          )}
                          <form action={replyToPlayDay.bind(null, playDay.id)}>
                            <ActionButton className="text-sm sm:text-base px-2 sm:px-4">
                              {userIsAttending
                                ? "I can no longer go"
                                : "I'll be there!"}
                            </ActionButton>
                          </form>
                        </div>
                      )}

                      {/* Volunteer Button - Only show for volunteers */}
                      {isVolunteer && (
                        <div className="flex items-center gap-2">
                          {userIsVolunteer ? (
                            <div className="flex items-center text-green-700 bg-green-100 px-3 py-1 rounded-md">
                              <span className="font-medium">Volunteering</span>
                              <span className="ml-1 text-green-600 font-bold">
                                ✓
                              </span>
                            </div>
                          ) : userHasRequestedToVolunteer ? (
                            <div className="flex items-center gap-2">
                              <div className="flex items-center text-blue-700 bg-blue-100 px-3 py-1 rounded-md">
                                <span className="font-medium">
                                  Requested to volunteer
                                </span>
                                <span className="ml-1 text-blue-600 font-bold">
                                  ✓
                                </span>
                              </div>
                              <form action={cancelVolunteerRequest}>
                                <input
                                  type="hidden"
                                  name="playDayId"
                                  value={playDay.id}
                                />
                                <ActionButton className="text-sm sm:text-base px-2 sm:px-4 btn-volunteer-cancel">
                                  I can no longer volunteer
                                </ActionButton>
                              </form>
                            </div>
                          ) : hasVolunteerSpace ? (
                            <form action={requestToVolunteer}>
                              <input
                                type="hidden"
                                name="playDayId"
                                value={playDay.id}
                              />
                              <ActionButton className="text-sm sm:text-base px-2 sm:px-4 btn-volunteer-signup">
                                I can volunteer
                              </ActionButton>
                            </form>
                          ) : null}
                        </div>
                      )}
                    </div>
                  )}
                </div>
              </div>

              {/* SECTION 2: Sponsor Information - Moved up */}
              {playDay.sponsorName && (
                <div className="bg-blue-50 p-4 sm:p-6 border-t border-blue-200">
                  <h3 className="font-bold text-xl mb-3">Sponsored by:</h3>
                  <div className="flex flex-col sm:flex-row items-center sm:items-start gap-4">
                    {playDay.sponsorLogo && (
                      <div className="flex-shrink-0">
                        <Image
                          src={playDay.sponsorLogo || "/placeholder.svg"}
                          alt={playDay.sponsorName}
                          width={120}
                          height={120}
                          className="object-contain rounded-md"
                        />
                      </div>
                    )}
                    <div>
                      <p className="font-bold text-lg mb-2">
                        {playDay.sponsorName}
                      </p>
                      <p className="text-sm mb-3 text-gray-700">
                        {playDay.sponsorDescription ||
                          "Supporting our community and helping us play the sport we love!"}
                      </p>
                      <div className="flex flex-wrap gap-3">
                        {playDay.sponsorWebsite && (
                          <a
                            href={playDay.sponsorWebsite}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-blue-600 hover:underline text-sm flex items-center"
                          >
                            <svg
                              xmlns="http://www.w3.org/2000/svg"
                              className="h-4 w-4 mr-1"
                              fill="none"
                              viewBox="0 0 24 24"
                              stroke="currentColor"
                            >
                              <path
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                strokeWidth={2}
                                d="M21 12a9 9 0 01-9 9m9-9a9 9 0 00-9-9m9 9H3m9 9a9 9 0 01-9-9m9 9c1.657 0 3-4.03 3-9s-1.343-9-3-9m0 18c-1.657 0-3-4.03-3-9s1.343-9 3-9m-9 9a9 9 0 019-9"
                              />
                            </svg>
                            {extractDomain(playDay.sponsorWebsite)}
                          </a>
                        )}
                        {playDay.sponsorInstagram && (
                          <a
                            href={playDay.sponsorInstagram}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-blue-600 hover:underline text-sm flex items-center"
                          >
                            {/* Instagram Icon - Updated */}
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
                              <line
                                x1="17.5"
                                y1="6.5"
                                x2="17.51"
                                y2="6.5"
                              ></line>
                            </svg>
                            @{extractInstagramHandle(playDay.sponsorInstagram)}
                          </a>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* SECTION 3: Updates (including original description as first update) */}
              <div className="bg-blue-100 p-3 sm:p-4 border-t border-blue-200">
                <h3 className="font-semibold mb-3">Updates:</h3>

                {/* Original description as first update */}
                <div className="bg-blue-50 p-3 rounded mb-3">
                  <p className="text-sm text-gray-600 mb-1">
                    {formatUpdateDate(playDay.createdAt)} by {playDay.postedBy}
                  </p>
                  <div className="overflow-auto break-words">
                    {playDay.description?.split("<br />").map((line, index) => (
                      <p key={`${playDay.id}-${index}`}>
                        {line}
                        <br />
                      </p>
                    ))}
                  </div>
                </div>

                {/* Additional updates with Show More button */}
                {playDay.updates && playDay.updates.length > 0 && (
                  <UpdatesSection
                    updates={playDay.updates}
                    formatUpdateDate={formatUpdateDate}
                  />
                )}

                {/* Update form for main volunteer */}
                {isMainVolunteer && (
                  <div className="mt-4 pt-4 border-t border-blue-200">
                    <h4 className="font-medium mb-2">Add an update:</h4>
                    <UpdateForm playDayId={playDay.id} />
                  </div>
                )}
              </div>

              {/* SECTION 4: Attendees */}
              <div className="bg-blue-100 p-3 sm:p-4 border-t border-blue-200">
                <h3 className="font-semibold mb-2">Who's going:</h3>
                {playDay.replies?.length > 0 ? (
                  <AttendeesSection replies={playDay.replies} />
                ) : (
                  <p className="text-sm text-gray-500 italic whitespace-nowrap">
                    No one has signed up yet. Be the first!
                  </p>
                )}
              </div>

              {/* SECTION 5: Beginner Clinic */}
              {playDay.hasClinic && playDay.beginnerClinic ? (
                <div className="bg-blue-300 p-3 sm:p-4 border-t border-blue-200">
                  {/* Clinic Header with Time, Volunteers, Court */}
                  <div className="flex flex-col sm:flex-row justify-between items-start gap-3 mb-3">
                    <div>
                      <h3 className="font-bold text-lg">Beginner Clinic</h3>
                      <p className="mt-1">
                        {convertTo12Hour(
                          playDay.beginnerClinic.beginnerClinicStartTime
                        )}{" "}
                        -{" "}
                        {convertTo12Hour(
                          playDay.beginnerClinic.beginnerClinicEndTime
                        )}
                      </p>
                      <p className="mt-1">
                        Volunteers:{" "}
                        {playDay.mainVolunteer
                          ? `${playDay.mainVolunteer.first_name} ${playDay.mainVolunteer.last_name}`
                          : "TBD"}
                      </p>
                      <p className="mt-1">
                        Court:{" "}
                        {playDay.beginnerClinic.beginnerClinicCourts || "TBD"}
                      </p>
                    </div>

                    {/* Clinic RSVP Button with Status Indicator */}
                    {isPlayDayActive(playDay.date) &&
                      (playDay.beginnerClinic.beginnerClinicReplies?.length >=
                      (playDay.beginnerClinic.maxParticipants || 10) ? (
                        <p className="text-sm bg-yellow-100 p-2 rounded">
                          This clinic is full
                        </p>
                      ) : (
                        <div className="flex items-center gap-2 mt-2 sm:mt-0">
                          {userIsAttendingClinic && (
                            <div className="flex items-center text-green-700 bg-green-100 px-3 py-1 rounded-md">
                              <span className="font-medium">Going</span>
                              <span className="ml-1 text-green-600 font-bold">
                                ✓
                              </span>
                            </div>
                          )}
                          <form action={replyToClinic.bind(null, playDay.id)}>
                            <ActionButton className="text-sm sm:text-base px-2 sm:px-4">
                              {userIsAttendingClinic
                                ? "I can no longer go"
                                : "I'll be there!"}
                            </ActionButton>
                          </form>
                        </div>
                      ))}
                  </div>

                  {/* Clinic Description */}
                  <p className="overflow-auto break-words mb-4">
                    {playDay.beginnerClinic.beginnerClinicMessage}
                  </p>

                  {/* Clinic Attendees */}
                  <div>
                    <h3 className="font-semibold mb-2">Who's going:</h3>
                    <div className="flex flex-wrap gap-3">
                      {playDay.beginnerClinic.beginnerClinicReplies?.length >
                      0 ? (
                        playDay.beginnerClinic.beginnerClinicReplies.map(
                          (reply) => (
                            <AttendeeItem
                              key={reply._id || reply.id}
                              reply={reply}
                              showFirstNameOnly={true}
                            />
                          )
                        )
                      ) : (
                        <p className="text-sm text-gray-500 italic whitespace-nowrap">
                          No one has signed up yet. Be the first!
                        </p>
                      )}
                    </div>
                  </div>

                  {/* Max Participants Warning */}
                  {isPlayDayActive(playDay.date) &&
                    playDay.beginnerClinic.beginnerClinicReplies?.length >=
                      (playDay.beginnerClinic.maxParticipants || 10) && (
                      <p className="mt-4 text-sm">
                        The maximum number of participants is{" "}
                        {playDay.beginnerClinic.maxParticipants || 10}. This
                        clinic is full, check back later to see if there's space
                        available.
                      </p>
                    )}
                </div>
              ) : (
                <div className="bg-blue-50 p-3 sm:p-4 border-t border-blue-200">
                  <p className="italic text-gray-600">
                    *Note: There will not be a beginner clinic offered on this
                    day.
                  </p>
                </div>
              )}
            </div>
          );
        })}
      </ul>
    </div>
  );
};

// Client component for expandable Updates section
const UpdatesSection = ({ updates, formatUpdateDate }) => {
  const [showAll, setShowAll] = useState(false);
  const initialDisplayCount = 2;

  // Sort updates by date (most recent first)
  const sortedUpdates = [...updates].sort(
    (a, b) => new Date(b.createdAt) - new Date(a.createdAt)
  );

  const hasMoreUpdates = sortedUpdates.length > initialDisplayCount;
  const displayedUpdates = showAll
    ? sortedUpdates
    : sortedUpdates.slice(0, initialDisplayCount);

  return (
    <div className="space-y-3">
      {displayedUpdates.map((update) => (
        <div key={update.id} className="bg-blue-50 p-3 rounded">
          <p className="text-sm text-gray-600 mb-1">
            {formatUpdateDate(update.createdAt)} by {update.createdByName}
          </p>
          <p>{update.content}</p>
        </div>
      ))}

      {hasMoreUpdates && (
        <button
          onClick={() => setShowAll(!showAll)}
          className="w-full py-2 text-sm text-blue-600 hover:text-blue-800 bg-blue-50 rounded-md"
        >
          {showAll
            ? "Show Less"
            : `Show ${sortedUpdates.length - initialDisplayCount} More Updates`}
        </button>
      )}
    </div>
  );
};

// Client component for expandable Attendees section
const AttendeesSection = ({ replies }) => {
  const [showAll, setShowAll] = useState(false);
  const initialDisplayCount = 20; // Show first 20 attendees initially
  const hasMoreAttendees = replies.length > initialDisplayCount;

  const displayedReplies = showAll
    ? replies
    : replies.slice(0, initialDisplayCount);

  return (
    <div>
      <div
        className="grid gap-4"
        style={{
          gridTemplateColumns: "repeat(auto-fill, minmax(70px, 1fr))",
        }}
      >
        {displayedReplies.map((reply) => (
          <AttendeeItem key={reply._id || reply.id} reply={reply} />
        ))}
      </div>

      {hasMoreAttendees && (
        <button
          onClick={() => setShowAll(!showAll)}
          className="w-full mt-3 py-2 text-sm text-blue-600 hover:text-blue-800 bg-blue-50 rounded-md"
        >
          {showAll
            ? "Show Less"
            : `Show ${replies.length - initialDisplayCount} More Attendees`}
        </button>
      )}
    </div>
  );
};

export default PlayDays;
