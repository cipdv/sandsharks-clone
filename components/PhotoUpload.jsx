"use client";

import { useState } from "react";
import { uploadPhotos } from "@/app/_actions";

export default function PhotoUpload({ years, currentYear, members }) {
  const [selectedFiles, setSelectedFiles] = useState([]);
  const [selectedYear, setSelectedYear] = useState(
    currentYear?.toString() || ""
  );
  const [newYear, setNewYear] = useState("");
  const [isCreatingNewYear, setIsCreatingNewYear] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [message, setMessage] = useState(null);
  const [taggedMembers, setTaggedMembers] = useState({});
  const [searchInputs, setSearchInputs] = useState({});

  const handleFileChange = (e) => {
    const files = Array.from(e.target.files);
    setSelectedFiles(files);

    // Initialize tagging state for new files
    const newTaggedMembers = {};
    const newSearchInputs = {};
    files.forEach((_, index) => {
      newTaggedMembers[index] = [];
      newSearchInputs[index] = "";
    });
    setTaggedMembers(newTaggedMembers);
    setSearchInputs(newSearchInputs);
  };

  const addMemberTag = (fileIndex, member) => {
    setTaggedMembers((prev) => ({
      ...prev,
      [fileIndex]: [
        ...(prev[fileIndex] || []),
        {
          type: "member",
          id: member.id,
          name: `${member.first_name || ""} ${member.last_name || ""}`.trim(),
        },
      ],
    }));
    setSearchInputs((prev) => ({ ...prev, [fileIndex]: "" }));
  };

  const addCustomTag = (fileIndex, name) => {
    if (!name.trim()) return;
    setTaggedMembers((prev) => ({
      ...prev,
      [fileIndex]: [
        ...(prev[fileIndex] || []),
        {
          type: "custom",
          name: name.trim(),
        },
      ],
    }));
    setSearchInputs((prev) => ({ ...prev, [fileIndex]: "" }));
  };

  const removeTag = (fileIndex, tagIndex) => {
    setTaggedMembers((prev) => ({
      ...prev,
      [fileIndex]: prev[fileIndex].filter((_, index) => index !== tagIndex),
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsUploading(true);
    setMessage(null);

    try {
      const formData = new FormData();
      const yearToUse = isCreatingNewYear ? newYear : selectedYear;

      formData.append("year", yearToUse);
      selectedFiles.forEach((file) => {
        formData.append("photos", file);
      });
      formData.append("taggedMembers", JSON.stringify(taggedMembers));

      const result = await uploadPhotos(formData);
      setMessage(result);

      if (result.success) {
        setSelectedFiles([]);
        setTaggedMembers({});
        setSearchInputs({});
      }
    } catch (error) {
      setMessage({ success: false, message: "Upload failed" });
    } finally {
      setIsUploading(false);
    }
  };

  const getFilteredMembers = (fileIndex) => {
    const searchValue = searchInputs[fileIndex] || "";
    if (!searchValue) return [];

    return members.filter((member) => {
      const fullName = `${member.first_name || ""} ${
        member.last_name || ""
      }`.toLowerCase();
      return fullName.includes(searchValue.toLowerCase());
    });
  };

  return (
    <div>
      <h2 className="text-2xl font-bold text-gray-900 mb-4">Upload Photos</h2>

      {message?.message && (
        <div
          className={`mb-4 p-4 rounded-md ${
            message.success
              ? "bg-green-50 text-green-800"
              : "bg-red-50 text-red-800"
          }`}
        >
          {message.message}
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Year Selection */}
        <div className="bg-white rounded-lg shadow-md p-6">
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Select Year
          </label>

          <div className="space-y-4">
            <div>
              <input
                type="radio"
                id="existingYear"
                name="yearType"
                checked={!isCreatingNewYear}
                onChange={() => setIsCreatingNewYear(false)}
                className="mr-2"
              />
              <label htmlFor="existingYear" className="text-sm text-gray-700">
                Use existing year
              </label>

              {!isCreatingNewYear && (
                <select
                  value={selectedYear}
                  onChange={(e) => setSelectedYear(e.target.value)}
                  className="ml-4 px-3 py-2 border border-gray-300 rounded-md"
                >
                  <option value="">Select a year</option>
                  {years.map((year) => (
                    <option key={year} value={year}>
                      {year}
                    </option>
                  ))}
                </select>
              )}
            </div>

            <div>
              <input
                type="radio"
                id="newYear"
                name="yearType"
                checked={isCreatingNewYear}
                onChange={() => setIsCreatingNewYear(true)}
                className="mr-2"
              />
              <label htmlFor="newYear" className="text-sm text-gray-700">
                Create new year
              </label>

              {isCreatingNewYear && (
                <input
                  type="number"
                  value={newYear}
                  onChange={(e) => setNewYear(e.target.value)}
                  placeholder="Enter year (e.g., 2025)"
                  className="ml-4 px-3 py-2 border border-gray-300 rounded-md"
                  min="2000"
                  max="2100"
                />
              )}
            </div>
          </div>
        </div>

        {/* File Upload */}
        <div className="bg-white rounded-lg shadow-md p-6">
          <label className="block text-sm font-medium text-gray-700 mb-4">
            Select Photos
          </label>

          <input
            type="file"
            multiple
            accept="image/*"
            onChange={handleFileChange}
            className="block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100"
          />

          {selectedFiles.length > 0 && (
            <div className="mt-6 space-y-4">
              {selectedFiles.map((file, index) => (
                <div key={index} className="border rounded-lg p-4">
                  <div className="flex items-start space-x-4">
                    <img
                      src={URL.createObjectURL(file) || "/placeholder.svg"}
                      alt={file.name}
                      className="w-20 h-20 object-cover rounded"
                    />
                    <div className="flex-1">
                      <p className="font-medium">{file.name}</p>

                      {/* Tagging */}
                      <div className="mt-2">
                        <input
                          type="text"
                          value={searchInputs[index] || ""}
                          onChange={(e) =>
                            setSearchInputs((prev) => ({
                              ...prev,
                              [index]: e.target.value,
                            }))
                          }
                          onKeyPress={(e) => {
                            if (e.key === "Enter") {
                              e.preventDefault();
                              addCustomTag(index, searchInputs[index]);
                            }
                          }}
                          placeholder="Type a name and press Enter..."
                          className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm"
                        />

                        {/* Member suggestions */}
                        {searchInputs[index] &&
                          getFilteredMembers(index).length > 0 && (
                            <div className="mt-1 border border-gray-300 rounded-md bg-white shadow-lg max-h-32 overflow-y-auto">
                              {getFilteredMembers(index).map((member) => (
                                <div
                                  key={member.id}
                                  className="p-2 hover:bg-gray-50 cursor-pointer text-sm"
                                  onClick={() => addMemberTag(index, member)}
                                >
                                  {member.first_name} {member.last_name}
                                </div>
                              ))}
                            </div>
                          )}

                        {/* Tagged people */}
                        {taggedMembers[index]?.length > 0 && (
                          <div className="mt-2 flex flex-wrap gap-2">
                            {taggedMembers[index].map((tag, tagIndex) => (
                              <span
                                key={tagIndex}
                                className="inline-flex items-center px-2 py-1 rounded-full text-xs bg-blue-100 text-blue-800"
                              >
                                {tag.name}
                                <button
                                  type="button"
                                  onClick={() => removeTag(index, tagIndex)}
                                  className="ml-1 text-blue-600 hover:text-blue-800"
                                >
                                  ×
                                </button>
                              </span>
                            ))}
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        <button
          type="submit"
          disabled={
            isUploading ||
            selectedFiles.length === 0 ||
            (!selectedYear && !newYear)
          }
          className="w-full bg-blue-600 text-white py-2 px-4 rounded-md hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {isUploading
            ? "Uploading..."
            : `Upload ${selectedFiles.length} Photo${
                selectedFiles.length !== 1 ? "s" : ""
              }`}
        </button>
      </form>
    </div>
  );
}
