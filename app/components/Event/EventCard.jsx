"use client";

import Link from "next/link";
import Image from "next/image";
import defaultPlaceholder from "@/public/logo.png";
import { fetchUserDetail, makeSecureRequest, hostSocket } from "@/lib/api";
import { toast, ToastContainer } from "react-toastify";

const isLoggedIn = await fetchUserDetail();
console.log(isLoggedIn);
export default function EventCard({ id, title, date, location, img }) {
  return (
    <div className="relative gap-2 w-full md:w-1/2 lg:w-1/3 p-4 mt-1">
      <Link href={`/events/detail?id=${id}`} className="block">
        <div className="bg-white shadow-lg rounded-2xl overflow-hidden hover:shadow-2xl transition-shadow duration-300">
          {/* IMAGE SECTION */}
          <div className="relative">
            <Image
              src={img || defaultPlaceholder}
              alt={title}
              width={400}
              height={250}
              unoptimized
              className="w-full h-48 object-cover"
            />
          </div>
        </div>
      </Link>
      {/* TEXT CONTENT */}
      <div className="p-4">
        <h3 className="text-lg font-semibold">{title}</h3>

        <p className="text-gray-600 text-sm mt-1">
          {new Date(date).toLocaleDateString("en-IN", {
            year: "numeric",
            month: "short",
            day: "numeric",
          })}
        </p>

        {isLoggedIn && (
          <button
            className="absolute right-4 bg-blue-600 text-white px-4 py-2 rounded-lg text-sm hover:bg-blue-700 z-10"
            onClick={() => {
              makeSecureRequest(
                `${hostSocket}/api/attendances/${id}`,
                "POST",
                {}
              )
                .then((data) => toast.success(data.message))
                .catch((err) => toast.error(err.message));
            }}
          >
            Enroll
          </button>
        )}
        <p className="text-gray-800 mt-2">{location}</p>
      </div>
    </div>
  );
}
