"use client";
import React from "react";
import { FaRegEnvelope } from "react-icons/fa";
import FormInput from "./FormInput";
import PasswordInput from "./PasswordInput";
import RoleFields from "./RoleFields";

const baseInputClass =
  "p-3 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-green-400 focus:bg-white outline-none shadow-sm text-sm text-gray-700 placeholder-gray-400 w-full transition-all duration-200";

const SignUpForm = ({ formData, handleChange, handleGetOtp, otpCooldown }) => {
  return (
    <div className="flex flex-col gap-4 animate-fade-in">
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <input type="text" name="name" placeholder="Full Name" value={formData.name} onChange={handleChange} className={baseInputClass} />
        <input type="text" name="nickname" placeholder="Nickname" value={formData.nickname} onChange={handleChange} className={baseInputClass} />
      </div>

      <div className="flex gap-2">
        <div className="flex-grow">
             <FormInput
                type="email"
                name="email"
                placeholder="Email Address"
                value={formData.email}
                onChange={handleChange}
                icon={FaRegEnvelope}
            />
        </div>
        <button
          type="button"
          onClick={handleGetOtp}
          disabled={otpCooldown > 0}
          className={`px-4 rounded-xl text-white text-sm font-medium transition-all duration-200 whitespace-nowrap shadow-sm ${
            otpCooldown > 0
              ? "bg-gray-400 cursor-not-allowed"
              : "bg-green-500 hover:bg-green-600 hover:shadow-md"
          }`}
        >
          {otpCooldown > 0 ? `${otpCooldown}s` : "Get OTP"}
        </button>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <input type="number" name="otp" placeholder="Enter OTP" value={formData.otp} onChange={handleChange} className={baseInputClass} />
        <PasswordInput value={formData.password} onChange={handleChange} />
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <select name="role" value={formData.role} onChange={handleChange} className={baseInputClass}>
            <option value="">Select Role</option>
            <option value="Teacher">Teacher</option>
            <option value="Student">Student</option>
        </select>

        <select name="gender" value={formData.gender} onChange={handleChange} className={baseInputClass}>
            <option value="">Select Gender</option>
            <option value="male">Male</option>
            <option value="female">Female</option>
            <option value="other">Other</option>
        </select>
      </div>

      <RoleFields role={formData.role} formData={formData} handleChange={handleChange} />
    </div>
  );
};

export default SignUpForm;