"use client";
import React, { useState } from "react";
import { useRouter } from "next/navigation";
import { toast, ToastContainer } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import FormInput from "@/app/components/forms/FormInput";
import { FaEnvelope, FaEye, FaEyeSlash } from "react-icons/fa";
import { verifyEmail, resetPassword } from "@/lib/api";

const ForgotPasswordPage = () => {
  const router = useRouter();

  const [email, setEmail] = useState("");
  const [otpSent, setOtpSent] = useState(false);
  const [otp, setOtp] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPass, setConfirmPass] = useState("");

  const [showPass, setShowPass] = useState(false);
  const [showConfirmPass, setShowConfirmPass] = useState(false);

  const [loading, setLoading] = useState(false);

  const handleSendOtp = async () => {
    if (!email) return toast.error("Enter your email first!");
    setLoading(true);

    verifyEmail(
      email,
      "password reset",
      () => {
        toast.success("OTP sent to your email!");
        setOtpSent(true);
        setLoading(false);
      },
      (err) => {
        toast.error(err.message || "Failed to send OTP");
        setLoading(false);
      }
    );
  };

  const handleResetPassword = () => {
    if (!otp || !password || !confirmPass)
      return toast.error("All fields are required");

    if (password !== confirmPass)
      return toast.error("Passwords do not match");

    setLoading(true);

    resetPassword(
      email,
      otp,
      password,
      () => {
        toast.success("Password changed successfully!");
        setTimeout(() => router.push("/LoginSignUp"), 1200);
        setLoading(false);
      },
      (err) => {
        toast.error(err.message || "Failed to reset password");
        setLoading(false);
      }
    );
  };

  return (
    <div
      className="flex items-center justify-center 
                 h-[calc(100vh-80px)] 
                 bg-gradient-to-br from-green-50 to-gray-100 px-4 overflow-hidden"
    >
      <div className="bg-white p-8 rounded-2xl shadow-xl w-full max-w-md border border-gray-200">
        
        <h2 className="text-3xl font-extrabold text-green-600 mb-2 text-center">
          Forgot Password
        </h2>
        <p className="text-gray-500 text-center mb-8 text-sm">
          Enter your registered email to receive OTP for password reset.
        </p>

        {/* EMAIL INPUT */}
        <FormInput
          type="email"
          placeholder="Enter your email"
          icon={FaEnvelope}
          value={email}
          onChange={(e) => setEmail(e.target.value)}
        />

        {otpSent && (
          <>
            {/* OTP FIELD */}
            <input
              type="text"
              placeholder="Enter OTP"
              value={otp}
              onChange={(e) => setOtp(e.target.value)}
              className="w-full h-12 mt-4 px-4 rounded-lg border border-gray-300 
                         focus:border-green-500 focus:ring focus:ring-green-200 bg-white outline-none"
            />

            {/* NEW PASSWORD */}
            <div className="relative mt-4">
              <input
                type={showPass ? "text" : "password"}
                placeholder="New Password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full h-12 px-4 rounded-lg border border-gray-300 
                           focus:border-green-500 focus:ring focus:ring-green-200 bg-white outline-none"
              />
              <span
                className="absolute right-4 top-3.5 cursor-pointer text-gray-500"
                onClick={() => setShowPass(!showPass)}
              >
                {showPass ? <FaEyeSlash /> : <FaEye />}
              </span>
            </div>

            {/* CONFIRM PASSWORD */}
            <div className="relative mt-4">
              <input
                type={showConfirmPass ? "text" : "password"}
                placeholder="Confirm Password"
                value={confirmPass}
                onChange={(e) => setConfirmPass(e.target.value)}
                className="w-full h-12 px-4 rounded-lg border border-gray-300 
                           focus:border-green-500 focus:ring focus:ring-green-200 bg-white outline-none"
              />
              <span
                className="absolute right-4 top-3.5 cursor-pointer text-gray-500"
                onClick={() => setShowConfirmPass(!showConfirmPass)}
              >
                {showConfirmPass ? <FaEyeSlash /> : <FaEye />}
              </span>
            </div>
          </>
        )}

        {/* BUTTON */}
        <button
          onClick={otpSent ? handleResetPassword : handleSendOtp}
          disabled={loading}
          className={`w-full h-12 mt-8 rounded-lg text-lg font-semibold shadow 
            transition-all duration-200 text-white 
            ${loading ? "bg-gray-400 cursor-not-allowed" : "bg-green-600 hover:bg-green-700"}`}
        >
          {loading ? (
            <span className="flex items-center justify-center gap-2">
              <span className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></span>
              Processing...
            </span>
          ) : otpSent ? (
            "Reset Password"
          ) : (
            "Send OTP"
          )}
        </button>

        <p
          onClick={() => router.push("/LoginSignUp")}
          className="text-sm text-green-600 hover:underline mt-6 text-center cursor-pointer"
        >
          Back to Sign In
        </p>
      </div>

      <ToastContainer />
    </div>
  );
};

export default ForgotPasswordPage;
