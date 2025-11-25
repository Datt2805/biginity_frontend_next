"use client";
import React, { useEffect, useRef, useState, useCallback } from "react";
import { toast } from "react-toastify";

const ChatModal = ({ 
  classroomId, 
  onClose, 
  socket, 
  messages = [],  // Messages now come from parent
  currentUser 
}) => {
  const [inputValue, setInputValue] = useState("");
  const [isSending, setIsSending] = useState(false);
  const [uploadedFile, setUploadedFile] = useState(null);
  
  const messagesEndRef = useRef(null);
  const fileInputRef = useRef(null);
  const inputRef = useRef(null);
  const prevMessagesLengthRef = useRef(0);

  // Auto-scroll to bottom when new messages arrive
  const scrollToBottom = useCallback(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, []);

  // Scroll when messages change
  useEffect(() => {
    // Only scroll if new messages were added
    if (messages.length > prevMessagesLengthRef.current) {
      setTimeout(scrollToBottom, 100);
    }
    prevMessagesLengthRef.current = messages.length;
  }, [messages, scrollToBottom]);

  // Focus input on mount
  useEffect(() => {
    inputRef.current?.focus();
    // Initial scroll
    setTimeout(scrollToBottom, 100);
  }, [scrollToBottom]);

  // Send message handler
  const handleSendMessage = useCallback(async () => {
    const trimmedValue = inputValue.trim();
    
    if (!trimmedValue && !uploadedFile) {
      toast.warning("Please enter a message or select a file");
      return;
    }

    if (!socket) {
      toast.error("Socket not connected");
      return;
    }

    setIsSending(true);

    try {
      // If there's a file, you could upload it first here
      // const fileUrl = uploadedFile ? await uploadFile(uploadedFile) : null;
      
      // Send the message via socket
      socket.sendMessage(classroomId, trimmedValue);
      
      // Clear input and file
      setInputValue("");
      setUploadedFile(null);
      
      // Reset file input
      if (fileInputRef.current) {
        fileInputRef.current.value = "";
      }

      // Focus back on input
      inputRef.current?.focus();
    } catch (err) {
      console.error("Failed to send message:", err);
      toast.error("Failed to send message");
    } finally {
      setIsSending(false);
    }
  }, [inputValue, uploadedFile, socket, classroomId]);

  // Handle Enter key to send
  const handleKeyDown = useCallback((e) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  }, [handleSendMessage]);

  // File selection handler
  const handleFileClick = useCallback(() => {
    fileInputRef.current?.click();
  }, []);

  // File change handler
  const handleFileChange = useCallback((e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Validate file size (e.g., max 10MB)
    const maxSize = 10 * 1024 * 1024;
    if (file.size > maxSize) {
      toast.error("File size must be less than 10MB");
      e.target.value = "";
      return;
    }

    // Validate file type (optional)
    const allowedTypes = [
      "image/jpeg", "image/png", "image/gif", "image/webp",
      "application/pdf", "text/plain",
      "application/msword", "application/vnd.openxmlformats-officedocument.wordprocessingml.document"
    ];

    if (!allowedTypes.includes(file.type)) {
      toast.error("File type not supported");
      e.target.value = "";
      return;
    }

    setUploadedFile(file);
    toast.success(`File selected: ${file.name}`);
  }, []);

  // Remove selected file
  const handleRemoveFile = useCallback(() => {
    setUploadedFile(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  }, []);

  // Close modal with confirmation if there's unsent text
  const handleClose = useCallback(() => {
    if (inputValue.trim() || uploadedFile) {
      const confirmed = window.confirm("You have unsent content. Are you sure you want to close?");
      if (!confirmed) return;
    }
    onClose();
  }, [inputValue, uploadedFile, onClose]);

  // Handle Escape key to close
  useEffect(() => {
    const handleEscape = (e) => {
      if (e.key === "Escape") {
        handleClose();
      }
    };

    window.addEventListener("keydown", handleEscape);
    return () => window.removeEventListener("keydown", handleEscape);
  }, [handleClose]);

  // Format timestamp
  const formatTimestamp = (timestamp) => {
    if (!timestamp) return "Just now";
    
    const date = new Date(timestamp);
    if (isNaN(date.getTime())) return "Just now";
    
    const now = new Date();
    const diffMs = now - date;
    const diffMins = Math.floor(diffMs / 60000);
    
    if (diffMins < 1) return "Just now";
    if (diffMins < 60) return `${diffMins}m ago`;
    if (diffMins < 1440) return `${Math.floor(diffMins / 60)}h ago`;
    
    return date.toLocaleDateString("en-US", { 
      month: "short", 
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit"
    });
  };

  return (
    <div 
      className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4"
      onClick={handleClose}
    >
      <div 
        className="bg-white w-full max-w-2xl rounded-2xl shadow-2xl flex flex-col h-[80vh] max-h-[600px]"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex justify-between items-center p-4 border-b bg-gradient-to-r from-purple-600 to-blue-600 text-white rounded-t-2xl">
          <div>
            <h3 className="text-lg font-semibold">Classroom Chat</h3>
            <p className="text-xs opacity-90">{messages.length} messages</p>
          </div>
          <button 
            className="px-4 py-2 rounded-lg bg-white/20 hover:bg-white/30 transition-all font-medium"
            onClick={handleClose}
          >
            ✕ Close
          </button>
        </div>

        {/* Messages Container */}
        <div className="flex-1 overflow-y-auto p-4 space-y-3 bg-gray-50">
          {messages.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-full text-gray-400">
              <svg className="w-16 h-16 mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
              </svg>
              <p className="text-sm">No messages yet. Start the conversation!</p>
            </div>
          ) : (
            <>
              {messages.map((msg, index) => {
                const isCurrentUser = currentUser && msg.nickname === currentUser.nickname;
                const showNickname = index === 0 || messages[index - 1].nickname !== msg.nickname;

                return (
                  <div 
                    key={`${msg.timestamp || index}-${msg.message}`}
                    className={`flex ${isCurrentUser ? "justify-end" : "justify-start"}`}
                  >
                    <div className={`max-w-[70%] ${isCurrentUser ? "items-end" : "items-start"} flex flex-col`}>
                      {showNickname && (
                        <p className={`text-xs font-semibold mb-1 ${isCurrentUser ? "text-blue-600" : "text-gray-600"}`}>
                          {isCurrentUser ? "You" : msg.nickname || "Anonymous"}
                        </p>
                      )}
                      <div 
                        className={`rounded-2xl px-4 py-2 shadow-sm ${
                          isCurrentUser 
                            ? "bg-blue-600 text-white rounded-tr-sm" 
                            : "bg-white text-gray-800 rounded-tl-sm border border-gray-200"
                        }`}
                      >
                        <p className="text-sm whitespace-pre-wrap break-words">{msg.message}</p>
                      </div>
                      <p className="text-[10px] text-gray-400 mt-1 px-1">
                        {formatTimestamp(msg.createdAt || msg.at || msg.timestamp)}
                      </p>
                    </div>
                  </div>
                );
              })}
              <div ref={messagesEndRef} />
            </>
          )}
        </div>

        {/* File Preview */}
        {uploadedFile && (
          <div className="px-4 py-2 bg-blue-50 border-t border-blue-100 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className="text-2xl">📎</span>
              <div>
                <p className="text-sm font-medium text-gray-800">{uploadedFile.name}</p>
                <p className="text-xs text-gray-500">
                  {(uploadedFile.size / 1024).toFixed(1)} KB
                </p>
              </div>
            </div>
            <button
              onClick={handleRemoveFile}
              className="text-red-600 hover:text-red-700 font-medium text-sm"
            >
              Remove
            </button>
          </div>
        )}

        {/* Input Area */}
        <div className="p-4 border-t bg-white rounded-b-2xl">
          <div className="flex gap-2">
            <textarea
              ref={inputRef}
              className="flex-1 border border-gray-300 rounded-lg px-4 py-2 resize-none focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              placeholder="Type your message..."
              value={inputValue}
              onChange={(e) => setInputValue(e.target.value)}
              onKeyDown={handleKeyDown}
              rows={1}
              disabled={isSending}
            />
            
            {/* File Attachment Button */}
            <button
              onClick={handleFileClick}
              disabled={isSending}
              className="px-4 py-2 border border-gray-300 rounded-lg bg-gray-50 hover:bg-gray-100 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
              title="Attach file"
            >
              <span className="text-xl">📎</span>
            </button>
            
            {/* Hidden File Input */}
            <input
              type="file"
              ref={fileInputRef}
              onChange={handleFileChange}
              className="hidden"
              accept="image/*,.pdf,.doc,.docx,.txt"
            />
            
            {/* Send Button */}
            <button
              className={`px-6 py-2 rounded-lg font-medium transition-all ${
                isSending || (!inputValue.trim() && !uploadedFile)
                  ? "bg-gray-300 text-gray-500 cursor-not-allowed"
                  : "bg-blue-600 text-white hover:bg-blue-700 shadow-md hover:shadow-lg"
              }`}
              onClick={handleSendMessage}
              disabled={isSending || (!inputValue.trim() && !uploadedFile)}
            >
              {isSending ? "Sending..." : "Send"}
            </button>
          </div>
          
          {/* Keyboard Hint */}
          <p className="text-xs text-gray-400 mt-2 text-center">
            Press Enter to send, Shift+Enter for new line
          </p>
        </div>
      </div>
    </div>
  );
};

export default ChatModal;
