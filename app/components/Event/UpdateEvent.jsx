"use client";
import { redirect } from 'next/navigation';
import { useEffect, useMemo, useRef, useState } from "react";
import { toast, ToastContainer } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
// import { createEvent, fetchSpeakersOnly, updateEvent } from "../../../lib/api"; // Keep your imports
import { getUsers, updateEvent } from "@/lib/api";
import ImageUploader from "../Common/ImageUploader";

// Mock API functions for demonstration - replace with your actual imports
const fetchSpeakersOnly = async () => (await getUsers({ role: "Speaker", all: true }))?.data || []

// --- 1. PREDEFINED LOCATIONS DATA ---
const PREDEFINED_LOCATIONS = [
  {
    name: "Nagar Auditorium",
    lat: "22.381599362662463",
    long: "73.14314073548469",
  },
  {
    name: "SOT Auditorium",
    lat: "22.385636040754616",
    long: "73.14493074913331",
  },
  {
    name: "Anviksha Building",
    lat: "22.3862105355751",
    long: "73.14561660211221",
  }, {
    name: "SOS Building",
    lat: "22.382901016778522",
    long: "73.14696416837283"
  },
  {
    name: "Aangava",
    lat: "22.385277259337578",
    long: "73.14446294649058"
  }, {
    name: "Basket Ball Court ( Aangava )",
    lat: "22.385232418863385",
    long: "73.14407034812744"
  }
];

// Reusable Modal Wrapper Component
function ModalWrapper({ isOpen, onClose, children, title = "Modal" }) {
  if (!isOpen) return null;

  return (
    // Overlay (Click to close outside the modal content)
    <div
      className="fixed inset-0 bg-gray-600 bg-opacity-50 z-50 flex justify-center items-center p-4"
      onClick={onClose}
    >
      {/* Modal Content (Prevent closing when clicking inside) */}
      <div
        className="relative bg-white rounded-lg shadow-xl w-full max-w-4xl max-h-[90vh] overflow-y-auto"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Modal Header */}
        <div className="sticky top-0 bg-white border-b p-4 flex justify-between items-center z-10">
          <h2 className="text-xl font-bold text-gray-800">{title}</h2>
          <button
            onClick={onClose}
            className="text-gray-500 hover:text-gray-800 text-2xl"
            aria-label="Close modal"
          >
            &times;
          </button>
        </div>

        {/* Modal Body (Padded content) */}
        <div className="p-6">
          {children}
        </div>
      </div>
    </div>
  );
}

// tiny searchable dropdown (Option C) - UNMODIFIED
function SearchableDropdown({
  items,
  display,
  value,
  onChange,
  placeholder = "Search...",
}) {
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

// CONVERTED COMPONENT: UpdateEventModal
// It now accepts props to manage its modal state.
export default function UpdateEventModal({ existingEvent, isOpen, onClose }) {
  // Use a default event structure to prevent errors if existingEvent is undefined
  const defaultEvent = useMemo(() => ({
    title: "",
    image: "",
    speakers: [],
    address: "",
    lat: "",
    long: "",
    start_time: new Date().toISOString().substring(0, 16),
    end_time: new Date().toISOString().substring(0, 16),
    description: { detail: "", objectives: [], learning_outcomes: [] },
    ...existingEvent
  }), [existingEvent]);

  const [loading, setLoading] = useState(false);
  const [uploadedImageUrl, setUploadedImageUrl] = useState(defaultEvent.image || "");
  const [speakers, setSpeakers] = useState(defaultEvent.speakers || []);
  const [selectedSpeakerId, setSelectedSpeakerId] = useState(defaultEvent?.speakers?.[0] || "");

  // --- 2. NEW STATE FOR LOCATION AUTO-FILL ---
  const [address, setAddress] = useState(defaultEvent.address || "");
  const [latitude, setLatitude] = useState(defaultEvent.lat || "");
  const [longitude, setLongitude] = useState(defaultEvent.long || "");

  // Load speakers on mount and when modal opens
  useEffect(() => {
    if (isOpen) {
      (async () => {
        try {
          const res = await fetchSpeakersOnly();
          setSpeakers(res || []);
          handleLocationChange({ target: { value: defaultEvent.address || "" } }); // Initialize location fields
        } catch (error) {
          console.error("Failed to fetch speakers:", error);
          toast.error("Failed to load speakers.");
        }
      })();
    }
  }, [isOpen]);

  // --- 3. HANDLE LOCATION CHANGE ---
  const handleLocationChange = (e) => {
    const selectedName = e.target.value;
    setAddress(selectedName);

    // Find the matching location object
    const locData = PREDEFINED_LOCATIONS.find(
      (loc) => loc.name === selectedName
    );

    if (locData) {
      setLatitude(locData.lat);
      setLongitude(locData.long);
    } else {
      // If they select "Other" or placeholder, clear coordinates or keep them manual
      setLatitude("");
      setLongitude("");
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!selectedSpeakerId) {
      toast.error("Please select a speaker");
      return;
    }

    setLoading(true);
    try {
      await updateEvent(
        e,
        () => {
          toast.success("Event updated successfully!");
          // Close modal on success
          onClose();
          setTimeout(() => window.location.reload(), 200); // Refresh to show updated event
        },
        (error) => toast.error(error?.message || "Failed to update event")
      );
      // NOTE: Form fields are not reset here. If you need to reset the form,
      // you must control all input fields and reset their state here.
      // For simplicity, I've left the state tied to the defaultEvent/existingEvent logic.
    } finally {
      setLoading(false);
    }
  };

  const nameOf = (s) =>
    s?.name || `${s?.first_name || ""} ${s?.last_name || ""}`.trim();

  // The ModalWrapper now controls the visibility and provides the backdrop/close button
  return (
    <ModalWrapper isOpen={isOpen} onClose={onClose} title="Update Event">
      {/* Removed the max-w-4xl mx-auto p-6 bg-white shadow-md rounded-lg mt-6 div and its content */}
      <div className="p-0"> {/* Use p-0 because ModalWrapper adds padding to its body */}
        {/* Image upload */}
        <div className="mb-6">
          <ImageUploader onUploadSuccess={setUploadedImageUrl} />
          {uploadedImageUrl && (
            <p className="text-sm text-green-700 mt-2 break-all">
              Uploaded: {uploadedImageUrl}
            </p>
          )}
        </div>

        <form id="updateEventForm" onSubmit={handleSubmit} className="space-y-6">
          {/* Hidden inputs */}
          <input
            type="hidden"
            name="speaker_ids"
            value={selectedSpeakerId || ""}
          />
          <input
            type="hidden"
            name="event_id"
            value={existingEvent._id}
          />
          <input type="hidden" name="image" value={uploadedImageUrl || ""} />
          <input type="hidden" name="event_id" value={defaultEvent._id} /> {/* Assuming _id exists */}

          {/* Mandatory Toggle */}
          <div className="flex items-center space-x-2">
            <input
              type="checkbox"
              className="h-4 w-4 text-blue-600 border-gray-300 rounded"
              name="mandatory"
              defaultChecked={defaultEvent.mandatory} // Use defaultEvent prop
            />
            <label className="text-gray-700">Mandatory</label>
          </div>

          {/* Title */}
          <div>
            <label
              htmlFor="title"
              className="block text-gray-700 font-medium mb-1"
            >
              Title <span className="text-red-500">*</span>
            </label>
            <input
              id="title"
              name="title"
              defaultValue={defaultEvent.title} // Use defaultValue for uncontrolled component
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
                defaultValue={defaultEvent.description.detail}
                className="w-full border border-gray-300 rounded px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-400"
              />
            </div>

            <div className="mt-4">
              <label htmlFor="objectives" className="block text-gray-700 mb-1">
                Objectives <span className="text-red-500">*</span>
              </label>
              <textarea
                id="objectives"
                name="objectives"
                defaultValue={defaultEvent.description.objectives.join("\n")} // Join with newline
                required
                className="w-full border border-gray-300 rounded px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-400"
                placeholder="One per line"
              ></textarea>
            </div>

            <div className="mt-4">
              <label
                htmlFor="learning_outcomes"
                className="block text-gray-700 mb-1"
              >
                Learning Outcomes <span className="text-red-500">*</span>
              </label>
              <textarea
                id="learning_outcomes"
                name="learning_outcomes"
                defaultValue={defaultEvent.description.learning_outcomes.join("\n")} // Join with newline
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
                // Format the ISO string to be compatible with datetime-local input
                defaultValue={defaultEvent.start_time ? new Date(defaultEvent.start_time).toISOString().substring(0, 16) : ""}
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
                defaultValue={defaultEvent.end_time ? new Date(defaultEvent.end_time).toISOString().substring(0, 16) : ""}
                required
                className="w-full border border-gray-300 rounded px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-400"
              />
            </div>
          </div>

          {/* --- 4. LOCATION DROPDOWN & AUTO-FILL --- */}
          <fieldset className="border border-gray-200 p-4 rounded bg-gray-50">
            <legend className="font-semibold text-gray-700">Location</legend>

            <div className="mt-2">
              <label htmlFor="address" className="block text-gray-700 mb-1">
                Address / Venue <span className="text-red-500">*</span>
              </label>
              <select
                id="address"
                name="address"
                required
                value={address}
                onChange={handleLocationChange}
                className="w-full border border-gray-300 rounded px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-400 bg-white"
              >
                <option value="">-- Select a Venue --</option>
                {PREDEFINED_LOCATIONS.map((loc) => (
                  <option key={loc.name} value={loc.name}>
                    {loc.name}
                  </option>
                ))}
              </select>
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
                  value={latitude}
                  onChange={(e) => setLatitude(e.target.value)}
                  placeholder="Auto-filled"
                  className="w-full border border-gray-300 rounded px-3 py-2 bg-gray-100 focus:outline-none focus:ring-2 focus:ring-blue-400"
                  readOnly // Added readOnly since it's auto-filled
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
                  value={longitude}
                  onChange={(e) => setLongitude(e.target.value)}
                  placeholder="Auto-filled"
                  className="w-full border border-gray-300 rounded px-3 py-2 bg-gray-100 focus:outline-none focus:ring-2 focus:ring-blue-400"
                  readOnly // Added readOnly since it's auto-filled
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
              display={(s) =>
                s?.name ||
                `${s?.first_name || ""} ${s?.last_name || ""}`.trim()
              }
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
            {loading ? "Submitting..." : "Update Event"}
          </button>
        </form>
      </div>

      <ToastContainer />
    </ModalWrapper>
  );
}