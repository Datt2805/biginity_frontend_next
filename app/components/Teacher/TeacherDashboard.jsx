// app/components/Teacher/TeacherDashboard.jsx
'use client';
import React, { useState } from 'react';
import { ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';

import ViewAttendancePage from '../Event/ViewAttendancePage';
import Classroom from '../Event/Classroom';
import CreateEvent from '../Event/CreateEvent';
import CreateSpeaker from '../Event/CreateSpeaker';
import { logOutUser } from '../../../lib/api';

const TeacherDashboard = () => {
  const [activeTab, setActiveTab] = useState('attendance');

  const renderContent = () => {
    switch (activeTab) {
      case 'attendance':
        return <ViewAttendancePage />;
      case 'classroom':
        return <Classroom />;
      case 'create-event':
        return <CreateEvent />;
      case 'create-speaker':
        return <CreateSpeaker />;
      default:
        return <div className="text-gray-500">Select an option from the tabs.</div>;
    }
  };

  return (
    <div className="p-4 sm:p-6 md:p-8 font-sans bg-gray-50 min-h-screen">
      {/* Header with Logout Button */}
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl md:text-3xl font-semibold text-gray-800 text-center md:text-left">
          👩‍🏫 Teacher Management Dashboard
        </h1>
        <button
          onClick={logOutUser.handler(
            () => { window.location.href = '/LoginSignUp'; }, // redirect after logout
            (err) => console.error(err)
          )}
          className="bg-red-500 hover:bg-red-600 text-white px-4 py-2 rounded-lg transition-all duration-300"
        >
          Logout
        </button>
      </div>

      {/* Tab Navigation */}
      <div className="flex flex-wrap justify-center md:justify-start border-b border-gray-300 mb-6">
        {[
          { id: 'attendance', label: 'Attendance' },
          { id: 'classroom', label: 'Classroom Live' },
          { id: 'create-event', label: 'Create Event' },
          { id: 'create-speaker', label: 'Register Speaker' },
        ].map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={`flex-1 md:flex-none px-4 py-2 text-sm sm:text-base text-center transition-all duration-300 
              border-b-4 ${
                activeTab === tab.id
                  ? 'border-blue-500 font-semibold text-blue-600'
                  : 'border-transparent text-gray-600 hover:text-blue-500'
              }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Main Content Area */}
      <div className="bg-white rounded-xl shadow-md p-4 sm:p-6 overflow-auto">
        {renderContent()}
      </div>

      <ToastContainer />
    </div>
  );
};

export default TeacherDashboard;
