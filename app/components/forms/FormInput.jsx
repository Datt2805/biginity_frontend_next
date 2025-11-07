"use client";
import React from "react";

const FormInput = ({ icon: Icon, ...props }) => {
  return (
    <div className="flex items-center bg-gray-100 border border-gray-200 rounded-xl focus-within:ring-2 focus-within:ring-green-400 shadow-sm transition-all duration-200">
      {Icon && <Icon className="text-gray-400 mx-3 text-lg" />}
      <input
        {...props}
        className="bg-transparent outline-none text-sm w-full p-2 text-gray-700 placeholder-gray-400 rounded-xl"
      />
    </div>
  );
};

export default FormInput;
