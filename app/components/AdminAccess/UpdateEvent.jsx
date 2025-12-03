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
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm transition-opacity"
      onClick={onClose}
    >
      <div
        className="relative flex flex-col w-full max-w-4xl max-h-[90vh] bg-white rounded-2xl shadow-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-200"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100 bg-white sticky top-0 z-20">
          <h2 className="text-xl font-bold text-slate-800 tracking-tight">{title}</h2>
          <button
            onClick={onClose}
            className="p-2 text-slate-400 hover:text-red-500 hover:bg-red-50 rounded-full transition-colors"
            aria-label="Close modal"
          >
            <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="18" y1="6" x2="6" y2="18"></line><line x1="6" y1="6" x2="18" y2="18"></line></svg>
          </button>
        </div>

        {/* Scrollable Content */}
        <div className="flex-1 overflow-y-auto p-6 scrollbar-thin scrollbar-thumb-slate-200 scrollbar-track-transparent">
            {children}
        </div>
      </div>
    </div>
  );
}

/**
 * SearchableMultiSelect (UI Updated)
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

  const filtered = useMemo(() => {
    const q = query.toLowerCase().trim();
    return items.filter((it) => {
      if (Array.isArray(value) && value.includes(it._id)) return false;
      if (!q) return true;
      return getLabel(it).toLowerCase().includes(q);
    });
  }, [items, query, value]);

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
    <div className="relative group" ref={wrapperRef}>
      {/* Selected Tags Area */}
      {Array.isArray(value) && value.length > 0 && (
        <div className="flex flex-wrap gap-2 mb-3">
          {value.map((id) => {
            const item = items.find((it) => it._id === id);
            if (!item) return null;
            return (
              <span key={id} className="inline-flex items-center px-3 py-1 bg-indigo-50 text-indigo-700 border border-indigo-100 rounded-full text-sm font-medium transition-all hover:bg-indigo-100">
                {getLabel(item)}
                <button
                  type="button"
                  onClick={() => removeTag(id)}
                  className="ml-2 p-0.5 hover:bg-indigo-200 rounded-full text-indigo-500 hover:text-indigo-800 transition-colors"
                  aria-label={`Remove ${getLabel(item)}`}
                >
                  <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><line x1="18" y1="6" x2="6" y2="18"></line><line x1="6" y1="6" x2="18" y2="18"></line></svg>
                </button>
              </span>
            );
          })}
        </div>
      )}

      {/* Input Field */}
      <div className="relative">
        <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
           <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="11" cy="11" r="8"></circle><line x1="21" y1="21" x2="16.65" y2="16.65"></line></svg>
        </div>
        <input
          ref={inputRef}
          type="text"
          placeholder={value.length === 0 ? placeholder : "Add another..."}
          value={query}
          onFocus={() => setOpen(true)}
          onChange={(e) => {
            setQuery(e.target.value);
            setOpen(true);
            setHighlightIndex(0);
          }}
          onKeyDown={onKeyDown}
          className="w-full pl-10 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-lg text-slate-800 placeholder-slate-400 focus:bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500/50 focus:border-indigo-500 transition-all"
        />
      </div>

      {/* Dropdown Menu */}
      {open && (
        <div className="absolute z-50 mt-2 w-full bg-white border border-slate-100 rounded-xl shadow-xl max-h-60 overflow-y-auto overflow-x-hidden ring-1 ring-black/5">
          {filtered.length === 0 ? (
            <div className="px-4 py-3 text-sm text-slate-500 text-center italic">No matching results found.</div>
          ) : (
            <div className="py-1">
              {filtered.map((it, idx) => (
                <button
                  key={it._id}
                  type="button"
                  onClick={() => chooseItem(it._id)}
                  onMouseEnter={() => setHighlightIndex(idx)}
                  className={`w-full text-left px-4 py-2.5 text-sm transition-colors duration-150 flex items-center space-x-2 ${
                    idx === highlightIndex
                      ? "bg-indigo-50 text-indigo-700 font-medium"
                      : "text-slate-700 hover:bg-slate-50"
                  }`}
                >
                  <div className="w-2 h-2 rounded-full bg-indigo-400 opacity-0 transition-opacity duration-200" style={{ opacity: idx === highlightIndex ? 1 : 0}}></div>
                  <span>{getLabel(it)}</span>
                </button>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}

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

  // Helper component for labels
  const Label = ({ htmlFor, children, required }) => (
    <label htmlFor={htmlFor} className="block text-sm font-semibold text-slate-700 mb-1.5">
      {children}
      {required && <span className="text-rose-500 ml-1">*</span>}
    </label>
  );

  return (
    <ModalWrapper isOpen={isOpen} onClose={onClose} title="Update Event Details">
      <div className="space-y-6">
        
        {/* Banner Image Section */}
        <div className="bg-slate-50 p-4 rounded-xl border border-dashed border-slate-300">
          <div className="flex flex-col items-center justify-center">
            <span className="text-sm font-medium text-slate-500 mb-3">Event Banner</span>
            <ImageUploader onUploadSuccess={setUploadedImageUrl} />
            {uploadedImageUrl && (
                <div className="mt-3 flex items-center gap-2 px-3 py-1.5 bg-emerald-50 text-emerald-700 rounded-lg text-xs font-medium max-w-full truncate">
                    <svg className="w-4 h-4 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7"></path></svg>
                    <span className="truncate">{uploadedImageUrl}</span>
                </div>
            )}
          </div>
        </div>

        <form id="updateEventForm" onSubmit={handleSubmit} className="space-y-8">
          {/* Hidden Inputs */}
          <input type="hidden" name="speaker_ids" value={selectedSpeakerIds.join(",") || ""} />
          <input type="hidden" name="event_id" value={existingEvent._id} />
          <input type="hidden" name="image" value={uploadedImageUrl || ""} />
          <input type="hidden" name="event_id" value={defaultEvent._id} />

          {/* Basic Info */}
          <div className="grid grid-cols-1 gap-6">
            <div className="flex items-center justify-between bg-blue-50/50 p-3 rounded-lg border border-blue-100">
               <span className="text-sm text-slate-600">Is this event mandatory for all students?</span>
               <label className="flex items-center cursor-pointer space-x-2">
                <input 
                    type="checkbox" 
                    className="w-5 h-5 text-indigo-600 rounded focus:ring-indigo-500 border-gray-300" 
                    name="mandatory" 
                    defaultChecked={defaultEvent.mandatory} 
                />
                <span className="text-sm font-semibold text-slate-800">Mandatory</span>
              </label>
            </div>

            <div>
              <Label htmlFor="title" required>Event Title</Label>
              <input 
                id="title" 
                name="title" 
                defaultValue={defaultEvent.title} 
                required 
                placeholder="Enter a descriptive title"
                className="w-full px-4 py-2.5 bg-white border border-slate-300 rounded-lg text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all" 
            />
            </div>
          </div>

          <hr className="border-slate-100" />

          {/* Description Section */}
          <div className="space-y-5">
            <h3 className="text-lg font-bold text-slate-800 flex items-center gap-2">
                <svg className="w-5 h-5 text-indigo-500" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 6h16M4 12h16M4 18h7" /></svg>
                Description
            </h3>
            
            <div>
              <Label htmlFor="detail">Detailed Description</Label>
              <textarea 
                id="detail" 
                name="detail" 
                rows="3"
                defaultValue={defaultEvent.description.detail} 
                className="w-full px-4 py-2.5 bg-white border border-slate-300 rounded-lg text-slate-800 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all resize-y" 
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                <div>
                    <Label htmlFor="objectives" required>Objectives</Label>
                    <textarea 
                        id="objectives" 
                        name="objectives" 
                        rows="4"
                        defaultValue={defaultEvent.description.objectives.join("\n")} 
                        required 
                        className="w-full px-4 py-2.5 bg-white border border-slate-300 rounded-lg text-slate-800 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all resize-none text-sm" 
                        placeholder="• Objective 1&#10;• Objective 2"
                    ></textarea>
                    <p className="mt-1 text-xs text-slate-400">Enter each objective on a new line.</p>
                </div>

                <div>
                    <Label htmlFor="learning_outcomes" required>Learning Outcomes</Label>
                    <textarea 
                        id="learning_outcomes" 
                        name="learning_outcomes" 
                        rows="4"
                        defaultValue={defaultEvent.description.learning_outcomes.join("\n")} 
                        required 
                        className="w-full px-4 py-2.5 bg-white border border-slate-300 rounded-lg text-slate-800 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all resize-none text-sm" 
                        placeholder="• Outcome 1&#10;• Outcome 2"
                    ></textarea>
                     <p className="mt-1 text-xs text-slate-400">Enter each outcome on a new line.</p>
                </div>
            </div>
          </div>

          <hr className="border-slate-100" />

          {/* Schedule Section */}
          <div className="space-y-5">
             <h3 className="text-lg font-bold text-slate-800 flex items-center gap-2">
                <svg className="w-5 h-5 text-indigo-500" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
                Schedule
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
              <div>
                <Label htmlFor="start_time" required>Start Time</Label>
                <input 
                    type="datetime-local" 
                    id="start_time" 
                    name="start_time" 
                    defaultValue={defaultEvent.start_time ? toYYYY_MM_DD_T_HH_mm(defaultEvent.start_time) : ""} 
                    required 
                    className="w-full px-4 py-2.5 bg-white border border-slate-300 rounded-lg text-slate-800 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all" 
                />
              </div>

              <div>
                <Label htmlFor="end_time" required>End Time</Label>
                <input 
                    type="datetime-local" 
                    id="end_time" 
                    name="end_time" 
                    defaultValue={defaultEvent.end_time ? toYYYY_MM_DD_T_HH_mm(defaultEvent.end_time) : ""} 
                    required 
                    className="w-full px-4 py-2.5 bg-white border border-slate-300 rounded-lg text-slate-800 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all" 
                />
              </div>
            </div>
          </div>

          <hr className="border-slate-100" />

          {/* Location Section */}
          <div className="space-y-5">
             <h3 className="text-lg font-bold text-slate-800 flex items-center gap-2">
                <svg className="w-5 h-5 text-indigo-500" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" /></svg>
                Location & Venue
            </h3>

            <div className="p-5 bg-slate-50 rounded-xl border border-slate-200">
                <div>
                  <Label htmlFor="address" required>Select Venue</Label>
                  <div className="relative">
                    <select 
                        id="address" 
                        name="address" 
                        required 
                        value={address} 
                        onChange={handleLocationChange} 
                        className="w-full pl-4 pr-10 py-2.5 bg-white border border-slate-300 rounded-lg text-slate-800 appearance-none focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all"
                    >
                        <option value="">-- Choose a location --</option>
                        {PREDEFINED_LOCATIONS.map((loc) => (
                        <option key={loc.name} value={loc.name}>{loc.name}</option>
                        ))}
                    </select>
                    <div className="absolute inset-y-0 right-0 flex items-center px-3 pointer-events-none text-slate-500">
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7"></path></svg>
                    </div>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4 mt-4">
                  <div>
                    <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1">Latitude</label>
                    <input 
                        type="number" 
                        id="lat" 
                        name="lat" 
                        step="any" 
                        value={latitude} 
                        onChange={(e) => setLatitude(e.target.value)} 
                        placeholder="Auto-filled" 
                        className="w-full px-3 py-2 bg-slate-200/50 border border-slate-300 rounded text-slate-600 text-sm focus:outline-none cursor-not-allowed" 
                        readOnly 
                    />
                  </div>

                  <div>
                     <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1">Longitude</label>
                    <input 
                        type="number" 
                        id="long" 
                        name="long" 
                        step="any" 
                        value={longitude} 
                        onChange={(e) => setLongitude(e.target.value)} 
                        placeholder="Auto-filled" 
                        className="w-full px-3 py-2 bg-slate-200/50 border border-slate-300 rounded text-slate-600 text-sm focus:outline-none cursor-not-allowed" 
                        readOnly 
                    />
                  </div>
                </div>
            </div>
          </div>

          <hr className="border-slate-100" />

          {/* Speaker Selection */}
          <div className="space-y-3">
             <h3 className="text-lg font-bold text-slate-800 flex items-center gap-2">
                <svg className="w-5 h-5 text-indigo-500" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z" /></svg>
                Speakers <span className="text-rose-500 text-sm font-normal">*</span>
            </h3>
            
            <SearchableMultiSelect
              items={speakers}
              value={selectedSpeakerIds}
              onChange={setSelectedSpeakerIds}
              placeholder="Type to search speakers..."
              display={(s) => s?.name || `${s?.first_name || ""} ${s?.last_name || ""}`.trim()}
            />
            {selectedSpeakerIds.length === 0 && (
                <p className="text-sm text-amber-600 flex items-center gap-1 mt-1">
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"></path></svg>
                    At least one speaker is required.
                </p>
            )}
          </div>

          {/* Footer / Actions */}
          <div className="pt-6 mt-8 border-t border-slate-100 flex items-center justify-end gap-3 sticky bottom-0 bg-white pb-2">
            <button 
                type="button" 
                onClick={onClose} 
                className="px-6 py-2.5 rounded-lg border border-slate-300 text-slate-700 font-medium hover:bg-slate-50 hover:text-slate-900 transition-colors"
            >
                Cancel
            </button>
            <button 
                type="submit" 
                disabled={loading} 
                className="px-8 py-2.5 rounded-lg bg-indigo-600 text-white font-semibold hover:bg-indigo-700 active:bg-indigo-800 disabled:opacity-50 disabled:cursor-not-allowed shadow-md hover:shadow-lg transition-all flex items-center gap-2"
            >
                {loading && (
                    <svg className="animate-spin h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                )}
                {loading ? "Saving Changes..." : "Save Updates"}
            </button>
          </div>
        </form>
      </div>

      <ToastContainer position="bottom-right" theme="colored" />
    </ModalWrapper>
  );
}