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
  const [searchQuery, setSearchQuery] = useState("");

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

  const filteredEvents = events.filter((event) => {
    const query = searchQuery.toLowerCase();
    const title = event.title?.toLowerCase() || "";
    const address = event.location?.address?.toLowerCase() || "";
    return title.includes(query) || address.includes(query);
  });

  if (loading) return <RouteLoader />;
  if (errMsg) 
    return (
      <div className="flex flex-col items-center justify-center p-12 text-center">
        <div className="text-red-500 bg-red-50 p-3 rounded-full mb-4">
          <svg className="w-8 h-8" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
          </svg>
        </div>
        <p className="text-gray-800 font-medium">{errMsg}</p>
        <button onClick={() => window.location.reload()} className="mt-4 text-blue-600 hover:underline">Try Again</button>
      </div>
    );

  return (
    <div className="w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      
      {/* HEADER SECTION */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-8">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Explore Events</h1>
          <p className="text-gray-500 mt-1">Discover what's happening around campus</p>
        </div>

        {/* SEARCH BAR */}
        <div className="relative w-full md:w-80">
          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
            {/* Search Icon SVG */}
            <svg className="h-5 w-5 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>
          </div>
          <input
            type="text"
            placeholder="Search events..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="block w-full pl-10 pr-3 py-2.5 border border-gray-200 rounded-xl leading-5 bg-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition duration-150 ease-in-out shadow-sm"
          />
        </div>
      </div>

      {/* TABS / FILTER BAR */}
      <div className="border-b border-gray-200 mb-8">
        <nav className="-mb-px flex space-x-6 overflow-x-auto no-scrollbar" aria-label="Tabs">
          {["all", "upcoming", "ongoing", "ended"].map((type) => {
            const isActive = filter === type;
            return (
              <button
                key={type}
                onClick={() => {
                  setFilter(type);
                  setSearchQuery("");
                }}
                className={`
                  whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm transition-colors duration-200
                  ${isActive 
                    ? "border-blue-500 text-blue-600" 
                    : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300"
                  }
                `}
              >
                {type.charAt(0).toUpperCase() + type.slice(1)}
                {/* Optional: Add count badge here if available */}
              </button>
            );
          })}
        </nav>
      </div>

      {/* EVENT GRID */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8">
        {filteredEvents.length === 0 && (
          <div className="col-span-full flex flex-col items-center justify-center py-16 text-center">
            <div className="bg-gray-50 rounded-full p-4 mb-4">
              <svg className="w-10 h-10 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
              </svg>
            </div>
            <h3 className="text-lg font-medium text-gray-900">No events found</h3>
            <p className="mt-1 text-gray-500">
              {searchQuery ? `We couldn't find anything matching "${searchQuery}"` : "Check back later for new events!"}
            </p>
            {searchQuery && (
               <button 
                 onClick={() => setSearchQuery("")}
                 className="mt-4 text-blue-600 hover:text-blue-700 font-medium text-sm"
               >
                 Clear Search
               </button>
            )}
          </div>
        )}

        {filteredEvents.map((event) => {
          const start = event?.start_time ? new Date(event.start_time) : null;
          const end = event?.end_time ? new Date(event.end_time) : null;
          const now = new Date();

          const year = start ? start.getFullYear() : "N/A";
          const month = start ? start.getMonth() + 1 : "N/A";

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