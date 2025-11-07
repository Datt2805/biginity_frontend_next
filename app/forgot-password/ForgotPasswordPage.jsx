"use client";
import React, { useState } from "react";
import { useRouter } from "next/navigation";
import { toast, ToastContainer } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import FormInput from "@/app/components/forms/FormInput";
import { FaEnvelope } from "react-icons/fa";
import { verifyEmail } from "@/lib/api/index"; // adjust path if needed

const ForgotPasswordPage = () => {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [otpSent, setOtpSent] = useState(false);
  const [otp, setOtp] = useState("");
  const [newPassword, setNewPassword] = useState("");

  const handleSendOtp = () => {
    if (!email) return toast.error("Enter your email first");
    verifyEmail(
      email,
      "forgot-password",
      (res) => {
        toast.success("OTP sent to your email!");
        setOtpSent(true);
      },
      (err) => toast.error(err.message || "Failed to send OTP")
    );
  };

  const handleResetPassword = () => {
    if (!otp || !newPassword)
      return toast.error("Please fill in all fields");
    toast.success("Password reset successful!");
  };

  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-gray-100 px-4">
      <div className="bg-white p-8 rounded-2xl shadow-lg w-full max-w-md text-center">
        <h2 className="text-3xl font-bold text-green-500 mb-4">
          Forgot Password
        </h2>
        <p className="text-gray-600 mb-6">
          Enter your email to receive a reset OTP.
        </p>

        <FormInput
          type="email"
          placeholder="Email"
          icon={FaEnvelope}
          value={email}
          onChange={(e) => setEmail(e.target.value)}
        />

        {otpSent && (
          <>
            <FormInput
              type="text"
              placeholder="Enter OTP"
              value={otp}
              onChange={(e) => setOtp(e.target.value)}
            />
            <FormInput
              type="password"
              placeholder="New Password"
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
            />
          </>
        )}

        <button
          onClick={otpSent ? handleResetPassword : handleSendOtp}
          className="w-full bg-green-500 text-white mt-4 py-2 rounded-full font-semibold hover:bg-green-600 transition-all duration-200"
        >
          {otpSent ? "Reset Password" : "Send OTP"}
        </button>

        {/* Back to Sign In link */}
        <p
          onClick={() => router.push("/LoginSignUp")}
          className="text-sm text-green-600 hover:underline mt-4 cursor-pointer"
        >
          Back to Sign In
        </p>
      </div>
      <ToastContainer />
    </div>
  );
};

export default ForgotPasswordPage;