"use client";
import React from "react";
import { FaRegEnvelope } from "react-icons/fa";
import FormInput from "./FormInput";
import PasswordInput from "./PasswordInput";

const SignInForm = ({ formData, handleChange }) => {
  return (
    <>
      <input
        type="text"
        name="nickname"
        placeholder="Nickname"
        value={formData.nickname}
        onChange={handleChange}
        className="p-2 bg-gray-200 rounded-lg w-full"
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
    </>
  );
};

export default SignInForm;
