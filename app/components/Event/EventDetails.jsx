"use client";

import { useEffect, useState } from "react";
import Image from "next/image";
import defaultPlaceholder from "@/public/logo.png";
import { useRouter } from "next/navigation";
// Import getEvents to fetch the fresh, populated data
import { fetchUserDetail, hostSocket, getEvents, fetchSpeakersOnly } from "@/lib/api";

export default function EventDetails({ event }) {
  const [userLoggedIn, setUserLoggedIn] = useState(null); // null = loading
  const [speakerList, setSpeakerList] = useState([]);
  const router = useRouter();

  useEffect(() => {
    async function initData() {
      console.log("--- DEBUG: Starting EventDetails Init ---");
      console.log("Initial Event Prop:", event);

      try {
        // 1. AUTH CHECK
        const user = await fetchUserDetail();
        console.log("Auth Check Result:", user);

        if (!user) {
          setUserLoggedIn(false);
          return;
        }
        setUserLoggedIn(true);

        // 2. CHECK IF SPEAKERS ARE ALREADY LOADED IN PROP
        // If event.speakers exists and the first item is an OBJECT with a name, we are done.
        if (event.speakers && event.speakers.length > 0 && typeof event.speakers[0] === 'object' && event.speakers[0].name) {
             console.log("Speakers are already populated in props.");
             setSpeakerList(event.speakers);
             return;
        }

        // 3. STRATEGY A: FETCH FRESH EVENT DATA
        // If we only have IDs, let's try getting the fresh event list. 
        // Often the 'getEvents' API returns fully populated data.
        console.log("Speakers are missing or are just IDs. Fetching fresh event list...");
        
        const allEvents = await getEvents();
        if (allEvents && allEvents.length > 0) {
            // Find current event
            const currentId = event._id || event.id;
            const freshEvent = allEvents.find(e => (e._id === currentId) || (e.id === currentId));
            
            console.log("Fresh Event Found:", freshEvent);

            if (freshEvent && freshEvent.speakers && freshEvent.speakers.length > 0) {
                // Check if this fresh data is populated (has names)
                if (typeof freshEvent.speakers[0] === 'object' && freshEvent.speakers[0].name) {
                    console.log("Found populated speakers in fresh fetch!");
                    setSpeakerList(freshEvent.speakers);
                    return; // Success!
                }
            }
        }

        // 4. STRATEGY B: MANUAL FETCH & MATCH (Fallback)
        // If Strategy A failed (backend sent IDs only), we fetch all speakers and match manually.
        console.log("Fresh fetch didn't give details. Trying Manual Match...");
        
        const allSpeakers = await fetchSpeakersOnly();
        console.log("All Speakers Fetched:", allSpeakers);

        if (event.speakers && event.speakers.length > 0 && allSpeakers.length > 0) {
            // Normalize Event Speaker IDs to strings
            const eventSpeakerIds = event.speakers.map(s => {
                const val = (typeof s === 'object' && s !== null) ? (s._id || s.id) : s;
                return String(val);
            });

            // Filter Global List
            const matched = allSpeakers.filter(sp => {
                const spId = String(sp._id || sp.id);
                return eventSpeakerIds.includes(spId);
            });

            console.log("Manual Matches Found:", matched);
            setSpeakerList(matched);
        }

      } catch (err) {
        console.error("CRITICAL ERROR:", err);
        setUserLoggedIn(false);
      }
    }

    initData();
  }, [event]); 

  return (
    <div className="max-w-5xl mx-auto px-4 py-8 bg-gray-100 min-h-screen">
      <button
        onClick={() => router.back()}
        className="mb-6 inline-flex items-center gap-2 px-4 py-2 bg-white shadow rounded-lg text-gray-700 hover:bg-gray-100 transition-colors"
      >
        <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
        </svg>
        Back
      </button>

      <h1 className="text-3xl font-bold mb-6 text-gray-900">{event.title}</h1>

      {/* --- UPDATED IMAGE SECTION START --- */}
      {/* Removed fixed height (h-[400px]) and 'relative'. Added w-full. */}
      <div className="mb-6 w-full rounded-2xl overflow-hidden shadow-md bg-gray-200">
        <Image
          src={event?.image ? `${hostSocket}${event.image}` : defaultPlaceholder}
          alt={event.title || "Event Image"}
          width={0}
          height={0}
          sizes="100vw"
          // This style makes the height auto-adjust based on width (100%)
          style={{ width: '100%', height: 'auto' }}
          priority
        />
      </div>
      {/* --- UPDATED IMAGE SECTION END --- */}

      <div className="bg-white p-6 mb-8 rounded-xl shadow-sm border border-gray-100">
          <h2 className="text-xl font-bold mb-4">Event Details</h2>
          <p><strong>Start:</strong> {new Date(event.start_time).toLocaleString()}</p>
          <p><strong>Location:</strong> {event.location?.address || "TBA"}</p>
          <p className="mt-4 text-gray-700">{event.description?.detail}</p>
      </div>

      {/* --- SPEAKERS SECTION --- */}
      
      {/* 1. Loading */}
      {userLoggedIn === null && (
        <div className="p-8 text-center bg-white rounded-xl shadow-sm animate-pulse">
          <p className="text-gray-500">Checking permissions...</p>
        </div>
      )}

      {/* 2. Not Logged In */}
      {userLoggedIn === false && (
        <div className="bg-white p-8 rounded-xl shadow-sm text-center border border-gray-200">
          <h3 className="text-xl font-medium text-gray-800 mb-2">Speaker Details Protected</h3>
          <button
            className="bg-blue-600 rounded-lg px-6 py-2 text-white"
            onClick={() => router.push("/LoginSignUp")}
          >
            Log in now
          </button>
        </div>
      )}

      {/* 3. Logged In */}
      {userLoggedIn === true && (
        <div>
          <h2 className="text-2xl font-semibold mb-4 text-gray-900">Speakers</h2>
          
          {speakerList.length === 0 ? (
            <div className="p-6 bg-white rounded-xl shadow-sm text-center">
              <p className="text-gray-500">No speakers found. (Check console for debug info)</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
              {speakerList.map((speaker, index) => (
                <div key={index} className="flex items-center gap-4 p-4 bg-white shadow rounded-xl">
                  <div className="relative h-16 w-16 flex-shrink-0">
                    <Image
                      src={speaker.profile ? `${hostSocket}${speaker.profile}` : defaultPlaceholder}
                      alt={speaker.name || "Speaker"}
                      fill
                      className="rounded-full object-cover"
                    />
                  </div>
                  <div>
                    <p className="font-semibold text-lg text-gray-800">{speaker.name}</p>
                    <p className="text-sm text-gray-500">{speaker.organization || "Guest Speaker"}</p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}