"use client";

import { useEffect, useState } from "react";
import EventCard from "./EventCard";
import { getEvents, makeRequest, hostSocket } from "@/lib/api/index";
import RouteLoader from "@/app/components/Common/RouteLoader";

const EVENT_ROUTES = {
  all: "/api/events",
  upcoming: "/api/events/upcoming",
  ongoing: "/api/events/ongoing",
  ended: "/api/events/ended",
};

export default function EventsList() {
  const [events, setEvents] = useState([]);
  const [filter, setFilter] = useState("all");
  const [loading, setLoading] = useState(true);
  const [errMsg, setErrMsg] = useState("");

  useEffect(() => {
    let isMounted = true;

    const fetchEvents = async () => {
      setLoading(true);
      setErrMsg("");

      try {
        let data;

        // ✅ Use your original logic for ALL events
        if (filter === "all" && typeof getEvents === "function") {
          data = await getEvents();
        } else {
          const route = EVENT_ROUTES[filter];
          data = await makeRequest(`${hostSocket}${route}`, "GET");
        }

        // ✅ Safe parsing just like your old logic
        const eventsArr = Array.isArray(data) ? data : data?.events || [];

        if (isMounted) setEvents(eventsArr);
      } catch (err) {
        if (isMounted) setErrMsg(err?.message || "Failed to load events");
      } finally {
        if (isMounted) setLoading(false);
      }
    };

    fetchEvents();

    return () => {
      isMounted = false;
    };
  }, [filter]);

  // ✅ Loading state
  if (loading) return <RouteLoader />;

  // ✅ Error state
  if (errMsg)
    return <p className="text-red-500 text-center p-4">{errMsg}</p>;

  return (
    <div className="w-full">

      {/* ✅ FILTER BAR */}
      <div className="w-full p-4 bg-white border-b sticky top-[64px] z-40">
        <div className="flex gap-3 overflow-x-auto">
          {["all", "upcoming", "ongoing", "ended"].map((type) => (
            <button
              key={type}
              onClick={() => setFilter(type)}
              className={`px-4 py-2 rounded-full text-sm font-semibold transition
                ${filter === type ? "bg-blue-600 text-white" : "bg-gray-200 text-gray-700 hover:bg-gray-300"}
              `}
            >
              {type.charAt(0).toUpperCase() + type.slice(1)}
            </button>
          ))}
        </div>
      </div>

      {/* ✅ EVENT LIST FROM YOUR ORIGINAL LOGIC */}
      <div className="flex flex-wrap">
        {events.map((event) => {
          const start = event?.start_time ? new Date(event.start_time) : null;
          const year = start ? start.getFullYear() : "N/A";
          const month = start ? start.getMonth() + 1 : "N/A";

          return (
            <EventCard
              key={event._id}
              id={event._id}
              heading={event.title}
              date={{ year, month }}
              location={event?.location?.address || "Unknown"}
              img={
                 event?.image 
                 ? `${hostSocket}${event.image}`  
                 : "./logo.png" 
              }
            />
          );
        })}

        {/* ✅ Empty state */}
        {!events.length && (
          <p className="w-full text-center text-gray-500 text-xl mt-6">
            No events found.
          </p>
        )}
      </div>
    </div>
  );
}
