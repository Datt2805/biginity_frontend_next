"use client";
import React from "react";
import { FaRegEnvelope } from "react-icons/fa";
import FormInput from "./FormInput";
import PasswordInput from "./PasswordInput";
import { useRouter } from "next/navigation";
import Link from "next/link";

const SignInForm = ({ formData, handleChange }) => {
  const router = useRouter();

  return (
    <>
      <input
        type="text"
        name="nickname"
        placeholder="Nickname"
        value={formData.nickname}
        onChange={handleChange}
        className="p-2 bg-gray-100 border border-gray-200 rounded-xl focus:ring-2 focus:ring-green-400 shadow-sm text-sm text-gray-700 placeholder-gray-400 w-full transition-all duration-200"
      />

      <FormInput
        type="email"
        name="email"
        placeholder="Email"
        value={formData.email}
        onChange={handleChange}
        icon={FaRegEnvelope}
      />

      <PasswordInput value={formData.password} onChange={handleChange} />

      <div className="text-right -mt-2">
        <Link
          href="/forgot-password"
          className="text-sm font-medium text-green-600 hover:text-green-700 hover:underline transition-colors duration-200"
        >
          Forgot Password?
        </Link>
      </div>
    </>
  );
};

export default SignInForm;
