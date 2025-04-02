"use client";

import { useState, useEffect } from "react";
import {
  createWeeklyNote,
  deleteWeeklyNote,
  getNextPendingNote,
  updateWeeklyNote,
} from "@/app/_actions";
import { useActionState } from "react";
import { ActionButton } from "@/components/ActionButton";

export default function WeeklyNotesManagement() {
  const [noteContent, setNoteContent] = useState("");
  const [pendingNote, setPendingNote] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isEditing, setIsEditing] = useState(false);
  const [editContent, setEditContent] = useState("");

  const initialState = {
    success: false,
    message: "",
  };

  const [createState, createAction] = useActionState(
    createWeeklyNote,
    initialState
  );
  const [deleteState, deleteAction] = useActionState(
    deleteWeeklyNote,
    initialState
  );
  const [updateState, updateAction] = useActionState(
    updateWeeklyNote,
    initialState
  );

  useEffect(() => {
    async function loadData() {
      setIsLoading(true);
      try {
        // Get the next pending note
        const pendingNoteResult = await getNextPendingNote();
        if (pendingNoteResult.success && pendingNoteResult.note) {
          setPendingNote(pendingNoteResult.note);
        } else {
          setPendingNote(null);
        }
      } catch (error) {
        console.error("Error loading weekly notes:", error);
      } finally {
        setIsLoading(false);
      }
    }

    loadData();
  }, [createState.success, deleteState.success, updateState.success]);

  // Clear the form after successful submission
  useEffect(() => {
    if (createState.success) {
      setNoteContent("");
    }
    if (updateState.success) {
      setIsEditing(false);
    }
  }, [createState.success, updateState.success]);

  const handleDelete = (noteId) => {
    if (confirm("Are you sure you want to delete this note?")) {
      const formData = new FormData();
      formData.append("noteId", noteId);
      deleteAction(formData);
    }
  };

  const startEditing = () => {
    if (pendingNote) {
      setEditContent(pendingNote.content);
      setIsEditing(true);
    }
  };

  const cancelEditing = () => {
    setIsEditing(false);
  };

  // Helper function to get status badge
  const getStatusBadge = (status) => {
    switch (status) {
      case "pending":
        return (
          <span className="px-2 py-1 text-xs font-semibold rounded-full bg-yellow-100 text-yellow-800">
            Pending
          </span>
        );
      case "sent":
        return (
          <span className="px-2 py-1 text-xs font-semibold rounded-full bg-green-100 text-green-800">
            Sent
          </span>
        );
      default:
        return (
          <span className="px-2 py-1 text-xs font-semibold rounded-full bg-gray-100 text-gray-800">
            {status}
          </span>
        );
    }
  };

  return (
    <div>
      {isLoading ? (
        <div className="text-center py-4">
          <div className="inline-block animate-spin rounded-full h-6 w-6 border-b-2 border-blue-600"></div>
          <p className="mt-2">Loading notes...</p>
        </div>
      ) : (
        <>
          {/* Create New Note Section */}
          <div className="mb-6">
            <h3 className="text-lg font-semibold mb-3">
              Create New Weekly Note
            </h3>
            <form action={createAction} className="space-y-4">
              <div>
                <label
                  htmlFor="noteContent"
                  className="block text-sm font-medium text-gray-700 mb-1"
                >
                  Note Content
                </label>
                <textarea
                  id="noteContent"
                  name="content"
                  value={noteContent}
                  onChange={(e) => setNoteContent(e.target.value)}
                  className="w-full p-2 border border-gray-300 rounded-md"
                  rows="3"
                  placeholder="Enter the note that will appear at the top of the weekly email..."
                  required
                ></textarea>
              </div>

              <ActionButton type="submit" className="w-full">
                Create Weekly Note
              </ActionButton>

              {createState.message && (
                <div
                  className={`mt-2 p-2 text-sm rounded-md ${createState.success ? "bg-green-100 text-green-800" : "bg-red-100 text-red-800"}`}
                >
                  {createState.message}
                </div>
              )}
            </form>
          </div>

          {/* Next Note to Send Section */}
          {pendingNote && (
            <div className="mb-6 bg-blue-50 p-4 rounded-lg border-l-4 border-blue-500">
              <div className="flex justify-between items-start mb-2">
                <h3 className="text-lg font-semibold">Next Note to Send</h3>
                {getStatusBadge(pendingNote.status)}
              </div>

              {isEditing ? (
                // Edit mode
                <form action={updateAction} className="space-y-3">
                  <input type="hidden" name="noteId" value={pendingNote.id} />
                  <textarea
                    name="content"
                    value={editContent}
                    onChange={(e) => setEditContent(e.target.value)}
                    className="w-full p-2 border border-gray-300 rounded-md"
                    rows="4"
                    required
                  ></textarea>
                  <div className="flex space-x-2">
                    <ActionButton type="submit" className="px-4 py-2 text-sm">
                      Save Changes
                    </ActionButton>
                    <button
                      type="button"
                      onClick={cancelEditing}
                      className="px-4 py-2 text-sm bg-gray-200 hover:bg-gray-300 text-gray-800 rounded-md"
                    >
                      Cancel
                    </button>
                  </div>

                  {updateState.message && (
                    <div
                      className={`p-2 text-sm rounded-md ${updateState.success ? "bg-green-100 text-green-800" : "bg-red-100 text-red-800"}`}
                    >
                      {updateState.message}
                    </div>
                  )}
                </form>
              ) : (
                // View mode
                <>
                  <div className="bg-white p-3 rounded-md mb-3">
                    <p className="whitespace-pre-line">{pendingNote.content}</p>
                  </div>
                  <div className="flex space-x-2">
                    <button
                      onClick={startEditing}
                      className="px-3 py-1 text-sm bg-blue-600 hover:bg-blue-700 text-white rounded-md"
                    >
                      Edit
                    </button>
                    <button
                      onClick={() => handleDelete(pendingNote.id)}
                      className="px-3 py-1 text-sm bg-red-600 hover:bg-red-700 text-white rounded-md"
                    >
                      Delete
                    </button>
                  </div>
                </>
              )}

              {deleteState.message && (
                <div
                  className={`mt-2 p-2 text-sm rounded-md ${deleteState.success ? "bg-green-100 text-green-800" : "bg-red-100 text-red-800"}`}
                >
                  {deleteState.message}
                </div>
              )}
            </div>
          )}

          {!pendingNote && !isLoading && (
            <div className="bg-gray-100 p-4 rounded-md text-center">
              <p className="text-gray-600">
                No pending notes available. Create a new note above.
              </p>
            </div>
          )}
        </>
      )}
    </div>
  );
}
