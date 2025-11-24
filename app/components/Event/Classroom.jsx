"use client";
import React, { useEffect, useState, useRef } from "react";
import {
  getClassrooms,
  initSocket,
  fetchUserDetail,
  getEnrollmentsByUser,
} from "../../../lib/api";
import Loader from "../Common/Loader";
import ChatModal from "../Chat/ChatModal";
import { toast, ToastContainer } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";

const Classroom = () => {
  // USER DATA
  const [userData, setUserData] = useState(null);
  const [enrolledIds, setEnrolledIds] = useState([]);

  useEffect(() => {
    const loadUser = async () => {
      const data = await fetchUserDetail();
      setUserData(data);

      // Fetch enrollment only for students
      if (data?.role === "Student") {
        const ids = await getEnrollmentsByUser(data._id);
        setEnrolledIds(ids);
        console.log("Enrolled classroom IDs:", ids);
      }
    };

    loadUser();
  }, []);

  // CLASSROOM DATA
  const [classrooms, setClassrooms] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  // SOCKET ACTIONS
  const [socketActions, setSocketActions] = useState(null);

  // CHAT
  const [openChat, setOpenChat] = useState(null);
  const [existingMessagesOfOpenChat, setExistingMessages] = useState([]);

  // ATTENDANCE TIMERS
  const [attendanceTimers, setAttendanceTimers] = useState(
    JSON.parse(localStorage.getItem("attendanceTimers")) || {}
  );

  // PUNCH STATUS
  const [punchStatus, setPunchStatus] = useState(
    JSON.parse(localStorage.getItem("punchStatus")) || {}
  );

  // LOCK FOR DOUBLE CLICK
  const punchLock = useRef({ in: false, out: false });

  // Restore punch status
  useEffect(() => {
    const saved = JSON.parse(localStorage.getItem("punchStatus")) || {};
    setPunchStatus(saved);
  }, []);

  // Restore timers
  useEffect(() => {
    const saved = JSON.parse(localStorage.getItem("attendanceTimers")) || {};
    setAttendanceTimers(saved);
  }, []);

  // Prevent leaving when attendance active
  useEffect(() => {
    const handleBeforeUnload = (event) => {
      if (Object.keys(attendanceTimers).length > 0) {
        event.preventDefault();
        event.returnValue =
          "Attendance is active. Are you sure you want to leave?";
      }
    };

    window.addEventListener("beforeunload", handleBeforeUnload);
    return () => window.removeEventListener("beforeunload", handleBeforeUnload);
  }, [attendanceTimers]);

  // Auto stop attendance on timeout
  useEffect(() => {
    const interval = setInterval(() => {
      if (!socketActions) return;

      const now = Date.now();
      Object.entries(attendanceTimers).forEach(([classroomId, endTime]) => {
        if (now >= endTime) {
          socketActions.stopAttendance(classroomId);
          toast.info("Attendance automatically stopped.");

          // ⭐ RESET PUNCH FOR THIS CLASSROOM
          const newPunch = { ...punchStatus };
          delete newPunch[classroomId]; // remove punch-in/out data
          setPunchStatus(newPunch);
          localStorage.setItem("punchStatus", JSON.stringify(newPunch));

          // ⭐ REMOVE attendance timer
          const updated = { ...attendanceTimers };
          delete updated[classroomId];
          setAttendanceTimers(updated);
          localStorage.setItem("attendanceTimers", JSON.stringify(updated));

          console.log("🔄 Punch reset because attendance ended");
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
      setClassrooms(data?.classrooms || data || []);
    } catch (err) {
      setError(err.message || "Failed to load classrooms");
    } finally {
      setLoading(false);
    }
  };

  // Initialize socket + load classrooms
  useEffect(() => {
    loadClassrooms();

    const actions = new initSocket({
      newMessageCallback: (d) => console.log("New message:", d),
      attendanceStartedCallback: () => toast.success("Attendance started."),
      punchInCallback: () => {
        toast.success("Punch-In recorded");
        punchLock.current.in = false;
      },
      punchOutCallback: () => {
        toast.success("Punch-Out recorded");
        punchLock.current.out = false;
      },
    });

    setSocketActions(actions);
    return () => actions.socket?.disconnect();
  }, []);

  // Start attendance
  const handleStartAttendance = (classroomId) => {
    socketActions.startAttendance(classroomId, 10);

    const endTime = Date.now() + 10 * 60000;
    const updated = { ...attendanceTimers, [classroomId]: endTime };

    setAttendanceTimers(updated);
    localStorage.setItem("attendanceTimers", JSON.stringify(updated));

    toast.success("Attendance started for 10 minutes!");
  };

  // Punch In/Out
  const handlePunch = (type, classroomId) => {
    const lockType = type === "punchIn" ? "in" : "out";
    const status = punchStatus[classroomId] || "none";

    if (status === "done") return toast.warning("Punch cycle completed.");
    if (type === "punchIn" && status !== "none")
      return toast.warning("Already punched in.");
    if (type === "punchOut" && status !== "in")
      return toast.warning("Punch-Out allowed only after Punch-In.");

    if (punchLock.current[lockType])
      return toast.warning("Processing... please wait.");

    punchLock.current[lockType] = true;

    navigator.geolocation.getCurrentPosition(
      (pos) => {
        socketActions[type]({
          classroom_id: classroomId,
          location: {
            lat: pos.coords.latitude,
            long: pos.coords.longitude,
          },
        });

        const updated = { ...punchStatus };
        if (type === "punchIn") updated[classroomId] = "in";
        if (type === "punchOut") updated[classroomId] = "done";

        setPunchStatus(updated);
        localStorage.setItem("punchStatus", JSON.stringify(updated));
      },
      () => {
        toast.error("Location access denied.");
        punchLock.current[lockType] = false;
      }
    );
  };

  if (loading || !userData) return <Loader />;
  if (error) return <div className="text-red-600">{error}</div>;

  // FILTER CLASSROOMS FOR STUDENT
  const visibleClassrooms =
    userData.role === "Student"
      ? classrooms.filter((c) => enrolledIds.includes(c._id))
      : classrooms;

  return (
    <div className="min-h-screen bg-gray-100 px-6 py-10">
      <ToastContainer />

      <h2 className="text-4xl font-extrabold text-gray-800 text-center mb-10">
        Classrooms
      </h2>

      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-8">
        {visibleClassrooms.map((classroom) => {
          const endTime = attendanceTimers[classroom._id];
          const isActive = !!endTime;
          const timeLeft = Math.max(
            0,
            Math.ceil((endTime - Date.now()) / 1000)
          );
          const status = punchStatus[classroom._id] || "none";

          const eventEnded =
            classroom?.event_end_time &&
            new Date(classroom.event_end_time).getTime() < Date.now();

          const isClassroomInactive = classroom?.status === "Inactive";

          return (
            <div
              key={classroom._id}
              className={`relative bg-white rounded-2xl shadow-lg p-6 border transition ${
                isActive ? "ring-2 ring-green-500" : ""
              } ${
                isClassroomInactive
                  ? "opacity-50 grayscale pointer-events-none"
                  : ""
              }`}
            >
              {/* Status Badge */}
              <span
                className={`absolute top-3 right-3 z-10 px-3 py-1 text-xs rounded-full font-semibold ${
                  isActive
                    ? "bg-green-600 text-white"
                    : eventEnded
                    ? "bg-red-600 text-white"
                    : "bg-gray-400 text-white"
                }`}
              >
                {isActive
                  ? "Attendance Active"
                  : eventEnded
                  ? "Event Ended"
                  : "Inactive"}
              </span>

              <h3 className="text-xl font-semibold text-center">
                {classroom.name}
              </h3>

              <div className="flex flex-col gap-4 mt-4">
                {/* Chat */}
                <button
                  onClick={() => {
                    setOpenChat(classroom._id);
                    setExistingMessages(classroom.discussion);
                  }}
                  className="px-5 py-3 bg-purple-600 text-white rounded-lg hover:bg-purple-700"
                >
                  💬 Open Chat
                </button>

                {/* Teacher Controls */}
                {userData.role === "Teacher" && (
                  <>
                    <button
                      onClick={() => handleStartAttendance(classroom._id)}
                      className="px-5 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
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

                {/* Punch In/Out Buttons */}
                <div className="flex gap-4">
                  <button
                    onClick={() => handlePunch("punchIn", classroom._id)}
                    disabled={status === "in" || status === "done"}
                    className={`w-1/2 py-3 rounded-lg text-white ${
                      status === "in" || status === "done"
                        ? "bg-gray-400 cursor-not-allowed"
                        : "bg-green-600 hover:bg-green-700"
                    }`}
                  >
                    Punch In
                  </button>

                  <button
                    onClick={() => handlePunch("punchOut", classroom._id)}
                    disabled={status !== "in"}
                    className={`w-1/2 py-3 rounded-lg text-white ${
                      status !== "in"
                        ? "bg-gray-400 cursor-not-allowed"
                        : "bg-red-600 hover:bg-red-700"
                    }`}
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
