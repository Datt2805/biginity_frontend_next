"use client";
import React from "react";

const FormInput = ({ icon: Icon, ...props }) => {
  return (
    <div className="flex items-center bg-gray-200 rounded-lg">
      {Icon && <Icon className="text-gray-400 m-2" />}
      <input
        {...props}
        className="bg-gray-200 outline-none text-sm w-full p-2 rounded-lg"
      />
    </div>
  );
};

export default FormInput;
