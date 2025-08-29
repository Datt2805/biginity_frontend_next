"use client";
import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { toast, ToastContainer } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";

import SignUpForm from "./SignUpForm";
import SignInForm from "./SignInForm";

// 🔗 import backend API functions
import { registerUser, logInUser, verifyEmail } from "@/lib/api/index"; // since you export * from ./auth.js

const UserForm = ({ defaultType = "register" }) => {
  const [isSignUp, setIsSignUp] = useState(defaultType === "register");
  const [formData, setFormData] = useState({
    name: "",
    nickname: "",
    email: "",
    otp: "",
    password: "",
    role: "Student",
    gender: "Male",
    branch: "",
    year: "",
    stream: "",
    enrollmentId: "",
    title: "",
  });
  const [otpCooldown, setOtpCooldown] = useState(0);
  const router = useRouter();
  useEffect(() => {
    if (otpCooldown > 0) {
      const timer = setTimeout(() => setOtpCooldown(otpCooldown - 1), 1000);
      return () => clearTimeout(timer);
    }
  }, [otpCooldown]);
  useEffect(() => {
    setIsSignUp(defaultType === "register");
  }, [defaultType]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  // 🔗 call backend APIs instead of demo checks
  const handleSubmit = async (e) => {
    e.preventDefault();

    if (isSignUp) {
      // Register via API
      await registerUser(
        e,
        (data) => {
          toast.success("User registered successfully!");
          console.log("Register API Response:", data);
          setIsSignUp(false); // switch to login
        },
        (err) => {
          toast.error(err.message || "Registration failed!");
        }
      );
    } else {
      // Login via API
      await logInUser(
        e,
        (data) => {
          toast.success("Signed in successfully!");
          console.log("Login API Response:", data);

          // ✅ route user to their dashboard
          if (data?.user?.role) {
            router.push(`/${data.user.role.toLowerCase()}`);
          } else {
            router.push("/student"); // fallback
          }
        },
        (err) => {
          toast.error(err.message || "Login failed!");
        }
      );
    }
  };
  const handleGetOtp = () => {
    if (!formData.email) {
      toast.error("Please enter your email first");
      return;
    }

    // call verifyEmail with purpose = "register"
    verifyEmail(
      formData.email,
      "verification",
      (data) => {
        toast.success(data.message || "OTP sent!");
        setOtpCooldown(30);
      },
      (err) => toast.error(err.message || "Failed to send OTP")
    );
  };

  return (
    <div className="flex flex-col items-center justify-center min-h-screen px-4 bg-gray-100">
      <main className="flex flex-col mt-20 md:flex-row items-center justify-center w-full max-w-6xl bg-white rounded-2xl shadow-2xl">
        {/* Left Form Section */}
        <div className="w-full md:w-3/5 p-6">
          <h2 className="text-3xl font-bold text-green-500 mb-4">
            {isSignUp ? "Create Account" : "Sign In"}
          </h2>
          <form
            onSubmit={handleSubmit}
            className={`gap-4 ${
              isSignUp ? "grid grid-cols-1 md:grid-cols-2" : "flex flex-col"
            }`}
          >
            {isSignUp ? (
              <SignUpForm
                formData={formData}
                handleChange={handleChange}
                handleGetOtp={handleGetOtp}
              />
            ) : (
              <SignInForm formData={formData} handleChange={handleChange} />
            )}

            <button
              type="submit"
              className="w-full mt-4 bg-green-500 text-white rounded-full px-12 py-2 font-semibold hover:bg-white hover:text-black border-2 border-green-500 transition-all duration-200"
            >
              {isSignUp ? "Sign Up" : "Sign In"}
            </button>
          </form>
        </div>

        {/* Right Toggle Section */}
        <div className="w-full md:w-2/5 bg-green-500 text-white rounded-b-2xl md:rounded-tr-2xl md:rounded-bl-none py-50 px-10 flex flex-col items-center justify-center text-center">
          <h2 className="text-3xl font-bold mb-2">
            {isSignUp ? "Welcome Back!" : "Hello, Friend!"}
          </h2>
          <div className="border-2 w-10 border-white inline-block mb-4"></div>
          <p className="mb-6 text-sm">
            {isSignUp
              ? "Already have an account? Sign in and continue your journey."
              : "Fill up personal information and start your journey with us."}
          </p>
          <button
            onClick={() => setIsSignUp(!isSignUp)}
            className="border-2 border-white rounded-full px-8 py-2 font-semibold hover:bg-white hover:text-black transition-all duration-200"
          >
            {isSignUp ? "Sign In" : "Sign Up"}
          </button>
        </div>
      </main>
      <ToastContainer />
    </div>
  );
};

export default UserForm;
