"use client";

import { useState } from "react";
import { sendEmailBlast } from "@/app/_actions";

export default function EmailBlast({ previousBlasts = [] }) {
  const [isPending, setIsPending] = useState(false);
  const [message, setMessage] = useState(null);
  const [blasts, setBlasts] = useState(previousBlasts);
  const [selectedGroup, setSelectedGroup] = useState("all");
  const [emailContent, setEmailContent] = useState("");
  const [selectedTemplate, setSelectedTemplate] = useState("default");

  // Member group options - simplified to only include all members and volunteers
  const memberGroups = [
    { value: "all", label: "All Members" },
    { value: "volunteers", label: "Volunteers Only" },
  ];

  // Email template options
  const emailTemplates = [
    { value: "default", label: "Default Template" },
    { value: "event", label: "Event Announcement" },
    { value: "update", label: "Weekly Update" },
    { value: "minimal", label: "Minimal Design" },
  ];

  // Insert formatting at cursor position
  const insertFormatting = (format) => {
    const textarea = document.getElementById("emailContent");
    const start = textarea.selectionStart;
    const end = textarea.selectionEnd;
    const selectedText = emailContent.substring(start, end);
    let formattedText = "";

    switch (format) {
      case "bold":
        formattedText = `**${selectedText}**`;
        break;
      case "italic":
        formattedText = `*${selectedText}*`;
        break;
      case "heading":
        formattedText = `# ${selectedText}`;
        break;
      case "subheading":
        formattedText = `## ${selectedText}`;
        break;
      case "list":
        formattedText = selectedText
          ? selectedText
              .split("\n")
              .map((line) => `- ${line}`)
              .join("\n")
          : "- Item 1\n- Item 2\n- Item 3";
        break;
      case "link":
        formattedText = selectedText
          ? `[${selectedText}](https://example.com)`
          : "[Link text](https://example.com)";
        break;
      default:
        formattedText = selectedText;
    }

    const newContent =
      emailContent.substring(0, start) +
      formattedText +
      emailContent.substring(end);
    setEmailContent(newContent);

    // Set focus back to textarea and position cursor after the inserted text
    setTimeout(() => {
      textarea.focus();
      const newPosition = start + formattedText.length;
      textarea.setSelectionRange(newPosition, newPosition);
    }, 0);
  };

  async function handleSubmit(formData) {
    setIsPending(true);
    setMessage(null);

    try {
      // Add the email content and template to the form data
      formData.append("emailContent", emailContent);
      formData.append("template", selectedTemplate);

      const result = await sendEmailBlast(formData);
      setMessage(result);

      if (result.success) {
        // Reset the form
        document.getElementById("email-blast-form").reset();
        setSelectedGroup("all");
        setEmailContent("");
        setSelectedTemplate("default");

        // Refresh the list of blasts
        const newBlast = {
          id: Date.now(), // Temporary ID
          subject: formData.get("subject"),
          message:
            emailContent.substring(0, 100) +
            (emailContent.length > 100 ? "..." : ""),
          member_group: formData.get("memberGroup"),
          template: selectedTemplate,
          recipient_count: result.recipientCount || "Multiple",
          sent_at: new Date().toISOString(),
          sender_name: "You",
        };

        setBlasts([newBlast, ...blasts]);
      }
    } catch (error) {
      setMessage({
        success: false,
        message: "An unexpected error occurred. Please try again.",
      });
    } finally {
      setIsPending(false);
    }
  }

  return (
    <div>
      <h2 className="text-2xl font-bold mb-4">Email Blast</h2>

      <form
        id="email-blast-form"
        action={handleSubmit}
        className="space-y-4 mb-8"
      >
        <div>
          <label
            htmlFor="memberGroup"
            className="block text-sm font-medium text-gray-700 mb-1"
          >
            Send To
          </label>
          <select
            id="memberGroup"
            name="memberGroup"
            value={selectedGroup}
            onChange={(e) => setSelectedGroup(e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
          >
            {memberGroups.map((group) => (
              <option key={group.value} value={group.value}>
                {group.label}
              </option>
            ))}
          </select>
        </div>

        <div>
          <label
            htmlFor="template"
            className="block text-sm font-medium text-gray-700 mb-1"
          >
            Email Template
          </label>
          <select
            id="template"
            name="template"
            value={selectedTemplate}
            onChange={(e) => setSelectedTemplate(e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
          >
            {emailTemplates.map((template) => (
              <option key={template.value} value={template.value}>
                {template.label}
              </option>
            ))}
          </select>
        </div>

        <div>
          <label
            htmlFor="subject"
            className="block text-sm font-medium text-gray-700 mb-1"
          >
            Subject
          </label>
          <input
            type="text"
            id="subject"
            name="subject"
            required
            className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
            placeholder="Email subject"
          />
        </div>

        <div>
          <label
            htmlFor="emailContent"
            className="block text-sm font-medium text-gray-700 mb-1"
          >
            Email Content
          </label>
          <div className="mb-2 flex flex-wrap gap-2">
            <button
              type="button"
              onClick={() => insertFormatting("bold")}
              className="px-2 py-1 bg-gray-200 rounded text-sm"
              title="Bold"
            >
              Bold
            </button>
            <button
              type="button"
              onClick={() => insertFormatting("italic")}
              className="px-2 py-1 bg-gray-200 rounded text-sm"
              title="Italic"
            >
              Italic
            </button>
            <button
              type="button"
              onClick={() => insertFormatting("heading")}
              className="px-2 py-1 bg-gray-200 rounded text-sm"
              title="Heading"
            >
              Heading
            </button>
            <button
              type="button"
              onClick={() => insertFormatting("subheading")}
              className="px-2 py-1 bg-gray-200 rounded text-sm"
              title="Subheading"
            >
              Subheading
            </button>
            <button
              type="button"
              onClick={() => insertFormatting("list")}
              className="px-2 py-1 bg-gray-200 rounded text-sm"
              title="Bullet List"
            >
              List
            </button>
            <button
              type="button"
              onClick={() => insertFormatting("link")}
              className="px-2 py-1 bg-gray-200 rounded text-sm"
              title="Link"
            >
              Link
            </button>
          </div>
          <textarea
            id="emailContent"
            name="emailContent"
            value={emailContent}
            onChange={(e) => setEmailContent(e.target.value)}
            required
            rows={8}
            className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
            placeholder="Enter your message here. Use the formatting buttons above or markdown syntax (**bold**, *italic*, # heading, etc.)"
          ></textarea>
          <p className="text-xs text-gray-500 mt-1">
            Use **text** for bold, *text* for italic, # for headings, ## for
            subheadings, - for lists
          </p>
        </div>

        {message && (
          <div
            className={`p-3 rounded-md ${
              message.success
                ? "bg-green-100 text-green-800"
                : "bg-red-100 text-red-800"
            }`}
          >
            {message.message}
          </div>
        )}

        <button
          type="submit"
          disabled={isPending}
          className="w-full py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50"
        >
          {isPending
            ? "Sending..."
            : `Send Email to ${
                selectedGroup === "all"
                  ? "All Members"
                  : memberGroups.find((g) => g.value === selectedGroup)?.label
              }`}
        </button>
      </form>

      {/* <div>
        <h3 className="text-lg font-semibold mb-2">Recent Email Blasts</h3>
        {blasts.length === 0 ? (
          <p className="text-gray-500">No email blasts have been sent yet.</p>
        ) : (
          <div className="space-y-4 max-h-96 overflow-y-auto">
            {blasts.map((blast) => (
              <div key={blast.id} className="border rounded-md p-4">
                <div className="flex justify-between items-start">
                  <h4 className="font-medium">{blast.subject}</h4>
                  <span className="text-xs text-gray-500">
                    {new Date(blast.sent_at).toLocaleDateString()} at {new Date(blast.sent_at).toLocaleTimeString()}
                  </span>
                </div>
                <div className="flex justify-between items-center mt-1">
                  <p className="text-sm text-gray-600">Sent by: {blast.sender_name}</p>
                  <span className="text-xs bg-blue-100 text-blue-800 px-2 py-1 rounded-full">
                    Sent to:{" "}
                    {blast.member_group
                      ? memberGroups.find((g) => g.value === blast.member_group)?.label || blast.member_group
                      : "All Members"}
                    {blast.recipient_count && ` (${blast.recipient_count} recipients)`}
                  </span>
                </div>
                <div className="mt-2 text-sm text-gray-700 line-clamp-2">{blast.message}</div>
              </div>
            ))}
          </div>
        )}
      </div> */}
    </div>
  );
}
