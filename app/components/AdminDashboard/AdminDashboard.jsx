'use client';
import React, { useEffect, useState } from 'react';
import { ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';

import EventsList from '../components/Event/EventsList';
import { logOutUser } from '@/lib/api';
// import ChartsPage from '../components/Event/Classroom'; // Kept commented as per original
import VerificationPage from './VerificationPage';

const AdminDashboard = () => {
  const [activeTab, setActiveTab] = useState('events'); // Note: logic says 'events' is default, but tabs array below uses 'update-event'. syncing logic below.

  // Check session storage on load to persist tab selection
  useEffect(() => {
    const savedTab = sessionStorage.getItem('teacherActiveTab');
    if (savedTab) {
      // Valid tabs only
      if (['update-event', 'verification'].includes(savedTab)) {
        setActiveTab(savedTab);
      }
    } else {
        // Default to update-event if nothing saved, matching the render logic
        setActiveTab('update-event'); 
    }
  }, []);

  const handleTabChange = (tabId) => {
    if (tabId === activeTab) return;
    sessionStorage.setItem('teacherActiveTab', tabId);
    setActiveTab(tabId);
  };

  const renderContent = () => {
    switch (activeTab) {
      case 'update-event':
        return <EventsList isAdmin={true} />;
      case 'verification':
        return <VerificationPage />;
      default:
        return <EventsList isAdmin={true} />;
    }
  };

  return (
    <div className="min-h-screen bg-slate-50/50 p-4 md:p-8 font-sans">
      <div className="max-w-7xl mx-auto space-y-6">
        
        {/* --- HEADER SECTION --- */}
        <header className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-white p-6 rounded-2xl shadow-sm border border-slate-200">
            <div>
                <h1 className="text-2xl md:text-3xl font-bold text-slate-800 flex items-center gap-3">
                    <span className="bg-indigo-100 p-2 rounded-lg text-2xl">👩‍🏫</span>
                    Admin Dashboard
                </h1>
                <p className="text-slate-500 text-sm mt-1 ml-14">Manage events, track activities, and verify student attendance.</p>
            </div>

            <button
                onClick={logOutUser.handler(
                () => { 
                    sessionStorage.clear(); 
                    window.location.href = '/LoginSignUp'; 
                }, 
                (err) => console.error(err)
                )}
                className="group flex items-center gap-2 px-5 py-2.5 text-sm font-medium text-rose-600 bg-rose-50 hover:bg-rose-600 hover:text-white rounded-xl transition-all duration-300 border border-rose-100 hover:border-rose-600 hover:shadow-md"
            >
                <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="transition-transform group-hover:-translate-x-1"><path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/><polyline points="16 17 21 12 16 7"/><line x1="21" x2="9" y1="12" y2="12"/></svg>
                Sign Out
            </button>
        </header>

        {/* --- TAB NAVIGATION --- */}
        <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
            <nav className="flex p-1 space-x-1 bg-white border border-slate-200 rounded-xl shadow-sm">
                {[
                { id: 'update-event', label: 'Manage Events', icon: (
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"></path></svg>
                ) },
                { id: 'verification', label: 'Verification Portal', icon: (
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"></path></svg>
                ) },
                ].map((tab) => {
                    const isActive = activeTab === tab.id;
                    return (
                        <button
                            key={tab.id}
                            onClick={() => handleTabChange(tab.id)}
                            className={`
                                flex items-center gap-2 px-4 py-2.5 text-sm font-semibold rounded-lg transition-all duration-200
                                ${isActive 
                                    ? 'bg-indigo-600 text-white shadow-md' 
                                    : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50'
                                }
                            `}
                        >
                            {tab.icon}
                            {tab.label}
                        </button>
                    );
                })}
            </nav>
        </div>

        {/* --- MAIN CONTENT CARD --- */}
        <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden min-h-[500px] relative animate-in fade-in zoom-in-95 duration-300">
            {/* Decorative top bar */}
            <div className="h-1 w-full bg-gradient-to-r from-indigo-500 via-purple-500 to-pink-500"></div>
            
            <div className="p-4 sm:p-6 lg:p-8">
                {renderContent()}
            </div>
        </div>

      </div>
      <ToastContainer position="bottom-right" theme="colored" />
    </div>
  );
};

export default AdminDashboard;