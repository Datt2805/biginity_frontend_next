"use client";

import { fetchUserDetail, hostSocket, makeSecureRequest } from "@/lib/api";
import defaultPlaceholder from "@/public/logo.png";
import Image from "next/image";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";
import { toast } from "react-toastify";

export default function EventCard({ id, heading, date, location, img, status }) {
  const pathname = usePathname();
  const [user, setUser] = useState(null); // 1. Changed to store the full user object

  useEffect(() => {
    // 2. Fetch user and store the data
    fetchUserDetail().then((usr) => setUser(usr));
  }, []);

  // Helper to determine status color styles
  const getStatusStyles = (s) => {
    switch (s) {
      case "Ended": return "bg-slate-100 text-slate-600 border-slate-200";
      case "Ongoing": return "bg-emerald-50 text-emerald-700 border-emerald-200 ring-1 ring-emerald-500/20";
      case "Upcoming": return "bg-indigo-50 text-indigo-700 border-indigo-200 ring-1 ring-indigo-500/20";
      default: return "bg-gray-100 text-gray-800";
    }
  };

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

        {/* IMAGE SECTION */}
        <Link href={`/events/detail?id=${id}`} className="block overflow-hidden relative">
          <div className="relative w-full aspect-[4/3] bg-slate-100">
            <Image
              src={img || defaultPlaceholder}
              alt={heading}
              fill
              className={`object-cover transition-transform duration-500 group-hover:scale-105
                ${status === "Ended" ? "opacity-60 grayscale filter" : ""}
              `}
              sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-slate-900/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
          </div>
        </Link>

        {/* CONTENT SECTION */}
        <div className="flex flex-col flex-grow p-5">
          
          {/* Date Tag */}
          <div className="flex items-center gap-2 mb-2">
             <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-md bg-slate-50 text-slate-600 text-xs font-semibold border border-slate-100">
                <svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><rect width="18" height="18" x="3" y="4" rx="2" ry="2"/><line x1="16" x2="16" y1="2" y2="6"/><line x1="8" x2="8" y1="2" y2="6"/><line x1="3" x2="21" y1="10" y2="10"/></svg>
                {date?.year !== "N/A" ? `${date.month}/${date.year}` : "TBA"}
             </div>
          </div>

          {/* Heading */}
          <Link href={`/events/detail?id=${id}`} className="block">
            <h3 className="text-lg font-bold text-slate-800 leading-snug mb-3 line-clamp-2 group-hover:text-indigo-600 transition-colors">
              {heading}
            </h3>
          </Link>

          {/* Location */}
          <div className="mt-auto flex items-start gap-2 text-slate-500 text-sm">
            <svg className="w-4 h-4 mt-0.5 shrink-0 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" /></svg>
            <span className="line-clamp-1 font-medium">{location || "Location TBD"}</span>
          </div>

          {/* Action Button - 3. Condition updated to check strict role */}
          {user && user.role === "student" && (
            <div className="mt-5 pt-4 border-t border-slate-100">
                <button
                onClick={() => {
                    makeSecureRequest(`${hostSocket}/api/attendances/${id}`, "POST", {})
                    .then((data) => toast.success(data.message))
                    .catch((err) => toast.error(err.message));
                }}
                className="w-full inline-flex justify-center items-center gap-2 bg-indigo-600 text-white py-2.5 px-4 rounded-xl text-sm font-semibold shadow-sm hover:bg-indigo-700 hover:shadow-md active:transform active:scale-95 transition-all focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
                >
                <span>Enroll Now</span>
                <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M5 12h14"/><path d="m12 5 7 7-7 7"/></svg>
                </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}