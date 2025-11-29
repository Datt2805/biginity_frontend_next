'use client';
import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation'; // Use Next.js router
import { ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import EventsList from '../components/Event/EventsList';
import Classroom from '../components/Event/Classroom';
import { logOutUser } from '@/lib/api';

// Define tabs here to avoid typos and mismatched IDs
const TABS = [
  { id: 'events', label: 'All Events' },
  { id: 'classroom', label: 'Classroom' },
];

const AdminDashboard = () => {
  const router = useRouter();
  const [activeTab, setActiveTab] = useState('events');

  // Check session storage on load
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const savedTab = sessionStorage.getItem('teacherActiveTab');
      // Check if the saved tab actually exists in our TABS config
      const isValidTab = TABS.some((t) => t.id === savedTab);
      
      if (savedTab && isValidTab) {
        setActiveTab(savedTab);
      }
    }
  }, []);

  const handleTabChange = (tabId) => {
    if (tabId === activeTab) return;
    sessionStorage.setItem('teacherActiveTab', tabId);
    setActiveTab(tabId);
  };

  const handleLogout = async () => {
    // Assuming logOutUser.handler returns a function. 
    // If not, wrap the logic directly here.
    try {
        await logOutUser.handler(() => {}, () => {}); // specific to your API
        sessionStorage.clear();
        router.push('/LoginSignUp'); // Faster than window.location
    } catch (error) {
        console.error("Logout failed", error);
    }
  };

  const renderContent = () => {
    switch (activeTab) {
      case 'events':
        return <EventsList />;
      case 'classroom':
        return <Classroom />;
      default:
        return <EventsList />; // Always have a fallback
    }
  };

  return (
    <div className="p-4 sm:p-6 md:p-8 font-sans bg-gray-50 min-h-screen">
      
      {/* Header */}
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl md:text-3xl font-semibold text-gray-800 text-center md:text-left">
          🎙️ Speaker Dashboard
        </h1>

        <button
          onClick={handleLogout}
          className="bg-red-500 hover:bg-red-600 text-white px-4 py-2 rounded-lg transition-all duration-300 shadow-sm"
        >
          Logout
        </button>
      </div>

      {/* -------------------- TAB NAVIGATION -------------------- */}
      <div className="flex flex-wrap justify-center md:justify-start border-b border-gray-300 mb-6">
        {TABS.map((tab) => (
          <button
            key={tab.id}
            onClick={() => handleTabChange(tab.id)}
            className={`flex-1 md:flex-none px-4 py-2 text-sm sm:text-base text-center transition-all duration-300 
            border-b-4 ${
              activeTab === tab.id
                ? 'border-blue-500 font-semibold text-blue-600 bg-blue-50'
                : 'border-transparent text-gray-600 hover:text-blue-500 hover:bg-gray-100'
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