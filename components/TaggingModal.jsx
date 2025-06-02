"use client";

import { useState, useEffect } from "react";
import {
  addTagToPhoto,
  removeTagFromPhoto,
  getMembersForTagging,
} from "@/app/_actions";

export default function TaggingModal({
  photo,
  isOpen,
  onClose,
  onTagsUpdated,
}) {
  const [searchInput, setSearchInput] = useState("");
  const [members, setMembers] = useState([]);
  const [isLoadingMembers, setIsLoadingMembers] = useState(false);
  const [isAddingTag, setIsAddingTag] = useState(false);
  const [message, setMessage] = useState(null);

  // Load members when modal opens - fixed with proper useEffect
  useEffect(() => {
    if (isOpen && members.length === 0) {
      loadMembers();
    }
  }, [isOpen, members.length]);

  const loadMembers = async () => {
    setIsLoadingMembers(true);
    try {
      const membersData = await getMembersForTagging();
      setMembers(membersData || []);
    } catch (error) {
      console.error("Error loading members:", error);
      setMembers([]);
    } finally {
      setIsLoadingMembers(false);
    }
  };

  const addMemberTag = async (member) => {
    setIsAddingTag(true);
    setMessage(null);

    try {
      const result = await addTagToPhoto(photo.id, {
        type: "member",
        id: member.id,
      });

      setMessage(result);
      if (result.success) {
        setSearchInput("");
        onTagsUpdated(); // Refresh the photo tags
      }
    } catch (error) {
      setMessage({ success: false, message: "Failed to add tag" });
    } finally {
      setIsAddingTag(false);
    }
  };

  const addCustomTag = async (name) => {
    if (!name.trim()) return;

    setIsAddingTag(true);
    setMessage(null);

    try {
      const result = await addTagToPhoto(photo.id, {
        type: "custom",
        name: name.trim(),
      });

      setMessage(result);
      if (result.success) {
        setSearchInput("");
        onTagsUpdated(); // Refresh the photo tags
      }
    } catch (error) {
      setMessage({ success: false, message: "Failed to add tag" });
    } finally {
      setIsAddingTag(false);
    }
  };

  const removeTag = async (tagId) => {
    setMessage(null);

    try {
      const result = await removeTagFromPhoto(photo.id, tagId);
      setMessage(result);
      if (result.success) {
        onTagsUpdated(); // Refresh the photo tags
      }
    } catch (error) {
      setMessage({ success: false, message: "Failed to remove tag" });
    }
  };

  const getFilteredMembers = () => {
    if (!searchInput) return [];

    return members.filter((member) => {
      const fullName = `${member.first_name || ""} ${
        member.last_name || ""
      }`.toLowerCase();
      return fullName.includes(searchInput.toLowerCase());
    });
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg max-w-md w-full max-h-[80vh] overflow-hidden">
        <div className="p-6">
          <div className="flex justify-between items-center mb-4">
            <h3 className="text-lg font-semibold text-gray-900">
              Tag People in Photo
            </h3>
            <button
              onClick={onClose}
              className="text-gray-400 hover:text-gray-600 text-2xl"
            >
              ×
            </button>
          </div>

          {/* Photo preview */}
          <div className="mb-4">
            <img
              src={photo.url || "/placeholder.svg"}
              alt={photo.filename || "Photo"}
              className="w-full h-32 object-cover rounded-lg"
            />
          </div>

          {/* Message */}
          {message?.message && (
            <div
              className={`mb-4 p-3 rounded-md text-sm ${
                message.success
                  ? "bg-green-50 text-green-800"
                  : "bg-red-50 text-red-800"
              }`}
            >
              {message.message}
            </div>
          )}

          {/* Add new tag */}
          <div className="mb-4">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Add Person
            </label>
            <div className="flex space-x-2">
              <input
                type="text"
                value={searchInput}
                onChange={(e) => setSearchInput(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter") {
                    e.preventDefault();
                    addCustomTag(searchInput);
                  }
                }}
                placeholder="Type a name and press Enter..."
                className="flex-1 px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                disabled={isAddingTag}
              />
              <button
                onClick={() => addCustomTag(searchInput)}
                disabled={!searchInput.trim() || isAddingTag}
                className="px-3 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors disabled:opacity-50"
              >
                Add
              </button>
            </div>

            {/* Member suggestions */}
            {searchInput && getFilteredMembers().length > 0 && (
              <div className="mt-1 border border-gray-300 rounded-md bg-white shadow-lg max-h-32 overflow-y-auto">
                {getFilteredMembers().map((member) => (
                  <div
                    key={member.id}
                    className="p-2 hover:bg-gray-50 cursor-pointer text-sm flex items-center space-x-2"
                    onClick={() => addMemberTag(member)}
                  >
                    {member.profile_pic_url && (
                      <img
                        src={member.profile_pic_url || "/placeholder.svg"}
                        alt={`${member.first_name || ""} ${
                          member.last_name || ""
                        }`}
                        className="w-6 h-6 rounded-full object-cover"
                      />
                    )}
                    <span>
                      {member.first_name} {member.last_name}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Current tags */}
          <div className="mb-4">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Currently Tagged
            </label>
            <div className="max-h-40 overflow-y-auto">
              {photo.tags && photo.tags.length > 0 ? (
                <div className="space-y-2">
                  {photo.tags.map((tag) => (
                    <div
                      key={tag.id}
                      className="flex items-center justify-between p-2 bg-gray-50 rounded-md"
                    >
                      <div className="flex items-center space-x-2">
                        {tag.member_id && tag.profile_pic_url && (
                          <img
                            src={tag.profile_pic_url || "/placeholder.svg"}
                            alt={`${tag.first_name || ""} ${
                              tag.last_name || ""
                            }`}
                            className="w-6 h-6 rounded-full object-cover"
                          />
                        )}
                        <span className="text-sm text-gray-700">
                          {tag.member_id && tag.first_name && tag.last_name
                            ? `${tag.first_name} ${tag.last_name}`
                            : tag.custom_name || "Unknown"}
                        </span>
                      </div>
                      <button
                        onClick={() => removeTag(tag.id)}
                        className="text-red-600 hover:text-red-800 text-sm"
                      >
                        Remove
                      </button>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-sm text-gray-500 italic">
                  No one tagged yet
                </p>
              )}
            </div>
          </div>

          {/* Debug info */}
          <div className="mb-4 text-xs text-gray-500">
            <p>Members loaded: {members.length}</p>
            <p>Filtered members: {getFilteredMembers().length}</p>
          </div>

          {/* Close button */}
          <div className="flex justify-end">
            <button
              onClick={onClose}
              className="px-4 py-2 bg-gray-600 text-white rounded-md hover:bg-gray-700 transition-colors"
            >
              Done
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
