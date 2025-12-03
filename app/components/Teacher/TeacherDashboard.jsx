'use client';
import React, { useState, useEffect } from 'react';
import { ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import { 
  LayoutDashboard, 
  Users, 
  Video, 
  Calendar, 
  PlusCircle, 
  Mic2, 
  BarChart3, 
  LogOut,
  Loader2,
  CircleUser
} from 'lucide-react'; 

// Import your components
import ViewAttendancePage from '../Event/ViewAttendancePage';
import Classroom from '../Event/Classroom';
import EventsList from '../Event/EventsList';
import CreateEvent from '../Event/CreateEvent';
import CreateSpeaker from '../Event/CreateSpeaker';
import ChartsPage from '../Event/AnalyticsDashboard'; 
import UserProfile from '../Common/UserProfile';
import { logOutUser, fetchUserDetail } from '../../../lib/api';

const TeacherDashboard = () => {
  const [activeTab, setActiveTab] = useState('attendance');
  const [isLoading, setIsLoading] = useState(false);
  // 2. NEW STATE for User Name (Defaulting to "Teacher Dashboard" until loaded)
  const [userName, setUserName] = useState("Teacher Dashboard");

  // Tab Configuration with Icons
  const tabs = [
    { id: 'attendance', label: 'Attendance', icon: Users },
    { id: 'classroom', label: 'Classroom Live', icon: Video },
    { id: 'events', label: 'All Events', icon: Calendar },
    { id: 'create-event', label: 'Create Event', icon: PlusCircle },
    { id: 'create-speaker', label: 'Register Speaker', icon: Mic2 },
    { id: 'charts', label: 'Analytics', icon: BarChart3 },
    { id: 'profile', label: 'Profile', icon: CircleUser }
  ];

  // 3. FETCH USER DETAILS ON MOUNT
  useEffect(() => {
    const getUserName = async () => {
      const user = await fetchUserDetail();
      if (user) {
        // Update state with name if found
        setUserName(user.name || user.firstName || "Teacher"); 
      }
    };
    getUserName();
  }, []);

  useEffect(() => {
    const savedTab = sessionStorage.getItem('teacherActiveTab');
    
    if (savedTab) {
      setActiveTab(savedTab);
      if (savedTab === 'classroom') {
        setIsLoading(true);
        setTimeout(() => {
          setIsLoading(false);
        }, 2000);
      }
    }
  }, []);

  const handleTabChange = (tabId) => {
    if (tabId === activeTab) return;

    if (tabId === 'classroom') {
      sessionStorage.setItem('teacherActiveTab', 'classroom');
      window.location.reload(); 
    } else {
      sessionStorage.setItem('teacherActiveTab', tabId);
      setActiveTab(tabId);
      setIsLoading(false);
    }
  };

  const renderContent = () => {
    if (isLoading) {
      return (
        <div className="flex flex-col justify-center items-center h-[50vh] text-indigo-600">
          <Loader2 className="h-16 w-16 animate-spin mb-4" />
          <h2 className="text-xl font-medium text-slate-600 animate-pulse">
            Connecting to Live Classroom...
          </h2>
        </div>
      );
    }

    switch (activeTab) {
      case 'attendance': return <ViewAttendancePage />;
      case 'classroom': return <Classroom />;
      case 'events': return <EventsList />;
      case 'create-event': return <CreateEvent />;
      case 'create-speaker': return <CreateSpeaker />;
      case 'charts': return <ChartsPage />;
      case 'profile': return <UserProfile />;
      default: return <div className="text-gray-500 text-center mt-10">Select an option from the tabs.</div>;
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 font-sans text-slate-800">
      
      {/* -------------------- HEADER -------------------- */}
      <header className="bg-white border-b border-slate-200 sticky top-0 z-20 shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            
            {/* Logo / Title */}
            <div className="flex items-center gap-2">
              <div className="bg-indigo-600 p-2 rounded-lg">
                <LayoutDashboard className="h-6 w-6 text-white" />
              </div>
              
              {/* 4. UPDATED H1 TO SHOW USER NAME */}
              <h1 className="text-xl md:text-2xl font-bold bg-gradient-to-r from-indigo-600 to-purple-600 bg-clip-text text-transparent hidden sm:block">
                {userName}
              </h1>
              
              <h1 className="text-lg font-bold text-indigo-700 sm:hidden">
                Dashboard
              </h1>
            </div>

            {/* Logout Button */}
            <button
              onClick={logOutUser.handler(
                () => { 
                  sessionStorage.clear();
                  window.location.href = '/LoginSignUp'; 
                }, 
                (err) => console.error(err)
              )}
              className="group flex items-center gap-2 px-4 py-2 text-sm font-medium text-slate-600 hover:text-red-600 hover:bg-red-50 rounded-full transition-all duration-300"
            >
              <span className="hidden sm:block">Logout</span>
              <LogOut className="h-5 w-5 group-hover:rotate-180 transition-transform duration-500" />
            </button>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        
        {/* -------------------- TAB NAVIGATION (Responsive) -------------------- */}
        <div className="mb-8">
          {/* Mobile: Horizontal Scroll | Desktop: Flex Grid */}
          <nav className="flex space-x-2 overflow-x-auto pb-4 sm:pb-0 sm:flex-wrap sm:justify-start scrollbar-hide" aria-label="Tabs">
            {tabs.map((tab) => {
              const Icon = tab.icon;
              const isActive = activeTab === tab.id;
              
              return (
                <button
                  key={tab.id}
                  onClick={() => handleTabChange(tab.id)}
                  className={`
                    flex items-center gap-2 px-5 py-3 text-sm font-medium rounded-xl whitespace-nowrap transition-all duration-200
                    ${isActive 
                      ? 'bg-indigo-600 text-white shadow-md shadow-indigo-200 translate-y-[-2px]' 
                      : 'bg-white text-slate-600 hover:bg-indigo-50 hover:text-indigo-600 border border-transparent hover:border-indigo-100'
                    }
                  `}
                >
                  <Icon className={`h-4 w-4 ${isActive ? 'text-indigo-100' : 'text-slate-400'}`} />
                  {tab.label}
                </button>
              );
            })}
          </nav>
        </div>

        {/* -------------------- MAIN CONTENT AREA -------------------- */}
        <div className="bg-white rounded-2xl shadow-xl border border-slate-100 min-h-[600px] relative overflow-hidden">
          {/* Top colored accent line */}
          <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-indigo-500 via-purple-500 to-pink-500"></div>
          
          <div className="p-4 sm:p-6 lg:p-8">
            {renderContent()}
          </div>
        </div>

      </main>

      <ToastContainer position="bottom-right" theme="colored" />
      
      {/* CSS Utility for hiding scrollbar in standard CSS if Tailwind plugin not installed */}
      <style jsx>{`
        .scrollbar-hide::-webkit-scrollbar {
            display: none;
        }
        .scrollbar-hide {
            -ms-overflow-style: none;
            scrollbar-width: none;
        }
      `}</style>
    </div>
  );
};

export default TeacherDashboard;