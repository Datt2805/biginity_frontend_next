"use client";
import React, { useEffect, useRef, useState } from "react";

const ChatModal = ({ classroomId, onClose, socket, existingMessages }) => {
  const [value, setValue] = useState("");
  const scrollRef = useRef(null);
  const fileInputRef = useRef(null);

  // Auto-scroll when messages change
  useEffect(() => {
    setTimeout(() => {
      scrollRef.current?.scrollTo({
        top: scrollRef.current.scrollHeight,
        behavior: "smooth",
      });
    }, 80);
  }, [existingMessages]);

  const send = () => {
    if (!value.trim()) return;
    if (!socket || !socket.sendMessage) {
      console.warn("Socket not ready");
      return;
    }

    socket.sendMessage(classroomId, value.trim());
    setValue("");
  };

  // File placeholder
  const handleFileClick = () => fileInputRef.current?.click();
  const handleFileChange = (e) => {
    console.log("Selected file:", e.target.files[0]?.name);
    e.target.value = "";
  };

  return (
    <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center">
      <div className="bg-white w-full max-w-lg rounded-2xl shadow-lg flex flex-col h-[70vh]">

        {/* Header */}
        <div className="flex justify-between items-center p-4 border-b">
          <h3 className="text-lg font-semibold">Classroom Chat</h3>
          <button className="px-3 py-1 rounded-md border" onClick={onClose}>Close</button>
        </div>

        {/* Messages */}
        <div ref={scrollRef} className="flex-1 overflow-y-auto p-4 space-y-3">
          {(!existingMessages || existingMessages.length === 0) ? (
            <p className="text-sm text-gray-500 text-center mt-10">No messages yet</p>
          ) : (
            existingMessages.map((msg, i) => (
              <div key={i} className="bg-gray-100 p-2 rounded-lg">
                <p className="text-sm break-words">{msg.message}</p>
                <p className="text-[10px] text-gray-500">
                  {new Date(msg.at || msg.createdAt || Date.now()).toLocaleString()}
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

          <button onClick={handleFileClick} className="px-3 py-2 border rounded-md bg-gray-100 hover:bg-gray-200">📎</button>
          <input type="file" className="hidden" ref={fileInputRef} onChange={handleFileChange} />

          <button onClick={send} className="bg-blue-600 text-white px-4 py-2 rounded-md">Send</button>
        </div>

      </div>
    </div>
  );
};

export default ChatModal;
