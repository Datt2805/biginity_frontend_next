"use client";
import React, { useEffect, useState, useCallback, useRef } from "react";
import { toast } from "react-toastify";
import { useSocket } from "../../../lib/api/initSocket"; 
import { getClassrooms, fetchUserDetail } from "../../../lib/api/app-SDK";
import Loader from "../Common/Loader";
import ChatModal from "../Chat/ChatModal";


const Classroom = () => {
  // 1. Get the persistent socket instance from Context
  const socket = useSocket();

  const [classrooms, setClassrooms] = useState([]);
  const [loading, setLoading] = useState(true);
  const [userData, setUserData] = useState(null);
  const [openChat, setOpenChat] = useState(null);
  const [attendanceTimers, setAttendanceTimers] = useState({});
  
  const timerIntervalRef = useRef(null);

  // ---------------------------------------------------------
  // 1.5 NEW: ROBUST AUTO-CONNECT LOGIC
  // ---------------------------------------------------------
  useEffect(() => {
    // If socket is not loaded yet, do nothing
    if (!socket) return;

    // Try to find the raw socket.io client
    // Your code uses 'socket.socket', so we prioritize that.
    const ioClient = socket.socket || socket;

    // Check if we found a valid socket client
    if (ioClient) {
      // If it is explicitly disconnected, force a connection
      if (ioClient.connected === false) {
        console.log("🔌 Socket is disconnected. Forcing connection now...");
        
        // Force the connection
        if (ioClient.connect) ioClient.connect(); 
        
        // Double check: Some wrappers use 'open' instead of connect
        else if (ioClient.open) ioClient.open();
      }
    } else {
      console.warn("⚠️ Socket wrapper exists, but raw IO client is missing.");
    }
  }, [socket]);


  // ---------------------------------------------------------
  // 2. DEFINE CALLBACKS (These update the UI)
  // ---------------------------------------------------------

  // Handle incoming messages
  const handleNewMessage = useCallback((data) => {
    console.log("⚡ UI Received Message:", data);
    
    // Handle potential ID naming differences from backend
    const targetId = data.classroom_id || data.classroomId || data._id;

    setClassrooms((prevClassrooms) => {
      return prevClassrooms.map((c) => {
        // Convert to string for safe comparison
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

  // Handle Attendance Events
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
  // 3. INITIALIZATION (Fetch Data & Wire up Socket)
  // ---------------------------------------------------------
  const initialize = async () => {
      try {
        setLoading(true);
        
        // A. Fetch Data
        const [user, clsData] = await Promise.all([fetchUserDetail(), getClassrooms()]);
        setUserData(user);
        
        const list = clsData?.length ? clsData : (clsData?.classrooms || []);
        setClassrooms(list);

        // B. Wire up Socket (Only if socket exists and we have classrooms)
        if (socket && list.length > 0) {
          console.log("🔗 Wiring up Socket Context...");

          // Use the setter methods from your Context Provider
          socket.setCallback('newMessageCallback', handleNewMessage);
          socket.setCallback('attendanceStartedCallback', (d) => handleAttendanceEvent('started', d));
          socket.setCallback('punchInCallback', (d) => handleAttendanceEvent('punchIn', d));
          socket.setCallback('punchOutCallback', (d) => handleAttendanceEvent('punchOut', d));

          // Join Rooms
          const classroomIds = list.map(c => c._id);
          
          // Check if your SDK has joinClassRoom, else fallback to emit
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
        setTimeout(()=>{
          setLoading(false);
        },2000)
      }
    };
  useEffect(() => {
    initialize();
  }, [socket, handleNewMessage, handleAttendanceEvent]);


  // ---------------------------------------------------------
  // 4. ATTENDANCE LOGIC (Timers & Geolocation)
  // ---------------------------------------------------------

  // Auto-stop attendance timer
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

  // Start Attendance Handler
  const handleStartAttendance = (classroomId, classroom_name) => {
    if (!socket) return toast.error("Socket not connected");
    
    const durationMins = 10;
    
    if (socket.startAttendance) {
      socket.startAttendance(classroomId, classroom_name, durationMins);
    } else {
      socket.socket.emit('start_attendance', { classroomId: classroomId, classroom_name, duration: durationMins });
    }

    setAttendanceTimers(prev => ({
      ...prev,
      [classroomId]: Date.now() + durationMins * 60000
    }));
    
    toast.success("Attendance started (10m)");
  };

  // Punch In/Out Handler
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
           // Fallback
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

  // Helper to get messages for the modal
  const getCurrentMessages = () => {
    if (!openChat) return [];
    return classrooms.find(c => String(c._id) === String(openChat))?.discussion || [];
  };

  if (loading || !userData) return <Loader />;

  return (
    <div className="min-h-screen bg-gray-100 px-6 py-10">

      <h2 className="text-4xl font-extrabold text-gray-800 text-center mb-10">
        Classrooms
      </h2>

      {classrooms.length === 0 ? (
        <div className="text-center text-gray-600">No classrooms found.</div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-8">
          {classrooms.map((classroom) => {
            const endTime = attendanceTimers[classroom._id];
            const isActive = Boolean(endTime);
            const timeLeft = isActive ? Math.max(0, Math.ceil((endTime - Date.now()) / 1000)) : 0;

            return (
              <div
                key={classroom._id}
                className={`relative bg-white rounded-2xl shadow-lg p-6 border ${
                  isActive ? "border-green-500 ring-1 ring-green-500" : "border-gray-200"
                }`}
              >
                <h3 className="text-xl font-bold text-gray-900 text-center mb-4">
                  {classroom.name}
                </h3>

                <div className="flex flex-col gap-3">
                  <button
                    onClick={() => setOpenChat(classroom._id)}
                    className="w-full py-2 bg-purple-600 text-white rounded hover:bg-purple-700"
                  >
                    💬 Chat ({classroom.discussion?.length || 0})
                  </button>

                  {userData.role === "Teacher" && (
                    <button
                      onClick={() => handleStartAttendance(classroom._id, classroom.name)}
                      disabled={isActive}
                      className={`w-full py-2 text-white rounded ${
                        isActive ? "bg-gray-400" : "bg-blue-600 hover:bg-blue-700"
                      }`}
                    >
                      {isActive ? `Ends in: ${Math.floor(timeLeft/60)}m ${timeLeft%60}s` : "Start Attendance"}
                    </button>
                  )}
                  {userData.role === "Student" && (
                    <div className="flex gap-2">
                    <button
                      onClick={() => handlePunch("punchIn", classroom._id)}
                      className="flex-1 py-2 bg-green-600 text-white rounded hover:bg-green-700"
                    >
                      Punch In
                    </button>
                    <button
                      onClick={() => handlePunch("punchOut", classroom._id)}
                      className="flex-1 py-2 bg-red-600 text-white rounded hover:bg-red-700"
                    >
                      Punch Out
                    </button>
                  </div>
                  )}
                  
                </div>
              </div> 
            );
          })}
        </div>  
      )}

      {openChat && (
        <ChatModal
          classroomId={openChat}
          socket={socket} // Pass the context socket to the modal
          onClose={() => setOpenChat(null)}
          messages={getCurrentMessages()}
          currentUser={userData}
        />
      )}
    </div>
  );
};

export default Classroom;