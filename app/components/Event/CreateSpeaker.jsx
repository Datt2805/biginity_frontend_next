"use client";
import { useState, useEffect } from "react";
import { toast, ToastContainer } from "react-toastify";
import { FaEye, FaEyeSlash } from "react-icons/fa";
import dynamic from "next/dynamic";
import "react-toastify/dist/ReactToastify.css";

import { registerUser, verifyEmail } from "../../../lib/api";

// ✅ Client-only ImageUploader
const ImageUploader = dynamic(() => import("../Common/ImageUploader.jsx"), { ssr: false });

export default function CreateSpeaker() {
  const [speakerImageUrl, setSpeakerImageUrl] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [otpCooldown, setOtpCooldown] = useState(0);
  const [isVerifying, setIsVerifying] = useState(false);

  const toastOptions = {
    success: { style: { background: "green", color: "white" } },
    error: { style: { background: "red", color: "white" } },
    warning: { style: { background: "orange", color: "black" } },
  };

  // ✅ OTP Countdown
  useEffect(() => {
    if (otpCooldown > 0) {
      const timer = setTimeout(() => setOtpCooldown(prev => prev - 1), 1000);
      return () => clearTimeout(timer);
    }
  }, [otpCooldown]);

  // ✅ Get OTP
  const handleGetOtp = async (email) => {
    if (!email.trim()) {
      toast.warning("Enter email first!", toastOptions.warning);
      return;
    }

    setIsVerifying(true);
    try {
      const response = await verifyEmail(email, "verification");
      if (response?.success) {
        toast.success("OTP sent!", toastOptions.success);
        setOtpCooldown(15);
      } else {
        toast.error(response?.message || "Failed to send OTP!", toastOptions.error);
      }
    } catch {
      toast.error("Error sending OTP!", toastOptions.error);
    } finally {
      setIsVerifying(false);
    }
  };

  // ✅ Submit Form
  const handleFormSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
  
    const form = new FormData(e.target);
    console.log(Object.entries(form.entries()))
    // ✅ Validation
    if (!speakerImageUrl) {
      toast.warning("Upload a speaker image!", toastOptions.warning);
      return setLoading(false);
    }

    if ((form.get("password") || "").length < 8) {
      toast.warning("Password must be at least 8 characters!", toastOptions.warning);
      return setLoading(false);
    }

    if (!form.get("otp")) {
      toast.warning("OTP required!", toastOptions.warning);
      return setLoading(false);
    }

    // // ✅ Match backend role
    // form.append("role", "Speaker");

    // // ✅ Add image
    // form.append("imageUrl", speakerImageUrl);

    // // ✅ Convert links → array
    // const rawLinks = form.get("links") || "";
    // if (rawLinks.trim().length > 0) {
    //   const parsedLinks = rawLinks.split(",").map(link => link.trim());
    //   form.delete("links");
    //   parsedLinks.forEach(link => form.append("links[]", link));
    // }

    // ✅ Send using existing working registerUser()
    await registerUser(
      { preventDefault: () => {}, target: e.target, submitter: e.nativeEvent.submitter },
      (data) => {
        toast.success(data?.message || "Speaker registered!", toastOptions.success);
        e.target.reset();
        setSpeakerImageUrl("");
        setOtpCooldown(0);
      },
      (err) => toast.error(err?.message || "Failed to register speaker!", toastOptions.error)
    );

    setLoading(false);
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 px-4 py-10">
      <div className="w-full max-w-2xl bg-white shadow-lg rounded-2xl p-8">
        <h2 className="text-2xl font-semibold text-center text-gray-800">Register a Speaker</h2>

        <ImageUploader onUploadSuccess={setSpeakerImageUrl} />

        <form onSubmit={handleFormSubmit} className="space-y-5 mt-6">

          {/* Basic Info */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <input name="name" placeholder="Name" className="p-3 border rounded-lg" />
            <input name="nickname" placeholder="Nickname" className="p-3 border rounded-lg" />
          </div>

          {/* Email + OTP */}
          <div className="flex flex-col sm:flex-row gap-3">
            <input name="email" type="email" placeholder="Email" className="flex-1 p-3 border rounded-lg" />
            <button
              type="button"
              disabled={otpCooldown > 0}
              onClick={() => handleGetOtp(document.querySelector("input[name='email']").value)}
              className={`px-5 py-2 rounded-lg text-white ${
                otpCooldown > 0 ? "bg-gray-400" : "bg-green-600 hover:bg-green-700"
              }`}
            >
              {isVerifying
                ? "Sending..."
                : otpCooldown > 0
                ? `Wait ${otpCooldown}s`
                : "Get OTP"}
            </button>
          </div>

          <input name="otp" placeholder="OTP" className="w-full p-3 border rounded-lg" />
          <input name="role" type="text" value="Speaker" hidden/>
          <input name="imageUrl" type="text" value={speakerImageUrl} hidden/>   
          {/* Gender + Password */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <select name="gender" className="p-3 border rounded-lg">
              <option value="Male">Male</option>
              <option value="Female">Female</option>
            </select>

            <div className="relative">
              <input
                type={showPassword ? "text" : "password"}
                name="password"
                placeholder="Password"
                className="p-3 border rounded-lg w-full pr-10"
              />
              <button
                type="button"
                onClick={() => setShowPassword(prev => !prev)}
                className="absolute top-3 right-3 text-gray-600"
              >
                {showPassword ? <FaEye /> : <FaEyeSlash />}
              </button>
            </div>
          </div>

          <textarea name="about" placeholder="About Speaker" className="w-full p-3 border rounded-lg" />

          <input name="organization" placeholder="Organization" className="w-full p-3 border rounded-lg" />

          {/* ✅ NEW FIELD: LINKS */}
          <textarea
            name="links"
            placeholder="Speaker Links (comma separated)\nExample: https://linkedin.com/in/xyz, https://google.com"
            className="w-full p-3 border rounded-lg"
            rows={3}
          />

          <button
            type="submit"
            disabled={loading}
            className={`w-full py-3 rounded-lg text-white ${
              loading ? "bg-green-400" : "bg-green-600 hover:bg-green-700"
            }`}
          >
            {loading ? "Submitting..." : "Register"}
          </button>
        </form>

        <ToastContainer autoClose={2000} hideProgressBar theme="colored" />
      </div>
    </div>
  );
}
