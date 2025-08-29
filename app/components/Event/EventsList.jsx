"use client";

import { useEffect, useState } from "react";
import EventCard from "./EventCard";
// import { dummyEvents } from "./dummyEvents";
import { getEvents } from "@/lib/api/index";
import RouteLoader from "@/app/components/Loader/RouteLoader";



export default function EventsList() {
  const [events, setEvents] = useState([]);
  const [loading, setLoading] = useState(true);

  const data = getEvents();
  console.log(data);
  
  useEffect(()=>{
    getEvents()
      .then((data)=>{
        setEvents(data.events || []);
      })
      .catch((err)=>{
        console.log(err);
      })
      .finally(()=>{
        setLoading(false);
      })
  }, []);

  if (loading) return <RouteLoader/>
  if (!events.length) return <p className="p-6 text-gray-500 flex items-center justify-center text-center text-9xl">No events found.</p>;
  
  return (
    <div className="flex flex-wrap">
      {events.map((event) => (
        <EventCard
          key={event._id}
          id={event._id}
          title={event.title}
          date={event.start_time}
          location={event.location.address}
          img={event.image}
        />
      ))}
    </div>
  );
}
