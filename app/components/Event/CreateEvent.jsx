"use client";
import { useEffect, useMemo, useRef, useState } from "react";
import { toast, ToastContainer } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import { createEvent, fetchSpeakersOnly } from "../../../lib/api";
import ImageUploader from "../Common/ImageUploader";

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
  },
  {
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

// MODIFIED SearchableDropdown component for multi-selection
function SearchableDropdown({
  items,
  display,
  value, // Value is now expected to be a string (single) or an array of strings (multiple)
  onChange,
  placeholder = "Search...",
  multiple = false, // New prop to enable multi-select
}) {
  const [query, setQuery] = useState("");
  const [open, setOpen] = useState(false);
  const inputRef = useRef(null);

  // Helper to safely get the name string
  const getLabel = (item) => {
    return (
      display(item) ||
      item?.name ||
      `${item?.first_name || ""} ${item?.last_name || ""}`.trim()
    );
  };

  const filtered = useMemo(() => {
    const q = query.toLowerCase().trim();
    return items.filter((it) => {
      // If multiple, hide items that are already selected
      if (multiple && Array.isArray(value) && value.includes(it._id)) {
        return false;
      }
      if (!q) return true;
      const name = getLabel(it);
      return (name || "").toLowerCase().includes(q);
    });
  }, [items, query, display, value, multiple]);

  const selectedLabel = useMemo(() => {
    // If multiple, we don't show a single label in the input
    if (multiple) return "";

    const sel = items.find((it) => value && it?._id === value);
    return sel ? getLabel(sel) : "";
  }, [items, value, display, multiple]);

  const commitSelection = (id) => {
    if (multiple) {
      const current = Array.isArray(value) ? value : [];
      // Add only if not already there
      if (!current.includes(id)) {
        onChange?.([...current, id]);
      }
      setQuery(""); // Clear query to keep typing
      inputRef.current?.focus(); // Keep focus
    } else {
      // Existing single select logic
      onChange?.(id);
      setOpen(false);
      setQuery("");
    }
  };

  const removeSelection = (e, idToRemove) => {
    e.preventDefault();
    e.stopPropagation();
    if (multiple && Array.isArray(value)) {
      onChange?.(value.filter((id) => id !== idToRemove));
    }
  };

  return (
    <div className="relative">
      {/* Tags for Multiple Selection */}
      {multiple && Array.isArray(value) && value.length > 0 && (
        <div className="flex flex-wrap gap-2 mb-2">
          {value.map((id) => {
            const item = items.find((it) => it._id === id);
            if (!item) return null;
            return (
              <span
                key={id}
                className="inline-flex items-center px-2 py-1 rounded bg-blue-100 text-blue-800 text-sm"
              >
                {getLabel(item)}
                <button
                  type="button"
                  onClick={(e) => removeSelection(e, id)}
                  className="ml-1 text-blue-600 hover:text-blue-800 focus:outline-none font-bold"
                >
                  &times;
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
        value={multiple ? query : open ? query : selectedLabel}
        onChange={(e) => setQuery(e.target.value)}
        onFocus={() => setOpen(true)}
        onBlur={() => {
            // Give a slight delay before closing, so that clicks on dropdown items can register
            setTimeout(() => setOpen(false), 100);
        }}
        className="w-full border border-gray-300 rounded px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-400"
      />
      {open && (
        <div
          className="absolute z-20 mt-1 w-full bg-white border border-gray-200 rounded shadow max-h-60 overflow-auto"
        >
          {filtered.length === 0 && (
            <div className="px-3 py-2 text-sm text-gray-500">No results</div>
          )}
          {filtered.map((it) => {
            const label = getLabel(it);
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

// MODIFIED COMPONENT: CreateEvent
export default function CreateEvent() {
  const [loading, setLoading] = useState(false);
  const [uploadedImageUrl, setUploadedImageUrl] = useState("");
  const [speakers, setSpeakers] = useState([]);
  
  // MODIFIED: Initialize state for speaker IDs as an array
  const [selectedSpeakerIds, setSelectedSpeakerIds] = useState([]);

  // --- 2. NEW STATE FOR LOCATION AUTO-FILL ---
  const [address, setAddress] = useState("");
  const [latitude, setLatitude] = useState("");
  const [longitude, setLongitude] = useState("");

  // Load speakers on mount
  useEffect(() => {
    (async () => {
      const res = await fetchSpeakersOnly();
      setSpeakers(res || []);
    })();
  }, []);

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

    // MODIFIED: Validation now checks if the array is empty
    if (selectedSpeakerIds.length === 0) {
      toast.error("Please select at least one speaker");
      return;
    }

    setLoading(true);
    try {
      await createEvent(
        e,
        () => toast.success("Event created successfully!"),
        (error) => toast.error(error?.message || "Failed to create event")
      );
      
      // reset after success
      e.target.reset();
      setUploadedImageUrl("");
      // Reset the new multi-select state
      setSelectedSpeakerIds([]); 
      setAddress(""); 
      setLatitude("");
      setLongitude("");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto p-6 bg-white shadow-md rounded-lg mt-6">
      <h2 className="text-2xl font-bold mb-6 text-gray-800">Create Event</h2>

      {/* Image upload */}
      <div className="mb-6">
        <ImageUploader onUploadSuccess={setUploadedImageUrl} />
        {uploadedImageUrl && (
          <p className="text-sm text-green-700 mt-2 break-all">
            Uploaded: {uploadedImageUrl}
          </p>
        )}
      </div>

      <form id="createEvent" onSubmit={handleSubmit} className="space-y-6">
        {/* Hidden inputs */}
        <input
          type="hidden"
          name="speaker_ids"
          // MODIFIED: Join the array of IDs into a comma-separated string for form submission
          value={selectedSpeakerIds.join(",") || ""}
        />
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
          <label
            htmlFor="title"
            className="block text-gray-700 font-medium mb-1"
          >
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
            <label
              htmlFor="learning_outcomes"
              className="block text-gray-700 mb-1"
            >
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
              />
            </div>
          </div>
        </fieldset>

        {/* Speaker (Searchable Dropdown) - MODIFIED USAGE */}
        <div>
          <label className="block text-gray-700 mb-1">Speaker</label>
          <SearchableDropdown
            items={speakers}
            value={selectedSpeakerIds} // Pass array state
            onChange={setSelectedSpeakerIds} // Handles array updates
            multiple={true} // Enable multi-select
            placeholder="Search speaker by name"
            display={(s) =>
              s?.name ||
              `${s?.first_name || ""} ${s?.last_name || ""}`.trim()
            }
          />
          {selectedSpeakerIds.length > 0 && ( // Display count
            <p className="text-sm text-gray-600 mt-2">
              Selected: {selectedSpeakerIds.length} speaker(s)
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