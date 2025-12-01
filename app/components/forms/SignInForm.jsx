"use client";
import React from "react";
import { FaRegEnvelope } from "react-icons/fa";
import FormInput from "./FormInput";
import PasswordInput from "./PasswordInput";
import Link from "next/link";

const baseInputClass =
  "p-3 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-green-400 focus:bg-white outline-none shadow-sm text-sm text-gray-700 placeholder-gray-400 w-full transition-all duration-200";

const SignInForm = ({ formData, handleChange }) => {
  return (
    <div className="flex flex-col gap-4 animate-fade-in">
      <input
        type="text"
        name="nickname"
        placeholder="Nickname"
        value={formData.nickname}
        onChange={handleChange}
        className={baseInputClass}
      />

      <FormInput
        type="email"
        name="email"
        placeholder="Email Address"
        value={formData.email}
        onChange={handleChange}
        icon={FaRegEnvelope}
      />

      <PasswordInput value={formData.password} onChange={handleChange} />

      <div className="text-right">
        <Link
          href="/forgot-password"
          className="text-sm font-medium text-green-600 hover:text-green-700 hover:underline transition-colors duration-200"
        >
          Forgot Password?
        </Link>
      </div>
    </div>
  );
};

export default SignInForm;