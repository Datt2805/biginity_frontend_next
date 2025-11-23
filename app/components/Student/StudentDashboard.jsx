"use client";
import React, { useState } from "react";
import { ToastContainer } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";

import EventsList from "../Event/EventsList";
import StudentClassroom from "../Event/Classroom";
import { logOutUser } from "../../../lib/api";

const StudentDashboard = () => {
  const [activeTab, setActiveTab] = useState("events");

  const renderContent = () => {
    switch (activeTab) {
      case "events":
        return <EventsList />;
      case "classroom":
        return <StudentClassroom />;
      default:
        return (
          <div className="text-gray-500 text-center py-6">
            Select a tab to continue.
          </div>
        );
    }
  };

  return (
    <div className="p-4 sm:p-6 md:p-8 bg-gray-50 min-h-screen font-sans">
      {/* Header */}
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl md:text-3xl font-semibold text-gray-800">
          🎓 Student Dashboard
        </h1>

        <button
          onClick={logOutUser.handler(
            () => (window.location.href = "/LoginSignUp"),
            (err) => console.error(err)
          )}
          className="bg-red-500 hover:bg-red-600 text-white px-4 py-2 rounded-lg transition"
        >
          Logout
        </button>
      </div>

      {/* Tabs */}
      <div className="flex gap-6 border-b border-gray-300 mb-4">
        {[
          { id: "events", label: "All Events" },
          { id: "classroom", label: "Classroom" },
        ].map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={`px-2 pb-2 text-sm sm:text-base transition border-b-4 ${
              activeTab === tab.id
                ? "border-blue-500 text-blue-600 font-semibold"
                : "border-transparent text-gray-600 hover:text-blue-500"
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Main Content */}
      <div className="bg-white rounded-xl shadow-md p-4 sm:p-6">
        {renderContent()}
      </div>

      <ToastContainer />
    </div>
  );
};

export default StudentDashboard;
