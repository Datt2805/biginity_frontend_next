"use client";

import Link from "next/link";
import Image from "next/image";
import defaultPlaceholder from "@/public/logo.png";
import { fetchUserDetail, makeSecureRequest, hostSocket } from "@/lib/api";
import { toast } from "react-toastify";

const isLoggedIn = await fetchUserDetail();

export default function EventCard({ id, heading, date, location, img, status }) {
  return (
    <div className="w-full p-3">
      <div className="bg-white rounded-2xl shadow-md hover:shadow-xl transition-all duration-300 overflow-hidden group h-full flex flex-col relative">

        {/* STATUS BADGE */}
        {status && (
          <span
            className={`absolute top-3 right-3 px-3 py-1 text-xs font-semibold rounded-full z-20
              ${status === "Ended" && "bg-red-600 text-white"}
              ${status === "Ongoing" && "bg-green-600 text-white"}
              ${status === "Upcoming" && "bg-blue-600 text-white"}
            `}
          >
            {status}
          </span>
        )}

        {/* IMAGE */}
        <Link href={`/events/detail?id=${id}`} className="block">
          <div className="relative w-full min-h-[350px]">
            <Image
              src={img || defaultPlaceholder}
              alt={heading}
              fill
              className={`object-cover group-hover:scale-105 transition-transform duration-300
                ${status === "Ended" ? "opacity-70 grayscale" : ""}
              `}
            />
          </div>
        </Link>

        {/* CONTENT */}
        <div className="flex flex-col flex-grow justify-between p-4">
          <div>
            <h3 className="text-lg font-semibold leading-tight">{heading}</h3>

            <p className="text-gray-500 text-sm mt-1">
              {date?.year !== "N/A" ? `${date.month}/${date.year}` : "Invalid Date"}
            </p>

            <p className="text-gray-700 font-medium mt-3">{location}</p>
          </div>

          {isLoggedIn && (
            <button
              onClick={() => {
                makeSecureRequest(`${hostSocket}/api/attendances/${id}`, "POST", {})
                  .then((data) => toast.success(data.message))
                  .catch((err) => toast.error(err.message));
              }}
              className="mt-4 w-full bg-blue-600 text-white py-2 rounded-lg 
                text-sm font-semibold hover:bg-blue-700 transition-colors"
            >
              Enroll
            </button>
          )}
        </div>

      </div>
    </div>
  );
}
