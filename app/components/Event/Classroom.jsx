"use client";
import React, { useEffect, useState, useCallback, useRef } from "react";
import { toast } from "react-toastify";
import { useSocket } from "../../../lib/api/initSocket"; 
import { getClassrooms, fetchUserDetail } from "../../../lib/api/app-SDK";
import Loader from "../Common/Loader"; 
import ChatModal from "../Chat/ChatModal";

const Classroom = () => {
  const socket = useSocket();

  const [classrooms, setClassrooms] = useState([]);
  const [loading, setLoading] = useState(true);
  const [userData, setUserData] = useState(null);
  const [openChat, setOpenChat] = useState(null);
  const [attendanceTimers, setAttendanceTimers] = useState({});
  const [searchTerm, setSearchTerm] = useState(""); 
  
  const timerIntervalRef = useRef(null);

  // =========================================================
  // 1. DATA FETCHING (Runs ONLY ONCE)
  // =========================================================
  useEffect(() => {
    let isMounted = true;

    const fetchData = async () => {
      try {
        const user = await fetchUserDetail();
        if (!isMounted) return;
        setUserData(user);
        
        let clsData = [];
        if (user.role === 'Speaker') {
            clsData = await getClassrooms(null);
        } else {
            clsData = await getClassrooms(null);
        }

        if (!isMounted) return;

        const list = clsData?.length ? clsData : (clsData?.classrooms || []);
        setClassrooms(list);

      } catch (err) {
        console.error("Init Error:", err);
        toast.error("Failed to load classrooms");
      } finally {
        if (isMounted) setLoading(false);
      }
    };

    fetchData();

    return () => { isMounted = false; };
  }, []);

  // =========================================================
  // 2. SOCKET CALLBACKS
  // =========================================================
  const handleNewMessage = useCallback((data) => {
    const targetId = data.classroom_id || data.classroomId || data._id;

    setClassrooms((prevClassrooms) => {
      return prevClassrooms.map((c) => {
        if (String(c._id) === String(targetId)) {
          return {
            ...c,
            discussion: [
              ...(c.discussion || []),
              {
                nickname: data.nickname || "User",
                message: data.message,
                createdAt: data.createdAt || new Date().toISOString(),
                timestamp: Date.now(),
              },
            ],
          };
        }
        return c;
      });
    });
  }, []);

  const handleAttendanceEvent = useCallback((type, data) => {
    if (type === "started") {
      toast.info(`Attendance Started for: ${data.classroom_name}`);
    } else if (type === "punchIn") {
      data.success ? toast.success("Punch In Successful!") : toast.error(data.message);
    } else if (type === "punchOut") {
      data.success ? toast.success("Punch Out Successful!") : toast.error(data.message);
    }
  }, []);

  // =========================================================
  // 3. SOCKET CONNECTION
  // =========================================================
  useEffect(() => {
    if (socket && classrooms.length > 0) {
      
      const ioClient = socket.socket || socket;

      if (ioClient) {
        if (ioClient.connected === false) {
           if (ioClient.connect) ioClient.connect();
           else if (ioClient.open) ioClient.open();
        }
      }

      socket.removeCallback?.('newMessageCallback');
      socket.removeCallback?.('attendanceStartedCallback');
      
      socket.setCallback('newMessageCallback', handleNewMessage);
      socket.setCallback('attendanceStartedCallback', (d) => handleAttendanceEvent('started', d));
      socket.setCallback('punchInCallback', (d) => handleAttendanceEvent('punchIn', d));
      socket.setCallback('punchOutCallback', (d) => handleAttendanceEvent('punchOut', d));

      const classroomIds = classrooms.map(c => c._id);
      if (typeof socket.joinClassRoom === 'function') {
        socket.joinClassRoom(classroomIds);
      } else if (socket.socket) {
         socket.socket.emit('join_classroom', classroomIds);
      }
    }
  }, [socket, classrooms, handleNewMessage, handleAttendanceEvent]); 

  // =========================================================
  // 4. ATTENDANCE TIMER LOGIC
  // =========================================================
  useEffect(() => {
    if (Object.keys(attendanceTimers).length === 0) return;
    timerIntervalRef.current = setInterval(() => {
      const now = Date.now();
      setAttendanceTimers((prev) => {
        const updates = { ...prev };
        let hasChanges = false;
        Object.entries(prev).forEach(([id, endTime]) => {
          if (now >= endTime) {
            if (socket?.stopAttendance) socket.stopAttendance(id);
            delete updates[id];
            hasChanges = true;
            toast.info("Attendance ended automatically.");
          }
        });
        return hasChanges ? updates : prev;
      });
    }, 1000);
    return () => clearInterval(timerIntervalRef.current);
  }, [attendanceTimers, socket]);

  // =========================================================
  // 5. HELPER FUNCTIONS
  // =========================================================
  const handleStartAttendance = (classroomId, classroom_name) => {
    if (!socket) return toast.error("Socket not connected");
    const durationMins = 10;
    if (socket.startAttendance) {
      socket.startAttendance(classroomId, classroom_name, durationMins);
    } else {
      socket.socket.emit('start_attendance', { classroomId: classroomId, classroom_name, duration: durationMins });
    }
    setAttendanceTimers(prev => ({ ...prev, [classroomId]: Date.now() + durationMins * 60000 }));
    toast.success("Attendance started (10m)");
  };

  const handlePunch = (type, classroomId) => {
    if (!socket) return toast.error("Socket not connected");
    if (!navigator.geolocation) return toast.error("Geolocation not supported");

    navigator.geolocation.getCurrentPosition(
      (pos) => {
        const payload = {
          classroom_id: classroomId,
          location: { lat: pos.coords.latitude, long: pos.coords.longitude }
        };
        if (type === 'punchIn' && socket.punchIn) socket.punchIn(payload);
        else if (type === 'punchOut' && socket.punchOut) socket.punchOut(payload);
        else {
           const event = type === 'punchIn' ? 'punch_in' : 'punch_out';
           socket.socket.emit(event, payload);
        }
      },
      (err) => {
        console.error(err);
        toast.error("Location access denied.");
      }
    );
  };

  const getCurrentMessages = () => {
    if (!openChat) return [];
    return classrooms.find(c => String(c._id) === String(openChat))?.discussion || [];
  };

  // =========================================================
  // 6. RENDER UI
  // =========================================================
  if (loading || !userData) return <Loader />;

  const filteredClassrooms = classrooms.filter((c) => 
    c.name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="min-h-screen bg-gray-50/50 px-4 sm:px-6 py-10">
      
      {/* HEADER SECTION */}
      <div className="max-w-7xl mx-auto mb-10 flex flex-col md:flex-row items-center justify-between gap-6">
        <div className="text-center md:text-left">
            <h2 className="text-3xl font-extrabold text-gray-900 tracking-tight">
                My Classrooms
            </h2>
            <p className="text-gray-500 mt-1">Manage your sessions and connect with your class.</p>
        </div>
        
        {/* SEARCH BAR */}
        <div className="relative w-full md:w-96">
          <input 
            type="text"
            placeholder="Search for a classroom..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-11 pr-4 py-3 bg-white border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500 shadow-sm transition-all"
          />
          <span className="absolute left-3.5 top-3.5 text-gray-400">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>
          </span>
        </div>
      </div>

      {/* GRID SECTION */}
      <div className="max-w-7xl mx-auto">
        {filteredClassrooms.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20 bg-white rounded-2xl border border-dashed border-gray-300">
            <div className="bg-gray-50 p-4 rounded-full mb-4">
                <svg className="w-10 h-10 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
                </svg>
            </div>
            <p className="text-lg font-medium text-gray-900">No classrooms found</p>
            <p className="text-gray-500 mt-1">
              {searchTerm ? `We couldn't find matches for "${searchTerm}"` : "You haven't been assigned to any classrooms yet."}
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {filteredClassrooms.map((classroom) => {
              const endTime = attendanceTimers[classroom._id];
              const isActive = Boolean(endTime);
              const timeLeft = isActive ? Math.max(0, Math.ceil((endTime - Date.now()) / 1000)) : 0;

              return (
                <div
                  key={classroom._id}
                  className="group bg-white rounded-2xl shadow-sm hover:shadow-xl border border-gray-100 overflow-hidden transition-all duration-300 flex flex-col"
                >
                  {/* Card Header Gradient */}
                  <div className={`h-20 w-full relative ${isActive ? 'bg-gradient-to-r from-green-500 to-emerald-600' : 'bg-gradient-to-r from-blue-500 to-indigo-600'}`}>
                    {isActive && (
                         <div className="absolute top-3 right-3 bg-white/20 backdrop-blur-md px-3 py-1 rounded-full flex items-center gap-2 border border-white/30">
                            <span className="relative flex h-2 w-2">
                                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-white opacity-75"></span>
                                <span className="relative inline-flex rounded-full h-2 w-2 bg-white"></span>
                            </span>
                            <span className="text-xs font-bold text-white tracking-wide">LIVE ATTENDANCE</span>
                         </div>
                    )}
                  </div>

                  <div className="p-6 pt-0 flex-1 flex flex-col relative">
                     {/* Floating Icon */}
                     <div className="absolute -top-10 left-6 h-16 w-16 bg-white p-1 rounded-2xl shadow-md">
                        <div className={`h-full w-full rounded-xl flex items-center justify-center text-2xl font-bold text-white ${isActive ? 'bg-green-500' : 'bg-blue-500'}`}>
                            {classroom.name.charAt(0).toUpperCase()}
                        </div>
                     </div>

                    <div className="mt-8 mb-4">
                      <h3 className="text-xl font-bold text-gray-900 truncate" title={classroom.name}>
                        {classroom.name}
                      </h3>
                      <p className="text-sm text-gray-500 mt-1">
                        {userData.role} View
                      </p>
                    </div>

                    <div className="mt-auto space-y-3">
                      
                      {/* CHAT BUTTON */}
                      <button
                        onClick={() => setOpenChat(classroom._id)}
                        className="w-full py-2.5 px-4 bg-gray-50 hover:bg-gray-100 text-gray-700 font-medium rounded-lg transition-colors flex items-center justify-center gap-2 border border-gray-200"
                      >
                        <svg className="w-5 h-5 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" /></svg>
                        Discussion <span className="bg-gray-200 text-gray-600 text-xs py-0.5 px-2 rounded-full ml-1">{classroom.discussion?.length || 0}</span>
                      </button>

                      {/* TEACHER ACTIONS */}
                      {userData.role === "Teacher" && (
                        <button
                          onClick={() => handleStartAttendance(classroom._id, classroom.name)}
                          disabled={isActive}
                          className={`w-full py-3 rounded-lg font-semibold transition-all shadow-sm flex items-center justify-center gap-2 ${
                            isActive 
                              ? "bg-green-50 text-green-700 border border-green-200 cursor-not-allowed" 
                              : "bg-blue-600 hover:bg-blue-700 text-white hover:shadow-md"
                          }`}
                        >
                           {isActive ? (
                               <>
                                <svg className="w-5 h-5 animate-spin" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
                                <span>Ends in {Math.floor(timeLeft/60)}m {timeLeft%60}s</span>
                               </>
                           ) : (
                               <>
                                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
                                <span>Start 10m Attendance</span>
                               </>
                           )}
                        </button>
                      )}

                      {/* STUDENT ACTIONS */}
                      {userData.role === "Student" && (
                        <div className="grid grid-cols-2 gap-3">
                          <button
                            onClick={() => handlePunch("punchIn", classroom._id)}
                            className="py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg font-medium transition-colors shadow-sm hover:shadow flex flex-col items-center justify-center"
                          >
                            <span className="text-xs opacity-90 uppercase tracking-wide">Entry</span>
                            <span className="leading-none">Punch In</span>
                          </button>
                          <button
                            onClick={() => handlePunch("punchOut", classroom._id)}
                            className="py-2.5 bg-white border border-red-200 text-red-600 hover:bg-red-50 rounded-lg font-medium transition-colors shadow-sm hover:shadow flex flex-col items-center justify-center"
                          >
                             <span className="text-xs opacity-70 uppercase tracking-wide">Exit</span>
                             <span className="leading-none">Punch Out</span>
                          </button>
                        </div>
                      )}
                      
                    </div>
                  </div>
                </div> 
              );
            })}
          </div>  
        )}

        {openChat && (
          <ChatModal
            classroomId={openChat}
            socket={socket}
            onClose={() => setOpenChat(null)}
            messages={getCurrentMessages()}
            currentUser={userData}
          />
        )}
      </div>
    </div>
  );
};

export default Classroom;