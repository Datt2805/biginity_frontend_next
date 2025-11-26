'use client';
import React, { useState, useEffect } from 'react';
import { ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';

// --- IMPORTS ---
import EventsList from '../components/Event/EventsList';
// RENAMED: Pointing to UpdateEvent component now
import UpdateEvent from './UpdateEvent'; 
import VerificationPage from './VerificationPage';
import { logOutUser } from '@/lib/api';

const AdminDashboard = () => {
  const [activeTab, setActiveTab] = useState('events');

  // Check session storage on load to persist tab selection
  useEffect(() => {
    const savedTab = sessionStorage.getItem('teacherActiveTab');
    if (savedTab) {
      // Valid tabs only
      if (['events', 'update-event', 'verification'].includes(savedTab)) {
        setActiveTab(savedTab);
      }
    }
  }, []);

  const handleTabChange = (tabId) => {
    if (tabId === activeTab) return;
    sessionStorage.setItem('teacherActiveTab', tabId);
    setActiveTab(tabId);
  };

  const renderContent = () => {
    switch (activeTab) {
      case "events":
        return <EventsList />;
      case 'update-event':
        // You may need to pass an eventId here or handle selection logic inside this component
        return <UpdateEvent />;
      case 'verification':
        return <VerificationPage />;
      default:
        return <EventsList />;
    }
  };

  return (
    <div className="p-4 sm:p-6 md:p-8 font-sans bg-gray-50 min-h-screen">
      
      {/* Header */}
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl md:text-3xl font-semibold text-gray-800 text-center md:text-left">
          👩‍🏫 Admin Dashboard
        </h1>

        <button
          onClick={logOutUser.handler(
            () => { 
              sessionStorage.clear(); 
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
          { id: "events", label: "All Events" },
          { id: 'update-event', label: 'Update Event Details' },
          { id: 'verification', label: 'Verification' },
        ].map((tab) => (
          <button
            key={tab.id}
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

export default AdminDashboard;