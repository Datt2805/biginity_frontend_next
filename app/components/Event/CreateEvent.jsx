"use client";
import { useEffect, useMemo, useRef, useState } from "react";
import { createEvent } from "../../../lib/api";
import { fetchSpeakersOnly } from "../../../lib/api";
import { toast, ToastContainer } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import ImageUploader from "../Common/ImageUploader";

// tiny searchable dropdown (Option C)
function SearchableDropdown({ items, display, value, onChange, placeholder = "Search..." }) {
  const [query, setQuery] = useState("");
  const [open, setOpen] = useState(false);
  const inputRef = useRef(null);

  const filtered = useMemo(() => {
    const q = query.toLowerCase().trim();
    if (!q) return items;
    return items.filter((it) => {
      const name =
        display(it) ||
        it?.name ||
        `${it?.first_name || ""} ${it?.last_name || ""}`.trim();
      return (name || "").toLowerCase().includes(q);
    });
  }, [items, query, display]);

  const selectedLabel = useMemo(() => {
    const sel = items.find((it) => value && it?._id === value);
    return sel
      ? display(sel) ||
          sel?.name ||
          `${sel?.first_name || ""} ${sel?.last_name || ""}`.trim()
      : "";
  }, [items, value, display]);

  const commitSelection = (id) => {
    onChange?.(id);
    setOpen(false);
    setQuery("");
  };

  return (
    <div className="relative">
      <input
        ref={inputRef}
        type="text"
        placeholder={placeholder}
        value={open ? query : selectedLabel}
        onChange={(e) => setQuery(e.target.value)}
        onFocus={() => setOpen(true)}
        className="w-full border border-gray-300 rounded px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-400"
      />
      {open && (
        <div
          className="absolute z-20 mt-1 w-full bg-white border border-gray-200 rounded shadow max-h-60 overflow-auto"
          onMouseDown={(e) => e.preventDefault()} // keep input focus
        >
          {filtered.length === 0 && (
            <div className="px-3 py-2 text-sm text-gray-500">No results</div>
          )}
          {filtered.map((it) => {
            const label =
              display(it) ||
              it?.name ||
              `${it?.first_name || ""} ${it?.last_name || ""}`.trim();
            return (
              <button
                key={it._id}
                type="button"
                className="w-full text-left px-3 py-2 hover:bg-gray-50"
                onClick={() => commitSelection(it._id)}
              >
                {label}
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}

export default function CreateEvent() {
  const [loading, setLoading] = useState(false);
  const [uploadedImageUrl, setUploadedImageUrl] = useState("");
  const [speakers, setSpeakers] = useState([]);
  const [selectedSpeakerId, setSelectedSpeakerId] = useState("");

  // Load speakers on mount
  useEffect(() => {
    (async () => {
      const res = await fetchSpeakersOnly();
      setSpeakers(res || []);
    })();
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!selectedSpeakerId) {
      toast.error("Please select a speaker");
      return;
    }

    setLoading(true);
    try {
      // Note: your createEvent() reads many fields from the form.
      // We add two hidden inputs below:
      //  - speaker_ids: selectedSpeakerId
      //  - banner_url: uploadedImageUrl (backend may ignore if unsupported)
      await createEvent(
        e,
        () => toast.success("Event created successfully!"),
        (error) => toast.error(error?.message || "Failed to create event")
      );
      // reset after success (optional)
      e.target.reset();
      setUploadedImageUrl("");
      setSelectedSpeakerId("");
    } finally {
      setLoading(false);
    }
  };

  const nameOf = (s) =>
    s?.name || `${s?.first_name || ""} ${s?.last_name || ""}`.trim();

  return (
    <div className="max-w-4xl mx-auto p-6 bg-white shadow-md rounded-lg mt-6">
      <h2 className="text-2xl font-bold mb-6 text-gray-800">Create Event</h2>

      {/* Image upload (optional but recommended) */}
      <div className="mb-6">
        <ImageUploader onUploadSuccess={setUploadedImageUrl} />
        {uploadedImageUrl && (
          <p className="text-sm text-green-700 mt-2 break-all">
            Uploaded: {uploadedImageUrl}
          </p>
        )}
      </div>

      <form id="createEvent" onSubmit={handleSubmit} className="space-y-6">
        {/* Hidden: pass selected speaker & banner to your existing createEvent() */}
        <input type="hidden" name="speaker_ids" value={selectedSpeakerId || ""} />
        <input type="hidden" name="banner_url" value={uploadedImageUrl || ""} />

        {/* Mandatory Toggle */}
        <div className="flex items-center space-x-2">
          <input
            type="checkbox"
            className="h-4 w-4 text-blue-600 border-gray-300 rounded"
            name="mandatory"
            defaultChecked
          />
          <label className="text-gray-700">Mandatory</label>
        </div>

        {/* Title */}
        <div>
          <label htmlFor="title" className="block text-gray-700 font-medium mb-1">
            Title <span className="text-red-500">*</span>
          </label>
          <input
            id="title"
            name="title"
            required
            className="w-full border border-gray-300 rounded px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-400"
          />
        </div>

        {/* Description */}
        <fieldset className="border border-gray-200 p-4 rounded">
          <legend className="font-semibold text-gray-700">Description</legend>

          <div className="mt-4">
            <label htmlFor="detail" className="block text-gray-700 mb-1">
              Detail
            </label>
            <textarea
              id="detail"
              name="detail"
              className="w-full border border-gray-300 rounded px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-400"
              placeholder="Optional extra details about the event"
            />
          </div>

          <div className="mt-4">
            <label htmlFor="objectives" className="block text-gray-700 mb-1">
              Objectives <span className="text-red-500">*</span>
            </label>
            <textarea
              id="objectives"
              name="objectives"
              required
              className="w-full border border-gray-300 rounded px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-400"
              placeholder="One per line"
            ></textarea>
          </div>

          <div className="mt-4">
            <label htmlFor="learning_outcomes" className="block text-gray-700 mb-1">
              Learning Outcomes <span className="text-red-500">*</span>
            </label>
            <textarea
              id="learning_outcomes"
              name="learning_outcomes"
              required
              className="w-full border border-gray-300 rounded px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-400"
              placeholder="One per line"
            ></textarea>
          </div>
        </fieldset>

        {/* Event Timing */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label htmlFor="start_time" className="block text-gray-700 mb-1">
              Start Time *
            </label>
            <input
              type="datetime-local"
              id="start_time"
              name="start_time"
              required
              className="w-full border border-gray-300 rounded px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-400"
            />
          </div>

          <div>
            <label htmlFor="end_time" className="block text-gray-700 mb-1">
              End Time *
            </label>
            <input
              type="datetime-local"
              id="end_time"
              name="end_time"
              required
              className="w-full border border-gray-300 rounded px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-400"
            />
          </div>
        </div>

        {/* Location */}
        <fieldset className="border border-gray-200 p-4 rounded">
          <legend className="font-semibold text-gray-700">Location</legend>

          <div className="mt-2">
            <label htmlFor="address" className="block text-gray-700 mb-1">
              Address *
            </label>
            <input
              id="address"
              name="address"
              required
              className="w-full border border-gray-300 rounded px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-400"
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
            <div>
              <label htmlFor="lat" className="block text-gray-700 mb-1">
                Latitude
              </label>
              <input
                type="number"
                id="lat"
                name="lat"
                step="any"
                className="w-full border border-gray-300 rounded px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-400"
              />
            </div>

            <div>
              <label htmlFor="long" className="block text-gray-700 mb-1">
                Longitude
              </label>
              <input
                type="number"
                id="long"
                name="long"
                step="any"
                className="w-full border border-gray-300 rounded px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-400"
              />
            </div>
          </div>
        </fieldset>

        {/* Speaker (Searchable Dropdown) */}
        <div>
          <label className="block text-gray-700 mb-1">Speaker</label>
          <SearchableDropdown
            items={speakers}
            value={selectedSpeakerId}
            onChange={setSelectedSpeakerId}
            placeholder="Search speaker by name"
            display={(s) => s?.name || `${s?.first_name || ""} ${s?.last_name || ""}`.trim()}
          />
          {selectedSpeakerId && (
            <p className="text-sm text-gray-600 mt-2">
              Selected: {nameOf(speakers.find((s) => s._id === selectedSpeakerId))}
            </p>
          )}
        </div>

        {/* Submit */}
        <button
          type="submit"
          disabled={loading}
          className="w-full bg-green-700 text-white font-semibold py-2 px-4 rounded transition duration-200 disabled:opacity-50"
        >
          {loading ? "Submitting..." : "Create Event"}
        </button>
      </form>

      <ToastContainer />
    </div>
  );
}
