"use client";
import React, { useState } from "react";
import { MdLockOutline } from "react-icons/md";
import { FaEye, FaEyeSlash } from "react-icons/fa";

const PasswordInput = ({ value, onChange }) => {
  const [showPassword, setShowPassword] = useState(false);

  return (
    <div className="flex items-center bg-gray-50 border border-gray-200 rounded-xl focus-within:ring-2 focus-within:ring-green-400 focus-within:bg-white shadow-sm transition-all duration-200">
      <MdLockOutline className="text-gray-400 mx-3 text-lg shrink-0" />
      <input
        type={showPassword ? "text" : "password"}
        name="password"
        placeholder="Password"
        value={value}
        onChange={onChange}
        className="bg-transparent outline-none text-sm w-full p-3 text-gray-700 placeholder-gray-400"
      />
      <div
        onClick={() => setShowPassword(!showPassword)}
        className="cursor-pointer pr-3 text-gray-400 hover:text-green-500 transition-colors"
      >
        {showPassword ? <FaEyeSlash /> : <FaEye />}
      </div>
    </div>
  );
};

export default PasswordInput;