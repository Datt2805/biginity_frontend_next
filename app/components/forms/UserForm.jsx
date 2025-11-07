"use client";
import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { toast, ToastContainer } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";

import SignUpForm from "./SignUpForm";
import SignInForm from "./SignInForm";

import { registerUser, logInUser, verifyEmail } from "@/lib/api/index";

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

  const handleSubmit = async (e) => {
    // The API functions will handle e.preventDefault()
    if (isSignUp) {
      await registerUser(
        e,
        (data) => {
          toast.success("User registered successfully!", {
            style: { background: "#22c55e", color: "#fff", fontWeight: "500" },
          });
          setIsSignUp(false);
        },
        (err) => {
          toast.error(err.message || "Registration failed!", {
            style: { background: "#dc2626", color: "#fff", fontWeight: "500" },
          });
        }
      );
    } else {
      await logInUser(
        e,
        (data) => {
          toast.success("Signed in successfully!", {
            style: { background: "#22c55e", color: "#fff", fontWeight: "500" },
          });
          if (data?.user?.role) router.push(`/${data.user.role.toLowerCase()}`);
          else router.push("/student");
        },
        (err) => {
          toast.error(err.message || "Login failed!", {
            style: { background: "#dc2626", color: "#fff", fontWeight: "500" },
          });
        }
      );
    }
  };

  const handleGetOtp = () => {
    if (!formData.email) {
      toast.error("Please enter your email first", {
        style: { background: "#dc2626", color: "#fff", fontWeight: "500" },
      });
      return;
    }

    verifyEmail(
      formData.email,
      "verification",
      (data) => {
        toast.success(data.message || "OTP sent!", {
          style: { background: "#22c55e", color: "#fff", fontWeight: "500" },
        });
        setOtpCooldown(15); // 15 seconds timer
      },
      (err) =>
        toast.error(err.message || "Failed to send OTP", {
          style: { background: "#dc2626", color: "#fff", fontWeight: "500" },
        })
    );
  };

  return (
    <div className="flex flex-col items-center justify-center min-h-screen px-4 bg-gray-100">
      <main className="flex flex-col md:flex-row w-full max-w-6xl bg-white rounded-2xl shadow-2xl overflow-hidden">
        {/* Left Form Section */}
        <div className="w-full md:w-3/5 p-6 sm:p-8">
          <h2 className="text-3xl sm:text-4xl font-bold text-green-500 mb-4 text-center md:text-left">
            {isSignUp ? "Create Account" : "Sign In"}
          </h2>

          <form
            onSubmit={handleSubmit}
            className={`gap-4 ${
              isSignUp
                ? "grid grid-cols-1 sm:grid-cols-2 gap-4"
                : "flex flex-col gap-4"
            }`}
          >
            {isSignUp ? (
              <SignUpForm
                formData={formData}
                handleChange={handleChange}
                handleGetOtp={handleGetOtp}
                otpCooldown={otpCooldown}
              />
            ) : (
              <SignInForm formData={formData} handleChange={handleChange} />
            )}

            <button className="w-full mt-4 bg-green-500 text-white rounded-full px-12 py-2 font-semibold hover:bg-white hover:text-black border-2 border-green-500 transition-all duration-200">
              {isSignUp ? "Sign Up" : "Sign In"}
            </button>
          </form>
        </div>

        {/* Right Toggle Section */}
        <div className="w-full md:w-2/5 bg-green-500 text-white flex flex-col items-center justify-center text-center py-12 px-6 sm:px-10 md:py-20">
          <h2 className="text-3xl sm:text-4xl font-bold mb-2">
            {isSignUp ? "Welcome Back!" : "Hello, Friend!"}
          </h2>
          <div className="border-2 w-10 border-white inline-block mb-4"></div>
          <p className="mb-6 text-sm sm:text-base">
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

      {/* Toast notifications */}
      <ToastContainer
        position="top-right"
        autoClose={2000}
        hideProgressBar={false}
        newestOnTop
        closeOnClick
        rtl={false}
        pauseOnFocusLoss
        draggable
        pauseOnHover
        theme="colored"
      />
    </div>
  );
};

export default UserForm;
