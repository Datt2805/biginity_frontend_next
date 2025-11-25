"use client";
import React, { createContext, useContext, useRef } from "react";
import { initSocket } from "../api/app-SDK"; // adjust path accordingly
import { toast } from "react-toastify";


export const SocketContext = createContext(null);

export const SocketProvider = ({ children }) => {
  const socketRef = useRef(null);

  // ---- CALLBACK HOLDERS (always latest functions) ----
  const callbacks = useRef({
    newMessageCallback: () => {},
    connectionCallback: () => {},
    successCallback: () => {},
    errorCallback: () => {},
    attendanceStartedCallback: () => {},
    attendanceStoppedCallback: () => {},
    punchInCallback: () => {},
    punchOutCallback: () => {},
  });

  // ---- SETTER METHODS TO UPDATE CALLBACKS FROM OUTSIDE ----
  const setCallback = (name, fn) => {
    if (callbacks.current[name]) {
      callbacks.current[name] = fn;
    }
  };

  // ---- INITIALIZE SOCKET ONLY ONCE ----
  if (!socketRef.current) {
    socketRef.current = new initSocket({
      newMessageCallback: (d) => {
        toast.info(d.message), callbacks.current.newMessageCallback(d);
      },
      connectionCallback: (d) => {
        toast.info(d.message), callbacks.current.connectionCallback(d);
      },
      successCallback: (d) => {
        toast.info(d.message), callbacks.current.successCallback(d);
      },
      errorCallback: (d) => {
        toast.error(d.message), callbacks.current.errorCallback(d);
      },
      attendanceStartedCallback: (d) => {
        toast.info(d.message), callbacks.current.attendanceStartedCallback(d);
      },
      attendanceStoppedCallback: (d) => {
        toast.info(d.message), callbacks.current.attendanceStoppedCallback(d);
      },
      punchInCallback: (d) => {
        toast.info(d.message), callbacks.current.punchInCallback(d);
      },
      punchOutCallback: (d) => {
        toast.info(d.message), callbacks.current.punchOutCallback(d);
      },
    });

    // EXPOSE SETTER TO SOCKET CONTROLLER
    socketRef.current.setCallback = setCallback;
  }

  return (
    <SocketContext.Provider value={socketRef.current}>
      {children}
    </SocketContext.Provider>
  );
};

// Hook
export const useSocket = () => useContext(SocketContext);
