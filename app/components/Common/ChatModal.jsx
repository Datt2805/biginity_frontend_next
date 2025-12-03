"use client";
import React, { useEffect, useRef, useState, useCallback } from "react";
import { toast } from "react-toastify";

const ChatModal = ({
  classroomId,
  onClose,
  socket,
  messages = [], // Messages now come from parent
  currentUser,
}) => {
  const [inputValue, setInputValue] = useState("");
  const [isSending, setIsSending] = useState(false);

  // --- FUTURE UPDATE: File Upload State (Commented Out) ---
  // const [uploadedFile, setUploadedFile] = useState(null);
  // const fileInputRef = useRef(null);
  // --------------------------------------------------------

  const messagesEndRef = useRef(null);
  const inputRef = useRef(null);
  const prevMessagesLengthRef = useRef(0);

  // Helper: Get Initials for Avatar
  const getInitials = (name) => {
    if (!name) return "?";
    return name
      .split(" ")
      .map((n) => n[0])
      .slice(0, 2)
      .join("")
      .toUpperCase();
  };

  // Auto-scroll to bottom when new messages arrive
  const scrollToBottom = useCallback(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, []);

  // Scroll when messages change
  useEffect(() => {
    if (messages.length > prevMessagesLengthRef.current) {
      setTimeout(scrollToBottom, 100);
    }
    prevMessagesLengthRef.current = messages.length;
  }, [messages, scrollToBottom]);

  // Focus input on mount
  useEffect(() => {
    inputRef.current?.focus();
    setTimeout(scrollToBottom, 100);
  }, [scrollToBottom]);

  // Send message handler
  const handleSendMessage = useCallback(async () => {
    const trimmedValue = inputValue.trim();

    // Modified condition to ignore uploadedFile for now
    if (!trimmedValue /* && !uploadedFile */) {
      // toast.warning("Please enter a message"); // Optional: prevent empty sends silently
      return;
    }

    if (!socket) {
      toast.error("Connection lost. Please refresh.");
      return;
    }

    setIsSending(true);

    try {
      // --- FUTURE UPDATE: File Upload Logic (Commented Out) ---
      // const fileUrl = uploadedFile ? await uploadFile(uploadedFile) : null;
      // --------------------------------------------------------

      // Send the message via socket
      // Note: If you add file logic later, pass fileUrl here
      socket.sendMessage(classroomId, trimmedValue);

      // Clear input
      setInputValue("");
      
      // --- FUTURE UPDATE: Clear File State (Commented Out) ---
      // setUploadedFile(null);
      // if (fileInputRef.current) fileInputRef.current.value = "";
      // --------------------------------------------------------

      // Focus back on input
      inputRef.current?.focus();
    } catch (err) {
      console.error("Failed to send message:", err);
      toast.error("Failed to send message");
    } finally {
      setIsSending(false);
    }
  }, [inputValue, socket, classroomId /* uploadedFile */]);

  // Handle Enter key to send
  const handleKeyDown = useCallback(
    (e) => {
      if (e.key === "Enter" && !e.shiftKey) {
        e.preventDefault();
        handleSendMessage();
      }
    },
    [handleSendMessage]
  );

  /* --- FUTURE UPDATE: File Handlers (Commented Out) ---
  const handleFileClick = useCallback(() => {
    fileInputRef.current?.click();
  }, []);

  const handleFileChange = useCallback((e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const maxSize = 10 * 1024 * 1024;
    if (file.size > maxSize) {
      toast.error("File size must be less than 10MB");
      e.target.value = "";
      return;
    }
    setUploadedFile(file);
    toast.success(`File selected: ${file.name}`);
  }, []);

  const handleRemoveFile = useCallback(() => {
    setUploadedFile(null);
    if (fileInputRef.current) fileInputRef.current.value = "";
  }, []);
  ----------------------------------------------------- */

  // Close modal logic
  const handleClose = useCallback(() => {
    // Check if user has typed something before closing
    if (inputValue.trim() /* || uploadedFile */) {
      const confirmed = window.confirm(
        "You have unsent text. Close anyway?"
      );
      if (!confirmed) return;
    }
    onClose();
  }, [inputValue, onClose /* uploadedFile */]);

  // Handle Escape key
  useEffect(() => {
    const handleEscape = (e) => {
      if (e.key === "Escape") handleClose();
    };
    window.addEventListener("keydown", handleEscape);
    return () => window.removeEventListener("keydown", handleEscape);
  }, [handleClose]);

  // Format timestamp
  const formatTimestamp = (timestamp) => {
    if (!timestamp) return "";
    const date = new Date(timestamp);
    return date.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
  };

  return (
    <div
      className="fixed inset-0 bg-black/40 backdrop-blur-sm z-50 flex items-center justify-center p-4 transition-opacity duration-300"
      onClick={handleClose}
    >
      <div
        className="bg-white w-full max-w-lg rounded-2xl shadow-2xl flex flex-col h-[85vh] max-h-[700px] overflow-hidden border border-gray-100"
        onClick={(e) => e.stopPropagation()}
      >
        {/* --- Header --- */}
        <div className="flex justify-between items-center px-6 py-4 bg-white border-b border-gray-100 shadow-sm z-10">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-indigo-100 flex items-center justify-center text-indigo-600 font-bold">
              #
            </div>
            <div>
              <h3 className="text-lg font-bold text-gray-800">Class Discussion</h3>
              <div className="flex items-center gap-2">
                <span className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></span>
                <p className="text-xs text-gray-500 font-medium">{messages.length} messages</p>
              </div>
            </div>
          </div>
          <button
            className="p-2 rounded-full hover:bg-gray-100 text-gray-400 hover:text-gray-600 transition-colors"
            onClick={handleClose}
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* --- Messages Container --- */}
        <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-gray-50/50 custom-scrollbar">
          {messages.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-full text-gray-400 opacity-60">
              <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mb-3">
                <svg className="w-8 h-8 text-gray-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                </svg>
              </div>
              <p className="text-sm font-medium">No messages yet. Be the first!</p>
            </div>
          ) : (
            <>
              {messages.map((msg, index) => {
                const isCurrentUser = currentUser && msg.nickname === currentUser.nickname;
                const isLastMessage = index === messages.length - 1;
                const showHeader = index === 0 || messages[index - 1].nickname !== msg.nickname;

                return (
                  <div
                    key={`${msg.timestamp || index}-${msg.message}`}
                    className={`flex w-full ${isCurrentUser ? "justify-end" : "justify-start"} animate-in fade-in slide-in-from-bottom-2 duration-300`}
                  >
                    <div className={`flex max-w-[75%] ${isCurrentUser ? "flex-row-reverse" : "flex-row"} gap-2`}>
                      
                      {/* Avatar */}
                      <div className="flex-shrink-0 flex flex-col justify-end">
                         {showHeader ? (
                           <div className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold border-2 border-white shadow-sm ${
                             isCurrentUser ? "bg-indigo-600 text-white" : "bg-gray-200 text-gray-600"
                           }`}>
                             {getInitials(msg.nickname)}
                           </div>
                         ) : <div className="w-8" />}
                      </div>

                      {/* Message Bubble */}
                      <div className={`flex flex-col ${isCurrentUser ? "items-end" : "items-start"}`}>
                        {showHeader && !isCurrentUser && (
                          <span className="text-[11px] text-gray-500 font-semibold ml-1 mb-1">
                            {msg.nickname}
                          </span>
                        )}
                        
                        <div
                          className={`px-4 py-2.5 shadow-sm text-sm relative group ${
                            isCurrentUser
                              ? "bg-indigo-600 text-white rounded-2xl rounded-tr-none"
                              : "bg-white text-gray-800 border border-gray-100 rounded-2xl rounded-tl-none"
                          }`}
                        >
                          <p className="whitespace-pre-wrap leading-relaxed">{msg.message}</p>
                          
                          {/* Hover Timestamp */}
                          <div className={`absolute bottom-0 ${isCurrentUser ? "-left-12" : "-right-12"} opacity-0 group-hover:opacity-100 transition-opacity text-[10px] text-gray-400 py-3`}>
                            {formatTimestamp(msg.createdAt || msg.timestamp)}
                          </div>
                        </div>
                        
                        {/* Always visible timestamp for last message only */}
                        {isLastMessage && (
                           <span className="text-[10px] text-gray-300 mt-1 px-1">
                             {isCurrentUser ? "Sent" : "Received"} • {formatTimestamp(msg.createdAt || msg.timestamp)}
                           </span>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })}
              <div ref={messagesEndRef} />
            </>
          )}
        </div>

        {/* --- FUTURE UPDATE: File Preview Area (Commented Out) --- */}
        {/* {uploadedFile && (
          <div className="px-4 py-2 bg-indigo-50 border-t border-indigo-100 flex items-center justify-between mx-4 mt-2 rounded-lg">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 bg-indigo-100 rounded flex items-center justify-center">📎</div>
              <div>
                <p className="text-sm font-medium text-gray-800 truncate max-w-[200px]">{uploadedFile.name}</p>
                <p className="text-[10px] text-gray-500">{(uploadedFile.size / 1024).toFixed(1)} KB</p>
              </div>
            </div>
            <button onClick={handleRemoveFile} className="text-red-500 hover:text-red-700 p-1">✕</button>
          </div>
        )}
        */}

        {/* --- Input Area --- */}
        <div className="p-4 bg-white border-t border-gray-100">
          <div className="flex items-end gap-2 bg-gray-50 p-2 rounded-xl border border-gray-200 focus-within:border-indigo-400 focus-within:ring-2 focus-within:ring-indigo-100 transition-all">
            
            {/* --- FUTURE UPDATE: File Button (Commented Out) --- */}
            {/*
            <button
              onClick={handleFileClick}
              disabled={isSending}
              className="p-2 text-gray-400 hover:text-indigo-600 hover:bg-gray-200 rounded-lg transition-colors"
            >
              <span className="text-lg">📎</span>
            </button>
            <input type="file" ref={fileInputRef} onChange={handleFileChange} className="hidden" />
            */}
            
            <textarea
              ref={inputRef}
              className="flex-1 bg-transparent border-none focus:ring-0 text-gray-700 placeholder-gray-400 resize-none py-2 px-2 max-h-32 text-sm"
              placeholder="Type your message..."
              value={inputValue}
              onChange={(e) => setInputValue(e.target.value)}
              onKeyDown={handleKeyDown}
              rows={1}
              style={{ minHeight: "44px" }} // Ensure clickable height
              disabled={isSending}
            />
            
            <button
              className={`p-2 rounded-lg mb-1 transition-all duration-200 ${
                !inputValue.trim()
                  ? "bg-gray-200 text-gray-400 cursor-not-allowed"
                  : "bg-indigo-600 text-white hover:bg-indigo-700 shadow-md"
              }`}
              onClick={handleSendMessage}
              disabled={isSending || !inputValue.trim()}
            >
              {isSending ? (
                <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
              ) : (
                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="w-5 h-5 transform rotate-[-45deg] translate-x-0.5 -translate-y-0.5">
                  <path d="M3.478 2.405a.75.75 0 00-.926.94l2.432 7.905H13.5a.75.75 0 010 1.5H4.984l-2.432 7.905a.75.75 0 00.926.94 60.519 60.519 0 0018.445-8.986.75.75 0 000-1.218A60.517 60.517 0 003.478 2.405z" />
                </svg>
              )}
            </button>
          </div>
          <p className="text-[10px] text-center text-gray-400 mt-2">
            Press <span className="font-mono bg-gray-100 px-1 rounded">Enter</span> to send
          </p>
        </div>
      </div>
    </div>
  );
};

export default ChatModal;