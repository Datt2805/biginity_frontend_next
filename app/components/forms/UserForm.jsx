"use client";
import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { toast, ToastContainer } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";

import SignUpForm from "./SignUpForm";
import SignInForm from "./SignInForm";

import { registerUser, logInUser, verifyEmail } from "@/lib/api/index";

const UserForm = ({ defaultType = "login" }) => {
  const [isSignUp, setIsSignUp] = useState(defaultType === "login");
  const [formData, setFormData] = useState({
    name: "",
    nickname: "",
    email: "",
    otp: "",
    password: "",
    role: "",
    gender: "",
    branch: "",
    year: "",
    stream: "",
    enrollmentId: "",
    title: "",
    school: "",
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
    if (e && e.preventDefault) e.preventDefault();

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
    <div className="flex flex-col items-center justify-center min-h-screen px-4 bg-gray-100 font-sans">
      <main className="flex flex-col md:flex-row w-full max-w-6xl bg-white rounded-3xl shadow-2xl overflow-hidden transition-all duration-300">
        
        {/* Left Form Section */}
        <div className="w-full md:w-3/5 p-8 sm:p-10 flex flex-col justify-center">
          <div className="mb-8 text-center md:text-left">
            <h2 className="text-3xl sm:text-4xl font-extrabold text-green-500 tracking-tight">
              {isSignUp ? "Create Account" : "Welcome Back"}
            </h2>
            <p className="text-gray-400 mt-2 text-sm">
                {isSignUp ? "Enter your details to get started" : "Please enter your details to sign in"}
            </p>
          </div>

          <form onSubmit={handleSubmit} className="w-full">
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

            <button 
                type="submit"
                className="w-full mt-6 bg-green-500 text-white rounded-xl px-12 py-3.5 font-bold text-sm tracking-wide hover:bg-green-600 hover:shadow-lg hover:-translate-y-0.5 transition-all duration-200 active:transform active:scale-95"
            >
              {isSignUp ? "Sign Up" : "Sign In"}
            </button>
          </form>
        </div>

        {/* Right Toggle Section */}
        <div className="w-full md:w-2/5 bg-gradient-to-br from-green-400 to-green-600 text-white flex flex-col items-center justify-center text-center py-12 px-8 relative overflow-hidden">
            {/* Decorative circles */}
            <div className="absolute top-0 right-0 -mr-12 -mt-12 w-40 h-40 rounded-full bg-white opacity-10 blur-xl"></div>
            <div className="absolute bottom-0 left-0 -ml-12 -mb-12 w-40 h-40 rounded-full bg-white opacity-10 blur-xl"></div>

          <h2 className="text-3xl font-bold mb-3 z-10">
            {isSignUp ? "Have an Account?" : "New Here?"}
          </h2>
          <div className="w-16 h-1 bg-white rounded-full mb-6 opacity-50 z-10"></div>
          <p className="mb-8 text-green-50 text-sm leading-relaxed max-w-xs z-10">
            {isSignUp
              ? "To keep connected with us please login with your personal info."
              : "Enter your personal details and start your journey with us today."}
          </p>
          <button
            type="button"
            onClick={() => setIsSignUp(!isSignUp)}
            className="border-2 border-white rounded-full px-10 py-2.5 font-bold text-sm uppercase tracking-wider hover:bg-white hover:text-green-600 transition-all duration-300 z-10 shadow-lg"
          >
            {isSignUp ? "Sign In" : "Sign Up"}
          </button>
        </div>
      </main>

      <ToastContainer
        position="top-right"
        autoClose={2500}
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