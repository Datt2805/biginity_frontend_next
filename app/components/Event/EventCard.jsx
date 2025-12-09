"use client";

import { fetchUserDetail, hostSocket, makeSecureRequest } from "@/lib/api";
import defaultPlaceholder from "@/public/logo.png";
import Image from "next/image";
import Link from "next/link";
import { useEffect, useState } from "react";
import { toast } from "react-toastify";

export default function EventCard({ id, heading, date, location, img, status, startTime }) {
  const [user, setUser] = useState(null);

  useEffect(() => {
    let isMounted = true;
    fetchUserDetail()
      .then((usr) => {
        if (isMounted) setUser(usr);
      })
      .catch((err) => {
        console.error(err);
        setUser(null);
      });
      
    return () => { isMounted = false; };
  }, []);

  const role = user?.role?.toLowerCase(); 
  const isStudent = role === "student";
  const isAdmin = role === "admin";
  const isNotEnded = status !== "Ended";
  
  const showEnrollButton = user && isStudent && isNotEnded;
  const showDeleteButton = user && isAdmin; 

  const getStatusStyles = (s) => {
    switch (s) {
      case "Ended": return "bg-slate-100 text-slate-600 border-slate-200";
      case "Ongoing": return "bg-emerald-50 text-emerald-700 border-emerald-200 ring-1 ring-emerald-500/20";
      case "Upcoming": return "bg-indigo-50 text-indigo-700 border-indigo-200 ring-1 ring-indigo-500/20";
      default: return "bg-gray-100 text-gray-800";
    }
  };

  // --- NEW FORMATTING FUNCTION ---
  const formatDateTime = (d) => {
    if (!d) return null;
    const dateObj = new Date(d);
    
    // 1. Get Day, Month, Year
    const day = String(dateObj.getDate()).padStart(2, '0');
    const month = String(dateObj.getMonth() + 1).padStart(2, '0'); // Months are 0-indexed
    const year = dateObj.getFullYear();
    
    // 2. Get Time (HH:MM AM/PM)
    const time = dateObj.toLocaleTimeString(undefined, {
      hour: '2-digit',
      minute: '2-digit',
      hour12: true // Set to false if you want 24-hour format (13:00)
    });

    // 3. Return combined string: "02/01/2026, 11:00 AM"
    return `${day}/${month}/${year}, ${time}`;
  };

  const handleEnroll = async () => {
    try {
      const data = await makeSecureRequest(`${hostSocket}/api/attendances/${id}`, "POST", {});
      toast.success(data.message);
    } catch (err) {
      toast.error(err.message || "Failed to enroll");
    }
  };

  const handleDelete = async () => {
    if (!window.confirm("Are you sure you want to delete this event? This action cannot be undone.")) {
      return;
    }
    try {
      const data = await makeSecureRequest(`${hostSocket}/api/events/${id}`, "DELETE", {});
      toast.success(data.message || "Event deleted successfully");
      window.location.reload(); 
    } catch (err) {
      if (err.message && (err.message.includes("end of JSON input") || err.message.includes("JSON"))) {
        toast.success("Event deleted successfully");
        window.location.reload();
        return;
      }
      toast.error(err.message || "Failed to delete event");
    }
  };

  // Prepare display date
  const displayDate = startTime 
    ? formatDateTime(startTime) 
    : (date?.year && date.year !== "N/A" ? `${date.day || date.date || "01"}/${date.month}/${date.year}` : "TBA");

  return (
    <div className="w-full p-3">
      <div className="group relative flex flex-col h-full bg-white rounded-2xl border border-slate-200 shadow-sm hover:shadow-xl hover:-translate-y-1 transition-all duration-300 overflow-hidden">
        
        {/* STATUS BADGE */}
        {status && (
          <div className="absolute top-3 right-3 z-20">
            <span className={`px-3 py-1 text-xs font-bold uppercase tracking-wide rounded-full border ${getStatusStyles(status)} shadow-sm backdrop-blur-md`}>
              {status}
            </span>
          </div>
        )}

        {/* IMAGE */}
        <Link href={`/events/detail?id=${id}`} className="block overflow-hidden relative">
          <div className="relative w-full aspect-[4/3] bg-slate-100">
            <Image
              src={img || defaultPlaceholder}
              alt={heading || "Event Image"}
              fill
              className={`object-cover transition-transform duration-500 group-hover:scale-105 ${status === "Ended" ? "opacity-60 grayscale" : ""}`}
              sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
            />
          </div>
        </Link>

        {/* CONTENT */}
        <div className="flex flex-col flex-grow p-5">
          
          {/* --- DATE & TIME BADGE --- */}
          <div className="flex items-center gap-2 mb-3">
             <div className="inline-flex items-center gap-2 px-2.5 py-1 rounded-md bg-slate-50 text-slate-700 text-xs font-bold border border-slate-100 shadow-sm">
                <span className="text-sm">📅</span>
                <span>{displayDate}</span>
             </div>
          </div>

          <Link href={`/events/detail?id=${id}`} className="block">
            <h3 className="text-lg font-bold text-slate-800 leading-snug mb-3 line-clamp-2 group-hover:text-indigo-600 transition-colors">
              {heading}
            </h3>
          </Link>

          <div className="mt-auto flex items-start gap-2 text-slate-500 text-sm">
            <span>📍</span>
            <span className="line-clamp-1 font-medium">{location || "Location TBD"}</span>
          </div>

          {/* ACTION BUTTONS AREA */}
          <div className="mt-5 pt-4 border-t border-slate-100 flex flex-col gap-3">
            
            {showEnrollButton && (
                <button
                onClick={handleEnroll}
                className="w-full inline-flex justify-center items-center gap-2 bg-indigo-600 text-white py-2.5 px-4 rounded-xl text-sm font-semibold shadow-sm hover:bg-indigo-700 hover:shadow-md active:transform active:scale-95 transition-all"
                >
                <span>Enroll Now</span>
                </button>
            )}

            {showDeleteButton && (
                <button
                onClick={handleDelete}
                className="w-full inline-flex justify-center items-center gap-2 bg-red-50 text-red-600 border border-red-200 py-2.5 px-4 rounded-xl text-sm font-semibold shadow-sm hover:bg-red-600 hover:text-white hover:border-red-600 transition-all active:transform active:scale-95"
                >
                <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M3 6h18"/><path d="M19 6v14c0 1-1 2-2 2H7c-1 0-2-1-2-2V6"/><path d="M8 6V4c0-1 1-2 2-2h4c1 0 2 1 2 2v2"/></svg>
                <span>Delete Event</span>
                </button>
            )}
          </div>

        </div>
      </div>
    </div>
  );
}