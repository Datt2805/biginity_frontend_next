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
      // ... (Your existing logic remains exactly the same) ...
      console.log("--- DEBUG: Starting EventDetails Init ---");
      try {
        const user = await fetchUserDetail();
        if (!user) { setUserLoggedIn(false); return; }
        setUserLoggedIn(true);
        setIsAdmin(user.role === "Admin")

        console.log("speakers :", event.speakers);
        if (event.speakers && event.speakers.length > 0 && typeof event.speakers[0] === 'object' && event.speakers[0].name) {
          setSpeakerList(event.speakers);
          return;
        }

        const allEvents = await getEvents();
        if (allEvents && allEvents.length > 0) {
          const currentId = event._id || event.id;
          const freshEvent = allEvents.find(e => (e._id === currentId) || (e.id === currentId));
          if (freshEvent && freshEvent.speakers && typeof freshEvent.speakers[0] === 'object' && freshEvent.speakers[0].name) {
            setSpeakerList(freshEvent.speakers);
            return;
          }
        }

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

  const formatDate = (d) => d ? new Date(d).toLocaleString() : "N/A";
  const formatList = (arr) => Array.isArray(arr) ? arr.join(", ") : (arr || "All");


  // EDIT EVENT MODAL DATA
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [eventToEdit, setEventToEdit] = useState(event);

  const openModal = (eventData) => {
    setEventToEdit(eventData);
    setIsModalOpen(true);
  };

  return (
    <>
      <div className="max-w-5xl mx-auto px-4 py-8 bg-gray-50 min-h-screen">
        {/* Back Button */}
        <button
          onClick={() => router.back()}
          className="mb-6 inline-flex items-center gap-2 px-4 py-2 bg-white shadow-sm border border-gray-200 rounded-lg text-gray-700 hover:bg-gray-100 transition-colors"
        >
          <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
          </svg>
          Back to Events
        </button>
        {/*edit button*/}
        {
          isAdmin &&
          <button
            className="mb-6 inline-flex items-center float-right gap-2 px-4 py-2 bg-green-200 shadow-sm border border-gray-200 rounded-lg text-gray-700 hover:bg-green-100 transition-colors"
            onClick={() => openModal(eventToEdit)}>Open Event Editor</button>
        }
        {/* Title */}
        <h1 className="text-3xl md:text-4xl font-extrabold mb-6 text-gray-900">{event.title}</h1>

        {/* --- UPDATED IMAGE SECTION --- */}
        {/* 1. 'bg-black/5' adds a light background so if the image is a different aspect ratio, the empty space looks nice.
         2. 'max-h-[600px]' prevents tall posters from taking up the entire screen.
         3. 'object-contain' ensures the WHOLE image is seen (no cropping).
      */}
        <div className="mb-8 w-full bg-black/5 rounded-2xl overflow-hidden shadow-lg border border-gray-200 relative flex justify-center items-center">
          <Image
            src={event?.image ? `${hostSocket}${event.image}` : defaultPlaceholder}
            alt={event.title || "Event Image"}
            width={0}
            height={0}
            sizes="100vw"
            className="w-full h-auto max-h-[500px] object-contain"
            priority
          />

          {/* Status Badge */}
          {event.status && (
            <div className="absolute top-4 right-4 bg-black/70 backdrop-blur-md text-white px-3 py-1 rounded-full text-sm font-semibold uppercase tracking-wider shadow-sm">
              {event.status}
            </div>
          )}
        </div>
        {/* --- END UPDATED IMAGE SECTION --- */}

        {/* Main Info Card */}
        <div className="bg-white p-6 md:p-8 mb-8 rounded-2xl shadow-sm border border-gray-200">
          <h2 className="text-2xl font-bold mb-6 text-gray-800 border-b pb-2">Event Overview</h2>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-y-6 gap-x-12">
            <div className="space-y-4">
              <div>
                <p className="text-sm text-gray-500 font-semibold uppercase tracking-wide">Start Time</p>
                <p className="text-lg text-gray-900 font-medium">{formatDate(event.start_time)}</p>
              </div>
              <div>
                <p className="text-sm text-gray-500 font-semibold uppercase tracking-wide">End Time</p>
                <p className="text-lg text-gray-900 font-medium">{formatDate(event.end_time)}</p>
              </div>
              <div>
                <p className="text-sm text-gray-500 font-semibold uppercase tracking-wide">Location</p>
                <p className="text-lg text-gray-900 font-medium flex items-center gap-2">
                  <span className="text-red-500">📍</span>
                  {event.location?.address || event.location || "To Be Announced"}
                </p>
              </div>
            </div>
          </div>

          <div className="mt-8 pt-6 border-t border-gray-100">
            <h3 className="text-lg font-bold text-gray-800 mb-3">About this Event</h3>
            <p className="text-gray-700 leading-relaxed whitespace-pre-wrap">
              {event.description?.detail || event.description || "No specific details provided for this event."}
            </p>
          </div>
        </div>

        {/* Speakers Section */}
        <div>
          <h2 className="text-2xl font-bold mb-6 text-gray-900">Featured Speakers</h2>
          {userLoggedIn === null && (
            <div className="p-12 text-center bg-white rounded-2xl shadow-sm border border-gray-200 animate-pulse">
              <div className="h-4 bg-gray-200 rounded w-1/4 mx-auto mb-4"></div>
              <p className="text-gray-500">Verifying access...</p>
            </div>
          )}
          {userLoggedIn === false && (
            <div className="bg-gradient-to-r from-blue-50 to-indigo-50 p-8 rounded-2xl shadow-sm text-center border border-blue-100">
              <h3 className="text-xl font-bold text-gray-800 mb-2">Speaker details are protected</h3>
              <p className="text-gray-600 mb-6">Please sign in to view guest profiles and details.</p>
              <button
                className="bg-blue-600 hover:bg-blue-700 transition rounded-lg px-8 py-3 text-white font-medium shadow-md"
                onClick={() => router.push("/LoginSignUp")}
              >
                Log In to View
              </button>
            </div>
          )}
          {userLoggedIn === true && (
            <>
              {speakerList.length === 0 ? (
                <div className="p-8 bg-white rounded-2xl shadow-sm text-center border border-dashed border-gray-300">
                  <p className="text-gray-500 italic">No speaker information available currently.</p>
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {speakerList.map((speaker, index) => (
                    <div key={index} className="flex flex-col items-center p-6 bg-white shadow-sm hover:shadow-md transition-shadow rounded-2xl border border-gray-200 text-center">
                      <div className="relative h-24 w-24 mb-4">
                        <Image
                          src={speaker.profile ? `${hostSocket}${speaker.profile}` : defaultPlaceholder}
                          alt={speaker.name || "Speaker"}
                          fill
                          className="rounded-full object-cover border-4 border-blue-50"
                        />
                      </div>
                      <h3 className="font-bold text-xl text-gray-900">{speaker.name}</h3>
                      <p className="text-blue-600 font-medium text-sm mb-2">{speaker.organization || "Guest Speaker"}</p>
                      {speaker.bio && <p className="text-gray-500 text-sm line-clamp-3">{speaker.bio}</p>}
                    </div>
                  ))}
                </div>
              )}
            </>
          )}
        </div>
      </div>
      <UpdateEventModal
        existingEvent={eventToEdit}
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
      />
    </>
  );
}