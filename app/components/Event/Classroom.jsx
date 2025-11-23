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

  // Load timers initially
  useEffect(() => {
    const saved = JSON.parse(localStorage.getItem("attendanceTimers")) || {};
    setAttendanceTimers(saved);
  }, []);

  // Block leaving page during attendance
  useEffect(() => {
    const handleBeforeUnload = (event) => {
      if (Object.keys(attendanceTimers).length > 0) {
        event.preventDefault();
        event.returnValue =
          "Attendance is still active. Are you sure you want to leave?";
      }
    };
    window.addEventListener("beforeunload", handleBeforeUnload);
    return () =>
      window.removeEventListener("beforeunload", handleBeforeUnload);
  }, [attendanceTimers]);

  // Auto stop attendance
  useEffect(() => {
    const interval = setInterval(() => {
      if (!socketActions) return;
      const now = Date.now();

      Object.entries(attendanceTimers).forEach(([classroomId, endTime]) => {
        if (now >= endTime) {
          socketActions.stopAttendance(classroomId);
          toast.info(`Attendance automatically stopped.`);

          const updated = { ...attendanceTimers };
          delete updated[classroomId];
          setAttendanceTimers(updated);
          localStorage.setItem("attendanceTimers", JSON.stringify(updated));
        }
      });
    }, 1000);
    return () => clearInterval(interval);
  }, [attendanceTimers, socketActions]);

  const loadClassrooms = async () => {
    try {
      setLoading(true);
      const data = await getClassrooms();
      if (data?.length) setClassrooms(data);
      else setClassrooms(data?.classrooms || []);
    } catch (err) {
      setError(err.message || "Failed to load classrooms");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadClassrooms();
    const actions = new initSocket({
      newMessageCallback: (data) => console.log("New message:", data),
      attendanceStartedCallback: () =>
        toast.success(`Attendance started for classroom.`),
      punchInCallback: () => toast.info("Punch-In recorded."),
      punchOutCallback: () => toast.info("Punch-Out recorded."),
    });

    setSocketActions(actions);
    return () => actions.socket.disconnect();
  }, []);

  const handleStartAttendance = (classroomId) => {
    socketActions.startAttendance(classroomId, 10);
    toast.success("Attendance started for 10 minutes!");

    const endTime = Date.now() + 10 * 60000;
    const updated = { ...attendanceTimers, [classroomId]: endTime };
    setAttendanceTimers(updated);
    localStorage.setItem("attendanceTimers", JSON.stringify(updated));
  };

  const handlePunch = (type, classroomId) => {
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        socketActions[type]({
          classroom_id: classroomId,
          location: {
            lat: pos.coords.latitude,
            long: pos.coords.longitude,
          },
        });
        toast.success(`${type === "punchIn" ? "Punch-In" : "Punch-Out"} successful!`);
      },
      () => toast.error("Location access denied.")
    );
  };

  if (loading) return <Loader />;
  if (error) return <div className="text-red-600">{error}</div>;

  return (
    <div className="min-h-screen bg-gray-100 px-6 py-10">
      <ToastContainer />

      <h2 className="text-4xl font-extrabold text-gray-800 text-center mb-10 tracking-tight">
        Classrooms
      </h2>

      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-8">
        {classrooms.map((classroom) => {
          const endTime = attendanceTimers[classroom._id];
          const isActive = Boolean(endTime);

          const timeLeft = Math.max(
            0,
            Math.ceil((endTime - Date.now()) / 1000)
          );

          return (
            <div
              key={classroom._id}
              className={`relative bg-white rounded-2xl shadow-lg hover:shadow-xl transition-all p-6 border border-gray-200 
                ${isActive ? "ring-2 ring-green-500" : ""}`}
            >

              {/* STATUS BADGE */}
              <span
                className={`absolute top-3 right-3 px-3 py-1 text-xs rounded-full font-semibold
                  ${isActive ? "bg-green-600 text-white" : "bg-gray-400 text-white"}`}
              >
                {isActive ? "Attendance Active" : "Inactive"}
              </span>

              {/* Classroom Title */}
              <h3 className="text-xl font-semibold text-gray-900 text-center">
                {classroom.name}
              </h3>

              {/* Buttons */}
              <div className="flex flex-col gap-4 mt-4">

                {/* Chat */}
                <button
                  onClick={() => {
                    setOpenChat(classroom._id);
                    setExistingMessages(classroom.discussion);
                  }}
                  className="px-5 py-3 bg-purple-600 w-full text-white rounded-lg hover:bg-purple-700 transition-all shadow-sm"
                >
                  💬 Open Chat
                </button>

                {/* Teacher Controls */}
                {userData.role === "Teacher" && (
                  <>
                    <button
                      onClick={() => handleStartAttendance(classroom._id)}
                      className="px-5 py-3 bg-blue-600 text-white rounded-lg w-full hover:bg-blue-700 transition-all shadow-sm"
                    >
                      Start Attendance (10 mins)
                    </button>

                    {isActive && (
                      <p className="text-green-700 text-center font-medium">
                        ⏳ Time Left: {timeLeft}s
                      </p>
                    )}
                  </>
                )}

                {/* Punch Buttons */}
                <div className="flex gap-4">
                  <button
                    onClick={() => handlePunch("punchIn", classroom._id)}
                    className="w-1/2 py-3 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-all shadow-sm"
                  >
                    Punch In
                  </button>
                  <button
                    onClick={() => handlePunch("punchOut", classroom._id)}
                    className="w-1/2 py-3 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-all shadow-sm"
                  >
                    Punch Out
                  </button>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {openChat && (
        <ChatModal
          classroomId={openChat}
          socket={socketActions}
          onClose={() => setOpenChat(null)}
          existingMessages={existingMessagesOfOpenChat}
        />
      )}
    </div>
  );
};

export default Classroom;
