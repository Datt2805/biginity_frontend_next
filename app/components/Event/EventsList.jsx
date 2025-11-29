"use client";

import { useEffect, useState, useRef } from "react";
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

  // requestId ensures we only accept the latest response
  const requestIdRef = useRef(0);

useEffect(() => {
    const currentRequestId = ++requestIdRef.current;
    let aborted = false;

    const fetchEvents = async () => {
      setLoading(true);
      setErrMsg("");

      try {
        let data;

        if (filter === "all" && typeof getEvents === "function") {
          data = await getEvents();
        } else {
          const route = EVENT_ROUTES[filter] || EVENT_ROUTES.all;
          data = await makeRequest(`${hostSocket}${route}`, "GET");
        }

        if (aborted || currentRequestId !== requestIdRef.current) return;

        const eventsArr = Array.isArray(data) ? data : data?.events || [];
        
        eventsArr.sort((a, b) => {
          const dateA = new Date(a.start_time || 0);
          const dateB = new Date(b.start_time || 0);
          return dateB - dateA; 
        });
        setEvents(eventsArr);
      } catch (err) {
        if (aborted || currentRequestId !== requestIdRef.current) return;
        setErrMsg(err?.message || "Failed to load events");
      } finally {
        if (aborted || currentRequestId !== requestIdRef.current) return;
        setLoading(false);
      }
    };

    fetchEvents();

    return () => {
      aborted = true;
    };
  }, [filter]);

  if (loading) return <RouteLoader />;
  if (errMsg) return <p className="text-red-500 text-center p-4">{errMsg}</p>;

  return (
    <div className="w-full">
      {/* FILTER BAR */}
      <div className="w-full p-4 bg-white border-b mb-6">
        <div className="flex flex-wrap gap-3">
          {["all", "upcoming", "ongoing", "ended"].map((type) => (
            <button
              key={type}
              onClick={() => setFilter(type)}
              className={`px-4 py-2 rounded-full text-sm font-semibold transition
                ${
                  filter === type
                    ? "bg-blue-600 text-white"
                    : "bg-gray-200 text-gray-700 hover:bg-gray-300"
                }
              `}
            >
              {type.charAt(0).toUpperCase() + type.slice(1)}
            </button>
          ))}
        </div>
      </div>

      {/* EVENT LIST */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
        {events.length === 0 && (
          <p className="w-full text-center text-gray-500 text-xl mt-6">No events found.</p>
        )}

        {events.map((event) => {
          const start = event?.start_time ? new Date(event.start_time) : null;
          const end = event?.end_time ? new Date(event.end_time) : null;
          const now = new Date();

          const year = start ? start.getFullYear() : "N/A";
          const month = start ? start.getMonth() + 1 : "N/A";

          // --- AUTO DETECT STATUS ---
          let status = "Upcoming";
          if (end && now > end) status = "Ended";
          else if (start && end && now >= start && now <= end) status = "Ongoing";

          return (
            <EventCard
              key={event._id || event.id}
              id={event._id || event.id}
              heading={event.title}
              date={{ year, month }}
              location={event?.location?.address || "Unknown"}
              img={event?.image ? `${hostSocket}${event.image}` : undefined}
              status={status}
            />
          );
        })}
      </div>
    </div>
  );
}
