"use client";
import React, { useEffect, useState, useRef, useCallback } from "react";
import {
  getClassrooms,
  initSocket,
  fetchUserDetail,
  getEnrollmentsByUser,
} from "../../../lib/api";
import Loader from "../Common/Loader";
import ChatModal from "../Chat/ChatModal";
import { ToastContainer, toast } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";

const LS_KEYS = {
  TIMERS: "attendanceTimers",
  PUNCH: "punchStatus",
};

const useLocalState = (key, initial) => {
  const [state, setState] = useState(() => {
    try {
      const raw = localStorage.getItem(key);
      return raw ? JSON.parse(raw) : initial;
    } catch (e) {
      return initial;
    }
  });

  useEffect(() => {
    try {
      localStorage.setItem(key, JSON.stringify(state));
    } catch (e) {
      // ignore storage errors
    }
  }, [key, state]);

  return [state, setState];
};

const Classroom = () => {
  // user + enrollments
  const [userData, setUserData] = useState(null);
  const [enrolledIds, setEnrolledIds] = useState([]);

  // classrooms
  const [classrooms, setClassrooms] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  // socket
  const socketRef = useRef(null);

  // chat
  const [openChat, setOpenChat] = useState(null);
  const [existingMessagesOfOpenChat, setExistingMessages] = useState([]);

  // attendance timers & punch status (persisted)
  const [attendanceTimers, setAttendanceTimers] = useLocalState(LS_KEYS.TIMERS, {});
  const [punchStatus, setPunchStatus] = useLocalState(LS_KEYS.PUNCH, {});

  // locks to prevent double actions
  const punchLock = useRef({ in: {}, out: {} });

  // ------- Helpers --------
  const isStudent = userData?.role === "Student";

  const loadClassrooms = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const data = await getClassrooms();
      setClassrooms(data?.classrooms || data || []);
    } catch (err) {
      setError(err?.message || "Failed to load classrooms");
      console.error(err);
    } finally {
      setLoading(false);
    }
  }, []);

  const loadUserAndEnrollments = useCallback(async () => {
    try {
      const u = await fetchUserDetail();
      setUserData(u);

      if (u?.role === "Student") {
        try {
          const ids = await getEnrollmentsByUser(u._id);
          // normalize to array of ids
          setEnrolledIds(ids || []);
        } catch (e) {
          console.warn("Failed to fetch enrollments", e);
          setEnrolledIds([]);
        }
      }
    } catch (err) {
      console.error("Failed to fetch user detail", err);
      setError("Failed to fetch user data");
    }
  }, []);

  // ------- Socket init & callbacks --------
  useEffect(() => {
    let mounted = true;

    const init = async () => {
      await loadUserAndEnrollments();
      await loadClassrooms();

      const actions = new initSocket({
        newMessageCallback: (d) => console.log("Socket new message:", d),
        attendanceStartedCallback: (payload) => {
          // payload may contain classroom_id and duration
          const classId = payload?.classroom_id;
          const durationMin = payload?.duration || 10;

          if (classId) {
            const endTime = Date.now() + durationMin * 60 * 1000;
            setAttendanceTimers((prev) => ({ ...prev, [classId]: endTime }));
            toast.success("Attendance started.");
          } else {
            toast.success("Attendance started.");
          }
        },
        attendanceStoppedCallback: (payload) => {
          const classId = payload?.classroom_id;
          if (classId) {
            setAttendanceTimers((prev) => {
              const updated = { ...prev };
              delete updated[classId];
              return updated;
            });

            setPunchStatus((prev) => {
              const updated = { ...prev };
              delete updated[classId];
              return updated;
            });

            toast.info("Attendance stopped by backend.");
          }
        },
        punchInCallback: (payload) => {
          const classId = payload?.classroom_id;
          if (classId) {
            setPunchStatus((prev) => ({ ...prev, [classId]: "in" }));
            // release lock
            if (punchLock.current.in[classId]) delete punchLock.current.in[classId];
            toast.success("Punch-In recorded");
          }
        },
        punchOutCallback: (payload) => {
          const classId = payload?.classroom_id;
          if (classId) {
            setPunchStatus((prev) => ({ ...prev, [classId]: "done" }));
            if (punchLock.current.out[classId]) delete punchLock.current.out[classId];
            toast.success("Punch-Out recorded");
          }
        },
      });

      socketRef.current = actions;

      if (!mounted) {
        actions.socket?.disconnect();
        socketRef.current = null;
      }
    };

    init();

    return () => {
      mounted = false;
      socketRef.current?.socket?.disconnect();
      socketRef.current = null;
    };
  }, [loadClassrooms, loadUserAndEnrollments, setAttendanceTimers, setPunchStatus]);

  // ------- Attendance timer interval (single source of truth) --------
  useEffect(() => {
    const id = setInterval(() => {
      setAttendanceTimers((prev) => {
        const now = Date.now();
        const updated = { ...prev };
        let changed = false;

        Object.keys(prev).forEach((classroomId) => {
          if (prev[classroomId] <= now) {
            changed = true;
            delete updated[classroomId];

            // reset punch for that classroom
            setPunchStatus((p) => {
              const pcopy = { ...p };
              delete pcopy[classroomId];
              return pcopy;
            });

            // Optionally: inform backend (only if socket available)
            try {
              socketRef.current?.stopAttendance?.(classroomId);
            } catch (e) {
              // ignore
            }

            toast.info(`Attendance ended for classroom ${classroomId}`);
          }
        });

        if (changed) {
          return updated;
        }
        return prev;
      });
    }, 1000);

    return () => clearInterval(id);
  }, []);

  // Prevent leaving while any attendance active
  useEffect(() => {
    const onBeforeUnload = (e) => {
      if (Object.keys(attendanceTimers).length > 0) {
        e.preventDefault();
        e.returnValue = "Attendance is active. Are you sure you want to leave?";
      }
    };
    window.addEventListener("beforeunload", onBeforeUnload);
    return () => window.removeEventListener("beforeunload", onBeforeUnload);
  }, [attendanceTimers]);

  // ------- Actions --------
  const handleStartAttendance = useCallback((classroomId, minutes = 10) => {
    if (!socketRef.current) return toast.error("Socket not ready");

    try {
      socketRef.current.startAttendance(classroomId, minutes);
      const endTime = Date.now() + minutes * 60 * 1000;
      setAttendanceTimers((prev) => ({ ...prev, [classroomId]: endTime }));
      toast.success(`Attendance started for ${minutes} minutes.`);
    } catch (e) {
      console.error(e);
      toast.error("Failed to start attendance");
    }
  }, [setAttendanceTimers]);

  const handlePunch = useCallback((type, classroomId) => {
    if (!socketRef.current) return toast.error("Socket not ready");

    // role checks (best-effort: rely on backend for enforcement)
    if (userData?.role === "Teacher") {
      toast.warning("Teachers cannot punch in/out");
      return;
    }

    const current = punchStatus[classroomId] || "none";
    if (current === "done") return toast.warning("Punch cycle completed.");
    if (type === "punchIn" && current !== "none")
      return toast.warning("Already punched in.");
    if (type === "punchOut" && current !== "in")
      return toast.warning("Punch-Out allowed only after Punch-In.");

    // prevent double request per classroom per type
    const lockKey = type === "punchIn" ? "in" : "out";
    if (punchLock.current[lockKey][classroomId])
      return toast.warning("Processing... please wait.");

    punchLock.current[lockKey][classroomId] = true;

    navigator.geolocation.getCurrentPosition(
      (pos) => {
        try {
          const payload = {
            classroom_id: classroomId,
            location: { lat: pos.coords.latitude, long: pos.coords.longitude },
          };

          if (type === "punchIn") socketRef.current.punchIn(payload);
          else socketRef.current.punchOut(payload);

          // optimistic UI update (will be reconciled by socket callbacks)
          setPunchStatus((prev) => ({ ...prev, [classroomId]: type === "punchIn" ? "in" : "done" }));
        } catch (err) {
          console.error(err);
          toast.error("Failed to send punch request");
          // release lock
          delete punchLock.current[lockKey][classroomId];
        }
      },
      (err) => {
        console.error("Geolocation failed", err);
        toast.error("Location access denied.");
        delete punchLock.current[lockKey][classroomId];
      }
    );
  }, [punchStatus, userData]);

  // Visible classrooms for students
  const visibleClassrooms = isStudent
    ? classrooms.filter((c) => enrolledIds.includes(c._id))
    : classrooms;

  if (loading || !userData) return <Loader />;
  if (error) return <div className="text-red-600">{error}</div>;

  // ---------- Render ----------
  return (
    <div className="min-h-screen bg-gray-100 px-6 py-10">
      <ToastContainer />

      <h2 className="text-4xl font-extrabold text-gray-800 text-center mb-10">Classrooms</h2>

      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-8">
        {visibleClassrooms.map((classroom) => {
          const endTime = attendanceTimers[classroom._id];
          const isActive = !!endTime;
          const timeLeft = endTime ? Math.max(0, Math.ceil((endTime - Date.now()) / 1000)) : 0;
          const status = punchStatus[classroom._id] || "none";

          const eventEnded = classroom?.event_end_time && new Date(classroom.event_end_time).getTime() < Date.now();
          const isClassroomInactive = classroom?.status === "Inactive";

          return (
            <div
              key={classroom._id}
              className={`relative bg-white rounded-2xl shadow-lg p-6 border transition ${isActive ? "ring-2 ring-green-500" : ""} ${isClassroomInactive ? "opacity-50 grayscale pointer-events-none" : ""}`}>

              <span className={`absolute top-3 right-3 z-10 px-3 py-1 text-xs rounded-full font-semibold ${isActive ? "bg-green-600 text-white" : eventEnded ? "bg-red-600 text-white" : "bg-gray-400 text-white"}`}>
                {isActive ? "Attendance Active" : eventEnded ? "Event Ended" : "Inactive"}
              </span>

              <h3 className="text-xl font-semibold text-center">{classroom.name}</h3>

              <div className="flex flex-col gap-4 mt-4">
                <button
                  onClick={() => {
                    setOpenChat(classroom._id);
                    setExistingMessages(classroom.discussion || []);
                  }}
                  className="px-5 py-3 bg-purple-600 text-white rounded-lg hover:bg-purple-700"
                >
                  💬 Open Chat
                </button>

                {userData?.role === "Teacher" && (
                  <>
                    <button onClick={() => handleStartAttendance(classroom._id)} className="px-5 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700">
                      Start Attendance (default)
                    </button>

                    {isActive && (
                      <p className="text-green-700 text-center font-medium">⏳ Time Left: {timeLeft}s</p>
                    )}
                  </>
                )}

                <div className="flex gap-4">
                  <button
                    onClick={() => handlePunch("punchIn", classroom._id)}
                    disabled={status === "in" || status === "done"}
                    className={`w-1/2 py-3 rounded-lg text-white ${status === "in" || status === "done" ? "bg-gray-400 cursor-not-allowed" : "bg-green-600 hover:bg-green-700"}`}>
                    Punch In
                  </button>

                  <button
                    onClick={() => handlePunch("punchOut", classroom._id)}
                    disabled={status !== "in"}
                    className={`w-1/2 py-3 rounded-lg text-white ${status !== "in" ? "bg-gray-400 cursor-not-allowed" : "bg-red-600 hover:bg-red-700"}`}>
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
          socket={socketRef.current}
          onClose={() => setOpenChat(null)}
          existingMessages={existingMessagesOfOpenChat}
        />
      )}
    </div>
  );
};

export default Classroom;
