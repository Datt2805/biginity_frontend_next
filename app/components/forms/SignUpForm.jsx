"use client";
import { FaRegEnvelope } from "react-icons/fa";
import FormInput from "./FormInput";
import PasswordInput from "./PasswordInput";
import RoleFields from "./RoleFields";

const baseInput =
  "p-2 bg-gray-100 border border-gray-200 rounded-xl focus:ring-2 focus:ring-green-400 shadow-sm text-sm text-gray-700 placeholder-gray-400 w-full transition-all duration-200";

const SignUpForm = ({ formData, handleChange, handleGetOtp, otpCooldown }) => {
  return (
    <>
      <input type="text" name="name" placeholder="Name" value={formData.name} onChange={handleChange} className={baseInput} />
      <input type="text" name="nickname" placeholder="Nickname" value={formData.nickname} onChange={handleChange} className={baseInput} />

      <FormInput
        type="email"
        name="email"
        placeholder="Email"
        value={formData.email}
        onChange={handleChange}
        icon={FaRegEnvelope}
      />

      <button
        type="button"
        onClick={handleGetOtp}
        disabled={otpCooldown > 0}
        className={`mt-2 p-2 rounded-xl w-full text-white font-medium transition-all duration-200 ${
          otpCooldown > 0
            ? "bg-gray-400 cursor-not-allowed"
            : "bg-green-500 hover:bg-green-600 shadow-sm hover:shadow-md"
        }`}
      >
        {otpCooldown > 0 ? `Wait ${otpCooldown}s` : "Get OTP"}
      </button>

      <input type="number" name="otp" placeholder="OTP" value={formData.otp} onChange={handleChange} className={baseInput} />
      <PasswordInput value={formData.password} onChange={handleChange} />

      <select name="role" value={formData.role} onChange={handleChange} className={baseInput}>
        <option value="">Select Role</option>
        <option value="Teacher">Teacher</option>
        <option value="Student">Student</option>
      </select>

      <select name="gender" value={formData.gender} onChange={handleChange} className={baseInput}>
        <option value="">Select Gender</option>
        <option value="male">Male</option>
        <option value="female">Female</option>
        <option value="other">Other</option>
      </select>

      <RoleFields role={formData.role} formData={formData} handleChange={handleChange} />
    </>
  );
};

export default SignUpForm;
