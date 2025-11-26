"use client";
import { useEffect, useMemo, useRef, useState } from "react";
import { toast, ToastContainer } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import ImageUploader from "../../app/components/Common/ImageUploader";

// --- IMPORTS FROM YOUR API LIB ---
// Ensure these paths match your project structure
import { getEvents, fetchSpeakersOnly, makeRequest, hostSocket } from "../../lib/api";

// --- PREDEFINED LOCATIONS DATA ---
const PREDEFINED_LOCATIONS = [
  { name: "Nagar Auditorium", lat: "22.381599362662463", long: "73.14314073548469" },
  { name: "SOT Auditorium", lat: "22.385636040754616", long: "73.14493074913331" },
  { name: "Anviksha Building", lat: "22.3862105355751", long: "73.14561660211221" },
];

// --- HELPER: FORMAT DATE FOR INPUT (YYYY-MM-DDTHH:MM) ---
const formatDateForInput = (isoString) => {
  if (!isoString) return "";
  const date = new Date(isoString);
  // Handle timezone offset to ensure it shows correct local time in input
  const offset = date.getTimezoneOffset() * 60000; 
  const localISOTime = (new Date(date - offset)).toISOString().slice(0, 16);
  return localISOTime;
};

// --- REUSABLE SEARCHABLE DROPDOWN ---
function SearchableDropdown({ items, display, value, onChange, placeholder = "Search..." }) {
  const [query, setQuery] = useState("");
  const [open, setOpen] = useState(false);
  const inputRef = useRef(null);

  const filtered = useMemo(() => {
    const q = query.toLowerCase().trim();
    if (!q) return items;
    return items.filter((it) => {
      const name = display(it) || "";
      return name.toLowerCase().includes(q);
    });
  }, [items, query, display]);

  const selectedLabel = useMemo(() => {
    const sel = items.find((it) => value && it?._id === value);
    return sel ? display(sel) : "";
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
        <div className="absolute z-50 mt-1 w-full bg-white border border-gray-200 rounded shadow-lg max-h-60 overflow-auto" onMouseDown={(e) => e.preventDefault()}>
          {filtered.length === 0 && <div className="px-3 py-2 text-sm text-gray-500">No results</div>}
          {filtered.map((it) => (
            <button
              key={it._id}
              type="button"
              className="w-full text-left px-3 py-2 hover:bg-gray-100 border-b border-gray-50"
              onClick={() => commitSelection(it._id)}
            >
              {display(it)}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

export default function UpdateEvent() {
  const [loading, setLoading] = useState(false);
  const [fetching, setFetching] = useState(true);

  // Data Sources
  const [allEvents, setAllEvents] = useState([]);
  const [speakers, setSpeakers] = useState([]);

  // Selection State
  const [selectedEventId, setSelectedEventId] = useState("");

  // Form State
  const [formData, setFormData] = useState({
    title: "",
    detail: "",
    objectives: "",
    learning_outcomes: "",
    start_time: "",
    end_time: "",
    address: "",
    lat: "",
    long: "",
    speaker_id: "",
    banner_url: "",
    mandatory: true,
  });

  const [uploadedImageUrl, setUploadedImageUrl] = useState("");

  // --- 1. INITIAL LOAD (EVENTS & SPEAKERS) ---
  useEffect(() => {
    const loadData = async () => {
      try {
        const [eventsRes, speakersRes] = await Promise.all([
          getEvents(), // Using your getEvents API
          fetchSpeakersOnly()
        ]);
        setAllEvents(eventsRes || []);
        setSpeakers(speakersRes || []);
      } catch (error) {
        console.error("Error loading data:", error);
        toast.error("Failed to load events or speakers.");
      } finally {
        setFetching(false);
      }
    };
    loadData();
  }, []);

  // --- 2. AUTO-FILL FORM WHEN EVENT IS SELECTED ---
  useEffect(() => {
    if (!selectedEventId) return;

    const eventToEdit = allEvents.find(e => e._id === selectedEventId);
    if (eventToEdit) {
      // Map event data to form state
      setFormData({
        title: eventToEdit.title || "",
        detail: eventToEdit.detail || "",
        objectives: Array.isArray(eventToEdit.objectives) ? eventToEdit.objectives.join("\n") : eventToEdit.objectives || "",
        learning_outcomes: Array.isArray(eventToEdit.learning_outcomes) ? eventToEdit.learning_outcomes.join("\n") : eventToEdit.learning_outcomes || "",
        start_time: formatDateForInput(eventToEdit.start_time),
        end_time: formatDateForInput(eventToEdit.end_time),
        address: eventToEdit.address || "",
        lat: eventToEdit.location?.lat || "", // Accessing nested location if structure differs
        long: eventToEdit.location?.long || "",
        speaker_id: eventToEdit.speaker_id?._id || eventToEdit.speaker_id || "", // Handle populated vs unpopulated
        banner_url: eventToEdit.banner_url || "",
        mandatory: eventToEdit.mandatory !== undefined ? eventToEdit.mandatory : true,
      });
      
      // Reset uploader state, use existing banner
      setUploadedImageUrl(""); 
    }
  }, [selectedEventId, allEvents]);

  // --- 3. HANDLERS ---
  const handleInputChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: type === "checkbox" ? checked : value
    }));
  };

  const handleLocationChange = (e) => {
    const selectedName = e.target.value;
    const locData = PREDEFINED_LOCATIONS.find(loc => loc.name === selectedName);
    
    setFormData(prev => ({
      ...prev,
      address: selectedName,
      lat: locData ? locData.lat : "",
      long: locData ? locData.long : ""
    }));
  };

  const handleSpeakerChange = (id) => {
    setFormData(prev => ({ ...prev, speaker_id: id }));
  };

  // --- 4. SUBMIT UPDATE ---
  const handleUpdate = async (e) => {
    e.preventDefault();
    if (!selectedEventId) {
      toast.error("Please select an event to update.");
      return;
    }

    setLoading(true);
    
    // Construct Payload
    // If a new image was uploaded, use it. Otherwise keep the old banner_url.
    const finalBanner = uploadedImageUrl || formData.banner_url;

    // Convert textareas to arrays if your backend expects arrays
    const payload = {
      ...formData,
      objectives: formData.objectives.split('\n').filter(line => line.trim() !== ''),
      learning_outcomes: formData.learning_outcomes.split('\n').filter(line => line.trim() !== ''),
      banner_url: finalBanner,
    };

    try {
      // Using makeRequest as requested
      // Assuming PUT /events/:id or PATCH /events/:id based on your API structure
      const response = await makeRequest("PUT", `/events/${selectedEventId}`, payload);
      
      toast.success("Event updated successfully!");
      
      // Optionally refresh the list to show new data immediately
      const refreshedEvents = await getEvents();
      setAllEvents(refreshedEvents);

    } catch (error) {
      console.error("Update failed", error);
      toast.error(error?.response?.data?.message || "Failed to update event");
    } finally {
      setLoading(false);
    }
  };

  // Speaker name helper
  const getSpeakerName = (s) => s?.name || `${s?.first_name || ""} ${s?.last_name || ""}`.trim();

  // Loading State
  if (fetching) return <div className="p-8 text-center text-gray-500">Loading events data...</div>;

  return (
    <div className="max-w-4xl mx-auto p-6 bg-white shadow-md rounded-lg mt-6">
      
      {/* --- SELECTION SECTION --- */}
      <div className="bg-blue-50 p-4 rounded-lg mb-8 border border-blue-200">
        <h2 className="text-xl font-bold mb-4 text-blue-800">1. Select Event to Edit</h2>
        <SearchableDropdown
          items={allEvents}
          value={selectedEventId}
          onChange={setSelectedEventId}
          placeholder="Search for an event to update..."
          display={(e) => e.title}
        />
      </div>

      {/* --- EDIT FORM (Only shows if event selected) --- */}
      {selectedEventId ? (
        <form onSubmit={handleUpdate} className="space-y-6 fade-in">
           <h2 className="text-2xl font-bold text-gray-800 pb-2 border-b">2. Edit Details</h2>

          {/* Banner Image Display & Update */}
          <div className="mb-6">
            <label className="block text-gray-700 font-medium mb-2">Event Banner</label>
            
            {/* Show Current Image */}
            {!uploadedImageUrl && formData.banner_url && (
              <div className="mb-3">
                <p className="text-xs text-gray-500 mb-1">Current Banner:</p>
                <img 
                  // If banner_url is relative, prepend hostSocket
                  src={formData.banner_url.startsWith('http') ? formData.banner_url : `${hostSocket}${formData.banner_url}`} 
                  alt="Current Banner" 
                  className="h-32 object-cover rounded border"
                />
              </div>
            )}

            <ImageUploader onUploadSuccess={setUploadedImageUrl} />
            {uploadedImageUrl && (
              <p className="text-sm text-green-600 mt-2">New image ready to save.</p>
            )}
          </div>

          {/* Mandatory Toggle */}
          <div className="flex items-center space-x-2">
            <input
              type="checkbox"
              name="mandatory"
              checked={formData.mandatory}
              onChange={handleInputChange}
              className="h-4 w-4 text-blue-600 border-gray-300 rounded"
            />
            <label className="text-gray-700">Mandatory Event</label>
          </div>

          {/* Title */}
          <div>
            <label className="block text-gray-700 font-medium mb-1">Title *</label>
            <input
              name="title"
              value={formData.title}
              onChange={handleInputChange}
              required
              className="w-full border border-gray-300 rounded px-3 py-2 focus:ring-2 focus:ring-blue-400"
            />
          </div>

          {/* Details Fieldset */}
          <fieldset className="border border-gray-200 p-4 rounded">
            <legend className="font-semibold text-gray-700">Description</legend>
            
            <div className="mt-2">
              <label className="block text-gray-700 mb-1">Detail</label>
              <textarea
                name="detail"
                value={formData.detail}
                onChange={handleInputChange}
                className="w-full border border-gray-300 rounded px-3 py-2 focus:ring-2 focus:ring-blue-400"
              />
            </div>

            <div className="mt-4">
              <label className="block text-gray-700 mb-1">Objectives *</label>
              <textarea
                name="objectives"
                value={formData.objectives}
                onChange={handleInputChange}
                required
                className="w-full border border-gray-300 rounded px-3 py-2 focus:ring-2 focus:ring-blue-400"
                placeholder="One per line"
              />
            </div>

            <div className="mt-4">
              <label className="block text-gray-700 mb-1">Learning Outcomes *</label>
              <textarea
                name="learning_outcomes"
                value={formData.learning_outcomes}
                onChange={handleInputChange}
                required
                className="w-full border border-gray-300 rounded px-3 py-2 focus:ring-2 focus:ring-blue-400"
                placeholder="One per line"
              />
            </div>
          </fieldset>

          {/* Timing */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-gray-700 mb-1">Start Time *</label>
              <input
                type="datetime-local"
                name="start_time"
                value={formData.start_time}
                onChange={handleInputChange}
                required
                className="w-full border border-gray-300 rounded px-3 py-2 focus:ring-2 focus:ring-blue-400"
              />
            </div>
            <div>
              <label className="block text-gray-700 mb-1">End Time *</label>
              <input
                type="datetime-local"
                name="end_time"
                value={formData.end_time}
                onChange={handleInputChange}
                required
                className="w-full border border-gray-300 rounded px-3 py-2 focus:ring-2 focus:ring-blue-400"
              />
            </div>
          </div>

          {/* Location */}
          <fieldset className="border border-gray-200 p-4 rounded bg-gray-50">
            <legend className="font-semibold text-gray-700">Location</legend>
            
            <div className="mt-2">
              <label className="block text-gray-700 mb-1">Address / Venue *</label>
              <select
                name="address"
                value={formData.address}
                onChange={handleLocationChange}
                required
                className="w-full border border-gray-300 rounded px-3 py-2 bg-white focus:ring-2 focus:ring-blue-400"
              >
                <option value="">-- Select a Venue --</option>
                {PREDEFINED_LOCATIONS.map((loc) => (
                  <option key={loc.name} value={loc.name}>{loc.name}</option>
                ))}
              </select>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
              <div>
                <label className="block text-gray-700 mb-1">Latitude</label>
                <input
                  type="number"
                  name="lat"
                  step="any"
                  value={formData.lat}
                  onChange={handleInputChange}
                  className="w-full border border-gray-300 rounded px-3 py-2 bg-gray-100"
                />
              </div>
              <div>
                <label className="block text-gray-700 mb-1">Longitude</label>
                <input
                  type="number"
                  name="long"
                  step="any"
                  value={formData.long}
                  onChange={handleInputChange}
                  className="w-full border border-gray-300 rounded px-3 py-2 bg-gray-100"
                />
              </div>
            </div>
          </fieldset>

          {/* Speaker */}
          <div>
            <label className="block text-gray-700 mb-1">Speaker</label>
            <SearchableDropdown
              items={speakers}
              value={formData.speaker_id}
              onChange={handleSpeakerChange}
              display={getSpeakerName}
            />
          </div>

          {/* Submit Button */}
          <button
            type="submit"
            disabled={loading}
            className="w-full bg-blue-600 hover:bg-blue-700 text-white font-semibold py-3 px-4 rounded transition duration-200 disabled:opacity-50"
          >
            {loading ? "Updating Event..." : "Update Event Details"}
          </button>

        </form>
      ) : (
        <div className="text-center py-10 text-gray-400 italic border-2 border-dashed border-gray-300 rounded-lg">
          Please select an event from the search bar above to begin editing.
        </div>
      )}

      <ToastContainer />
    </div>
  );
}