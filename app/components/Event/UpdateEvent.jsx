"use client";
import { redirect } from "next/navigation";
import { useEffect, useMemo, useRef, useState } from "react";
import { toast, ToastContainer } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import { getUsers, updateEvent } from "@/lib/api";
import { toYYYY_MM_DD_T_HH_mm } from "@/lib/api/utils";
import ImageUploader from "../Common/ImageUploader";

// Mock API functions for demonstration - replace with your actual imports
const fetchSpeakersOnly = async () =>
  (await getUsers({ role: "Speaker", all: true }))?.data || [];

const PREDEFINED_LOCATIONS = [
  { name: "Nagar Auditorium", lat: "22.381599362662463", long: "73.14314073548469" },
  { name: "SOT Auditorium", lat: "22.385636040754616", long: "73.14493074913331" },
  { name: "Anviksha Building", lat: "22.3862105355751", long: "73.14561660211221" },
  { name: "SOS Building", lat: "22.382901016778522", long: "73.14696416837283" },
  { name: "Aangava", lat: "22.385277259337578", long: "73.14446294649058" },
  { name: "Basket Ball Court ( Aangava )", lat: "22.385232418863385", long: "73.14407034812744" }
];

function ModalWrapper({ isOpen, onClose, children, title = "Modal" }) {
  if (!isOpen) return null;
  return (
    <div
      className="fixed inset-0 bg-gray-600 bg-opacity-50 z-50 flex justify-center items-center p-4"
      onClick={onClose}
    >
      <div
        className="relative bg-white rounded-lg shadow-xl w-full max-w-4xl max-h-[90vh] overflow-y-auto"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="sticky top-0 bg-white border-b p-4 flex justify-between items-center z-10">
          <h2 className="text-xl font-bold text-gray-800">{title}</h2>
          <button onClick={onClose} className="text-gray-500 hover:text-gray-800 text-2xl" aria-label="Close modal">
            &times;
          </button>
        </div>

        <div className="p-6">{children}</div>
      </div>
    </div>
  );
}

/**
 * SearchableMultiSelect (integrated)
 *
 * Props:
 * - items: array of objects with at least _id and name / first_name/last_name
 * - value: array of selected ids
 * - onChange: (newArrayOfIds) => {}
 * - placeholder: placeholder text
 * - display: function(item) => string (optional)
 */
function SearchableMultiSelect({
  items = [],
  value = [],
  onChange = () => {},
  placeholder = "Search...",
  display = (it) => it?.name || `${it?.first_name || ""} ${it?.last_name || ""}`.trim()
}) {
  const [query, setQuery] = useState("");
  const [open, setOpen] = useState(false);
  const [highlightIndex, setHighlightIndex] = useState(0);
  const wrapperRef = useRef(null);
  const inputRef = useRef(null);

  const getLabel = (item) => display(item) || "";

  // Filter: exclude already selected, and match by label
  const filtered = useMemo(() => {
    const q = query.toLowerCase().trim();
    return items.filter((it) => {
      if (Array.isArray(value) && value.includes(it._id)) return false;
      if (!q) return true;
      return getLabel(it).toLowerCase().includes(q);
    });
  }, [items, query, value]);

  // Close on outside click
  useEffect(() => {
    function handleClick(e) {
      if (wrapperRef.current && !wrapperRef.current.contains(e.target)) {
        setOpen(false);
        setHighlightIndex(0);
      }
    }
    document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, []);

  // Keyboard handling for accessibility
  const onKeyDown = (e) => {
    if (!open && (e.key === "ArrowDown" || e.key === "ArrowUp")) {
      setOpen(true);
      return;
    }
    if (!open) return;

    if (e.key === "ArrowDown") {
      e.preventDefault();
      setHighlightIndex((idx) => Math.min(idx + 1, Math.max(0, filtered.length - 1)));
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      setHighlightIndex((idx) => Math.max(idx - 1, 0));
    } else if (e.key === "Enter") {
      e.preventDefault();
      const sel = filtered[highlightIndex];
      if (sel) chooseItem(sel._id);
    } else if (e.key === "Escape") {
      setOpen(false);
    }
  };

  const chooseItem = (id) => {
    const curr = Array.isArray(value) ? value : [];
    if (!curr.includes(id)) {
      onChange([...curr, id]);
    }
    setQuery("");
    setOpen(true);
    inputRef.current?.focus();
    setHighlightIndex(0);
  };

  const removeTag = (id) => {
    if (!Array.isArray(value)) return;
    onChange(value.filter((v) => v !== id));
  };

  return (
    <div className="relative" ref={wrapperRef}>
      {/* Selected tags */}
      {Array.isArray(value) && value.length > 0 && (
        <div className="flex flex-wrap gap-2 mb-2">
          {value.map((id) => {
            const item = items.find((it) => it._id === id);
            if (!item) return null;
            return (
              <span key={id} className="flex items-center px-2 py-1 bg-blue-100 text-blue-800 rounded text-sm">
                {getLabel(item)}
                <button
                  type="button"
                  onClick={() => removeTag(id)}
                  className="ml-2 font-bold text-blue-600 hover:text-blue-900"
                  aria-label={`Remove ${getLabel(item)}`}
                >
                  ×
                </button>
              </span>
            );
          })}
        </div>
      )}

      <input
        ref={inputRef}
        type="text"
        placeholder={placeholder}
        value={query}
        onFocus={() => setOpen(true)}
        onChange={(e) => {
          setQuery(e.target.value);
          setOpen(true);
          setHighlightIndex(0);
        }}
        onKeyDown={onKeyDown}
        className="w-full border border-gray-300 rounded px-3 py-2 focus:ring-2 focus:ring-blue-400 outline-none"
      />

      {open && (
        <div className="absolute z-30 mt-1 w-full bg-white border border-gray-200 rounded shadow max-h-60 overflow-auto">
          {filtered.length === 0 ? (
            <div className="px-3 py-2 text-gray-500">No results</div>
          ) : (
            filtered.map((it, idx) => (
              <button
                key={it._id}
                type="button"
                onClick={() => chooseItem(it._id)}
                onMouseEnter={() => setHighlightIndex(idx)}
                className={`w-full text-left px-3 py-2 ${idx === highlightIndex ? "bg-gray-100" : "hover:bg-gray-50"}`}
              >
                {getLabel(it)}
              </button>
            ))
          )}
        </div>
      )}
    </div>
  );
}

// CONVERTED COMPONENT: UpdateEventModal
export default function UpdateEventModal({ existingEvent, isOpen, onClose }) {
  // Defensive defaults
  existingEvent = existingEvent || {};

  const defaultEvent = useMemo(() => {
    const speakerIds = existingEvent?.speakers?.map((s) => s._id) || [];
    return {
      title: "",
      image: "",
      speakers: [],
      address: "",
      lat: "",
      long: "",
      description: { detail: "", objectives: [], learning_outcomes: [] },
      ...existingEvent,
      initialSpeakerIds: speakerIds
    };
  }, [existingEvent]);

  const [loading, setLoading] = useState(false);
  const [uploadedImageUrl, setUploadedImageUrl] = useState(defaultEvent.image || "");
  const [speakers, setSpeakers] = useState(defaultEvent.speakers || []);
  const [selectedSpeakerIds, setSelectedSpeakerIds] = useState(defaultEvent.initialSpeakerIds || []);
  const [address, setAddress] = useState(defaultEvent.address || "");
  const [latitude, setLatitude] = useState(defaultEvent.lat || "");
  const [longitude, setLongitude] = useState(defaultEvent.long || "");

  useEffect(() => {
    if (isOpen) {
      (async () => {
        try {
          const res = await fetchSpeakersOnly();
          setSpeakers(res || []);
          handleLocationChange({ target: { value: defaultEvent.address || "" } });
        } catch (error) {
          console.error("Failed to fetch speakers:", error);
          toast.error("Failed to load speakers.");
        }
      })();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isOpen]);

  const handleLocationChange = (e) => {
    const selectedName = e.target.value;
    setAddress(selectedName);
    const locData = PREDEFINED_LOCATIONS.find((loc) => loc.name === selectedName);
    if (locData) {
      setLatitude(locData.lat);
      setLongitude(locData.long);
    } else {
      setLatitude("");
      setLongitude("");
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!selectedSpeakerIds || selectedSpeakerIds.length === 0) {
      toast.error("Please select at least one speaker");
      return;
    }

    setLoading(true);
    try {
      await updateEvent(
        e,
        () => {
          toast.success("Event updated successfully!");
          onClose();
          setTimeout(() => window.location.reload(), 200);
        },
        (error) => toast.error(error?.message || "Failed to update event")
      );
    } finally {
      setLoading(false);
    }
  };

  const nameOf = (s) => s?.name || `${s?.first_name || ""} ${s?.last_name || ""}`.trim();

  return (
    <ModalWrapper isOpen={isOpen} onClose={onClose} title="Update Event">
      <div className="p-0">
        <div className="mb-6">
          <ImageUploader onUploadSuccess={setUploadedImageUrl} />
          {uploadedImageUrl && (
            <p className="text-sm text-green-700 mt-2 break-all">Uploaded: {uploadedImageUrl}</p>
          )}
        </div>

        <form id="updateEventForm" onSubmit={handleSubmit} className="space-y-6">
          <input type="hidden" name="speaker_ids" value={selectedSpeakerIds.join(",") || ""} />
          <input type="hidden" name="event_id" value={existingEvent._id} />
          <input type="hidden" name="image" value={uploadedImageUrl || ""} />
          <input type="hidden" name="event_id" value={defaultEvent._id} />

          <div className="flex items-center space-x-2">
            <input type="checkbox" className="h-4 w-4 text-blue-600 border-gray-300 rounded" name="mandatory" defaultChecked={defaultEvent.mandatory} />
            <label className="text-gray-700">Mandatory</label>
          </div>

          <div>
            <label htmlFor="title" className="block text-gray-700 font-medium mb-1">Title <span className="text-red-500">*</span></label>
            <input id="title" name="title" defaultValue={defaultEvent.title} required className="w-full border border-gray-300 rounded px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-400" />
          </div>

          <fieldset className="border border-gray-200 p-4 rounded">
            <legend className="font-semibold text-gray-700">Description</legend>

            <div className="mt-4">
              <label htmlFor="detail" className="block text-gray-700 mb-1">Detail</label>
              <textarea id="detail" name="detail" defaultValue={defaultEvent.description.detail} className="w-full border border-gray-300 rounded px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-400" />
            </div>

            <div className="mt-4">
              <label htmlFor="objectives" className="block text-gray-700 mb-1">Objectives <span className="text-red-500">*</span></label>
              <textarea id="objectives" name="objectives" defaultValue={defaultEvent.description.objectives.join("\n")} required className="w-full border border-gray-300 rounded px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-400" placeholder="One per line"></textarea>
            </div>

            <div className="mt-4">
              <label htmlFor="learning_outcomes" className="block text-gray-700 mb-1">Learning Outcomes <span className="text-red-500">*</span></label>
              <textarea id="learning_outcomes" name="learning_outcomes" defaultValue={defaultEvent.description.learning_outcomes.join("\n")} required className="w-full border border-gray-300 rounded px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-400" placeholder="One per line"></textarea>
            </div>
          </fieldset>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label htmlFor="start_time" className="block text-gray-700 mb-1">Start Time *</label>
              <input type="datetime-local" id="start_time" name="start_time" defaultValue={defaultEvent.start_time ? toYYYY_MM_DD_T_HH_mm(defaultEvent.start_time) : ""} required className="w-full border border-gray-300 rounded px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-400" />
            </div>

            <div>
              <label htmlFor="end_time" className="block text-gray-700 mb-1">End Time *</label>
              <input type="datetime-local" id="end_time" name="end_time" defaultValue={defaultEvent.end_time ? toYYYY_MM_DD_T_HH_mm(defaultEvent.end_time) : ""} required className="w-full border border-gray-300 rounded px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-400" />
            </div>
          </div>

          <fieldset className="border border-gray-200 p-4 rounded bg-gray-50">
            <legend className="font-semibold text-gray-700">Location</legend>

            <div className="mt-2">
              <label htmlFor="address" className="block text-gray-700 mb-1">Address / Venue <span className="text-red-500">*</span></label>
              <select id="address" name="address" required value={address} onChange={handleLocationChange} className="w-full border border-gray-300 rounded px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-400 bg-white">
                <option value="">-- Select a Venue --</option>
                {PREDEFINED_LOCATIONS.map((loc) => (
                  <option key={loc.name} value={loc.name}>{loc.name}</option>
                ))}
              </select>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
              <div>
                <label htmlFor="lat" className="block text-gray-700 mb-1">Latitude</label>
                <input type="number" id="lat" name="lat" step="any" value={latitude} onChange={(e) => setLatitude(e.target.value)} placeholder="Auto-filled" className="w-full border border-gray-300 rounded px-3 py-2 bg-gray-100 focus:outline-none focus:ring-2 focus:ring-blue-400" readOnly />
              </div>

              <div>
                <label htmlFor="long" className="block text-gray-700 mb-1">Longitude</label>
                <input type="number" id="long" name="long" step="any" value={longitude} onChange={(e) => setLongitude(e.target.value)} placeholder="Auto-filled" className="w-full border border-gray-300 rounded px-3 py-2 bg-gray-100 focus:outline-none focus:ring-2 focus:ring-blue-400" readOnly />
              </div>
            </div>
          </fieldset>

          {/* Speaker (Searchable Dropdown) */}
          <div>
            <label className="block text-gray-700 mb-1">Speaker</label>
            <SearchableMultiSelect
              items={speakers}
              value={selectedSpeakerIds}
              onChange={setSelectedSpeakerIds}
              placeholder="Search speaker by name"
              display={(s) => s?.name || `${s?.first_name || ""} ${s?.last_name || ""}`.trim()}
            />
            {selectedSpeakerIds.length > 0 && (
              <p className="text-sm text-gray-600 mt-2">Selected: {selectedSpeakerIds.length} speaker(s)</p>
            )}
          </div>

          <button type="submit" disabled={loading} className="w-full bg-green-700 text-white font-semibold py-2 px-4 rounded transition duration-200 disabled:opacity-50">
            {loading ? "Submitting..." : "Update Event"}
          </button>
        </form>
      </div>

      <ToastContainer />
    </ModalWrapper>
  );
}
