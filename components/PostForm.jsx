"use client";

import { useState } from "react";
import { createPlayDay, createPlayDayUpdate } from "@/app/_actions";
import { useActionState } from "react";
import MemberSearch from "./MemberSearch";

export default function PostForm({ members }) {
  const initialFormState = {
    title: "",
    description: "",
    date: "",
    startTime: "",
    endTime: "",
    courts: "",
    hasClinic: false,
    clinicDescription: "",
    clinicStartTime: "",
    clinicEndTime: "",
    clinicCourts: "",
    clinicMaxParticipants: "12",
  };

  const [formData, setFormData] = useState(initialFormState);
  const [volunteers, setVolunteers] = useState({
    facilitator: [],
    ballMachine: [],
    photographer: [],
  });
  const [formType, setFormType] = useState("playDay"); // 'playDay' or 'update'
  const [selectedPlayDay, setSelectedPlayDay] = useState(null);

  const [state, action, isPending] = useActionState(async (formData) => {
    if (formType === "playDay") {
      const result = await createPlayDay(formData);
      if (result.success) {
        // Reset form after successful submission
        setFormData(initialFormState);
        setVolunteers({
          facilitator: [],
          ballMachine: [],
          photographer: [],
        });
      }
      return result;
    } else if (formType === "update") {
      return await createPlayDayUpdate(formData);
    }
  }, null);

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: type === "checkbox" ? checked : value,
    }));
  };

  const handleSubmit = (e) => {
    e.preventDefault();

    const formDataToSubmit = new FormData();

    if (formType === "playDay") {
      // Add play day data
      Object.entries(formData).forEach(([key, value]) => {
        formDataToSubmit.append(key, value);
      });

      // Add volunteers data
      Object.entries(volunteers).forEach(([role, memberList]) => {
        memberList.forEach((member) => {
          formDataToSubmit.append(
            `volunteers[${role}][]`,
            JSON.stringify(member)
          );
        });
      });
    } else if (formType === "update") {
      formDataToSubmit.append("playDayId", selectedPlayDay);
      formDataToSubmit.append("content", formData.updateContent);
    }

    action(formDataToSubmit);
  };

  const addVolunteer = (member, role) => {
    // Check if member is already in the list
    if (!volunteers[role].some((v) => v.id === member.id)) {
      setVolunteers((prev) => ({
        ...prev,
        [role]: [...prev[role], member],
      }));
    }
  };

  const removeVolunteer = (memberId, role) => {
    setVolunteers((prev) => ({
      ...prev,
      [role]: prev[role].filter((member) => member.id !== memberId),
    }));
  };

  return (
    <div className="bg-white p-4 rounded shadow">
      <div className="mb-4">
        <button
          onClick={() => setFormType("playDay")}
          className={`mr-2 px-4 py-2 rounded ${
            formType === "playDay" ? "bg-blue-500 text-white" : "bg-gray-200"
          }`}
        >
          Create Play Day
        </button>
        <button
          onClick={() => setFormType("update")}
          className={`px-4 py-2 rounded ${
            formType === "update" ? "bg-blue-500 text-white" : "bg-gray-200"
          }`}
        >
          Create Update
        </button>
      </div>

      <form onSubmit={handleSubmit}>
        {formType === "playDay" ? (
          <>
            <div className="mb-4">
              <label className="block mb-1">Title</label>
              <input
                type="text"
                name="title"
                value={formData.title}
                onChange={handleChange}
                className="w-full p-2 border border-gray-300 rounded"
                required
              />
            </div>

            <div className="mb-4">
              <label className="block mb-1">Description</label>
              <textarea
                name="description"
                value={formData.description}
                onChange={handleChange}
                className="w-full p-2 border border-gray-300 rounded"
                rows="3"
                required
              />
            </div>

            <div className="mb-4">
              <label className="block mb-1">Date</label>
              <input
                type="date"
                name="date"
                value={formData.date}
                onChange={handleChange}
                className="w-full p-2 border border-gray-300 rounded"
                required
              />
            </div>

            <div className="grid grid-cols-2 gap-4 mb-4">
              <div>
                <label className="block mb-1">Start Time</label>
                <input
                  type="time"
                  name="startTime"
                  value={formData.startTime}
                  onChange={handleChange}
                  className="w-full p-2 border border-gray-300 rounded"
                  required
                />
              </div>
              <div>
                <label className="block mb-1">End Time</label>
                <input
                  type="time"
                  name="endTime"
                  value={formData.endTime}
                  onChange={handleChange}
                  className="w-full p-2 border border-gray-300 rounded"
                  required
                />
              </div>
            </div>

            <div className="mb-4">
              <label className="block mb-1">Courts</label>
              <input
                type="text"
                name="courts"
                value={formData.courts}
                onChange={handleChange}
                className="w-full p-2 border border-gray-300 rounded"
                required
              />
            </div>

            {/* Volunteer Sections */}
            <div className="mb-4">
              <h3 className="font-bold mb-2">Facilitator</h3>
              <MemberSearch
                members={members}
                onSelect={addVolunteer}
                role="facilitator"
              />
              <div className="mt-2">
                {volunteers.facilitator.map((member) => (
                  <div
                    key={member.id}
                    className="flex items-center bg-gray-100 p-2 rounded mb-1"
                  >
                    <span>
                      {member.first_name} {member.last_name}
                    </span>
                    <button
                      type="button"
                      onClick={() => removeVolunteer(member.id, "facilitator")}
                      className="ml-auto text-red-500"
                    >
                      ✕
                    </button>
                  </div>
                ))}
              </div>
            </div>

            <div className="mb-4">
              <h3 className="font-bold mb-2">Ball Machine</h3>
              <MemberSearch
                members={members}
                onSelect={addVolunteer}
                role="ballMachine"
              />
              <div className="mt-2">
                {volunteers.ballMachine.map((member) => (
                  <div
                    key={member.id}
                    className="flex items-center bg-gray-100 p-2 rounded mb-1"
                  >
                    <span>
                      {member.first_name} {member.last_name}
                    </span>
                    <button
                      type="button"
                      onClick={() => removeVolunteer(member.id, "ballMachine")}
                      className="ml-auto text-red-500"
                    >
                      ✕
                    </button>
                  </div>
                ))}
              </div>
            </div>

            <div className="mb-4">
              <h3 className="font-bold mb-2">Photographer</h3>
              <MemberSearch
                members={members}
                onSelect={addVolunteer}
                role="photographer"
              />
              <div className="mt-2">
                {volunteers.photographer.map((member) => (
                  <div
                    key={member.id}
                    className="flex items-center bg-gray-100 p-2 rounded mb-1"
                  >
                    <span>
                      {member.first_name} {member.last_name}
                    </span>
                    <button
                      type="button"
                      onClick={() => removeVolunteer(member.id, "photographer")}
                      className="ml-auto text-red-500"
                    >
                      ✕
                    </button>
                  </div>
                ))}
              </div>
            </div>

            <div className="mb-4">
              <label className="flex items-center">
                <input
                  type="checkbox"
                  name="hasClinic"
                  checked={formData.hasClinic}
                  onChange={handleChange}
                  className="mr-2"
                />
                <span>Offer Beginner Clinic</span>
              </label>
            </div>

            {formData.hasClinic && (
              <div className="pl-4 border-l-2 border-blue-300 mb-4">
                <div className="mb-4">
                  <label className="block mb-1">Clinic Description</label>
                  <textarea
                    name="clinicDescription"
                    value={formData.clinicDescription}
                    onChange={handleChange}
                    className="w-full p-2 border border-gray-300 rounded"
                    rows="2"
                    required={formData.hasClinic}
                  />
                </div>

                <div className="grid grid-cols-2 gap-4 mb-4">
                  <div>
                    <label className="block mb-1">Clinic Start Time</label>
                    <input
                      type="time"
                      name="clinicStartTime"
                      value={formData.clinicStartTime}
                      onChange={handleChange}
                      className="w-full p-2 border border-gray-300 rounded"
                      required={formData.hasClinic}
                    />
                  </div>
                  <div>
                    <label className="block mb-1">Clinic End Time</label>
                    <input
                      type="time"
                      name="clinicEndTime"
                      value={formData.clinicEndTime}
                      onChange={handleChange}
                      className="w-full p-2 border border-gray-300 rounded"
                      required={formData.hasClinic}
                    />
                  </div>
                </div>

                <div className="mb-4">
                  <label className="block mb-1">Clinic Courts</label>
                  <input
                    type="text"
                    name="clinicCourts"
                    value={formData.clinicCourts}
                    onChange={handleChange}
                    className="w-full p-2 border border-gray-300 rounded"
                    required={formData.hasClinic}
                  />
                </div>

                <div className="mb-4">
                  <label className="block mb-1">Max Participants</label>
                  <input
                    type="number"
                    name="clinicMaxParticipants"
                    value={formData.clinicMaxParticipants}
                    onChange={handleChange}
                    className="w-full p-2 border border-gray-300 rounded"
                    required={formData.hasClinic}
                    min="1"
                  />
                </div>
              </div>
            )}
          </>
        ) : (
          <>
            <div className="mb-4">
              <label className="block mb-1">Select Play Day</label>
              <select
                value={selectedPlayDay || ""}
                onChange={(e) => setSelectedPlayDay(e.target.value)}
                className="w-full p-2 border border-gray-300 rounded"
                required
              >
                <option value="">Select a Play Day</option>
                {/* This would be populated with actual play days */}
                <option value="1">Example Play Day 1</option>
                <option value="2">Example Play Day 2</option>
              </select>
            </div>

            <div className="mb-4">
              <label className="block mb-1">Update Content</label>
              <textarea
                name="updateContent"
                value={formData.updateContent || ""}
                onChange={handleChange}
                className="w-full p-2 border border-gray-300 rounded"
                rows="4"
                required
              />
            </div>
          </>
        )}

        <button
          type="submit"
          disabled={isPending}
          className="w-full bg-blue-500 text-white p-2 rounded hover:bg-blue-600 disabled:bg-gray-400"
        >
          {isPending
            ? "Submitting..."
            : formType === "playDay"
            ? "Create Play Day"
            : "Post Update"}
        </button>

        {state && (
          <div
            className={`mt-4 p-2 rounded ${
              state.success
                ? "bg-green-100 text-green-800"
                : "bg-red-100 text-red-800"
            }`}
          >
            {state.message}
          </div>
        )}
      </form>
    </div>
  );
}
