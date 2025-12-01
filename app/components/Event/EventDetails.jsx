"use client";

import { fetchSpeakersOnly, fetchUserDetail, getEvents, hostSocket } from "@/lib/api";
import defaultPlaceholder from "@/public/logo.png";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import UpdateEventModal from "./UpdateEvent";

export default function EventDetails({ event }) {

  const [isAdmin, setIsAdmin] = useState(false);
  const [userLoggedIn, setUserLoggedIn] = useState(null); // null = loading
  const [speakerList, setSpeakerList] = useState([]);
  const router = useRouter();

  useEffect(() => {
    async function initData() {
      console.log("--- DEBUG: Starting EventDetails Init ---");
      try {
        const user = await fetchUserDetail();
        if (!user) { setUserLoggedIn(false); return; }
        setUserLoggedIn(true);
        setIsAdmin(user.role === "Admin")

        // 1. Check if speakers are already full objects in props
        if (event.speakers && event.speakers.length > 0 && typeof event.speakers[0] === 'object' && event.speakers[0].name) {
          setSpeakerList(event.speakers);
          return;
        }

        // 2. If not, try fetching from all events list to get fresh data
        const allEvents = await getEvents();
        if (allEvents && allEvents.length > 0) {
          const currentId = event._id || event.id;
          const freshEvent = allEvents.find(e => (e._id === currentId) || (e.id === currentId));
          if (freshEvent && freshEvent.speakers && typeof freshEvent.speakers[0] === 'object' && freshEvent.speakers[0].name) {
            setSpeakerList(freshEvent.speakers);
            return;
          }
        }

        // 3. Last resort: Fetch all speakers and filter by ID
        const allSpeakers = await fetchSpeakersOnly();
        if (event.speakers && event.speakers.length > 0 && allSpeakers.length > 0) {
          const eventSpeakerIds = event.speakers.map(s => String((typeof s === 'object' && s !== null) ? (s._id || s.id) : s));
          const matched = allSpeakers.filter(sp => eventSpeakerIds.includes(String(sp._id || sp.id)));
          setSpeakerList(matched);
        }

      } catch (err) {
        console.error(err);
        setUserLoggedIn(false);
      }
    }
    initData();
  }, [event]);

  const formatDate = (d) => d ? new Date(d).toLocaleString(undefined, {
    dateStyle: "medium",
    timeStyle: "short"
  }) : "N/A";

  // --- MODAL STATE ---
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [eventToEdit, setEventToEdit] = useState(event);

  const openModal = (eventData) => {
    setEventToEdit(eventData);
    setIsModalOpen(true);
  };

  return (
    <>
      <div className="min-h-screen bg-slate-50/50 pb-20">
        
        {/* --- HERO / HEADER SECTION --- */}
        <div className="bg-white border-b border-slate-200 shadow-sm sticky top-0 z-10">
            <div className="max-w-5xl mx-auto px-4 md:px-8 py-4 flex items-center justify-between">
                 <button
                    onClick={() => router.back()}
                    className="group inline-flex items-center gap-2 px-3 py-1.5 text-sm font-medium text-slate-600 hover:text-slate-900 hover:bg-slate-100 rounded-lg transition-all"
                >
                    <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="group-hover:-translate-x-1 transition-transform"><path d="m15 18-6-6 6-6"/></svg>
                    Back
                </button>

                {isAdmin && (
                    <button
                        onClick={() => openModal(eventToEdit)}
                        className="inline-flex items-center gap-2 px-4 py-2 bg-indigo-600 text-white text-sm font-semibold rounded-lg shadow-sm hover:bg-indigo-700 hover:shadow-md transition-all active:scale-95"
                    >
                        <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M17 3a2.828 2.828 0 1 1 4 4L7.5 20.5 2 22l1.5-5.5L17 3z"/></svg>
                        Edit Event
                    </button>
                )}
            </div>
        </div>

        <div className="max-w-5xl mx-auto px-4 md:px-8 py-8 space-y-8">

            {/* --- TITLE & BANNER --- */}
            <div className="space-y-6">
                 <div>
                    <h1 className="text-3xl md:text-5xl font-extrabold text-slate-900 tracking-tight leading-tight">
                        {event.title}
                    </h1>
                     <div className="mt-4 flex flex-wrap gap-2">
                        {event.status && (
                             <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-emerald-100 text-emerald-800 border border-emerald-200">
                                {event.status}
                             </span>
                        )}
                        {event.mandatory && (
                             <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-rose-100 text-rose-800 border border-rose-200">
                                Mandatory
                             </span>
                        )}
                     </div>
                 </div>

                 {/* Image Container */}
                 <div className="relative w-full aspect-video md:aspect-[21/9] bg-slate-900 rounded-2xl overflow-hidden shadow-xl border border-slate-200">
                    <Image
                        src={event?.image ? `${hostSocket}${event.image}` : defaultPlaceholder}
                        alt={event.title || "Event Image"}
                        fill
                        className="object-contain"
                        priority
                    />
                 </div>
            </div>

            {/* --- MAIN CONTENT GRID --- */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                
                {/* Left Column: Details */}
                <div className="lg:col-span-2 space-y-8">
                    
                    {/* Description */}
                    <div className="prose prose-slate max-w-none">
                        <h3 className="text-xl font-bold text-slate-800 flex items-center gap-2 mb-4">
                            Event Details
                        </h3>
                        <p className="text-slate-600 leading-relaxed whitespace-pre-wrap text-lg">
                             {event.description?.detail || event.description || "No specific details provided for this event."}
                        </p>
                    </div>

                    {/* Objectives & Outcomes Cards */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        {(event.objectives || event.description?.objectives) && (
                            <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm relative overflow-hidden">
                                <div className="absolute top-0 left-0 w-1 h-full bg-blue-500"></div>
                                <h3 className="font-bold text-slate-800 mb-3 flex items-center gap-2">
                                    <svg className="w-5 h-5 text-blue-500" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" /></svg>
                                    Objectives
                                </h3>
                                <p className="text-sm text-slate-600 leading-relaxed whitespace-pre-wrap">
                                    {event.objectives || event.description?.objectives}
                                </p>
                            </div>
                        )}

                        {(event.learning_outcomes || event.description?.learning_outcomes) && (
                            <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm relative overflow-hidden">
                                <div className="absolute top-0 left-0 w-1 h-full bg-indigo-500"></div>
                                <h3 className="font-bold text-slate-800 mb-3 flex items-center gap-2">
                                     <svg className="w-5 h-5 text-indigo-500" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" /></svg>
                                    Learning Outcomes
                                </h3>
                                <p className="text-sm text-slate-600 leading-relaxed whitespace-pre-wrap">
                                    {event.learning_outcomes || event.description?.learning_outcomes}
                                </p>
                            </div>
                        )}
                    </div>
                </div>

                {/* Right Column: Key Info (Sticky) */}
                <div className="lg:col-span-1">
                    <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6 sticky top-24 space-y-6">
                        <h3 className="font-bold text-slate-400 uppercase tracking-wider text-xs">At a Glance</h3>
                        
                        <div className="space-y-5">
                            <div className="flex gap-4 items-start">
                                <div className="p-2 bg-blue-50 text-blue-600 rounded-lg shrink-0">
                                    <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg>
                                </div>
                                <div>
                                    <p className="text-sm font-medium text-slate-500">Start Time</p>
                                    <p className="text-slate-900 font-semibold">{formatDate(event.start_time)}</p>
                                </div>
                            </div>

                            <div className="flex gap-4 items-start">
                                <div className="p-2 bg-indigo-50 text-indigo-600 rounded-lg shrink-0">
                                    <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 8 14"/></svg>
                                </div>
                                <div>
                                    <p className="text-sm font-medium text-slate-500">End Time</p>
                                    <p className="text-slate-900 font-semibold">{formatDate(event.end_time)}</p>
                                </div>
                            </div>

                             <div className="flex gap-4 items-start">
                                <div className="p-2 bg-rose-50 text-rose-600 rounded-lg shrink-0">
                                    <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M20 10c0 6-8 12-8 12s-8-6-8-12a8 8 0 0 1 16 0Z"/><circle cx="12" cy="10" r="3"/></svg>
                                </div>
                                <div>
                                    <p className="text-sm font-medium text-slate-500">Location</p>
                                    <p className="text-slate-900 font-semibold">
                                        {event.location?.address || event.location || "To Be Announced"}
                                    </p>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

            </div>

            <hr className="border-slate-200 my-10" />

            {/* --- SPEAKERS SECTION --- */}
            <div className="space-y-8">
                <div className="flex items-center gap-3">
                     <h2 className="text-2xl font-bold text-slate-900">Featured Speakers</h2>
                     <span className="px-2.5 py-0.5 rounded-full bg-slate-100 text-slate-600 text-xs font-semibold">
                        {speakerList.length}
                     </span>
                </div>
          
                {userLoggedIn === null && (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 animate-pulse">
                        {[1,2,3].map(i => (
                             <div key={i} className="h-48 bg-slate-200 rounded-2xl"></div>
                        ))}
                    </div>
                )}

                {userLoggedIn === false && (
                    <div className="relative overflow-hidden rounded-3xl bg-white border border-slate-200 shadow-sm p-10 text-center">
                        <div className="absolute inset-0 bg-[url('/grid-pattern.svg')] opacity-5"></div>
                        <div className="relative z-10 max-w-lg mx-auto space-y-4">
                            <div className="mx-auto w-12 h-12 bg-slate-100 rounded-full flex items-center justify-center text-slate-400 mb-2">
                                <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="11" width="18" height="11" rx="2" ry="2"/><path d="M7 11V7a5 5 0 0 1 10 0v4"/></svg>
                            </div>
                            <h3 className="text-2xl font-bold text-slate-900">Guest List Locked</h3>
                            <p className="text-slate-500">Sign in with your university account to view speaker profiles, bios, and connection details.</p>
                            <button
                                className="mt-4 inline-flex items-center justify-center px-6 py-2.5 border border-transparent text-sm font-medium rounded-lg text-white bg-slate-900 hover:bg-slate-800 transition-all shadow-lg hover:shadow-xl"
                                onClick={() => router.push("/LoginSignUp")}
                            >
                                Log In to Access
                            </button>
                        </div>
                    </div>
                )}

                {userLoggedIn === true && (
                    <>
                    {speakerList.length === 0 ? (
                        <div className="p-12 text-center bg-slate-50 rounded-2xl border border-dashed border-slate-300">
                             <p className="text-slate-500">No speaker information has been published yet.</p>
                        </div>
                    ) : (
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                            {speakerList.map((speaker, index) => (
                                <div key={index} className="group bg-white rounded-2xl border border-slate-200 p-6 shadow-sm hover:shadow-xl transition-all duration-300 flex flex-col items-center text-center">
                                    <div className="relative h-24 w-24 mb-5">
                                        <Image
                                            src={speaker.profile ? `${hostSocket}${speaker.profile}` : defaultPlaceholder}
                                            alt={speaker.name || "Speaker"}
                                            fill
                                            className="rounded-full object-cover border-4 border-white shadow-md group-hover:scale-105 transition-transform duration-300"
                                        />
                                        <div className="absolute bottom-1 right-1 w-5 h-5 bg-green-500 border-2 border-white rounded-full"></div>
                                    </div>
                                    
                                    <h3 className="font-bold text-lg text-slate-900 mb-1">{speaker.name}</h3>
                                    <p className="text-indigo-600 font-medium text-sm mb-4 bg-indigo-50 px-3 py-1 rounded-full">
                                        {speaker.organization || "Guest Speaker"}
                                    </p>
                                    
                                    {speaker.bio && (
                                        <p className="text-slate-500 text-sm leading-relaxed line-clamp-3 mb-4">
                                            {speaker.bio}
                                        </p>
                                    )}
                                </div>
                            ))}
                        </div>
                    )}
                    </>
                )}
            </div>

        </div>
      </div>

      {/* --- UPDATE MODAL --- */}
      <UpdateEventModal
        existingEvent={eventToEdit}
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
      />
    </>
  );
}