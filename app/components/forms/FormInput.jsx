"use client";
import React from "react";

const FormInput = ({ icon: Icon, className, ...props }) => {
  return (
    <div className={`flex items-center bg-gray-50 border border-gray-200 rounded-xl focus-within:ring-2 focus-within:ring-green-400 focus-within:bg-white shadow-sm transition-all duration-200 ${className}`}>
      {Icon && <Icon className="text-gray-400 mx-3 text-lg shrink-0" />}
      <input
        {...props}
        className="bg-transparent outline-none text-sm w-full p-3 text-gray-700 placeholder-gray-400 rounded-xl"
      />
    </div>
  );
};

export default FormInput;