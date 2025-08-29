"use client";
import React, { useState } from "react";

const demoSpeakers = [
  { id: "sp1", name: "Alice Johnson" },
  { id: "sp2", name: "Rahul Sharma" },
  { id: "sp3", name: "Sophia Lee" },
  { id: "sp4", name: "David Kim" },
];

const CreateEvent = () => {
  const [loading, setLoading] = useState(false);
  const [uploadedImageUrl, setUploadedImageUrl] = useState("");
  const [selectedSpeaker, setSelectedSpeaker] = useState("");

  const handleImageUpload = (e) => {
    const file = e.target.files[0];
    if (file) {
      setUploadedImageUrl(URL.createObjectURL(file));
    }
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    setLoading(true);

    const formData = new FormData(e.target);
    formData.append("speaker_id", selectedSpeaker);

    setTimeout(() => {
      console.log("Event submitted with data:");
      for (let [key, value] of formData.entries()) {
        console.log(key, value);
      }
      alert("✅ Event created successfully (demo)");
      setLoading(false);
    }, 1500);
  };

  return (
    <div className="p-6 bg-gray-100 min-h-screen">
      <h2 className="text-2xl font-bold mb-6 text-gray-800">📅 Create Event</h2>

      {/* Image Upload */}
      <div className="mb-6">
        <label className="block mb-2 font-medium">Upload Image *</label>
        <input
          type="file"
          accept="image/*"
          onChange={handleImageUpload}
          className="block w-full text-sm text-gray-600 file:mr-4 file:py-2 file:px-4 
          file:rounded-md file:border-0 file:text-sm file:font-semibold 
          file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100"
        />
        {uploadedImageUrl && (
          <img
            src={uploadedImageUrl}
            alt="Preview"
            className="mt-4 h-40 rounded-md shadow"
          />
        )}
      </div>

      {/* Event Form */}
      <form
        onSubmit={handleSubmit}
        className="bg-white p-6 rounded-lg shadow space-y-4"
      >
        {/* Mandatory toggle */}
        <div className="flex items-center gap-2">
          <input type="checkbox" id="mandatory" name="mandatory" defaultChecked />
          <label htmlFor="mandatory" className="font-medium">Mandatory</label>
        </div>

        {/* Title */}
        <div>
          <label className="block mb-1 font-medium">Title *</label>
          <input
            type="text"
            name="title"
            required
            className="w-full border rounded p-2"
          />
        </div>

        {/* Description */}
        <fieldset className="border rounded p-4">
          <legend className="font-semibold">Description</legend>
          <div className="mt-2">
            <label className="block mb-1 font-medium">Objectives *</label>
            <textarea name="objectives" required className="w-full border rounded p-2" />
          </div>
          <div className="mt-2">
            <label className="block mb-1 font-medium">Learning Outcomes *</label>
            <textarea
              name="learning_outcomes"
              required
              className="w-full border rounded p-2"
            />
          </div>
        </fieldset>

        {/* Date & Time */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block mb-1 font-medium">Start Time *</label>
            <input
              type="datetime-local"
              name="start_time"
              required
              className="w-full border rounded p-2"
            />
          </div>
          <div>
            <label className="block mb-1 font-medium">End Time *</label>
            <input
              type="datetime-local"
              name="end_time"
              required
              className="w-full border rounded p-2"
            />
          </div>
        </div>

        {/* Location */}
        <fieldset className="border rounded p-4">
          <legend className="font-semibold">Location</legend>
          <div className="mt-2">
            <label className="block mb-1 font-medium">Address *</label>
            <input
              type="text"
              name="address"
              required
              className="w-full border rounded p-2"
            />
          </div>
          <div className="grid grid-cols-2 gap-4 mt-2">
            <div>
              <label className="block mb-1 font-medium">Latitude</label>
              <input
                type="number"
                step="any"
                name="lat"
                className="w-full border rounded p-2"
              />
            </div>
            <div>
              <label className="block mb-1 font-medium">Longitude</label>
              <input
                type="number"
                step="any"
                name="long"
                className="w-full border rounded p-2"
              />
            </div>
          </div>
        </fieldset>

        {/* Speakers */}
        <div>
          <label className="block mb-1 font-medium">Speaker</label>
          <select
            value={selectedSpeaker}
            onChange={(e) => setSelectedSpeaker(e.target.value)}
            className="w-full border rounded p-2"
          >
            <option value="">Select Speaker</option>
            {demoSpeakers.map((speaker) => (
              <option key={speaker.id} value={speaker.id}>
                {speaker.name}
              </option>
            ))}
          </select>
        </div>

        {/* Submit */}
        <button
          type="submit"
          disabled={loading}
          className="w-full bg-blue-600 text-white py-2 rounded-md shadow hover:bg-blue-700 disabled:opacity-50"
        >
          {loading ? "Uploading & Submitting..." : "Submit Event"}
        </button>
      </form>
    </div>
  );
};

export default CreateEvent;
