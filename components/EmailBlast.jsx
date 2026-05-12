"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { sendEmailBlast } from "@/app/_actions";

const memberGroups = [
  { value: "all", label: "All Members" },
  { value: "volunteers", label: "Volunteers Only" },
];

const imagePlacementOptions = [
  { value: "top", label: "Top of email" },
  { value: "afterMessage", label: "After message" },
  { value: "afterPlayDays", label: "After play day details" },
];

function formatPlayDayLabel(playDay) {
  if (!playDay?.date) {
    return playDay?.title || "Play day";
  }

  const date = new Date(`${playDay.date}T12:00:00`);
  const formattedDate = Number.isNaN(date.getTime())
    ? playDay.date
    : date.toLocaleDateString("en-CA", {
        weekday: "short",
        month: "short",
        day: "numeric",
        year: "numeric",
      });

  return `${formattedDate} - ${playDay.title || "Play Day"}`;
}

export default function EmailBlast({ previousBlasts = [], playDays = [] }) {
  const [isPending, setIsPending] = useState(false);
  const [message, setMessage] = useState(null);
  const [, setBlasts] = useState(previousBlasts);
  const [selectedGroup, setSelectedGroup] = useState("all");
  const [emailContent, setEmailContent] = useState("");
  const [selectedPlayDays, setSelectedPlayDays] = useState([]);
  const [imageBlocks, setImageBlocks] = useState([]);
  const [isDragActive, setIsDragActive] = useState(false);
  const fileInputRef = useRef(null);

  const playDayYears = useMemo(() => {
    const years = Array.from(
      new Set(
        playDays
          .map((playDay) => String(playDay?.date || "").slice(0, 4))
          .filter((year) => /^\d{4}$/.test(year)),
      ),
    ).sort((a, b) => Number(b) - Number(a));

    return years;
  }, [playDays]);

  const [selectedPlayDayYear, setSelectedPlayDayYear] = useState(() => {
    const currentYear = String(new Date().getFullYear());
    return playDayYears.includes(currentYear)
      ? currentYear
      : playDayYears[0] || currentYear;
  });

  useEffect(() => {
    const currentYear = String(new Date().getFullYear());
    const nextYear = playDayYears.includes(selectedPlayDayYear)
      ? selectedPlayDayYear
      : playDayYears.includes(currentYear)
        ? currentYear
        : playDayYears[0] || currentYear;

    if (nextYear !== selectedPlayDayYear) {
      setSelectedPlayDayYear(nextYear);
    }
  }, [playDayYears, selectedPlayDayYear]);

  const filteredPlayDays = useMemo(
    () =>
      playDays
        .filter((playDay) =>
          selectedPlayDayYear
            ? String(playDay?.date || "").startsWith(selectedPlayDayYear)
            : true,
        )
        .sort((a, b) =>
          String(b?.date || "").localeCompare(String(a?.date || "")),
        ),
    [playDays, selectedPlayDayYear],
  );

  useEffect(() => {
    const validIds = new Set(filteredPlayDays.map((playDay) => playDay.id));
    setSelectedPlayDays((current) =>
      current.filter((playDayId) => validIds.has(playDayId)),
    );
  }, [filteredPlayDays]);

  const insertFormatting = (format) => {
    const textarea = document.getElementById("emailContent");
    const start = textarea.selectionStart;
    const end = textarea.selectionEnd;
    const selectedText = emailContent.substring(start, end);
    let formattedText = "";

    switch (format) {
      case "bold":
        formattedText = `**${selectedText || "Bold text"}**`;
        break;
      case "italic":
        formattedText = `*${selectedText || "Italic text"}*`;
        break;
      case "heading":
        formattedText = `# ${selectedText || "Heading"}`;
        break;
      case "subheading":
        formattedText = `## ${selectedText || "Subheading"}`;
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

    setTimeout(() => {
      textarea.focus();
      const newPosition = start + formattedText.length;
      textarea.setSelectionRange(newPosition, newPosition);
    }, 0);
  };

  const addFiles = (incomingFiles) => {
    const imageFiles = Array.from(incomingFiles || []).filter((file) =>
      file.type.startsWith("image/"),
    );

    if (imageFiles.length === 0) {
      return;
    }

    const nextBlocks = imageFiles.map((file, index) => ({
      id: `${Date.now()}-${index}-${file.name}`,
      file,
      placement: "afterMessage",
      altText: file.name.replace(/\.[^/.]+$/, "").replace(/[-_]/g, " "),
      previewUrl: URL.createObjectURL(file),
    }));

    setImageBlocks((current) => [...current, ...nextBlocks]);
  };

  const handleFileChange = (event) => {
    addFiles(event.target.files);
    event.target.value = "";
  };

  const handleDrop = (event) => {
    event.preventDefault();
    setIsDragActive(false);
    addFiles(event.dataTransfer.files);
  };

  const updateImageBlock = (id, updates) => {
    setImageBlocks((current) =>
      current.map((image) =>
        image.id === id ? { ...image, ...updates } : image,
      ),
    );
  };

  const removeImageBlock = (id) => {
    setImageBlocks((current) => {
      const target = current.find((image) => image.id === id);
      if (target?.previewUrl) {
        URL.revokeObjectURL(target.previewUrl);
      }
      return current.filter((image) => image.id !== id);
    });
  };

  const togglePlayDay = (playDayId) => {
    setSelectedPlayDays((current) =>
      current.includes(playDayId)
        ? current.filter((id) => id !== playDayId)
        : [...current, playDayId],
    );
  };

  async function handleSubmit(formData) {
    setIsPending(true);
    setMessage(null);

    try {
      formData.append("emailContent", emailContent);
      formData.append("selectedPlayDayIds", JSON.stringify(selectedPlayDays));
      formData.append(
        "imageBlockMeta",
        JSON.stringify(
          imageBlocks.map((image) => ({
            placement: image.placement,
            altText: image.altText,
          })),
        ),
      );

      for (const image of imageBlocks) {
        formData.append("imageFiles", image.file);
      }

      const result = await sendEmailBlast(formData);
      setMessage(result);

      if (result.success) {
        document.getElementById("email-blast-form").reset();
        setSelectedGroup("all");
        setEmailContent("");
        setSelectedPlayDays([]);
        for (const image of imageBlocks) {
          if (image.previewUrl) {
            URL.revokeObjectURL(image.previewUrl);
          }
        }
        setImageBlocks([]);

        const newBlast = {
          id: Date.now(),
          subject: formData.get("subject"),
          message:
            emailContent.substring(0, 100) +
            (emailContent.length > 100 ? "..." : ""),
          member_group: formData.get("memberGroup"),
          template: "standard",
          recipient_count: result.recipientCount || "Multiple",
          sent_at: new Date().toISOString(),
          sender_name: "You",
        };

        setBlasts((current) => [newBlast, ...current]);
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
      <h2 className="text-2xl font-bold mb-2">Email Blast</h2>
      <p className="text-sm text-gray-600 mb-6">
        Uses one shared Sandsharks email design with the site logo, play day RSVP
        sections, and unsubscribe links included automatically.
      </p>

      <form
        id="email-blast-form"
        action={handleSubmit}
        className="space-y-6 mb-8"
      >
        <div className="grid gap-4 md:grid-cols-2">
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
              className="w-full rounded-md border border-gray-300 px-3 py-2 shadow-sm focus:border-blue-500 focus:outline-none focus:ring-blue-500"
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
              className="w-full rounded-md border border-gray-300 px-3 py-2 shadow-sm focus:border-blue-500 focus:outline-none focus:ring-blue-500"
              placeholder="Email subject"
            />
          </div>
        </div>

        <div className="rounded-xl border border-gray-200 bg-slate-50 p-4">
          <div className="flex flex-wrap items-center justify-between gap-3 mb-3">
            <div>
              <h3 className="text-sm font-semibold text-gray-900">
                Message Body
              </h3>
              <p className="text-xs text-gray-500">
                The shared blast template is applied automatically.
              </p>
            </div>
            <div className="flex flex-wrap gap-2">
              <button
                type="button"
                onClick={() => insertFormatting("bold")}
                className="rounded bg-white px-2 py-1 text-sm text-gray-700 shadow-sm ring-1 ring-gray-200"
              >
                Bold
              </button>
              <button
                type="button"
                onClick={() => insertFormatting("italic")}
                className="rounded bg-white px-2 py-1 text-sm text-gray-700 shadow-sm ring-1 ring-gray-200"
              >
                Italic
              </button>
              <button
                type="button"
                onClick={() => insertFormatting("heading")}
                className="rounded bg-white px-2 py-1 text-sm text-gray-700 shadow-sm ring-1 ring-gray-200"
              >
                Heading
              </button>
              <button
                type="button"
                onClick={() => insertFormatting("subheading")}
                className="rounded bg-white px-2 py-1 text-sm text-gray-700 shadow-sm ring-1 ring-gray-200"
              >
                Subheading
              </button>
              <button
                type="button"
                onClick={() => insertFormatting("list")}
                className="rounded bg-white px-2 py-1 text-sm text-gray-700 shadow-sm ring-1 ring-gray-200"
              >
                List
              </button>
              <button
                type="button"
                onClick={() => insertFormatting("link")}
                className="rounded bg-white px-2 py-1 text-sm text-gray-700 shadow-sm ring-1 ring-gray-200"
              >
                Link
              </button>
            </div>
          </div>

          <textarea
            id="emailContent"
            name="emailContent"
            value={emailContent}
            onChange={(e) => setEmailContent(e.target.value)}
            required
            rows={10}
            className="w-full rounded-md border border-gray-300 px-3 py-2 shadow-sm focus:border-blue-500 focus:outline-none focus:ring-blue-500"
            placeholder="Write your email body here. Markdown works for headings, bold, lists, and links."
          />
          <p className="mt-2 text-xs text-gray-500">
            Markdown supported: `**bold**`, `*italic*`, `# heading`, `## subheading`,
            `- list item`, `[link](https://...)`.
          </p>
        </div>

        <div className="rounded-xl border border-gray-200 bg-white p-4">
          <div className="mb-3">
            <h3 className="text-sm font-semibold text-gray-900">
              Photos
            </h3>
            <p className="text-xs text-gray-500">
              Drag photos into the drop zone or browse from your desktop. Each
              uploaded image can be positioned within the email.
            </p>
          </div>

          <div
            onDragOver={(event) => {
              event.preventDefault();
              setIsDragActive(true);
            }}
            onDragLeave={(event) => {
              event.preventDefault();
              setIsDragActive(false);
            }}
            onDrop={handleDrop}
            className={`rounded-xl border-2 border-dashed px-4 py-8 text-center transition ${
              isDragActive
                ? "border-blue-500 bg-blue-50"
                : "border-gray-300 bg-slate-50"
            }`}
          >
            <p className="text-sm font-medium text-gray-700">
              Drop images here
            </p>
            <p className="mt-1 text-xs text-gray-500">
              PNG, JPG, WEBP, or GIF. They&apos;ll be uploaded and included in the blast.
            </p>
            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              className="mt-4 rounded-md bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700"
            >
              Choose Photos
            </button>
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              multiple
              className="hidden"
              onChange={handleFileChange}
            />
          </div>

          {imageBlocks.length > 0 && (
            <div className="mt-4 space-y-4">
              {imageBlocks.map((image) => (
                <div
                  key={image.id}
                  className="grid gap-4 rounded-xl border border-gray-200 p-4 md:grid-cols-[120px_1fr]"
                >
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={image.previewUrl}
                    alt={image.altText || "Email upload preview"}
                    className="h-24 w-full rounded-lg object-cover"
                  />
                  <div className="space-y-3">
                    <div className="grid gap-3 md:grid-cols-2">
                      <div>
                        <label className="mb-1 block text-xs font-medium uppercase tracking-wide text-gray-500">
                          Alt text
                        </label>
                        <input
                          type="text"
                          value={image.altText}
                          onChange={(event) =>
                            updateImageBlock(image.id, {
                              altText: event.target.value,
                            })
                          }
                          className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm shadow-sm focus:border-blue-500 focus:outline-none focus:ring-blue-500"
                        />
                      </div>
                      <div>
                        <label className="mb-1 block text-xs font-medium uppercase tracking-wide text-gray-500">
                          Placement
                        </label>
                        <select
                          value={image.placement}
                          onChange={(event) =>
                            updateImageBlock(image.id, {
                              placement: event.target.value,
                            })
                          }
                          className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm shadow-sm focus:border-blue-500 focus:outline-none focus:ring-blue-500"
                        >
                          {imagePlacementOptions.map((option) => (
                            <option key={option.value} value={option.value}>
                              {option.label}
                            </option>
                          ))}
                        </select>
                      </div>
                    </div>
                    <button
                      type="button"
                      onClick={() => removeImageBlock(image.id)}
                      className="text-sm font-medium text-red-600 hover:text-red-700"
                    >
                      Remove image
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="rounded-xl border border-gray-200 bg-white p-4">
          <div className="mb-3">
            <h3 className="text-sm font-semibold text-gray-900">
              Play Day Details
            </h3>
            <p className="text-xs text-gray-500">
              Select one or more play days to append event details and RSVP buttons
              to this email.
            </p>
          </div>

          <div className="mb-4 max-w-xs">
            <label
              htmlFor="playDayYear"
              className="mb-1 block text-xs font-medium uppercase tracking-wide text-gray-500"
            >
              Year
            </label>
            <select
              id="playDayYear"
              value={selectedPlayDayYear}
              onChange={(event) => setSelectedPlayDayYear(event.target.value)}
              className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm shadow-sm focus:border-blue-500 focus:outline-none focus:ring-blue-500"
            >
              {playDayYears.map((year) => (
                <option key={year} value={year}>
                  {year}
                </option>
              ))}
            </select>
          </div>

          {filteredPlayDays.length === 0 ? (
            <p className="text-sm text-gray-500">No play days available.</p>
          ) : (
            <div className="grid gap-3 md:grid-cols-2">
              {filteredPlayDays.map((playDay) => (
                <label
                  key={playDay.id}
                  className={`flex cursor-pointer items-start gap-3 rounded-xl border p-3 transition ${
                    selectedPlayDays.includes(playDay.id)
                      ? "border-blue-500 bg-blue-50"
                      : "border-gray-200 bg-slate-50"
                  }`}
                >
                  <input
                    type="checkbox"
                    checked={selectedPlayDays.includes(playDay.id)}
                    onChange={() => togglePlayDay(playDay.id)}
                    className="mt-1 h-4 w-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                  />
                  <div>
                    <div className="text-sm font-medium text-gray-900">
                      {formatPlayDayLabel(playDay)}
                    </div>
                    <div className="mt-1 text-xs text-gray-500">
                      Courts: {playDay.courts || "TBD"}
                    </div>
                    {playDay.description ? (
                      <div className="mt-1 text-xs text-gray-500 line-clamp-2">
                        {playDay.description}
                      </div>
                    ) : null}
                  </div>
                </label>
              ))}
            </div>
          )}
        </div>

        {message && (
          <div
            className={`rounded-md p-3 ${
              message.success
                ? "bg-green-100 text-green-800"
                : "bg-red-100 text-red-800"
            }`}
          >
            {message.message}
          </div>
        )}

        <div className="grid gap-3 md:grid-cols-2">
          <button
            type="submit"
            name="sendMode"
            value="test"
            disabled={isPending}
            className="rounded-md border border-blue-200 bg-white px-4 py-3 text-sm font-medium text-blue-700 shadow-sm hover:bg-blue-50 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:opacity-50"
          >
            {isPending ? "Sending..." : "Send Test Email"}
          </button>

          <button
            type="submit"
            name="sendMode"
            value="blast"
            disabled={isPending}
            className="rounded-md border border-transparent bg-blue-600 px-4 py-3 text-sm font-medium text-white shadow-sm hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:opacity-50"
          >
            {isPending
              ? "Sending..."
              : `Send Email to ${
                  selectedGroup === "all"
                    ? "All Members"
                    : memberGroups.find((group) => group.value === selectedGroup)
                        ?.label
                }`}
          </button>
        </div>
      </form>
    </div>
  );
}
