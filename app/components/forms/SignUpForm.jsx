"use client";

import { FaRegEnvelope } from "react-icons/fa";
import FormInput from "./FormInput";
import PasswordInput from "./PasswordInput";
import RoleFields from "./RoleFields";

const SignUpForm = ({ formData, handleChange, handleGetOtp, otpCooldown}) => {
  
  return (
    <>
      <input
        type="text"
        name="name" 
        placeholder="Name"
        value={formData.name}
        onChange={handleChange}
        className="p-2 bg-gray-200 rounded-lg w-full"
      />
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
      <button
        name="otp"
        type="button"
        onClick={handleGetOtp}
        disabled={otpCooldown > 0}
        className={`mt-2 p-2 rounded w-full text-white ${
          otpCooldown > 0
            ? "bg-gray-400 cursor-not-allowed"
            : "bg-blue-600 hover:bg-blue-700"
        }`}
      >
        {otpCooldown > 0 ? `Wait ${otpCooldown}s` : "Get OTP"}
      </button>

      <input
        type="number"
        name="otp"
        placeholder="OTP"
        value={formData.otp}
        onChange={handleChange}
        className="p-2 bg-gray-200 rounded-lg w-full"
      />
      <PasswordInput value={formData.password} onChange={handleChange} />
      <select
        name="role"
        value={formData.role}
        onChange={handleChange}
        className="p-2 bg-gray-200 rounded-lg w-full"
      >
        <option value="">Select Role</option>
        <option value="Teacher">Teacher</option>
        <option value="Student">Student</option>
      </select>
      <select
        name="gender"
        value={formData.gender}
        onChange={handleChange}
        className="p-2 bg-gray-200 rounded-lg w-full"
      >
        <option value="male">Male</option>
        <option value="female">Female</option>
        <option value="other">Other</option>
      </select>

      <RoleFields
        role={formData.role}
        formData={formData}
        handleChange={handleChange}
      />
    </>
  );
};

export default SignUpForm;
