"use client";

import Image from "next/image";
import defaultPlaceholder from "@/public/logo.png";

export default function EventDetails({ event }) {
  return (
    <div className="max-w-5xl mx-auto px-4 py-8 bg-gray-100">
      {/* Title */}
      <h1 className="text-3xl font-bold mb-6">{event.title}</h1>

      {/* Event Image */}
      <div className="mb-6">
        <Image
          src={event.image || defaultPlaceholder}
          alt={event.title}
          width={800}
          height={400}
          className="rounded-2xl shadow-md object-cover w-full h-[400px]"
        />
      </div>

      {/* Event Info */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
        <div className="bg-gray-100 p-4 rounded-xl">
          <p><strong>Mandatory:</strong> {event.mandatory ? "Yes" : "No"}</p>
          <p><strong>Start:</strong> {new Date(event.start_time).toLocaleString()}</p>
          <p><strong>End:</strong> {new Date(event.end_time).toLocaleString()}</p>
          <p><strong>Location:</strong> {event.location?.address}</p>
        </div>
      </div>

      {/* Description */}
      <div className="mb-8">
        <h2 className="text-2xl font-semibold mb-4">Description</h2>

        <h3 className="text-lg font-medium">Objectives</h3>
        <ul className="list-disc pl-6 mb-4 text-gray-700">
          {(event.description?.objectives || []).map((obj, i) => (
            <li key={i}>{obj}</li>
          ))}
        </ul>

        <h3 className="text-lg font-medium">Learning Outcomes</h3>
        <ul className="list-disc pl-6 text-gray-700">
          {(event.description?.learning_outcomes || []).map((outcome, i) => (
            <li key={i}>{outcome}</li>
          ))}
        </ul>
      </div>

      {/* Speakers */}
      <div>
        <h2 className="text-2xl font-semibold mb-4">Speakers</h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
          {(event.speakers || []).map((speaker) => (
            <div
              key={speaker.id}
              className="flex items-center gap-4 p-4 bg-white shadow rounded-xl"
            >
              <Image
                src={speaker.profile || defaultPlaceholder}
                alt={speaker.name}
                width={80}
                height={80}
                className="rounded-full object-cover"
              />
              <div>
                <p className="font-semibold">{speaker.name}</p>
                <p className="text-sm text-gray-600">{speaker.organization}</p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
