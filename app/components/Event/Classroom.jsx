"use client";
import React, { useEffect, useState, useCallback, useRef } from "react";
import { toast } from "react-toastify";
import { useSocket } from "../../../lib/api/initSocket"; 
// 🆕 UPDATED IMPORTS: Added getClassroomsForSpeaker
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
  
  // State for Search
  const [searchTerm, setSearchTerm] = useState(""); 
  
  const timerIntervalRef = useRef(null);

  // ---------------------------------------------------------
  // SOCKET: AUTO-CONNECT LOGIC (UNCHANGED)
  // ---------------------------------------------------------
  useEffect(() => {
    if (!socket) return;
    const ioClient = socket.socket || socket;
    if (ioClient) {
      if (ioClient.connected === false) {
        console.log("🔌 Socket is disconnected. Forcing connection now...");
        if (ioClient.connect) ioClient.connect(); 
        else if (ioClient.open) ioClient.open();
      }
    }
  }, [socket]);

  // ---------------------------------------------------------
  // CALLBACKS (UNCHANGED)
  // ---------------------------------------------------------
  const handleNewMessage = useCallback((data) => {
    console.log("⚡ UI Received Message:", data);
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

  // ---------------------------------------------------------
  // 🆕 UPDATED INITIALIZATION LOGIC
  // ---------------------------------------------------------
  const initialize = async () => {
      try {
        setLoading(true);
        
        // 1. Fetch User Details FIRST so we know the Role
        const user = await fetchUserDetail();
        setUserData(user);
        
        let clsData = [];

        // 2. Conditional Fetching based on Role
        if (user.role === 'Speaker') {
            console.log("👤 User is Speaker: Fetching assigned classrooms...");
            // Use the new function for Speakers (pass null for event)
            clsData = await getClassrooms(null);
        } else {
            console.log("👤 User is Teacher/Student: Fetching all classrooms...");
            // Use the standard function for everyone else
            clsData = await getClassrooms(null);
        }

        // 3. Handle Data Structure (Array vs Object)
        const list = clsData?.length ? clsData : (clsData?.classrooms || []);
        setClassrooms(list);

        // 4. Wire up Socket (Only if socket exists and we have classrooms)
        if (socket && list.length > 0) {
          socket.setCallback('newMessageCallback', handleNewMessage);
          socket.setCallback('attendanceStartedCallback', (d) => handleAttendanceEvent('started', d));
          socket.setCallback('punchInCallback', (d) => handleAttendanceEvent('punchIn', d));
          socket.setCallback('punchOutCallback', (d) => handleAttendanceEvent('punchOut', d));

          const classroomIds = list.map(c => c._id);
          if (typeof socket.joinClassRoom === 'function') {
            socket.joinClassRoom(classroomIds);
          } else if (socket.socket) {
             socket.socket.emit('join_classroom', classroomIds);
          }
        }

      } catch (err) {
        console.error("Init Error:", err);
        toast.error("Failed to load classrooms");
      } finally {
        setTimeout(()=>{ setLoading(false); }, 1000)
      }
    };

  useEffect(() => {
    initialize();
  }, [socket, handleNewMessage, handleAttendanceEvent]);

  // ---------------------------------------------------------
  // ATTENDANCE LOGIC (UNCHANGED)
  // ---------------------------------------------------------
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

  // ---------------------------------------------------------
  // FILTER LOGIC (UNCHANGED)
  // ---------------------------------------------------------
  const filteredClassrooms = classrooms.filter((c) => 
    c.name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  if (loading || !userData) return <Loader />;

  return (
    <div className="min-h-screen bg-gray-100 px-4 sm:px-6 py-10">

      <h2 className="text-3xl sm:text-4xl font-extrabold text-gray-800 text-center mb-6">
        Classrooms
      </h2>

      {/* SEARCH BAR UI (UNCHANGED) */}
      <div className="flex justify-center mb-8">
        <div className="relative w-full max-w-md">
          <input 
            type="text"
            placeholder="Search classrooms..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-full focus:outline-none focus:ring-2 focus:ring-blue-500 shadow-sm transition-all"
          />
          <span className="absolute left-3 top-2.5 text-gray-400">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>
          </span>
        </div>
      </div>

      {filteredClassrooms.length === 0 ? (
        <div className="text-center text-gray-600 mt-10">
          {searchTerm ? `No classrooms match "${searchTerm}"` : "No classrooms found."}
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-8">
          {filteredClassrooms.map((classroom) => {
            const endTime = attendanceTimers[classroom._id];
            const isActive = Boolean(endTime);
            const timeLeft = isActive ? Math.max(0, Math.ceil((endTime - Date.now()) / 1000)) : 0;

            return (
              <div
                key={classroom._id}
                className={`relative bg-white rounded-2xl shadow-lg p-6 border transition-all hover:shadow-xl ${
                  isActive ? "border-green-500 ring-1 ring-green-500" : "border-gray-200"
                }`}
              >
                <h3 className="text-xl font-bold text-gray-900 text-center mb-4 truncate" title={classroom.name}>
                  {classroom.name}
                </h3>

                <div className="flex flex-col gap-3">
                  
                  {/* --- COMMON: CHAT BUTTON --- */}
                  <button
                    onClick={() => setOpenChat(classroom._id)}
                    className="w-full py-2 bg-purple-600 text-white rounded hover:bg-purple-700 transition-colors flex items-center justify-center gap-2"
                  >
                    <span>💬</span> Chat ({classroom.discussion?.length || 0})
                  </button>

                  {/* --- TEACHER ONLY: START ATTENDANCE --- */}
                  {userData.role === "Teacher" && (
                    <button
                      onClick={() => handleStartAttendance(classroom._id, classroom.name)}
                      disabled={isActive}
                      className={`w-full py-2 text-white rounded transition-colors ${
                        isActive ? "bg-gray-400 cursor-not-allowed" : "bg-blue-600 hover:bg-blue-700"
                      }`}
                    >
                      {isActive ? `Ends in: ${Math.floor(timeLeft/60)}m ${timeLeft%60}s` : "Start Attendance"}
                    </button>
                  )}

                  {/* --- STUDENT ONLY: PUNCH IN/OUT --- */}
                  {userData.role === "Student" && (
                    <div className="flex gap-2">
                      <button
                        onClick={() => handlePunch("punchIn", classroom._id)}
                        className="flex-1 py-2 bg-green-600 text-white rounded hover:bg-green-700 transition-colors"
                      >
                        Punch In
                      </button>
                      <button
                        onClick={() => handlePunch("punchOut", classroom._id)}
                        className="flex-1 py-2 bg-red-600 text-white rounded hover:bg-red-700 transition-colors"
                      >
                        Punch Out
                      </button>
                    </div>
                  )}
                  
                  {/* If Speaker, they see only Chat */}
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
  );
};

export default Classroom;