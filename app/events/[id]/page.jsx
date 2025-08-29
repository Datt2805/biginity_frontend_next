"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import EventDetails from "@/app/components/Event/EventDetails";
import { makeRequest, hostSocket } from "@/lib/api";
import Loader from "@/app/components/Loader/Loader";

export default function EventDetailPage() {
  const params = useParams();
  const [event, setEvent] = useState(null);
  const [loading, setLoading] = useState(true);

useEffect(() => {
  async function fetchEvent() {
    try {
      const data = await makeRequest(`${hostSocket}/api/events/`, "GET");

      // Find the one by ID
      const eventData = (data.events || []).find(ev => ev._id === params.id);

      if (!eventData) {
        setEvent(null);
        return;
      }

      // Fetch speakers if needed
      let speakers = [];
      if (eventData?.speaker_ids?.length) {
        speakers = await Promise.all(
          eventData.speaker_ids.map(async (id) => {
            try {
              return await makeRequest(`${hostSocket}/api/users/${id}`, "GET");
            } catch (err) {
              console.error("Error fetching speaker", id, err);
              return null;
            }
          })
        );
      }

      setEvent({ ...eventData, speakers: speakers.filter(Boolean) });
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  }

  fetchEvent();
}, [params.id]);


  if (loading) return <Loader/>;
  if (!event) return <p className="p-6 text-red-500">Event not found.</p>;

  return (
    <main className="p-6">
      <EventDetails event={event} />
    </main>
  );
}
