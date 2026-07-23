"use client";

import { useActionState, useState } from "react";
import GuestSignupForm from "@/components/GuestSignupForm";
import SignInForm from "@/components/SignInForm";
import SignupForm from "@/components/SignupForm";
import {
  cancelMemberEventRegistration,
  registerMemberForEvent,
} from "@/app/_actions";

function formatEventDate(event) {
  const date = new Date(`${event.eventDate}T${event.startTime || "00:00"}`);

  return new Intl.DateTimeFormat("en-US", {
    weekday: "long",
    month: "long",
    day: "numeric",
    year: "numeric",
  }).format(date);
}

function formatEventTime(event) {
  if (!event.startTime) return "";

  return event.endTime
    ? `${formatTime(event.startTime)} - ${formatTime(event.endTime)}`
    : formatTime(event.startTime);
}

function formatTime(time) {
  const [hourValue, minuteValue = "0"] = String(time).split(":");
  const hour = Number.parseInt(hourValue, 10);
  const minute = Number.parseInt(minuteValue, 10);

  if (!Number.isInteger(hour)) return time;

  const displayHour = hour % 12 || 12;
  const suffix = hour >= 12 ? "pm" : "am";
  const displayMinutes =
    Number.isInteger(minute) && minute > 0
      ? `:${String(minute).padStart(2, "0")}`
      : "";

  return `${displayHour}${displayMinutes}${suffix}`;
}

function getMapQuery(event) {
  return [event.locationName, event.address].filter(Boolean).join(", ");
}

function getMapEmbedUrl(event) {
  return `https://www.google.com/maps?q=${encodeURIComponent(
    getMapQuery(event),
  )}&output=embed`;
}

function ActionMessage({ state }) {
  if (!state?.message) return null;

  return (
    <p
      className={`rounded-md px-3 py-2 text-sm ${
        state.success ? "bg-green-50 text-green-800" : "bg-red-50 text-red-800"
      }`}
    >
      {state.message}
    </p>
  );
}

function MemberEventRegistrationForm({ eventId, currentUser }) {
  const [state, action, isPending] = useActionState(
    registerMemberForEvent,
    null,
  );

  if (!currentUser) {
    return (
      <div className="mt-4 rounded-md border p-4">
        <p className="text-sm text-gray-700">Sign in to register.</p>
        <SignInForm redirectTo={`/events?eventId=${eventId}`} />
      </div>
    );
  }

  return (
    <form action={action} className="mt-4 space-y-3 rounded-md border p-4">
      <input type="hidden" name="eventId" value={eventId} />
      <p className="text-sm text-gray-700">
        Hi {currentUser.firstName}, click the button below to register for this
        event.
      </p>
      <label className="flex items-start gap-2 text-sm text-gray-700">
        <input
          type="checkbox"
          name="wantsToVolunteer"
          className="mt-1 h-4 w-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
        />
        <span>I&apos;d like to volunteer to help out at this event</span>
      </label>
      <div className="flex flex-wrap items-center gap-3">
        <button
          type="submit"
          disabled={isPending}
          className="rounded-md bg-blue-600 px-4 py-2 font-medium text-white hover:bg-blue-700 disabled:opacity-60"
        >
          {isPending ? "Registering..." : "Register for this event"}
        </button>
        <ActionMessage state={state} />
      </div>
    </form>
  );
}

function CancelMemberEventRegistrationForm({ eventId }) {
  const [state, action, isPending] = useActionState(
    cancelMemberEventRegistration,
    null,
  );

  return (
    <form
      action={action}
      className="mt-4 space-y-3 rounded-md border border-sandsharks-magenta/30 bg-blue-100/60 p-4"
    >
      <input type="hidden" name="eventId" value={eventId} />
      <p className="text-lg font-bold text-sandsharks-magenta">
        You are registered for this event!
      </p>
      <p className="text-sm text-gray-700">
        If you can no longer attend, click the button below
      </p>
      <div className="flex flex-wrap items-center gap-3">
        <button
          type="submit"
          disabled={isPending}
          className="rounded-md bg-blue-600 px-4 py-2 font-medium text-white hover:bg-blue-700 disabled:opacity-60"
        >
          {isPending ? "Cancelling..." : "I can no longer attend this event"}
        </button>
        <ActionMessage state={state} />
      </div>
    </form>
  );
}

function EventRegistration({ event, currentUser }) {
  const [answer, setAnswer] = useState(null);
  const [nonMemberPath, setNonMemberPath] = useState(null);

  if (
    currentUser &&
    currentUser.memberType !== "ultrashark" &&
    event.currentUserRegistered
  ) {
    return <CancelMemberEventRegistrationForm eventId={event.id} />;
  }

  if (event.registrationType === "none") {
    return (
      <p className="mt-4 rounded-md bg-gray-50 px-3 py-2 text-sm text-gray-700">
        No registration required.
      </p>
    );
  }

  if (currentUser && currentUser.memberType !== "ultrashark") {
    return (
      <div className="mt-5">
        <h3 className="mb-2 text-lg font-bold text-sandsharks-magenta">
          Register for this event:
        </h3>
        <MemberEventRegistrationForm
          eventId={event.id}
          currentUser={currentUser}
        />
      </div>
    );
  }

  return (
    <div className="mt-5">
      <h3 className="mb-2 text-lg font-bold text-sandsharks-magenta">
        Register for this event:
      </h3>
      <p className="mb-3 text-sm font-medium text-gray-900">
        Are you currently a member of Sandsharks?
      </p>
      <div className="flex gap-2">
        <button
          type="button"
          onClick={() => {
            setAnswer("yes");
            setNonMemberPath(null);
          }}
          className={`rounded-md px-4 py-2 text-sm font-medium ${
            answer === "yes"
              ? "bg-blue-600 text-white"
              : "border border-gray-300 bg-white hover:bg-gray-50"
          }`}
        >
          Yes
        </button>
        <button
          type="button"
          onClick={() => {
            setAnswer("no");
            setNonMemberPath(null);
          }}
          className={`rounded-md px-4 py-2 text-sm font-medium ${
            answer === "no"
              ? "bg-blue-600 text-white"
              : "border border-gray-300 bg-white hover:bg-gray-50"
          }`}
        >
          No
        </button>
      </div>

      {answer === "yes" ? (
        <MemberEventRegistrationForm
          eventId={event.id}
          currentUser={currentUser}
        />
      ) : null}

      {answer === "no" && event.registrationType === "public_registration" ? (
        <div className="mt-4 rounded-md border p-4">
          <p className="text-sm text-gray-700">
            You can become a Sandsharks member, or register for this event as a
            non-member.
          </p>
          <div className="mt-3 flex flex-wrap gap-2">
            <button
              type="button"
              onClick={() => setNonMemberPath("signup")}
              className={`rounded-md px-4 py-2 text-sm font-medium ${
                nonMemberPath === "signup"
                  ? "bg-blue-600 text-white"
                  : "border border-gray-300 bg-white hover:bg-gray-50"
              }`}
            >
              Become a member
            </button>
            <button
              type="button"
              onClick={() => setNonMemberPath("guest")}
              className={`rounded-md px-4 py-2 text-sm font-medium ${
                nonMemberPath === "guest"
                  ? "bg-blue-600 text-white"
                  : "border border-gray-300 bg-white hover:bg-gray-50"
              }`}
            >
              Register as non-member
            </button>
          </div>

          {nonMemberPath === "signup" ? (
            <SignupForm redirectTo={`/events?eventId=${event.id}`} />
          ) : null}

          {nonMemberPath === "guest" ? (
            <GuestSignupForm
              compact
              eventId={event.id}
              eventTitle={event.title}
              eventDateLabel={formatEventDate(event)}
              eventTimeLabel={formatEventTime(event)}
            />
          ) : null}
        </div>
      ) : null}

      {answer === "no" && event.registrationType === "members" ? (
        <div className="mt-4 rounded-md border p-4">
          <p className="text-base font-bold text-sandsharks-magenta">
            This event is currently open to Sandsharks members only. If you'd
            like to become a Sandsharks member, register below
          </p>
          <SignupForm redirectTo={`/events?eventId=${event.id}`} />
        </div>
      ) : null}
    </div>
  );
}

export default function PublicEventsList({ events = [], currentUser = null }) {
  if (events.length === 0) {
    return (
      <div className="mx-auto max-w-3xl rounded-lg border border-gray-200 bg-white/80 p-6 shadow-sm">
        <p className="text-gray-700">No upcoming events are scheduled.</p>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-3xl space-y-6">
      {events.map((event) => (
        <article
          key={event.id}
          className="rounded-lg border border-gray-200 bg-white/85 p-5 shadow-sm sm:p-6"
        >
          <div className="space-y-4">
            <div>
              <h2 className="bg-gradient-to-r from-blue-600 via-purple-600 to-pink-600 bg-clip-text text-4xl font-black tracking-tight text-transparent sm:text-5xl">
                {event.title}
              </h2>
            </div>

            <div className="rounded-md bg-blue-50/80 p-4">
              <p className="text-xl font-bold text-gray-950 sm:text-2xl">
                {formatEventDate(event)}
                {formatEventTime(event) ? `, ${formatEventTime(event)}` : ""}
              </p>
            </div>

            <div className="grid grid-cols-1 gap-4 rounded-md bg-gray-50 p-4 md:grid-cols-[minmax(220px,0.9fr)_minmax(0,1fr)]">
              {getMapQuery(event) ? (
                <iframe
                  title={`Map for ${event.title}`}
                  src={getMapEmbedUrl(event)}
                  loading="lazy"
                  referrerPolicy="no-referrer-when-downgrade"
                  className="h-44 w-full rounded-md border border-gray-200"
                />
              ) : null}
              <div className="space-y-1">
                <p className="text-lg font-bold text-gray-950 sm:text-xl">
                  {event.locationName}
                </p>
                {event.address ? (
                  <p className="text-base font-semibold leading-snug text-gray-800">
                    {event.address}
                  </p>
                ) : null}
              </div>
            </div>

            <p className="whitespace-pre-wrap text-sm leading-relaxed text-gray-800">
              {event.details}
            </p>
          </div>

          <EventRegistration event={event} currentUser={currentUser} />
        </article>
      ))}
    </div>
  );
}
