'use client';
import React, { useState } from 'react';
import { ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';

import EventsList from '../Event/EventsList';
import StudentClassroom from '../Event/Classroom';
import { logOutUser } from '../../../lib/api';

const StudentDashboard = () => {
  const [activeTab, setActiveTab] = useState('events');

  const renderContent = () => {
    switch (activeTab) {
      case 'events':
        return <EventsList />;
      case 'classroom':
        return <StudentClassroom />;
      default:
        return <div className="text-gray-500">Select an option from the tabs.</div>;
    }
  };

  return (
    <div className="p-4 sm:p-6 md:p-8 font-sans bg-gray-50 min-h-screen">
      {/* Header */}
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl md:text-3xl font-semibold text-gray-800 text-center md:text-left">
          🎓 Student Dashboard
        </h1>
        <button
          onClick={logOutUser.handler(
            () => { window.location.href = '/LoginSignUp'; },
            (err) => console.error(err)
          )}
          className="bg-red-500 hover:bg-red-600 text-white px-4 py-2 rounded-lg transition-all duration-300"
        >
          Logout
        </button>
      </div>

      {/* Tabs */}
      <div className="flex flex-wrap justify-center md:justify-start border-b border-gray-300 mb-6">
        {[
          { id: 'events', label: 'All Events' },
          { id: 'classroom', label: 'Classroom' },
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

      {/* Main Content */}
      <div className="bg-white rounded-xl shadow-md p-4 sm:p-6 overflow-auto">
        {renderContent()}
      </div>

      <ToastContainer />
    </div>
  );
};

export default StudentDashboard;
