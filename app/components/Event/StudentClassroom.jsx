'use client';
import React, { useEffect, useState } from "react";
import { getClassrooms, initSocket } from "../../../lib/api";
import Loader from "../Common/Loader";
import { ToastContainer, toast } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import { FaComments } from "react-icons/fa";
import ChatPopup from "../Chat/ChatModal";

const StudentClassroom = () => {
  const [classrooms, setClassrooms] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [socketActions, setSocketActions] = useState(null);
  const [activeChat, setActiveChat] = useState(null); // currently open chat classroom

  useEffect(() => {
    const loadData = async () => {
      try {
        const data = await getClassrooms();
        console.log("classrooms :", data);
        
        setClassrooms(data || []);
      } catch (err) {
        setError(err.message || "Failed to load classrooms");
      } finally {
        setLoading(false);
      }
    };
    loadData();

    const actions = new initSocket({
      newMessageCallback: (msg) => console.log("New message:", msg),
      connectionCallback: () => console.log("Socket connected"),
      errorCallback: (err) => console.error("Socket error:", err),
    });

    setSocketActions(actions);

    return () => actions.socket.disconnect();
  }, []);

  if (loading) return <Loader />;
  if (error) return <div className="text-red-600 text-center">{error}</div>;

  return (
    <div className="bg-gray-50 min-h-screen px-6 py-8">
      <ToastContainer />
      <h2 className="text-3xl font-bold text-center text-gray-800 mb-8">
        Classrooms
      </h2>

      {/* Classrooms Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
        {classrooms.map((classroom) => (
          <div
            key={classroom._id}
            className="bg-white border border-gray-200 shadow-md rounded-2xl p-6 hover:shadow-xl transition-all relative"
          >
            <h3 className="text-xl font-semibold text-gray-900 mb-4 text-center">
              {classroom.name}
            </h3>

            {/* Chat Button */}
            <button
              onClick={() => setActiveChat(classroom)}
              className="absolute top-4 right-4 bg-blue-600 text-white p-2 rounded-full hover:bg-blue-700 transition"
              title="Open Chat"
            >
              <FaComments size={18} />
            </button>

            <div className="flex justify-center mt-4">
              <p className="text-gray-500 text-sm">
                Join live discussions and interact with your teacher.
              </p>
            </div>
          </div>
        ))}
      </div>

      {/* Chat Popup */}
      {activeChat && (
        <ChatPopup
          classroom={activeChat._id}
          socketActions={socketActions}
          onClose={() => setActiveChat(null)}
          existingMessages={activeChat.discussion}
        />
      )}
    </div>
  );
};

export default StudentClassroom;


