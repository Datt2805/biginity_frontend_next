"use client";
import React, { useEffect, useState } from "react";
import { getClassrooms, initSocket, fetchUserDetail } from "../../../lib/api";
import Loader from "../Common/Loader";
import ChatModal from "../Chat/ChatModal";
import { toast, ToastContainer } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";

const userData = await fetchUserDetail();

const Classroom = () => {
  const [classrooms, setClassrooms] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [socketActions, setSocketActions] = useState(null);
  const [openChat, setOpenChat] = useState(null);
  const [existingMessagesOfOpenChat, setExistingMessages] = useState([]);
  const [attendanceTimers, setAttendanceTimers] = useState(
    JSON.parse(localStorage.getItem("attendanceTimers")) || {}
  );

  useEffect(() => {
    const saved = JSON.parse(localStorage.getItem("attendanceTimers")) || {};
    setAttendanceTimers(saved);
  }, []);

  // Prevent leaving during active attendance
  useEffect(() => {
    const handleBeforeUnload = (event) => {
      if (Object.keys(attendanceTimers).length > 0) {
        event.preventDefault();
        event.returnValue =
          "Attendance is still running. Are you sure you want to leave?";
      }
    };

    window.addEventListener("beforeunload", handleBeforeUnload);
    return () => window.removeEventListener("beforeunload", handleBeforeUnload);
  }, [attendanceTimers]);

  // ✅ Auto-stop attendance when time ends
  useEffect(() => {
    const interval = setInterval(() => {
      if (!socketActions) return;

      const now = Date.now(); 

      Object.entries(attendanceTimers).forEach(([classroomId, endTime]) => {
        if (now >= endTime) {
          // ✅ Stop attendance
          socketActions.stopAttendance(classroomId);
          toast.info(`Attendance automatically stopped for ${classroomId}`);

          // ✅ Remove timer
          const updated = { ...attendanceTimers };
          delete updated[classroomId];

          setAttendanceTimers(updated);
          localStorage.setItem("attendanceTimers", JSON.stringify(updated));
        }
      });
    }, 1000);

    return () => clearInterval(interval);
  }, [attendanceTimers, socketActions]);

  // Load classrooms
  const loadClassrooms = async () => {
    try {
      setLoading(true);
      const data = await getClassrooms();
      setClassrooms(data);
    } catch (err) {
      setError(err.message || "Failed to load classrooms");
    } finally {
      setLoading(false);
    }
  };

  // Init socket
  useEffect(() => {
    loadClassrooms();

    const actions = new initSocket({
      newMessageCallback: (data) => console.log("New message:", data),
      connectionCallback: () => console.log("Connected to socket"),
      successCallback: (data) => console.log("Socket success:", data),
      errorCallback: (err) => console.error("Socket error:", err),
      attendanceStartedCallback: (data) =>
        toast.success(`Attendance started for ${data.classroom_id || ""}`),
      punchInCallback: () => toast.info("Punch-In recorded."),
      punchOutCallback: () => toast.info("Punch-Out recorded."),
    });

    setSocketActions(actions);

    return () => {
      actions.socket.disconnect();
    };
  }, []);

  const handleStartAttendance = (classroomId) => {
    if (!socketActions) return toast.error("Socket not initialized yet!");

    socketActions.startAttendance(classroomId, 10); // ✅ 10 minutes
    toast.success("Attendance started for 10 minutes!");

    const endTime = Date.now() + 10 * 60000;
    const updatedTimers = { ...attendanceTimers, [classroomId]: endTime };

    setAttendanceTimers(updatedTimers);
    localStorage.setItem("attendanceTimers", JSON.stringify(updatedTimers));
  };

  // Punch In
  const handlePunchIn = (classroomId) => {
    if (!socketActions) return;

    navigator.geolocation.getCurrentPosition(
      (pos) => {
        socketActions.punchIn({
          classroom_id: classroomId,
          location: { lat: pos.coords.latitude, long: pos.coords.longitude },
        });
        toast.success("Punch-In successful!");
      },
      () => toast.error("Location not found")
    );
  };

  // Punch Out
  const handlePunchOut = (classroomId) => {
    if (!socketActions) return;

    navigator.geolocation.getCurrentPosition(
      (pos) => {
        socketActions.punchOut({
          classroom_id: classroomId,
          location: { lat: pos.coords.latitude, long: pos.coords.longitude },
        });
        toast.success("Punch-Out successful!");
      },
      () => toast.error("Location not found")
    );
  };

  if (loading) return <Loader />;
  if (error) return <div className="text-red-600">{error}</div>;

  return (
    <div className="bg-gray-50 min-h-screen px-6 py-8">
      <ToastContainer />
      <h2 className="text-3xl font-bold text-center mb-8">Classrooms</h2>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
        {classrooms.map((classroom) => (
          <div
            key={classroom._id}
            className="bg-white border shadow-md rounded-2xl p-6"
          >
            <h3 className="text-xl font-semibold text-center">
              {classroom.name}
            </h3>

            <div className="flex flex-col gap-3 items-center mt-4">
              {/* Chat Button */}
              <button
                onClick={() => {setOpenChat(classroom._id); setExistingMessages(classroom.discussion)}}
                className="px-5 py-2.5 bg-purple-600 text-white rounded-lg hover:bg-purple-700"
              >
                Open Chat
              </button>

              {/* Start Attendance */}
              {userData.role === "Teacher" && <button
                onClick={() => handleStartAttendance(classroom._id)}
                className="px-5 py-2.5 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
              >
                Start Attendance
              </button>}

              {/* Countdown */}
              {attendanceTimers[classroom._id] && (
                <p className="text-green-700 font-semibold">
                  Time Left:{" "}
                  {Math.max(  
                    0,
                    Math.ceil(
                      (attendanceTimers[classroom._id] - Date.now()) / 1000
                    )
                  )}
                  s
                </p>
              )}

              {/* Punch In / Out */}
              <div className="flex gap-3 w-full">
                <button
                  onClick={() => handlePunchIn(classroom._id)}
                  className="w-1/2 bg-green-600 text-white py-2 rounded-lg"
                >
                  Punch In
                </button>
                <button
                  onClick={() => handlePunchOut(classroom._id)}
                  className="w-1/2 bg-red-600 text-white py-2 rounded-lg"
                >
                  Punch Out
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Chat Modal */}
      {openChat && (
        <ChatModal
          classroomId={openChat}
          socket={socketActions}
          onClose={() => setOpenChat(null)}
          existingMessages={ existingMessagesOfOpenChat }
        />
      )}
    </div>
  );
};

export default Classroom;
