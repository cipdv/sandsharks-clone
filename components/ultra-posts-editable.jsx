"use client";

import { useState, useEffect } from "react";
import {
  createPlayDay,
  updatePlayDay,
  deletePlayDay,
  cancelPlayDay,
} from "@/app/_actions";

export default function UltraPostsEditable({
  existingPlayDays = [],
  sponsors = [],
  members = [],
}) {
  const formatTime = (timeString) => {
    if (!timeString) return "";
    // If timeString is in HH:MM:SS format, extract just HH:MM
    if (timeString.includes(":")) {
      return timeString.substring(0, 5);
    }
    return timeString;
  };

  // Sort play days by date (earliest first)
  const sortedPlayDays = [...existingPlayDays].sort((a, b) => {
    if (!a.date) return 1;
    if (!b.date) return -1;
    return new Date(a.date) - new Date(b.date);
  });

  const [isCreating, setIsCreating] = useState(false);
  const [editingPlayDayId, setEditingPlayDayId] = useState(null);
  const [formError, setFormError] = useState("");
  const [formSuccess, setFormSuccess] = useState("");
  const [isLoadingMembers, setIsLoadingMembers] = useState(false);
  const [isLoadingSponsors, setIsLoadingSponsors] = useState(false);

  // Cancellation state
  const [isCancelling, setIsCancelling] = useState(false);
  const [cancellingPlayDayId, setCancellingPlayDayId] = useState(null);
  const [cancellationReason, setCancellationReason] = useState("");

  // Form state
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [date, setDate] = useState("");
  const [startTime, setStartTime] = useState("");
  const [endTime, setEndTime] = useState("");
  const [courts, setCourts] = useState("");
  const [sponsorId, setSponsorId] = useState("");
  const [mainVolunteerId, setMainVolunteerId] = useState("");
  const [helperVolunteerId, setHelperVolunteerId] = useState("");
  const [updateContent, setUpdateContent] = useState("");

  // Clinic state
  const [hasClinic, setHasClinic] = useState(false);
  const [clinicStartTime, setClinicStartTime] = useState("");
  const [clinicEndTime, setClinicEndTime] = useState("");
  const [clinicDescription, setClinicDescription] = useState("");
  const [clinicCourts, setClinicCourts] = useState("");
  const [clinicMaxParticipants, setClinicMaxParticipants] = useState(10);

  // Set loading state based on props
  useEffect(() => {
    setIsLoadingMembers(members.length === 0);
    setIsLoadingSponsors(sponsors.length === 0);
  }, [members, sponsors]);

  const resetForm = () => {
    setTitle("");
    setDescription("");
    setDate("");
    setStartTime("");
    setEndTime("");
    setCourts("");
    setSponsorId("");
    setMainVolunteerId("");
    setHelperVolunteerId("");
    setUpdateContent("");
    setHasClinic(false);
    setClinicStartTime("");
    setClinicEndTime("");
    setClinicDescription("");
    setClinicCourts("");
    setClinicMaxParticipants(10);
    setFormError("");
    setFormSuccess("");
    setCancellationReason("");
  };

  const handleCreateClick = () => {
    setIsCreating(true);
    setEditingPlayDayId(null);
    setIsCancelling(false);
    setCancellingPlayDayId(null);
    resetForm();
  };

  const handleEditClick = (playDay) => {
    setIsCreating(false);
    setEditingPlayDayId(playDay.id);
    setIsCancelling(false);
    setCancellingPlayDayId(null);

    // Populate form with play day data
    setTitle(playDay.title || "");
    setDescription(playDay.description || "");
    setDate(playDay.date ? playDay.date.split("T")[0] : ""); // Format date for input
    setStartTime(playDay.startTime || "");
    setEndTime(playDay.endTime || "");
    setCourts(playDay.courts || "");
    setSponsorId(playDay.sponsorId || "");
    setMainVolunteerId(playDay.mainVolunteerId || "");
    setHelperVolunteerId(playDay.helperVolunteerId || "");
    setUpdateContent(""); // Clear update content when editing

    // Populate clinic data if it exists
    if (playDay.hasClinic && playDay.beginnerClinic) {
      setHasClinic(true);
      setClinicStartTime(playDay.beginnerClinic.beginnerClinicStartTime || "");
      setClinicEndTime(playDay.beginnerClinic.beginnerClinicEndTime || "");
      setClinicDescription(playDay.beginnerClinic.beginnerClinicMessage || "");
      setClinicCourts(playDay.beginnerClinic.beginnerClinicCourts || "");
      setClinicMaxParticipants(playDay.beginnerClinic.maxParticipants || 10);
    } else {
      setHasClinic(false);
      setClinicStartTime("");
      setClinicEndTime("");
      setClinicDescription("");
      setClinicCourts("");
      setClinicMaxParticipants(10);
    }
  };

  const handleCancelClick = () => {
    setIsCreating(false);
    setEditingPlayDayId(null);
    setIsCancelling(false);
    setCancellingPlayDayId(null);
    resetForm();
  };

  // Handle opening the cancellation modal
  const handleCancelPlayDayClick = (playDay) => {
    setIsCancelling(true);
    setCancellingPlayDayId(playDay.id);
    setIsCreating(false);
    setEditingPlayDayId(null);
    setCancellationReason("");
  };

  // Handle submitting the cancellation
  const handleCancelPlayDaySubmit = async (e) => {
    e.preventDefault();
    setFormError("");
    setFormSuccess("");

    if (!cancellationReason.trim()) {
      setFormError("Please provide a reason for cancellation");
      return;
    }

    try {
      const formData = new FormData();
      formData.append("playDayId", cancellingPlayDayId);
      formData.append("cancellationReason", cancellationReason);

      const result = await cancelPlayDay(formData);
      if (result.success) {
        setFormSuccess("Play day cancelled successfully!");
        setIsCancelling(false);
        setCancellingPlayDayId(null);
        setCancellationReason("");

        // Redirect after a short delay to show the success message
        if (result.shouldRedirect) {
          setTimeout(() => {
            window.location.href = "/dashboard/ultrashark";
          }, 1500);
        }
      } else {
        setFormError(result.message || "Failed to cancel play day");
      }
    } catch (error) {
      console.error("Error cancelling play day:", error);
      setFormError("An unexpected error occurred");
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setFormError("");
    setFormSuccess("");

    // Validate form
    if (!title || !date || !startTime || !endTime || !courts) {
      setFormError("Please fill in all required fields");
      return;
    }

    if (hasClinic && (!clinicStartTime || !clinicEndTime)) {
      setFormError(
        "Please fill in all clinic fields or disable the clinic option"
      );
      return;
    }

    try {
      // Create FormData object to match the server action expectations
      const formData = new FormData();
      formData.append("title", title);
      formData.append("description", description);
      formData.append("date", date);
      formData.append("startTime", startTime);
      formData.append("endTime", endTime);
      formData.append("courts", courts);
      formData.append("sponsorId", sponsorId);
      formData.append("mainVolunteerId", mainVolunteerId);
      formData.append("helperVolunteerId", helperVolunteerId);
      formData.append("hasClinic", hasClinic);

      if (hasClinic) {
        formData.append("clinicDescription", clinicDescription);
        formData.append("clinicStartTime", clinicStartTime);
        formData.append("clinicEndTime", clinicEndTime);
        formData.append("clinicCourts", clinicCourts);
        formData.append("clinicMaxParticipants", clinicMaxParticipants);
      }

      // Add update content if provided
      if (updateContent) {
        formData.append("updateContent", updateContent);
      }

      if (isCreating) {
        // Create new play day
        const result = await createPlayDay(formData);
        if (result.success) {
          setFormSuccess("Play day created successfully!");
          resetForm();
          setIsCreating(false);

          // Redirect after a short delay to show the success message
          if (result.shouldRedirect) {
            setTimeout(() => {
              window.location.href = "/dashboard/ultrashark";
            }, 1500);
          }
        } else {
          setFormError(result.message || "Failed to create play day");
        }
      } else if (editingPlayDayId) {
        // Update existing play day
        formData.append("playDayId", editingPlayDayId);
        const result = await updatePlayDay(formData);
        if (result.success) {
          setFormSuccess("Play day updated successfully!");

          // Redirect after a short delay to show the success message
          if (result.shouldRedirect) {
            setTimeout(() => {
              window.location.href = "/dashboard/ultrashark";
            }, 1500);
          }
        } else {
          setFormError(result.message || "Failed to update play day");
        }
      }
    } catch (error) {
      console.error("Error submitting form:", error);
      setFormError("An unexpected error occurred");
    }
  };

  const handleDelete = async (playDayId) => {
    if (
      !confirm(
        "Are you sure you want to delete this play day? This action cannot be undone."
      )
    ) {
      return;
    }

    try {
      const result = await deletePlayDay(playDayId);
      if (result.success) {
        setFormSuccess("Play day deleted successfully!");
        if (editingPlayDayId === playDayId) {
          setEditingPlayDayId(null);
          resetForm();
        }
      } else {
        setFormError(result.message || "Failed to delete play day");
      }
    } catch (error) {
      console.error("Error deleting play day:", error);
      setFormError("An unexpected error occurred");
    }
  };

  // Render the cancellation form
  const renderCancellationForm = () => {
    const playDay = sortedPlayDays.find((p) => p.id === cancellingPlayDayId);
    if (!playDay) return null;

    return (
      <form
        onSubmit={handleCancelPlayDaySubmit}
        className="bg-white p-6 rounded-lg shadow-md"
      >
        <h3 className="text-xl font-semibold mb-4 text-red-600">
          Cancel Play Day: {playDay.title}
        </h3>

        {formError && (
          <div className="bg-red-50 text-red-600 p-3 rounded mb-4">
            {formError}
          </div>
        )}

        {formSuccess && (
          <div className="bg-green-50 text-green-600 p-3 rounded mb-4">
            {formSuccess}
          </div>
        )}

        <div className="mb-6">
          <p className="text-gray-700 mb-4">
            Cancelling a play day will notify all members who have RSVP'd and
            mark the play day as cancelled in the system. This is different from
            deleting, as the play day will still be visible but marked as
            cancelled.
          </p>

          <div className="bg-red-50 p-4 rounded-md mb-4">
            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Cancellation Reason *
              </label>
              <textarea
                value={cancellationReason}
                onChange={(e) => setCancellationReason(e.target.value)}
                rows={4}
                className="w-full px-3 py-2 border border-gray-300 rounded-md"
                placeholder="Please provide a reason for cancellation..."
                required
              />
              <p className="text-xs text-gray-500 mt-1">
                This reason will be included in the notification email sent to
                members.
              </p>
            </div>
          </div>
        </div>

        <div className="flex justify-end space-x-3">
          <button
            type="button"
            onClick={handleCancelClick}
            className="px-4 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50"
          >
            Back
          </button>

          <button
            type="submit"
            className="px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700"
          >
            Confirm Cancellation
          </button>
        </div>
      </form>
    );
  };

  return (
    <div className="space-y-8">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 sm:gap-0">
        <h2 className="text-2xl font-bold">Manage Play Days</h2>
        {!isCreating && !editingPlayDayId && !isCancelling && (
          <button
            onClick={handleCreateClick}
            className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded w-full sm:w-auto"
          >
            Create New Play Day
          </button>
        )}
      </div>

      {formError && !isCreating && !editingPlayDayId && !isCancelling && (
        <div className="bg-red-50 text-red-600 p-3 rounded">{formError}</div>
      )}

      {formSuccess && !isCreating && !editingPlayDayId && !isCancelling && (
        <div className="bg-green-50 text-green-600 p-3 rounded">
          {formSuccess}
        </div>
      )}

      {isCancelling && renderCancellationForm()}

      {(isCreating || editingPlayDayId) && (
        <form
          onSubmit={handleSubmit}
          className="bg-white p-4 sm:p-6 rounded-lg shadow-md"
        >
          <h3 className="text-xl font-semibold mb-4">
            {isCreating ? "Create New Play Day" : "Edit Play Day"}
          </h3>

          {formError && (
            <div className="bg-red-50 text-red-600 p-3 rounded mb-4">
              {formError}
            </div>
          )}

          {formSuccess && (
            <div className="bg-green-50 text-green-600 p-3 rounded mb-4">
              {formSuccess}
            </div>
          )}

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Title *
              </label>
              <input
                type="text"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md"
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Date *
              </label>
              <input
                type="date"
                value={date}
                onChange={(e) => setDate(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md"
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Start Time *
              </label>
              <input
                type="time"
                value={startTime}
                onChange={(e) => setStartTime(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md"
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                End Time *
              </label>
              <input
                type="time"
                value={endTime}
                onChange={(e) => setEndTime(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md"
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Courts *
              </label>
              <input
                type="text"
                value={courts}
                onChange={(e) => setCourts(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md"
                required
                placeholder="e.g. 1, 2, 3"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Sponsor
              </label>
              <select
                value={sponsorId}
                onChange={(e) => setSponsorId(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md"
              >
                <option value="">Select a sponsor</option>
                {isLoadingSponsors ? (
                  <option disabled>Loading sponsors...</option>
                ) : (
                  sponsors.map((sponsor) => (
                    <option key={sponsor.id} value={sponsor.id}>
                      {sponsor.name}
                    </option>
                  ))
                )}
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Main Volunteer
              </label>
              <select
                value={mainVolunteerId}
                onChange={(e) => setMainVolunteerId(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md"
              >
                <option value="">Select a volunteer</option>
                {isLoadingMembers ? (
                  <option disabled>Loading members...</option>
                ) : (
                  members.map((member) => (
                    <option key={member.id} value={member.id}>
                      {member.first_name} {member.last_name}
                    </option>
                  ))
                )}
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Helper Volunteer
              </label>
              <select
                value={helperVolunteerId}
                onChange={(e) => setHelperVolunteerId(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md"
              >
                <option value="">Select a volunteer</option>
                {isLoadingMembers ? (
                  <option disabled>Loading members...</option>
                ) : (
                  members.map((member) => (
                    <option key={member.id} value={member.id}>
                      {member.first_name} {member.last_name}
                    </option>
                  ))
                )}
              </select>
            </div>

            <div className="md:col-span-2">
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Description
              </label>
              <textarea
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                rows={4}
                className="w-full px-3 py-2 border border-gray-300 rounded-md"
              />
            </div>
          </div>

          <div className="mb-6">
            <div className="flex items-center mb-4">
              <input
                type="checkbox"
                id="hasClinic"
                checked={hasClinic}
                onChange={(e) => setHasClinic(e.target.checked)}
                className="h-4 w-4 text-blue-600 border-gray-300 rounded"
              />
              <label
                htmlFor="hasClinic"
                className="ml-2 text-sm font-medium text-gray-700"
              >
                Offer Beginner Clinic
              </label>
            </div>

            {hasClinic && (
              <div className="bg-yellow-50 p-4 rounded-md">
                <h4 className="font-medium text-yellow-800 mb-3">
                  Beginner Clinic Details
                </h4>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Clinic Start Time *
                    </label>
                    <input
                      type="time"
                      value={clinicStartTime}
                      onChange={(e) => setClinicStartTime(e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md"
                      required={hasClinic}
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Clinic End Time *
                    </label>
                    <input
                      type="time"
                      value={clinicEndTime}
                      onChange={(e) => setClinicEndTime(e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md"
                      required={hasClinic}
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Clinic Courts *
                    </label>
                    <input
                      type="text"
                      value={clinicCourts}
                      onChange={(e) => setClinicCourts(e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md"
                      required={hasClinic}
                      placeholder="e.g. 1, 2"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Max Participants
                    </label>
                    <input
                      type="number"
                      value={clinicMaxParticipants}
                      onChange={(e) => setClinicMaxParticipants(e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md"
                      min="1"
                      max="50"
                    />
                  </div>

                  <div className="md:col-span-2">
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Clinic Description
                    </label>
                    <textarea
                      value={clinicDescription}
                      onChange={(e) => setClinicDescription(e.target.value)}
                      rows={3}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md"
                    />
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Update Section */}
          <div className="mb-6">
            <h4 className="font-medium text-gray-800 mb-3">Play Day Update</h4>
            <div className="bg-blue-50 p-4 rounded-md">
              <p className="text-sm text-blue-600 mb-2">
                {isCreating
                  ? "Add an initial update for this play day. This will be sent to members."
                  : "Add a new update for this play day. This will be sent to members."}
              </p>
              <textarea
                value={updateContent}
                onChange={(e) => setUpdateContent(e.target.value)}
                rows={4}
                className="w-full px-3 py-2 border border-gray-300 rounded-md"
                placeholder="Enter update details here..."
              />
            </div>
          </div>

          <div className="flex flex-col sm:flex-row justify-end space-y-3 sm:space-y-0 sm:space-x-3">
            <button
              type="button"
              onClick={handleCancelClick}
              className="px-4 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50 order-2 sm:order-1"
            >
              Cancel
            </button>

            <button
              type="submit"
              className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 order-1 sm:order-2"
            >
              {isCreating ? "Create Play Day" : "Update Play Day"}
            </button>
          </div>
        </form>
      )}

      {!isCreating && !editingPlayDayId && !isCancelling && (
        <div className="bg-white rounded-lg shadow overflow-x-auto">
          <div className="min-w-full">
            {/* Desktop view */}
            <table className="min-w-full divide-y divide-gray-200 hidden md:table">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Date
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Title
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Time
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Clinic
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Sponsor
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Volunteers
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    RSVPs
                  </th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {sortedPlayDays.length === 0 ? (
                  <tr>
                    <td
                      colSpan="8"
                      className="px-6 py-4 text-center text-gray-500"
                    >
                      No play days found. Create your first one!
                    </td>
                  </tr>
                ) : (
                  sortedPlayDays.map((playDay) => (
                    <tr
                      key={playDay.id}
                      className={playDay.is_cancelled ? "bg-red-50" : ""}
                    >
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm text-gray-500">
                          {playDay.date
                            ? (() => {
                                // Parse the date and adjust for timezone issues
                                const dateParts = playDay.date
                                  .split("T")[0]
                                  .split("-");
                                const year = Number.parseInt(dateParts[0]);
                                const month = Number.parseInt(dateParts[1]);
                                const day = Number.parseInt(dateParts[2]);

                                // Format the date without timezone conversion
                                return `${year}-${String(month).padStart(2, "0")}-${String(day).padStart(2, "0")}`;
                              })()
                            : ""}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm font-medium text-gray-900">
                          {playDay.title}
                          {playDay.is_cancelled && (
                            <span className="ml-2 px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-red-100 text-red-800">
                              CANCELLED
                            </span>
                          )}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm text-gray-500">
                          {formatTime(playDay.startTime)} -{" "}
                          {formatTime(playDay.endTime)}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        {playDay.hasClinic ? (
                          <span className="px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-green-100 text-green-800">
                            Yes
                          </span>
                        ) : (
                          <span className="px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-gray-100 text-gray-800">
                            No
                          </span>
                        )}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        {playDay.sponsorName && (
                          <div className="text-sm text-gray-500">
                            {playDay.sponsorName}
                          </div>
                        )}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-xs text-gray-500">
                          {playDay.mainVolunteer && (
                            <div>
                              Main: {playDay.mainVolunteer.first_name}{" "}
                              {playDay.mainVolunteer.last_name}
                            </div>
                          )}
                          {playDay.helperVolunteer && (
                            <div>
                              Helper: {playDay.helperVolunteer.first_name}{" "}
                              {playDay.helperVolunteer.last_name}
                            </div>
                          )}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {playDay.replies?.length || 0}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                        <div className="flex justify-end space-x-2">
                          <button
                            onClick={() => handleEditClick(playDay)}
                            className="text-blue-600 hover:text-blue-900"
                            disabled={playDay.is_cancelled}
                          >
                            Edit
                          </button>
                          {!playDay.is_cancelled && (
                            <button
                              onClick={() => handleCancelPlayDayClick(playDay)}
                              className="text-orange-600 hover:text-orange-900"
                            >
                              Cancel
                            </button>
                          )}
                          <button
                            onClick={() => handleDelete(playDay.id)}
                            className="text-red-600 hover:text-red-900"
                          >
                            Delete
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>

            {/* Mobile view */}
            <div className="md:hidden">
              {sortedPlayDays.length === 0 ? (
                <div className="px-6 py-4 text-center text-gray-500">
                  No play days found. Create your first one!
                </div>
              ) : (
                sortedPlayDays.map((playDay) => (
                  <div
                    key={playDay.id}
                    className={`border-b border-gray-200 p-4 ${playDay.is_cancelled ? "bg-red-50" : ""}`}
                  >
                    <div className="flex justify-between items-start mb-2">
                      <div>
                        <h3 className="font-medium text-gray-900">
                          {playDay.title}
                          {playDay.is_cancelled && (
                            <span className="ml-2 px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-red-100 text-red-800">
                              CANCELLED
                            </span>
                          )}
                        </h3>
                        <p className="text-sm text-gray-500">
                          {playDay.date
                            ? (() => {
                                const dateParts = playDay.date
                                  .split("T")[0]
                                  .split("-");
                                const year = Number.parseInt(dateParts[0]);
                                const month = Number.parseInt(dateParts[1]);
                                const day = Number.parseInt(dateParts[2]);
                                return `${year}-${String(month).padStart(2, "0")}-${String(day).padStart(2, "0")}`;
                              })()
                            : ""}
                        </p>
                      </div>
                      <div className="flex space-x-2">
                        <button
                          onClick={() => handleEditClick(playDay)}
                          className="text-blue-600 hover:text-blue-900 p-1"
                          disabled={playDay.is_cancelled}
                          aria-label="Edit"
                        >
                          <svg
                            xmlns="http://www.w3.org/2000/svg"
                            className="h-5 w-5"
                            fill="none"
                            viewBox="0 0 24 24"
                            stroke="currentColor"
                          >
                            <path
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              strokeWidth={2}
                              d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"
                            />
                          </svg>
                        </button>
                        {!playDay.is_cancelled && (
                          <button
                            onClick={() => handleCancelPlayDayClick(playDay)}
                            className="text-orange-600 hover:text-orange-900 p-1"
                            aria-label="Cancel"
                          >
                            <svg
                              xmlns="http://www.w3.org/2000/svg"
                              className="h-5 w-5"
                              fill="none"
                              viewBox="0 0 24 24"
                              stroke="currentColor"
                            >
                              <path
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                strokeWidth={2}
                                d="M18.364 18.364A9 9 0 005.636 5.636m12.728 12.728A9 9 0 015.636 5.636m12.728 12.728L5.636 5.636"
                              />
                            </svg>
                          </button>
                        )}
                        <button
                          onClick={() => handleDelete(playDay.id)}
                          className="text-red-600 hover:text-red-900 p-1"
                          aria-label="Delete"
                        >
                          <svg
                            xmlns="http://www.w3.org/2000/svg"
                            className="h-5 w-5"
                            fill="none"
                            viewBox="0 0 24 24"
                            stroke="currentColor"
                          >
                            <path
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              strokeWidth={2}
                              d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"
                            />
                          </svg>
                        </button>
                      </div>
                    </div>
                    <div className="grid grid-cols-2 gap-2 text-sm">
                      <div>
                        <span className="font-medium">Time:</span>{" "}
                        {formatTime(playDay.startTime)} -{" "}
                        {formatTime(playDay.endTime)}
                      </div>
                      <div>
                        <span className="font-medium">Courts:</span>{" "}
                        {playDay.courts}
                      </div>
                      <div>
                        <span className="font-medium">Clinic:</span>{" "}
                        {playDay.hasClinic ? "Yes" : "No"}
                      </div>
                      <div>
                        <span className="font-medium">RSVPs:</span>{" "}
                        {playDay.replies?.length || 0}
                      </div>
                      {playDay.sponsorName && (
                        <div className="col-span-2">
                          <span className="font-medium">Sponsor:</span>{" "}
                          {playDay.sponsorName}
                        </div>
                      )}
                      {(playDay.mainVolunteer || playDay.helperVolunteer) && (
                        <div className="col-span-2">
                          <span className="font-medium">Volunteers:</span>{" "}
                          {playDay.mainVolunteer && (
                            <span>
                              {playDay.mainVolunteer.first_name}{" "}
                              {playDay.mainVolunteer.last_name}
                              {playDay.helperVolunteer && ", "}
                            </span>
                          )}
                          {playDay.helperVolunteer && (
                            <span>
                              {playDay.helperVolunteer.first_name}{" "}
                              {playDay.helperVolunteer.last_name}
                            </span>
                          )}
                        </div>
                      )}
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// "use client";

// import { useState, useEffect } from "react";
// import {
//   createPlayDay,
//   updatePlayDay,
//   deletePlayDay,
//   cancelPlayDay,
// } from "@/app/_actions";

// export default function UltraPostsEditable({
//   existingPlayDays = [],
//   sponsors = [],
//   members = [],
// }) {
//   const formatTime = (timeString) => {
//     if (!timeString) return "";
//     // If timeString is in HH:MM:SS format, extract just HH:MM
//     if (timeString.includes(":")) {
//       return timeString.substring(0, 5);
//     }
//     return timeString;
//   };

//   // Sort play days by date (earliest first)
//   const sortedPlayDays = [...existingPlayDays].sort((a, b) => {
//     if (!a.date) return 1;
//     if (!b.date) return -1;
//     return new Date(a.date) - new Date(b.date);
//   });

//   const [isCreating, setIsCreating] = useState(false);
//   const [editingPlayDayId, setEditingPlayDayId] = useState(null);
//   const [formError, setFormError] = useState("");
//   const [formSuccess, setFormSuccess] = useState("");
//   const [isLoadingMembers, setIsLoadingMembers] = useState(false);
//   const [isLoadingSponsors, setIsLoadingSponsors] = useState(false);

//   // Cancellation state
//   const [isCancelling, setIsCancelling] = useState(false);
//   const [cancellingPlayDayId, setCancellingPlayDayId] = useState(null);
//   const [cancellationReason, setCancellationReason] = useState("");

//   // Form state
//   const [title, setTitle] = useState("");
//   const [description, setDescription] = useState("");
//   const [date, setDate] = useState("");
//   const [startTime, setStartTime] = useState("");
//   const [endTime, setEndTime] = useState("");
//   const [courts, setCourts] = useState("");
//   const [sponsorId, setSponsorId] = useState("");
//   const [mainVolunteerId, setMainVolunteerId] = useState("");
//   const [helperVolunteerId, setHelperVolunteerId] = useState("");
//   const [updateContent, setUpdateContent] = useState("");

//   // Clinic state
//   const [hasClinic, setHasClinic] = useState(false);
//   const [clinicStartTime, setClinicStartTime] = useState("");
//   const [clinicEndTime, setClinicEndTime] = useState("");
//   const [clinicDescription, setClinicDescription] = useState("");
//   const [clinicCourts, setClinicCourts] = useState("");
//   const [clinicMaxParticipants, setClinicMaxParticipants] = useState(10);

//   // Set loading state based on props
//   useEffect(() => {
//     setIsLoadingMembers(members.length === 0);
//     setIsLoadingSponsors(sponsors.length === 0);
//   }, [members, sponsors]);

//   const resetForm = () => {
//     setTitle("");
//     setDescription("");
//     setDate("");
//     setStartTime("");
//     setEndTime("");
//     setCourts("");
//     setSponsorId("");
//     setMainVolunteerId("");
//     setHelperVolunteerId("");
//     setUpdateContent("");
//     setHasClinic(false);
//     setClinicStartTime("");
//     setClinicEndTime("");
//     setClinicDescription("");
//     setClinicCourts("");
//     setClinicMaxParticipants(10);
//     setFormError("");
//     setFormSuccess("");
//     setCancellationReason("");
//   };

//   const handleCreateClick = () => {
//     setIsCreating(true);
//     setEditingPlayDayId(null);
//     setIsCancelling(false);
//     setCancellingPlayDayId(null);
//     resetForm();
//   };

//   const handleEditClick = (playDay) => {
//     setIsCreating(false);
//     setEditingPlayDayId(playDay.id);
//     setIsCancelling(false);
//     setCancellingPlayDayId(null);

//     // Populate form with play day data
//     setTitle(playDay.title || "");
//     setDescription(playDay.description || "");
//     setDate(playDay.date ? playDay.date.split("T")[0] : ""); // Format date for input
//     setStartTime(playDay.startTime || "");
//     setEndTime(playDay.endTime || "");
//     setCourts(playDay.courts || "");
//     setSponsorId(playDay.sponsorId || "");
//     setMainVolunteerId(playDay.mainVolunteerId || "");
//     setHelperVolunteerId(playDay.helperVolunteerId || "");
//     setUpdateContent(""); // Clear update content when editing

//     // Populate clinic data if it exists
//     if (playDay.hasClinic && playDay.beginnerClinic) {
//       setHasClinic(true);
//       setClinicStartTime(playDay.beginnerClinic.beginnerClinicStartTime || "");
//       setClinicEndTime(playDay.beginnerClinic.beginnerClinicEndTime || "");
//       setClinicDescription(playDay.beginnerClinic.beginnerClinicMessage || "");
//       setClinicCourts(playDay.beginnerClinic.beginnerClinicCourts || "");
//       setClinicMaxParticipants(playDay.beginnerClinic.maxParticipants || 10);
//     } else {
//       setHasClinic(false);
//       setClinicStartTime("");
//       setClinicEndTime("");
//       setClinicDescription("");
//       setClinicCourts("");
//       setClinicMaxParticipants(10);
//     }
//   };

//   const handleCancelClick = () => {
//     setIsCreating(false);
//     setEditingPlayDayId(null);
//     setIsCancelling(false);
//     setCancellingPlayDayId(null);
//     resetForm();
//   };

//   // Handle opening the cancellation modal
//   const handleCancelPlayDayClick = (playDay) => {
//     setIsCancelling(true);
//     setCancellingPlayDayId(playDay.id);
//     setIsCreating(false);
//     setEditingPlayDayId(null);
//     setCancellationReason("");
//   };

//   // Handle submitting the cancellation
//   const handleCancelPlayDaySubmit = async (e) => {
//     e.preventDefault();
//     setFormError("");
//     setFormSuccess("");

//     if (!cancellationReason.trim()) {
//       setFormError("Please provide a reason for cancellation");
//       return;
//     }

//     try {
//       const formData = new FormData();
//       formData.append("playDayId", cancellingPlayDayId);
//       formData.append("cancellationReason", cancellationReason);

//       const result = await cancelPlayDay(formData);
//       if (result.success) {
//         setFormSuccess("Play day cancelled successfully!");
//         setIsCancelling(false);
//         setCancellingPlayDayId(null);
//         setCancellationReason("");

//         // Redirect after a short delay to show the success message
//         if (result.shouldRedirect) {
//           setTimeout(() => {
//             window.location.href = "/dashboard/ultrashark";
//           }, 1500);
//         }
//       } else {
//         setFormError(result.message || "Failed to cancel play day");
//       }
//     } catch (error) {
//       console.error("Error cancelling play day:", error);
//       setFormError("An unexpected error occurred");
//     }
//   };

//   const handleSubmit = async (e) => {
//     e.preventDefault();
//     setFormError("");
//     setFormSuccess("");

//     // Validate form
//     if (!title || !date || !startTime || !endTime || !courts) {
//       setFormError("Please fill in all required fields");
//       return;
//     }

//     if (hasClinic && (!clinicStartTime || !clinicEndTime)) {
//       setFormError(
//         "Please fill in all clinic fields or disable the clinic option"
//       );
//       return;
//     }

//     try {
//       // Create FormData object to match the server action expectations
//       const formData = new FormData();
//       formData.append("title", title);
//       formData.append("description", description);
//       formData.append("date", date);
//       formData.append("startTime", startTime);
//       formData.append("endTime", endTime);
//       formData.append("courts", courts);
//       formData.append("sponsorId", sponsorId);
//       formData.append("mainVolunteerId", mainVolunteerId);
//       formData.append("helperVolunteerId", helperVolunteerId);
//       formData.append("hasClinic", hasClinic);

//       if (hasClinic) {
//         formData.append("clinicDescription", clinicDescription);
//         formData.append("clinicStartTime", clinicStartTime);
//         formData.append("clinicEndTime", clinicEndTime);
//         formData.append("clinicCourts", clinicCourts);
//         formData.append("clinicMaxParticipants", clinicMaxParticipants);
//       }

//       // Add update content if provided
//       if (updateContent) {
//         formData.append("updateContent", updateContent);
//       }

//       if (isCreating) {
//         // Create new play day
//         const result = await createPlayDay(formData);
//         if (result.success) {
//           setFormSuccess("Play day created successfully!");
//           resetForm();
//           setIsCreating(false);

//           // Redirect after a short delay to show the success message
//           if (result.shouldRedirect) {
//             setTimeout(() => {
//               window.location.href = "/dashboard/ultrashark";
//             }, 1500);
//           }
//         } else {
//           setFormError(result.message || "Failed to create play day");
//         }
//       } else if (editingPlayDayId) {
//         // Update existing play day
//         formData.append("playDayId", editingPlayDayId);
//         const result = await updatePlayDay(formData);
//         if (result.success) {
//           setFormSuccess("Play day updated successfully!");

//           // Redirect after a short delay to show the success message
//           if (result.shouldRedirect) {
//             setTimeout(() => {
//               window.location.href = "/dashboard/ultrashark";
//             }, 1500);
//           }
//         } else {
//           setFormError(result.message || "Failed to update play day");
//         }
//       }
//     } catch (error) {
//       console.error("Error submitting form:", error);
//       setFormError("An unexpected error occurred");
//     }
//   };

//   const handleDelete = async (playDayId) => {
//     if (
//       !confirm(
//         "Are you sure you want to delete this play day? This action cannot be undone."
//       )
//     ) {
//       return;
//     }

//     try {
//       const result = await deletePlayDay(playDayId);
//       if (result.success) {
//         setFormSuccess("Play day deleted successfully!");
//         if (editingPlayDayId === playDayId) {
//           setEditingPlayDayId(null);
//           resetForm();
//         }
//       } else {
//         setFormError(result.message || "Failed to delete play day");
//       }
//     } catch (error) {
//       console.error("Error deleting play day:", error);
//       setFormError("An unexpected error occurred");
//     }
//   };

//   // Render the cancellation form
//   const renderCancellationForm = () => {
//     const playDay = sortedPlayDays.find((p) => p.id === cancellingPlayDayId);
//     if (!playDay) return null;

//     return (
//       <form
//         onSubmit={handleCancelPlayDaySubmit}
//         className="bg-white p-6 rounded-lg shadow-md"
//       >
//         <h3 className="text-xl font-semibold mb-4 text-red-600">
//           Cancel Play Day: {playDay.title}
//         </h3>

//         {formError && (
//           <div className="bg-red-50 text-red-600 p-3 rounded mb-4">
//             {formError}
//           </div>
//         )}

//         {formSuccess && (
//           <div className="bg-green-50 text-green-600 p-3 rounded mb-4">
//             {formSuccess}
//           </div>
//         )}

//         <div className="mb-6">
//           <p className="text-gray-700 mb-4">
//             Cancelling a play day will notify all members who have RSVP'd and
//             mark the play day as cancelled in the system. This is different from
//             deleting, as the play day will still be visible but marked as
//             cancelled.
//           </p>

//           <div className="bg-red-50 p-4 rounded-md mb-4">
//             <div className="mb-4">
//               <label className="block text-sm font-medium text-gray-700 mb-1">
//                 Cancellation Reason *
//               </label>
//               <textarea
//                 value={cancellationReason}
//                 onChange={(e) => setCancellationReason(e.target.value)}
//                 rows={4}
//                 className="w-full px-3 py-2 border border-gray-300 rounded-md"
//                 placeholder="Please provide a reason for cancellation..."
//                 required
//               />
//               <p className="text-xs text-gray-500 mt-1">
//                 This reason will be included in the notification email sent to
//                 members.
//               </p>
//             </div>
//           </div>
//         </div>

//         <div className="flex justify-end space-x-3">
//           <button
//             type="button"
//             onClick={handleCancelClick}
//             className="px-4 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50"
//           >
//             Back
//           </button>

//           <button
//             type="submit"
//             className="px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700"
//           >
//             Confirm Cancellation
//           </button>
//         </div>
//       </form>
//     );
//   };

//   return (
//     <div className="space-y-8">
//       <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 sm:gap-0">
//         <h2 className="text-2xl font-bold">Manage Play Days</h2>
//         {!isCreating && !editingPlayDayId && !isCancelling && (
//           <button
//             onClick={handleCreateClick}
//             className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded w-full sm:w-auto"
//           >
//             Create New Play Day
//           </button>
//         )}
//       </div>

//       {formError && !isCreating && !editingPlayDayId && !isCancelling && (
//         <div className="bg-red-50 text-red-600 p-3 rounded">{formError}</div>
//       )}

//       {formSuccess && !isCreating && !editingPlayDayId && !isCancelling && (
//         <div className="bg-green-50 text-green-600 p-3 rounded">
//           {formSuccess}
//         </div>
//       )}

//       {isCancelling && renderCancellationForm()}

//       {(isCreating || editingPlayDayId) && (
//         <form
//           onSubmit={handleSubmit}
//           className="bg-white p-4 sm:p-6 rounded-lg shadow-md"
//         >
//           <h3 className="text-xl font-semibold mb-4">
//             {isCreating ? "Create New Play Day" : "Edit Play Day"}
//           </h3>

//           {formError && (
//             <div className="bg-red-50 text-red-600 p-3 rounded mb-4">
//               {formError}
//             </div>
//           )}

//           {formSuccess && (
//             <div className="bg-green-50 text-green-600 p-3 rounded mb-4">
//               {formSuccess}
//             </div>
//           )}

//           <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
//             <div>
//               <label className="block text-sm font-medium text-gray-700 mb-1">
//                 Title *
//               </label>
//               <input
//                 type="text"
//                 value={title}
//                 onChange={(e) => setTitle(e.target.value)}
//                 className="w-full px-3 py-2 border border-gray-300 rounded-md"
//                 required
//               />
//             </div>

//             <div>
//               <label className="block text-sm font-medium text-gray-700 mb-1">
//                 Date *
//               </label>
//               <input
//                 type="date"
//                 value={date}
//                 onChange={(e) => setDate(e.target.value)}
//                 className="w-full px-3 py-2 border border-gray-300 rounded-md"
//                 required
//               />
//             </div>

//             <div>
//               <label className="block text-sm font-medium text-gray-700 mb-1">
//                 Start Time *
//               </label>
//               <input
//                 type="time"
//                 value={startTime}
//                 onChange={(e) => setStartTime(e.target.value)}
//                 className="w-full px-3 py-2 border border-gray-300 rounded-md"
//                 required
//               />
//             </div>

//             <div>
//               <label className="block text-sm font-medium text-gray-700 mb-1">
//                 End Time *
//               </label>
//               <input
//                 type="time"
//                 value={endTime}
//                 onChange={(e) => setEndTime(e.target.value)}
//                 className="w-full px-3 py-2 border border-gray-300 rounded-md"
//                 required
//               />
//             </div>

//             <div>
//               <label className="block text-sm font-medium text-gray-700 mb-1">
//                 Courts *
//               </label>
//               <input
//                 type="text"
//                 value={courts}
//                 onChange={(e) => setCourts(e.target.value)}
//                 className="w-full px-3 py-2 border border-gray-300 rounded-md"
//                 required
//                 placeholder="e.g. 1, 2, 3"
//               />
//             </div>

//             <div>
//               <label className="block text-sm font-medium text-gray-700 mb-1">
//                 Sponsor
//               </label>
//               <select
//                 value={sponsorId}
//                 onChange={(e) => setSponsorId(e.target.value)}
//                 className="w-full px-3 py-2 border border-gray-300 rounded-md"
//               >
//                 <option value="">Select a sponsor</option>
//                 {isLoadingSponsors ? (
//                   <option disabled>Loading sponsors...</option>
//                 ) : (
//                   sponsors.map((sponsor) => (
//                     <option key={sponsor.id} value={sponsor.id}>
//                       {sponsor.name}
//                     </option>
//                   ))
//                 )}
//               </select>
//             </div>

//             <div>
//               <label className="block text-sm font-medium text-gray-700 mb-1">
//                 Main Volunteer
//               </label>
//               <select
//                 value={mainVolunteerId}
//                 onChange={(e) => setMainVolunteerId(e.target.value)}
//                 className="w-full px-3 py-2 border border-gray-300 rounded-md"
//               >
//                 <option value="">Select a volunteer</option>
//                 {isLoadingMembers ? (
//                   <option disabled>Loading members...</option>
//                 ) : (
//                   members.map((member) => (
//                     <option key={member.id} value={member.id}>
//                       {member.first_name} {member.last_name}
//                     </option>
//                   ))
//                 )}
//               </select>
//             </div>

//             <div>
//               <label className="block text-sm font-medium text-gray-700 mb-1">
//                 Helper Volunteer
//               </label>
//               <select
//                 value={helperVolunteerId}
//                 onChange={(e) => setHelperVolunteerId(e.target.value)}
//                 className="w-full px-3 py-2 border border-gray-300 rounded-md"
//               >
//                 <option value="">Select a volunteer</option>
//                 {isLoadingMembers ? (
//                   <option disabled>Loading members...</option>
//                 ) : (
//                   members.map((member) => (
//                     <option key={member.id} value={member.id}>
//                       {member.first_name} {member.last_name}
//                     </option>
//                   ))
//                 )}
//               </select>
//             </div>

//             <div className="md:col-span-2">
//               <label className="block text-sm font-medium text-gray-700 mb-1">
//                 Description
//               </label>
//               <textarea
//                 value={description}
//                 onChange={(e) => setDescription(e.target.value)}
//                 rows={4}
//                 className="w-full px-3 py-2 border border-gray-300 rounded-md"
//               />
//             </div>
//           </div>

//           <div className="mb-6">
//             <div className="flex items-center mb-4">
//               <input
//                 type="checkbox"
//                 id="hasClinic"
//                 checked={hasClinic}
//                 onChange={(e) => setHasClinic(e.target.checked)}
//                 className="h-4 w-4 text-blue-600 border-gray-300 rounded"
//               />
//               <label
//                 htmlFor="hasClinic"
//                 className="ml-2 text-sm font-medium text-gray-700"
//               >
//                 Offer Beginner Clinic
//               </label>
//             </div>

//             {hasClinic && (
//               <div className="bg-yellow-50 p-4 rounded-md">
//                 <h4 className="font-medium text-yellow-800 mb-3">
//                   Beginner Clinic Details
//                 </h4>
//                 <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
//                   <div>
//                     <label className="block text-sm font-medium text-gray-700 mb-1">
//                       Clinic Start Time *
//                     </label>
//                     <input
//                       type="time"
//                       value={clinicStartTime}
//                       onChange={(e) => setClinicStartTime(e.target.value)}
//                       className="w-full px-3 py-2 border border-gray-300 rounded-md"
//                       required={hasClinic}
//                     />
//                   </div>

//                   <div>
//                     <label className="block text-sm font-medium text-gray-700 mb-1">
//                       Clinic End Time *
//                     </label>
//                     <input
//                       type="time"
//                       value={clinicEndTime}
//                       onChange={(e) => setClinicEndTime(e.target.value)}
//                       className="w-full px-3 py-2 border border-gray-300 rounded-md"
//                       required={hasClinic}
//                     />
//                   </div>

//                   <div>
//                     <label className="block text-sm font-medium text-gray-700 mb-1">
//                       Clinic Courts *
//                     </label>
//                     <input
//                       type="text"
//                       value={clinicCourts}
//                       onChange={(e) => setClinicCourts(e.target.value)}
//                       className="w-full px-3 py-2 border border-gray-300 rounded-md"
//                       required={hasClinic}
//                       placeholder="e.g. 1, 2"
//                     />
//                   </div>

//                   <div>
//                     <label className="block text-sm font-medium text-gray-700 mb-1">
//                       Max Participants
//                     </label>
//                     <input
//                       type="number"
//                       value={clinicMaxParticipants}
//                       onChange={(e) => setClinicMaxParticipants(e.target.value)}
//                       className="w-full px-3 py-2 border border-gray-300 rounded-md"
//                       min="1"
//                       max="50"
//                     />
//                   </div>

//                   <div className="md:col-span-2">
//                     <label className="block text-sm font-medium text-gray-700 mb-1">
//                       Clinic Description
//                     </label>
//                     <textarea
//                       value={clinicDescription}
//                       onChange={(e) => setClinicDescription(e.target.value)}
//                       rows={3}
//                       className="w-full px-3 py-2 border border-gray-300 rounded-md"
//                     />
//                   </div>
//                 </div>
//               </div>
//             )}
//           </div>

//           {/* Update Section */}
//           <div className="mb-6">
//             <h4 className="font-medium text-gray-800 mb-3">Play Day Update</h4>
//             <div className="bg-blue-50 p-4 rounded-md">
//               <p className="text-sm text-blue-600 mb-2">
//                 {isCreating
//                   ? "Add an initial update for this play day. This will be sent to members."
//                   : "Add a new update for this play day. This will be sent to members."}
//               </p>
//               <textarea
//                 value={updateContent}
//                 onChange={(e) => setUpdateContent(e.target.value)}
//                 rows={4}
//                 className="w-full px-3 py-2 border border-gray-300 rounded-md"
//                 placeholder="Enter update details here..."
//               />
//             </div>
//           </div>

//           <div className="flex flex-col sm:flex-row justify-end space-y-3 sm:space-y-0 sm:space-x-3">
//             <button
//               type="button"
//               onClick={handleCancelClick}
//               className="px-4 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50 order-2 sm:order-1"
//             >
//               Cancel
//             </button>

//             <button
//               type="submit"
//               className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 order-1 sm:order-2"
//             >
//               {isCreating ? "Create Play Day" : "Update Play Day"}
//             </button>
//           </div>
//         </form>
//       )}

//       {!isCreating && !editingPlayDayId && !isCancelling && (
//         <div className="bg-white rounded-lg shadow overflow-x-auto">
//           <div className="min-w-full">
//             {/* Desktop view */}
//             <table className="min-w-full divide-y divide-gray-200 hidden md:table">
//               <thead className="bg-gray-50">
//                 <tr>
//                   <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
//                     Date
//                   </th>
//                   <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
//                     Title
//                   </th>
//                   <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
//                     Time
//                   </th>
//                   <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
//                     Clinic
//                   </th>
//                   <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
//                     Sponsor
//                   </th>
//                   <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
//                     Volunteers
//                   </th>
//                   <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
//                     RSVPs
//                   </th>
//                   <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
//                     Actions
//                   </th>
//                 </tr>
//               </thead>
//               <tbody className="bg-white divide-y divide-gray-200">
//                 {sortedPlayDays.length === 0 ? (
//                   <tr>
//                     <td
//                       colSpan="8"
//                       className="px-6 py-4 text-center text-gray-500"
//                     >
//                       No play days found. Create your first one!
//                     </td>
//                   </tr>
//                 ) : (
//                   sortedPlayDays.map((playDay) => (
//                     <tr
//                       key={playDay.id}
//                       className={playDay.isCancelled ? "bg-red-50" : ""}
//                     >
//                       <td className="px-6 py-4 whitespace-nowrap">
//                         <div className="text-sm text-gray-500">
//                           {playDay.date
//                             ? (() => {
//                                 // Parse the date and adjust for timezone issues
//                                 const dateParts = playDay.date
//                                   .split("T")[0]
//                                   .split("-");
//                                 const year = Number.parseInt(dateParts[0]);
//                                 const month = Number.parseInt(dateParts[1]);
//                                 const day = Number.parseInt(dateParts[2]);

//                                 // Format the date without timezone conversion
//                                 return `${year}-${String(month).padStart(
//                                   2,
//                                   "0"
//                                 )}-${String(day).padStart(2, "0")}`;
//                               })()
//                             : ""}
//                         </div>
//                       </td>
//                       <td className="px-6 py-4 whitespace-nowrap">
//                         <div className="text-sm font-medium text-gray-900">
//                           {playDay.title}
//                           {playDay.isCancelled && (
//                             <span className="ml-2 px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-red-100 text-red-800">
//                               CANCELLED
//                             </span>
//                           )}
//                         </div>
//                       </td>
//                       <td className="px-6 py-4 whitespace-nowrap">
//                         <div className="text-sm text-gray-500">
//                           {formatTime(playDay.startTime)} -{" "}
//                           {formatTime(playDay.endTime)}
//                         </div>
//                       </td>
//                       <td className="px-6 py-4 whitespace-nowrap">
//                         {playDay.hasClinic ? (
//                           <span className="px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-green-100 text-green-800">
//                             Yes
//                           </span>
//                         ) : (
//                           <span className="px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-gray-100 text-gray-800">
//                             No
//                           </span>
//                         )}
//                       </td>
//                       <td className="px-6 py-4 whitespace-nowrap">
//                         {playDay.sponsorName && (
//                           <div className="text-sm text-gray-500">
//                             {playDay.sponsorName}
//                           </div>
//                         )}
//                       </td>
//                       <td className="px-6 py-4 whitespace-nowrap">
//                         <div className="text-xs text-gray-500">
//                           {playDay.mainVolunteer && (
//                             <div>
//                               Main: {playDay.mainVolunteer.first_name}{" "}
//                               {playDay.mainVolunteer.last_name}
//                             </div>
//                           )}
//                           {playDay.helperVolunteer && (
//                             <div>
//                               Helper: {playDay.helperVolunteer.first_name}{" "}
//                               {playDay.helperVolunteer.last_name}
//                             </div>
//                           )}
//                         </div>
//                       </td>
//                       <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
//                         {playDay.replies?.length || 0}
//                       </td>
//                       <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
//                         <div className="flex justify-end space-x-2">
//                           <button
//                             onClick={() => handleEditClick(playDay)}
//                             className="text-blue-600 hover:text-blue-900"
//                             disabled={playDay.isCancelled}
//                           >
//                             Edit
//                           </button>
//                           {!playDay.isCancelled && (
//                             <button
//                               onClick={() => handleCancelPlayDayClick(playDay)}
//                               className="text-orange-600 hover:text-orange-900"
//                             >
//                               Cancel
//                             </button>
//                           )}
//                           <button
//                             onClick={() => handleDelete(playDay.id)}
//                             className="text-red-600 hover:text-red-900"
//                           >
//                             Delete
//                           </button>
//                         </div>
//                       </td>
//                     </tr>
//                   ))
//                 )}
//               </tbody>
//             </table>

//             {/* Mobile view */}
//             <div className="md:hidden">
//               {sortedPlayDays.length === 0 ? (
//                 <div className="px-6 py-4 text-center text-gray-500">
//                   No play days found. Create your first one!
//                 </div>
//               ) : (
//                 sortedPlayDays.map((playDay) => (
//                   <div
//                     key={playDay.id}
//                     className={`border-b border-gray-200 p-4 ${
//                       playDay.isCancelled ? "bg-red-50" : ""
//                     }`}
//                   >
//                     <div className="flex justify-between items-start mb-2">
//                       <div>
//                         <h3 className="font-medium text-gray-900">
//                           {playDay.title}
//                           {playDay.isCancelled && (
//                             <span className="ml-2 px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-red-100 text-red-800">
//                               CANCELLED
//                             </span>
//                           )}
//                         </h3>
//                         <p className="text-sm text-gray-500">
//                           {playDay.date
//                             ? (() => {
//                                 const dateParts = playDay.date
//                                   .split("T")[0]
//                                   .split("-");
//                                 const year = Number.parseInt(dateParts[0]);
//                                 const month = Number.parseInt(dateParts[1]);
//                                 const day = Number.parseInt(dateParts[2]);
//                                 return `${year}-${String(month).padStart(
//                                   2,
//                                   "0"
//                                 )}-${String(day).padStart(2, "0")}`;
//                               })()
//                             : ""}
//                         </p>
//                       </div>
//                       <div className="flex space-x-2">
//                         <button
//                           onClick={() => handleEditClick(playDay)}
//                           className="text-blue-600 hover:text-blue-900 p-1"
//                           disabled={playDay.isCancelled}
//                           aria-label="Edit"
//                         >
//                           <svg
//                             xmlns="http://www.w3.org/2000/svg"
//                             className="h-5 w-5"
//                             fill="none"
//                             viewBox="0 0 24 24"
//                             stroke="currentColor"
//                           >
//                             <path
//                               strokeLinecap="round"
//                               strokeLinejoin="round"
//                               strokeWidth={2}
//                               d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"
//                             />
//                           </svg>
//                         </button>
//                         {!playDay.isCancelled && (
//                           <button
//                             onClick={() => handleCancelPlayDayClick(playDay)}
//                             className="text-orange-600 hover:text-orange-900 p-1"
//                             aria-label="Cancel"
//                           >
//                             <svg
//                               xmlns="http://www.w3.org/2000/svg"
//                               className="h-5 w-5"
//                               fill="none"
//                               viewBox="0 0 24 24"
//                               stroke="currentColor"
//                             >
//                               <path
//                                 strokeLinecap="round"
//                                 strokeLinejoin="round"
//                                 strokeWidth={2}
//                                 d="M18.364 18.364A9 9 0 005.636 5.636m12.728 12.728A9 9 0 015.636 5.636m12.728 12.728L5.636 5.636"
//                               />
//                             </svg>
//                           </button>
//                         )}
//                         <button
//                           onClick={() => handleDelete(playDay.id)}
//                           className="text-red-600 hover:text-red-900 p-1"
//                           aria-label="Delete"
//                         >
//                           <svg
//                             xmlns="http://www.w3.org/2000/svg"
//                             className="h-5 w-5"
//                             fill="none"
//                             viewBox="0 0 24 24"
//                             stroke="currentColor"
//                           >
//                             <path
//                               strokeLinecap="round"
//                               strokeLinejoin="round"
//                               strokeWidth={2}
//                               d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"
//                             />
//                           </svg>
//                         </button>
//                       </div>
//                     </div>
//                     <div className="grid grid-cols-2 gap-2 text-sm">
//                       <div>
//                         <span className="font-medium">Time:</span>{" "}
//                         {formatTime(playDay.startTime)} -{" "}
//                         {formatTime(playDay.endTime)}
//                       </div>
//                       <div>
//                         <span className="font-medium">Courts:</span>{" "}
//                         {playDay.courts}
//                       </div>
//                       <div>
//                         <span className="font-medium">Clinic:</span>{" "}
//                         {playDay.hasClinic ? "Yes" : "No"}
//                       </div>
//                       <div>
//                         <span className="font-medium">RSVPs:</span>{" "}
//                         {playDay.replies?.length || 0}
//                       </div>
//                       {playDay.sponsorName && (
//                         <div className="col-span-2">
//                           <span className="font-medium">Sponsor:</span>{" "}
//                           {playDay.sponsorName}
//                         </div>
//                       )}
//                       {(playDay.mainVolunteer || playDay.helperVolunteer) && (
//                         <div className="col-span-2">
//                           <span className="font-medium">Volunteers:</span>{" "}
//                           {playDay.mainVolunteer && (
//                             <span>
//                               {playDay.mainVolunteer.first_name}{" "}
//                               {playDay.mainVolunteer.last_name}
//                               {playDay.helperVolunteer && ", "}
//                             </span>
//                           )}
//                           {playDay.helperVolunteer && (
//                             <span>
//                               {playDay.helperVolunteer.first_name}{" "}
//                               {playDay.helperVolunteer.last_name}
//                             </span>
//                           )}
//                         </div>
//                       )}
//                     </div>
//                   </div>
//                 ))
//               )}
//             </div>
//           </div>
//         </div>
//       )}
//     </div>
//   );
// }
