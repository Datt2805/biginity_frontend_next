'use client';
import React, { useState, useEffect } from 'react'; // 1. Import useEffect
import { ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';

import ViewAttendancePage from '../Event/ViewAttendancePage';
import Classroom from '../Event/Classroom';
import EventsList from '../Event/EventsList';
import CreateEvent from '../Event/CreateEvent';
import CreateSpeaker from '../Event/CreateSpeaker';
import ChartsPage from '../Event/charts'; 
import { logOutUser } from '../../../lib/api';

const TeacherDashboard = () => {
  const [activeTab, setActiveTab] = useState('attendance');
  const [isLoading, setIsLoading] = useState(false); // 2. Add loading state

  // 3. Check session storage on load to see if we need to show the classroom loader
  useEffect(() => {
    const savedTab = sessionStorage.getItem('teacherActiveTab');
    
    if (savedTab) {
      setActiveTab(savedTab);

      // If the saved tab is classroom, trigger the loading animation
      if (savedTab === 'classroom') {
        setIsLoading(true);
        setTimeout(() => {
          setIsLoading(false);
        }, 2000); // Show loader for 2 seconds
      }
    }
  }, []);

  // 4. Handle Tab Switching with Reload Logic
  const handleTabChange = (tabId) => {
    if (tabId === activeTab) return;

    // If clicking "Classroom", force a page reload
    if (tabId === 'classroom') {
      sessionStorage.setItem('teacherActiveTab', 'classroom');
      window.location.reload(); 
    } else {
      // Normal switch for other tabs
      sessionStorage.setItem('teacherActiveTab', tabId);
      setActiveTab(tabId);
      setIsLoading(false);
    }
  };

  const renderContent = () => {
    // 5. Show Loading Animation if active
    if (isLoading) {
      return (
        <div className="flex flex-col justify-center items-center h-[60vh]">
          <div className="animate-spin rounded-full h-16 w-16 border-t-4 border-b-4 border-blue-600 mb-6"></div>
          <h2 className="text-xl font-semibold text-gray-700 animate-pulse">
            Loading Live Classroom...
          </h2>
        </div>
      );
    }

    switch (activeTab) {
      case 'attendance':
        return <ViewAttendancePage />;
      case 'classroom':
        return <Classroom />;
      case "events":
        return <EventsList />;
      case 'create-event':
        return <CreateEvent />;
      case 'create-speaker':
        return <CreateSpeaker />;
      case 'charts':
        return <ChartsPage />; 
      default:
        return <div className="text-gray-500">Select an option from the tabs.</div>;
    }
  };

  return (
    <div className="p-4 sm:p-6 md:p-8 font-sans bg-gray-50 min-h-screen">
      
      {/* Header */}
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl md:text-3xl font-semibold text-gray-800 text-center md:text-left">
          👩‍🏫 Teacher Management Dashboard
        </h1>

        <button
          onClick={logOutUser.handler(
            () => { 
              sessionStorage.clear(); // Clear tab memory on logout
              window.location.href = '/LoginSignUp'; 
            }, 
            (err) => console.error(err)
          )}
          className="bg-red-500 hover:bg-red-600 text-white px-4 py-2 rounded-lg transition-all duration-300"
        >
          Logout
        </button>
      </div>

      {/* -------------------- TAB NAVIGATION -------------------- */}
      <div className="flex flex-wrap justify-center md:justify-start border-b border-gray-300 mb-6">

        {[
          { id: 'attendance', label: 'Attendance' },
          { id: 'classroom', label: 'Classroom Live' },
          { id: "events", label: "All Events" },
          { id: 'create-event', label: 'Create Event' },
          { id: 'create-speaker', label: 'Register Speaker' },
          { id: 'charts', label: 'Charts' }, 
        ].map((tab) => (
          <button
            key={tab.id}
            // 6. Use the custom handleTabChange
            onClick={() => handleTabChange(tab.id)}
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

      {/* -------------------- MAIN CONTENT -------------------- */}
      <div className="bg-white rounded-xl shadow-md p-4 sm:p-6 overflow-auto min-h-[400px]">
        {renderContent()}
      </div>

      <ToastContainer />
    </div>
  );
};

export default TeacherDashboard;