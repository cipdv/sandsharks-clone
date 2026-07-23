"use client";

import { useActionState, useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import {
  createUltrasharkEvent,
  deleteUltrasharkEvent,
  updateUltrasharkEvent,
} from "@/app/_actions";

const REGISTRATION_LABELS = {
  members: "Members only",
  public_registration: "Open to anyone with registration form",
  none: "No registration required",
};

const emptyForm = {
  title: "",
  details: "",
  eventDate: "",
  startTime: "",
  endTime: "",
  locationName: "",
  address: "",
  registrationType: "members",
};

function formatDateTime(event) {
  const date = new Date(`${event.eventDate}T${event.startTime || "00:00"}`);
  const dateLabel = new Intl.DateTimeFormat("en-US", {
    weekday: "short",
    month: "short",
    day: "numeric",
    year: "numeric",
  }).format(date);

  return `${dateLabel}, ${formatTime(event.startTime)}${
    event.endTime ? ` - ${formatTime(event.endTime)}` : ""
  }`;
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

function memberNameById(members, id) {
  const member = members.find((candidate) => Number(candidate.id) === Number(id));
  return member ? `${member.first_name} ${member.last_name}` : "Unknown member";
}

function EventActionMessage({ state }) {
  if (!state?.message) return null;

  return (
    <div
      className={`rounded-md px-3 py-2 text-sm ${
        state.success
          ? "bg-green-50 text-green-800"
          : "bg-red-50 text-red-800"
      }`}
    >
      {state.message}
    </div>
  );
}

function DeleteEventForm({ eventId }) {
  const [state, action, isPending] = useActionState(deleteUltrasharkEvent, null);
  const router = useRouter();

  useEffect(() => {
    if (state?.success) {
      router.refresh();
    }
  }, [router, state]);

  return (
    <form
      action={action}
      className="space-y-2"
      onSubmit={(event) => {
        if (
          !window.confirm(
            "Are you sure you want to delete this event? This cannot be undone.",
          )
        ) {
          event.preventDefault();
        }
      }}
    >
      <input type="hidden" name="eventId" value={eventId} />
      <button
        type="submit"
        disabled={isPending}
        className="rounded-md border border-red-200 px-3 py-1.5 text-sm font-medium text-red-700 hover:bg-red-50 disabled:opacity-60"
      >
        {isPending ? "Deleting..." : "Delete"}
      </button>
      <EventActionMessage state={state} />
    </form>
  );
}

export default function UltrasharkEventsManagement({ events = [], members = [] }) {
  const router = useRouter();
  const [formData, setFormData] = useState(emptyForm);
  const [selectedVolunteerIds, setSelectedVolunteerIds] = useState([]);
  const [tasks, setTasks] = useState([]);
  const [editingEvent, setEditingEvent] = useState(null);
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [showPastEvents, setShowPastEvents] = useState(false);
  const [volunteerSearch, setVolunteerSearch] = useState("");
  const [createState, createAction, isCreating] = useActionState(
    createUltrasharkEvent,
    null,
  );
  const [updateState, updateAction, isUpdating] = useActionState(
    updateUltrasharkEvent,
    null,
  );

  const today = useMemo(() => {
    const currentDate = new Date();
    currentDate.setHours(0, 0, 0, 0);
    return currentDate;
  }, []);

  const upcomingEvents = events.filter(
    (event) => new Date(`${event.eventDate}T00:00:00`) >= today,
  );
  const pastEvents = events.filter(
    (event) => new Date(`${event.eventDate}T00:00:00`) < today,
  );

  useEffect(() => {
    if (createState?.success) {
      setFormData(emptyForm);
      setSelectedVolunteerIds([]);
      setTasks([]);
      setIsFormOpen(false);
      setVolunteerSearch("");
      router.refresh();
    }
  }, [createState, router]);

  useEffect(() => {
    if (updateState?.success) {
      setEditingEvent(null);
      setFormData(emptyForm);
      setSelectedVolunteerIds([]);
      setTasks([]);
      setIsFormOpen(false);
      setVolunteerSearch("");
      router.refresh();
    }
  }, [updateState, router]);

  function updateField(event) {
    const { name, value } = event.target;
    setFormData((currentFormData) => ({
      ...currentFormData,
      [name]: value,
    }));
  }

  function toggleVolunteer(memberId) {
    setSelectedVolunteerIds((currentIds) => {
      const normalizedId = Number(memberId);
      const nextIds = currentIds.includes(normalizedId)
        ? currentIds.filter((id) => id !== normalizedId)
        : [...currentIds, normalizedId];

      setTasks((currentTasks) =>
        currentTasks.map((task) => ({
          ...task,
          volunteerIds: task.volunteerIds.filter((id) =>
            nextIds.includes(Number(id)),
          ),
        })),
      );

      return nextIds;
    });
  }

  function addTask() {
    setTasks((currentTasks) => [
      ...currentTasks,
      { id: crypto.randomUUID(), name: "", volunteerIds: [] },
    ]);
  }

  function updateTaskName(taskId, name) {
    setTasks((currentTasks) =>
      currentTasks.map((task) =>
        task.id === taskId ? { ...task, name } : task,
      ),
    );
  }

  function toggleTaskVolunteer(taskId, memberId) {
    const normalizedId = Number(memberId);

    setTasks((currentTasks) =>
      currentTasks.map((task) => {
        if (task.id !== taskId) return task;

        return {
          ...task,
          volunteerIds: task.volunteerIds.includes(normalizedId)
            ? task.volunteerIds.filter((id) => id !== normalizedId)
            : [...task.volunteerIds, normalizedId],
        };
      }),
    );
  }

  function removeTask(taskId) {
    setTasks((currentTasks) =>
      currentTasks.filter((task) => task.id !== taskId),
    );
  }

  function editEvent(event) {
    setEditingEvent(event);
    setFormData({
      title: event.title || "",
      details: event.details || "",
      eventDate: event.eventDate || "",
      startTime: event.startTime || "",
      endTime: event.endTime || "",
      locationName: event.locationName || "",
      address: event.address || "",
      registrationType: event.registrationType || "members",
    });
    setSelectedVolunteerIds(event.volunteerIds || []);
    setTasks(
      (event.tasks || []).map((task) => ({
        id: crypto.randomUUID(),
        name: task.name || "",
        volunteerIds: task.volunteerIds || [],
      })),
    );
    setIsFormOpen(true);
    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  function cancelEdit() {
    setEditingEvent(null);
    setFormData(emptyForm);
    setSelectedVolunteerIds([]);
    setTasks([]);
    setIsFormOpen(false);
    setVolunteerSearch("");
  }

  const activeAction = editingEvent ? updateAction : createAction;
  const activeState = editingEvent ? updateState : createState;
  const isPending = editingEvent ? isUpdating : isCreating;
  const selectedVolunteers = members.filter((member) =>
    selectedVolunteerIds.includes(Number(member.id)),
  );
  const filteredMembers = members.filter((member) => {
    const searchValue = volunteerSearch.trim().toLowerCase();

    if (!searchValue) return true;

    return [
      member.first_name,
      member.last_name,
      member.email,
    ]
      .filter(Boolean)
      .join(" ")
      .toLowerCase()
      .includes(searchValue);
  });

  return (
    <div className="mx-auto max-w-4xl space-y-8">
      <section className="rounded-lg border border-gray-200 bg-white/80 p-6 shadow-sm">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <h2 className="text-2xl font-bold text-gray-900">
            {editingEvent ? "Edit event" : "Create event"}
          </h2>
          <button
            type="button"
            onClick={() => setIsFormOpen((currentValue) => !currentValue)}
            className="rounded-md border border-gray-300 px-3 py-2 text-sm font-medium hover:bg-gray-50"
          >
            {isFormOpen ? "Collapse form" : "Create new event"}
          </button>
          {editingEvent ? (
            <button
              type="button"
              onClick={cancelEdit}
              className="rounded-md border border-gray-300 px-3 py-2 text-sm font-medium hover:bg-gray-50"
            >
              Cancel edit
            </button>
          ) : null}
        </div>

        {isFormOpen ? (
        <form action={activeAction} className="mt-5 space-y-6">
          {editingEvent ? (
            <input type="hidden" name="eventId" value={editingEvent.id} />
          ) : null}
          <input
            type="hidden"
            name="volunteerIds"
            value={JSON.stringify(selectedVolunteerIds)}
          />
          <input type="hidden" name="tasks" value={JSON.stringify(tasks)} />

          <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
            <div className="md:col-span-2">
              <label className="mb-1 block text-sm font-medium text-gray-700">
                Event title
              </label>
              <input
                name="title"
                value={formData.title}
                onChange={updateField}
                className="w-full rounded-md border border-gray-300 px-3 py-2"
                required
              />
            </div>

            <div className="md:col-span-2">
              <label className="mb-1 block text-sm font-medium text-gray-700">
                Event details
              </label>
              <textarea
                name="details"
                value={formData.details}
                onChange={updateField}
                rows="4"
                className="w-full rounded-md border border-gray-300 px-3 py-2"
                required
              />
            </div>

            <div>
              <label className="mb-1 block text-sm font-medium text-gray-700">
                Date
              </label>
              <input
                type="date"
                name="eventDate"
                value={formData.eventDate}
                onChange={updateField}
                className="w-full rounded-md border border-gray-300 px-3 py-2"
                required
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="mb-1 block text-sm font-medium text-gray-700">
                  Start
                </label>
                <input
                  type="time"
                  name="startTime"
                  value={formData.startTime}
                  onChange={updateField}
                  className="w-full rounded-md border border-gray-300 px-3 py-2"
                  required
                />
              </div>
              <div>
                <label className="mb-1 block text-sm font-medium text-gray-700">
                  End
                </label>
                <input
                  type="time"
                  name="endTime"
                  value={formData.endTime}
                  onChange={updateField}
                  className="w-full rounded-md border border-gray-300 px-3 py-2"
                />
              </div>
            </div>

            <div>
              <label className="mb-1 block text-sm font-medium text-gray-700">
                Location name
              </label>
              <input
                name="locationName"
                value={formData.locationName}
                onChange={updateField}
                className="w-full rounded-md border border-gray-300 px-3 py-2"
                required
              />
            </div>

            <div>
              <label className="mb-1 block text-sm font-medium text-gray-700">
                Address
              </label>
              <input
                name="address"
                value={formData.address}
                onChange={updateField}
                className="w-full rounded-md border border-gray-300 px-3 py-2"
              />
            </div>

            <div className="md:col-span-2">
              <label className="mb-1 block text-sm font-medium text-gray-700">
                Registration
              </label>
              <select
                name="registrationType"
                value={formData.registrationType}
                onChange={updateField}
                className="w-full rounded-md border border-gray-300 px-3 py-2"
              >
                <option value="members">Members only</option>
                <option value="public_registration">
                  Open to anyone with registration form
                </option>
                <option value="none">No registration required</option>
              </select>
            </div>
          </div>

          <div>
            <div className="mb-3 flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
              <div>
                <h3 className="text-lg font-semibold text-gray-900">
                  Volunteers
                </h3>
                <p className="text-sm text-gray-600">
                  Select members who are assigned to help with this event.
                </p>
              </div>
              <div className="sm:w-64">
                <label className="mb-1 block text-sm font-medium text-gray-700">
                  Search members
                </label>
                <input
                  type="search"
                  value={volunteerSearch}
                  onChange={(event) => setVolunteerSearch(event.target.value)}
                  placeholder="Name or email"
                  className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm"
                />
              </div>
            </div>
            <div className="grid max-h-64 grid-cols-1 gap-2 overflow-y-auto rounded-md border border-gray-200 p-3 md:grid-cols-2">
              {filteredMembers.length === 0 ? (
                <p className="text-sm text-gray-600">No members found.</p>
              ) : (
                filteredMembers.map((member) => (
                <label
                  key={member.id}
                  className="flex items-center gap-2 rounded-md px-2 py-1 text-sm hover:bg-gray-50"
                >
                  <input
                    type="checkbox"
                    checked={selectedVolunteerIds.includes(Number(member.id))}
                    onChange={() => toggleVolunteer(member.id)}
                  />
                  <span>
                    {member.first_name} {member.last_name}
                  </span>
                </label>
                ))
              )}
            </div>
          </div>

          <div>
            <div className="mb-2 flex items-center justify-between gap-3">
              <h3 className="text-lg font-semibold text-gray-900">Tasks</h3>
              <button
                type="button"
                onClick={addTask}
                className="rounded-md border border-gray-300 px-3 py-1.5 text-sm font-medium hover:bg-gray-50"
              >
                Add task
              </button>
            </div>

            <div className="space-y-3">
              {tasks.length === 0 ? (
                <p className="text-sm text-gray-600">No tasks added.</p>
              ) : (
                tasks.map((task) => (
                  <div
                    key={task.id}
                    className="rounded-md border border-gray-200 p-3"
                  >
                    <div className="mb-3 flex gap-2">
                      <input
                        value={task.name}
                        onChange={(event) =>
                          updateTaskName(task.id, event.target.value)
                        }
                        placeholder="Task name"
                        className="min-w-0 flex-1 rounded-md border border-gray-300 px-3 py-2"
                      />
                      <button
                        type="button"
                        onClick={() => removeTask(task.id)}
                        className="rounded-md border border-red-200 px-3 py-2 text-sm font-medium text-red-700 hover:bg-red-50"
                      >
                        Remove
                      </button>
                    </div>

                    {selectedVolunteers.length === 0 ? (
                      <p className="text-sm text-gray-600">
                        Select event volunteers before assigning this task.
                      </p>
                    ) : (
                      <div className="grid grid-cols-1 gap-2 md:grid-cols-2">
                        {selectedVolunteers.map((member) => (
                          <label
                            key={member.id}
                            className="flex items-center gap-2 text-sm"
                          >
                            <input
                              type="checkbox"
                              checked={task.volunteerIds.includes(
                                Number(member.id),
                              )}
                              onChange={() =>
                                toggleTaskVolunteer(task.id, member.id)
                              }
                            />
                            <span>
                              {member.first_name} {member.last_name}
                            </span>
                          </label>
                        ))}
                      </div>
                    )}
                  </div>
                ))
              )}
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            <button
              type="submit"
              disabled={isPending}
              className="rounded-md bg-blue-600 px-4 py-2 font-medium text-white hover:bg-blue-700 disabled:opacity-60"
            >
              {isPending
                ? "Saving..."
                : editingEvent
                ? "Update event"
                : "Create event"}
            </button>
            <EventActionMessage state={activeState} />
          </div>
        </form>
        ) : null}
      </section>

      <EventList
        title="Upcoming events"
        events={upcomingEvents}
        members={members}
        onEdit={editEvent}
        showRsvps
        emptyMessage="No upcoming events."
      />

      <div>
        <button
          type="button"
          onClick={() => setShowPastEvents((currentValue) => !currentValue)}
          className="rounded-md border border-gray-300 px-4 py-2 font-medium hover:bg-gray-50"
        >
          {showPastEvents ? "Hide past events" : "View past events"}
        </button>
      </div>

      {showPastEvents ? (
        <EventList
          title="Past events"
          events={pastEvents}
          members={members}
          onEdit={editEvent}
          emptyMessage="No past events."
        />
      ) : null}
    </div>
  );
}

function EventList({
  title,
  events,
  members,
  onEdit,
  showRsvps = false,
  emptyMessage,
}) {
  return (
    <section className="rounded-lg border border-gray-200 bg-white/80 p-6 shadow-sm">
      <h2 className="mb-4 text-2xl font-bold text-gray-900">
        {title} ({events.length})
      </h2>

      {events.length === 0 ? (
        <p className="text-sm text-gray-600">{emptyMessage}</p>
      ) : (
        <div className="space-y-4">
          {events.map((event) => (
            <article
              key={event.id}
              className="rounded-md border border-gray-200 p-4"
            >
              <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
                <div className="space-y-2">
                  <div className="text-center">
                    <h3 className="text-xl font-semibold text-gray-900">
                      {event.title}
                    </h3>
                    <p className="text-sm text-gray-600">
                      {formatDateTime(event)}
                    </p>
                  </div>
                  <p className="text-sm text-gray-700">{event.details}</p>
                  <p className="text-sm text-gray-700">
                    <span className="font-medium">Where:</span>{" "}
                    {event.locationName}
                    {event.address ? `, ${event.address}` : ""}
                  </p>
                  <p className="text-sm text-gray-700">
                    <span className="font-medium">Registration:</span>{" "}
                    {REGISTRATION_LABELS[event.registrationType] ||
                      REGISTRATION_LABELS.members}
                  </p>
                  {showRsvps ? <EventRsvps event={event} /> : null}
                  <p className="text-sm text-gray-700">
                    <span className="font-medium">Volunteers:</span>{" "}
                    {event.volunteerIds.length > 0
                      ? event.volunteerIds
                          .map((id) => memberNameById(members, id))
                          .join(", ")
                      : "None assigned"}
                  </p>
                  {event.tasks.length > 0 ? (
                    <div className="text-sm text-gray-700">
                      <p className="font-medium">Tasks:</p>
                      <ul className="mt-1 list-disc space-y-1 pl-5">
                        {event.tasks.map((task, index) => (
                          <li key={`${event.id}-task-${index}`}>
                            {task.name}
                            {task.volunteerIds?.length > 0
                              ? `: ${task.volunteerIds
                                  .map((id) => memberNameById(members, id))
                                  .join(", ")}`
                              : ": unassigned"}
                          </li>
                        ))}
                      </ul>
                    </div>
                  ) : null}
                </div>

                <div className="flex flex-wrap gap-2 lg:justify-end">
                  <button
                    type="button"
                    onClick={() => onEdit(event)}
                    className="rounded-md border border-gray-300 px-3 py-1.5 text-sm font-medium hover:bg-gray-50"
                  >
                    Edit
                  </button>
                  <DeleteEventForm eventId={event.id} />
                </div>
              </div>
            </article>
          ))}
        </div>
      )}
    </section>
  );
}

function EventRsvps({ event }) {
  const [isOpen, setIsOpen] = useState(false);
  const memberRsvps = event.registrations?.members || [];
  const guestRsvps = event.registrations?.guests || [];
  const volunteerRsvps = [...memberRsvps, ...guestRsvps].filter(
    (rsvp) => rsvp.wantsToVolunteer,
  );
  const memberCount = event.rsvpCounts?.members || memberRsvps.length;
  const guestCount = event.rsvpCounts?.guests || guestRsvps.length;
  const totalCount = event.rsvpCounts?.total || memberCount + guestCount;

  return (
    <div className="rounded-md bg-gray-50 p-3 text-sm text-gray-700">
      <button
        type="button"
        onClick={() => setIsOpen((currentValue) => !currentValue)}
        className="flex w-full flex-wrap items-center justify-between gap-2 text-left font-medium text-gray-900"
      >
        <span>
          RSVPs: {totalCount} total ({memberCount}{" "}
          {memberCount === 1 ? "member" : "members"}, {guestCount}{" "}
          {guestCount === 1 ? "non-member" : "non-members"})
        </span>
        <span className="text-sm text-blue-700">
          {isOpen ? "Hide list" : "Show list"}
        </span>
      </button>

      {isOpen ? (
        <div className="mt-3 space-y-4">
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
            <RsvpGroup title="Members" rsvps={memberRsvps} />
            <RsvpGroup title="Non-members" rsvps={guestRsvps} />
          </div>
          <RsvpGroup title="Volunteered to help" rsvps={volunteerRsvps} />
        </div>
      ) : null}
    </div>
  );
}

function RsvpGroup({ title, rsvps }) {
  return (
    <div>
      <h4 className="font-medium text-gray-900">
        {title} ({rsvps.length})
      </h4>
      {rsvps.length === 0 ? (
        <p className="mt-1 text-gray-600">No RSVPs.</p>
      ) : (
        <ul className="mt-1 space-y-1">
          {rsvps.map((rsvp) => (
            <li key={rsvp.id}>
              {rsvp.name || "Unknown name"}
              {rsvp.email ? (
                <span className="text-gray-500"> ({rsvp.email})</span>
              ) : null}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
