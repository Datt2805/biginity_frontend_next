"use client";
import React, { useState } from "react";
import { MdLockOutline } from "react-icons/md";
import { FaEye, FaEyeSlash } from "react-icons/fa";

const PasswordInput = ({ value, onChange }) => {
  const [showPassword, setShowPassword] = useState(false);

  return (
    <div className="flex items-center bg-gray-200 rounded-lg">
      <MdLockOutline className="text-gray-400 m-2" />
      <input
        type={showPassword ? "text" : "password"}
        name="password"
        placeholder="Password"
        value={value}
        onChange={onChange}
        className="bg-gray-200 outline-none text-sm w-full"
      />
      <div
        onClick={() => setShowPassword(!showPassword)}
        className="cursor-pointer pr-2"
      >
        {showPassword ? <FaEyeSlash /> : <FaEye />}
      </div>
    </div>
  );
};

export default PasswordInput;
