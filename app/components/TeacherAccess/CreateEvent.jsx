"use client";
import { useEffect, useMemo, useRef, useState } from "react";
import { toast, ToastContainer } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import { createEvent, fetchSpeakersOnly } from "../../../lib/api"; // Adjust path as needed
import ImageUploader from "../Common/ImageUploader"; // Adjust path as needed
import { 
  MapPin, 
  Calendar, 
  Clock, 
  Users, 
  Type, 
  AlignLeft, 
  CheckCircle,
  X,
  ChevronDown,
  Search
} from "lucide-react";

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

// --- STYLED COMPONENTS ---

// Helper for consistent input styling
const InputField = ({ icon: Icon, className = "", ...props }) => (
  <div className="relative">
    {Icon && (
      <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-gray-400">
        <Icon size={18} />
      </div>
    )}
    <input
      {...props}
      className={`w-full bg-gray-50 border border-gray-300 text-gray-900 text-sm rounded-lg focus:ring-indigo-500 focus:border-indigo-500 block p-2.5 ${Icon ? "pl-10" : ""} transition-all duration-200 ${className}`}
    />
  </div>
);

const TextAreaField = ({ icon: Icon, className = "", ...props }) => (
  <div className="relative">
    {Icon && (
      <div className="absolute top-3 left-0 pl-3 pointer-events-none text-gray-400">
        <Icon size={18} />
      </div>
    )}
    <textarea
      {...props}
      className={`w-full bg-gray-50 border border-gray-300 text-gray-900 text-sm rounded-lg focus:ring-indigo-500 focus:border-indigo-500 block p-2.5 ${Icon ? "pl-10" : ""} transition-all duration-200 ${className}`}
    />
  </div>
);

// MODIFIED SearchableDropdown component for multi-selection
function SearchableDropdown({
  items,
  display,
  value,
  onChange,
  placeholder = "Search...",
  multiple = false,
}) {
  const [query, setQuery] = useState("");
  const [open, setOpen] = useState(false);
  const inputRef = useRef(null);

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
      if (multiple && Array.isArray(value) && value.includes(it._id)) {
        return false;
      }
      if (!q) return true;
      const name = getLabel(it);
      return (name || "").toLowerCase().includes(q);
    });
  }, [items, query, display, value, multiple]);

  const selectedLabel = useMemo(() => {
    if (multiple) return "";
    const sel = items.find((it) => value && it?._id === value);
    return sel ? getLabel(sel) : "";
  }, [items, value, display, multiple]);

  const commitSelection = (id) => {
    if (multiple) {
      const current = Array.isArray(value) ? value : [];
      if (!current.includes(id)) {
        onChange?.([...current, id]);
      }
      setQuery("");
      inputRef.current?.focus();
    } else {
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
    <div className="relative group">
      {/* Selected Tags Area */}
      {multiple && Array.isArray(value) && value.length > 0 && (
        <div className="flex flex-wrap gap-2 mb-3 p-2 bg-indigo-50 border border-indigo-100 rounded-lg">
          {value.map((id) => {
            const item = items.find((it) => it._id === id);
            if (!item) return null;
            return (
              <span
                key={id}
                className="inline-flex items-center px-3 py-1 rounded-full bg-white border border-indigo-200 text-indigo-700 text-xs font-medium shadow-sm transition-all hover:shadow-md"
              >
                {getLabel(item)}
                <button
                  type="button"
                  onClick={(e) => removeSelection(e, id)}
                  className="ml-2 p-0.5 rounded-full hover:bg-indigo-100 text-indigo-400 hover:text-indigo-600 focus:outline-none transition-colors"
                >
                  <X size={12} />
                </button>
              </span>
            );
          })}
        </div>
      )}

      <div className="relative">
        <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-gray-400">
          <Search size={18} />
        </div>
        <input
          ref={inputRef}
          type="text"
          placeholder={selectedLabel || placeholder}
          value={multiple ? query : open ? query : selectedLabel}
          onChange={(e) => setQuery(e.target.value)}
          onFocus={() => setOpen(true)}
          onBlur={() => setTimeout(() => setOpen(false), 200)}
          className="w-full pl-10 pr-10 py-2.5 bg-gray-50 border border-gray-300 text-gray-900 text-sm rounded-lg focus:ring-indigo-500 focus:border-indigo-500 block transition-all shadow-sm"
        />
        <div className="absolute inset-y-0 right-0 pr-3 flex items-center pointer-events-none text-gray-400">
          <ChevronDown size={16} />
        </div>
      </div>

      {/* Dropdown Menu */}
      {open && (
        <div className="absolute z-50 mt-1 w-full bg-white border border-gray-200 rounded-lg shadow-xl max-h-60 overflow-y-auto animate-in fade-in zoom-in-95 duration-100">
          {filtered.length === 0 && (
            <div className="px-4 py-3 text-sm text-gray-500 text-center italic">No matching speakers found</div>
          )}
          {filtered.map((it) => {
            const label = getLabel(it);
            return (
              <button
                key={it._id}
                type="button"
                className="w-full text-left px-4 py-2.5 text-sm text-gray-700 hover:bg-indigo-50 hover:text-indigo-700 transition-colors flex items-center gap-2 border-b border-gray-50 last:border-0"
                onClick={() => commitSelection(it._id)}
              >
                <div className="w-2 h-2 rounded-full bg-indigo-400"></div>
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

    const locData = PREDEFINED_LOCATIONS.find(
      (loc) => loc.name === selectedName
    );

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
      
      e.target.reset();
      setUploadedImageUrl("");
      setSelectedSpeakerIds([]); 
      setAddress(""); 
      setLatitude("");
      setLongitude("");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50/50 py-10 px-4 sm:px-6 lg:px-8">
      <div className="max-w-5xl mx-auto">
        
        {/* Header Section */}
        <div className="mb-8 text-center sm:text-left">
          <h2 className="text-3xl font-extrabold text-gray-900 tracking-tight">Create New Event</h2>
          <p className="mt-2 text-sm text-gray-600">Fill in the details below to schedule a new session.</p>
        </div>

        <div className="bg-white shadow-xl shadow-gray-200/50 rounded-2xl overflow-hidden border border-gray-100">
          
          <form id="createEvent" onSubmit={handleSubmit} className="p-6 sm:p-10 space-y-8">
            
            {/* Hidden inputs */}
            <input type="hidden" name="speaker_ids" value={selectedSpeakerIds.join(",") || ""} />
            <input type="hidden" name="banner_url" value={uploadedImageUrl || ""} />

            {/* Top Section: Image & Basic Info */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
              
              {/* Left Column: Image Upload */}
              <div className="lg:col-span-1 space-y-4">
                 <label className="block text-sm font-semibold text-gray-700">Event Banner</label>
                 <div className="border-2 border-dashed border-gray-300 rounded-xl p-4 bg-gray-50 hover:bg-gray-100 transition-colors text-center min-h-[200px] flex flex-col items-center justify-center">
                    <ImageUploader onUploadSuccess={setUploadedImageUrl} />
                    {uploadedImageUrl ? (
                      <div className="mt-3 flex items-center text-xs text-green-600 font-medium bg-green-50 px-2 py-1 rounded-md">
                        <CheckCircle size={12} className="mr-1" /> Image Ready
                      </div>
                    ) : (
                      <span className="text-xs text-gray-400 mt-2">Recommended: 16:9 Aspect Ratio</span>
                    )}
                 </div>
                 
                 {/* Mandatory Toggle */}
                <div className="flex items-center p-3 bg-blue-50 rounded-lg border border-blue-100">
                  <div className="flex items-center h-5">
                    <input
                      id="mandatory"
                      name="mandatory"
                      type="checkbox"
                      defaultChecked
                      className="w-4 h-4 text-indigo-600 border-gray-300 rounded focus:ring-indigo-500"
                    />
                  </div>
                  <div className="ml-3 text-sm">
                    <label htmlFor="mandatory" className="font-medium text-blue-900">Mandatory Attendance</label>
                    <p className="text-blue-700/70 text-xs">Students must attend this event</p>
                  </div>
                </div>
              </div>

              {/* Right Column: Title & Description */}
              <div className="lg:col-span-2 space-y-6">
                <div>
                  <label htmlFor="title" className="block text-sm font-semibold text-gray-700 mb-2">
                    Event Title <span className="text-red-500">*</span>
                  </label>
                  <InputField 
                    id="title" 
                    name="title" 
                    required 
                    placeholder="e.g. Introduction to Next.js" 
                    icon={Type}
                    className="text-lg font-medium"
                  />
                </div>

                <div>
                  <label htmlFor="detail" className="block text-sm font-semibold text-gray-700 mb-2">Description</label>
                  <TextAreaField 
                    id="detail" 
                    name="detail" 
                    rows={3} 
                    placeholder="Brief overview of the event..." 
                    icon={AlignLeft}
                  />
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                   <div>
                      <label htmlFor="objectives" className="block text-sm font-semibold text-gray-700 mb-2">
                        Objectives <span className="text-red-500">*</span>
                      </label>
                      <TextAreaField 
                        id="objectives" 
                        name="objectives" 
                        required 
                        rows={3} 
                        placeholder="• Objective 1&#10;• Objective 2" 
                      />
                   </div>
                   <div>
                      <label htmlFor="learning_outcomes" className="block text-sm font-semibold text-gray-700 mb-2">
                        Learning Outcomes <span className="text-red-500">*</span>
                      </label>
                      <TextAreaField 
                        id="learning_outcomes" 
                        name="learning_outcomes" 
                        required 
                        rows={3} 
                        placeholder="• Outcome 1&#10;• Outcome 2" 
                      />
                   </div>
                </div>
              </div>
            </div>

            <hr className="border-gray-100" />

            {/* Middle Section: Timing & Location */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              {/* Timing */}
              <div className="space-y-4">
                 <h3 className="text-lg font-semibold text-gray-800 flex items-center">
                    <Clock className="mr-2 text-indigo-500" size={20} /> Schedule
                 </h3>
                 <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label htmlFor="start_time" className="block text-xs font-medium text-gray-500 uppercase tracking-wide mb-1">Starts</label>
                      <input
                        type="datetime-local"
                        id="start_time"
                        name="start_time"
                        required
                        className="w-full bg-white border border-gray-300 text-gray-900 text-sm rounded-lg focus:ring-indigo-500 focus:border-indigo-500 block p-2.5"
                      />
                    </div>
                    <div>
                      <label htmlFor="end_time" className="block text-xs font-medium text-gray-500 uppercase tracking-wide mb-1">Ends</label>
                      <input
                        type="datetime-local"
                        id="end_time"
                        name="end_time"
                        required
                        className="w-full bg-white border border-gray-300 text-gray-900 text-sm rounded-lg focus:ring-indigo-500 focus:border-indigo-500 block p-2.5"
                      />
                    </div>
                 </div>
              </div>

              {/* Location */}
              <div className="space-y-4">
                <h3 className="text-lg font-semibold text-gray-800 flex items-center">
                   <MapPin className="mr-2 text-indigo-500" size={20} /> Venue Details
                </h3>
                <div>
                   <select
                      id="address"
                      name="address"
                      required
                      value={address}
                      onChange={handleLocationChange}
                      className="w-full bg-white border border-gray-300 text-gray-900 text-sm rounded-lg focus:ring-indigo-500 focus:border-indigo-500 block p-2.5 mb-3"
                    >
                      <option value="">-- Select Venue --</option>
                      {PREDEFINED_LOCATIONS.map((loc) => (
                        <option key={loc.name} value={loc.name}>{loc.name}</option>
                      ))}
                    </select>
                </div>
                <div className="grid grid-cols-2 gap-4">
                    <div className="relative">
                      <input
                        type="number"
                        id="lat"
                        name="lat"
                        step="any"
                        value={latitude}
                        onChange={(e) => setLatitude(e.target.value)}
                        placeholder="Latitude"
                        className="w-full bg-gray-100 text-gray-500 border-0 rounded-lg p-2 text-xs font-mono"
                        readOnly={!!latitude} // Visually suggest readonly if autofilled
                      />
                    </div>
                    <div className="relative">
                      <input
                        type="number"
                        id="long"
                        name="long"
                        step="any"
                        value={longitude}
                        onChange={(e) => setLongitude(e.target.value)}
                        placeholder="Longitude"
                        className="w-full bg-gray-100 text-gray-500 border-0 rounded-lg p-2 text-xs font-mono"
                        readOnly={!!longitude}
                      />
                    </div>
                </div>
              </div>
            </div>

            <hr className="border-gray-100" />

            {/* Bottom Section: Speakers */}
            <div>
               <h3 className="text-lg font-semibold text-gray-800 flex items-center mb-4">
                  <Users className="mr-2 text-indigo-500" size={20} /> Speakers
               </h3>
               <div className="bg-gray-50 p-6 rounded-xl border border-gray-200">
                  <label className="block text-sm font-medium text-gray-700 mb-2">Select Guest Speakers</label>
                  <SearchableDropdown
                    items={speakers}
                    value={selectedSpeakerIds}
                    onChange={setSelectedSpeakerIds}
                    multiple={true}
                    placeholder="Search speaker name..."
                    display={(s) =>
                      s?.name || `${s?.first_name || ""} ${s?.last_name || ""}`.trim()
                    }
                  />
                  <div className="mt-2 flex justify-between items-center text-xs text-gray-500">
                     <span>Search and select multiple speakers</span>
                     <span className={selectedSpeakerIds.length > 0 ? "text-indigo-600 font-semibold" : ""}>
                        {selectedSpeakerIds.length} Selected
                     </span>
                  </div>
               </div>
            </div>

            {/* Submit Button */}
            <div className="pt-4">
              <button
                type="submit"
                disabled={loading}
                className="w-full flex justify-center py-4 px-4 border border-transparent rounded-xl shadow-sm text-lg font-medium text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:opacity-50 disabled:cursor-not-allowed transition-all transform active:scale-[0.99]"
              >
                {loading ? (
                   <span className="flex items-center">
                     <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                       <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                       <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                     </svg>
                     Processing Event...
                   </span>
                ) : (
                   "Create Event"
                )}
              </button>
            </div>

          </form>
        </div>
      </div>
      <ToastContainer position="bottom-right" theme="colored" />
    </div>
  );
}