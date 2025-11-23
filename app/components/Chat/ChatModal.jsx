"use client";
import React, { useEffect, useRef, useState } from "react";

const ChatModal = ({ classroomId, onClose, socket, existingMessages: extMsgs }) => {
  const [messages, setMessages] = useState([]);
  const [value, setValue] = useState("");
  const ref = useRef(null);
  const fileInputRef = useRef(null); // NEW
  const [existingMessages, setExistingMessages] = useState(extMsgs || []);

  useEffect(() => {
    if (!socket) return;

    socket.joinClassRoom([classroomId]);

    socket.socket.on("new_message", (data) => {
      if (data.classroom_id !== classroomId) return;

      setMessages((prev) => [...prev, data]);

      setTimeout(() => {
        ref.current?.scrollTo({ top: 999999, behavior: "smooth" });
      }, 50);
    });

    return () => {
      socket.socket.emit("leave_classroom", { classroom_ids: [classroomId] });
    };
  }, [socket, classroomId]);

  const send = () => {
    if (!value.trim()) return;
    socket.sendMessage(classroomId, value.trim());
    setValue("");
  };

  // NEW — Select file from hidden input
  const handleFileClick = () => {
    fileInputRef.current?.click();
  };

  // NEW — Handle file selection (you can connect upload API later)
  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (!file) return;

    // You can later replace this with upload logic
    console.log("Selected file:", file.name);

    // Reset input so same file can be uploaded again
    e.target.value = "";
  };

  const allMessages = [...existingMessages, ...messages];

  return (
    <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center">
      <div className="bg-white w-full max-w-lg rounded-2xl shadow-lg flex flex-col h-[70vh]">
        
        {/* Header */}
        <div className="flex justify-between items-center p-4 border-b">
          <h3 className="text-lg font-semibold">Classroom Chat</h3>
          <button className="px-3 py-1 rounded-md border" onClick={onClose}>
            Close
          </button>
        </div>

        {/* Messages */}
        <div ref={ref} className="flex-1 overflow-y-auto p-4 space-y-3">
          {allMessages.length === 0 ? (
            <p className="text-sm text-gray-500 text-center mt-10">
              No messages yet
            </p>
          ) : (
            allMessages.map((m, i) => (
              <div key={i} className="bg-gray-100 p-2 rounded-lg">
                <p className="text-sm">{m.message}</p>
                <p className="text-[10px] text-gray-500">
                  {new Date(m.at || m.createdAt || Date.now()).toLocaleString()}
                </p>
              </div>
            ))
          )}
        </div>

        {/* Input */}
        <div className="p-4 border-t flex gap-2">
          <input
            className="flex-1 border rounded-md px-3 py-2"
            placeholder="Write message..."
            value={value}
            onChange={(e) => setValue(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && send()}
          />

          {/* 📎 File Button */}
          <button
            onClick={handleFileClick}
            className="px-3 py-2 border rounded-md bg-gray-100 hover:bg-gray-200"
          >
            📎
          </button>

          {/* Hidden Input */}
          <input
            type="file"
            ref={fileInputRef}
            onChange={handleFileChange}
            className="hidden"
          />

          <button
            className="bg-blue-600 text-white px-4 py-2 rounded-md"
            onClick={send}
          >
            Send
          </button>
        </div>

      </div>
    </div>
  );
};

export default ChatModal;
