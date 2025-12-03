"use client";
import { useState, useEffect } from "react";
import { toast, ToastContainer } from "react-toastify";
import dynamic from "next/dynamic";
import "react-toastify/dist/ReactToastify.css";
import { registerUser, verifyEmail } from "../../../lib/api"; // Adjust path if needed
import { 
  User, 
  Mail, 
  Lock, 
  Eye, 
  EyeOff, 
  Building, 
  Info, 
  Link as LinkIcon,
  Key,
  ShieldCheck,
  CheckCircle,
  Send
} from "lucide-react";

// Client-only ImageUploader
const ImageUploader = dynamic(() => import("../Common/ImageUploader.jsx"), { ssr: false });

// --- STYLED COMPONENTS ( consistent with your other pages ) ---

const InputField = ({ icon: Icon, className = "", ...props }) => (
  <div className="relative">
    {Icon && (
      <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-gray-400">
        <Icon size={18} />
      </div>
    )}
    <input
      {...props}
      className={`w-full bg-gray-50 border border-gray-300 text-gray-900 text-sm rounded-lg focus:ring-indigo-500 focus:border-indigo-500 block p-2.5 ${Icon ? "pl-10" : ""} transition-all duration-200 ${className}`}
    />
  </div>
);

const TextAreaField = ({ icon: Icon, className = "", ...props }) => (
  <div className="relative">
    {Icon && (
      <div className="absolute top-3 left-0 pl-3 pointer-events-none text-gray-400">
        <Icon size={18} />
      </div>
    )}
    <textarea
      {...props}
      className={`w-full bg-gray-50 border border-gray-300 text-gray-900 text-sm rounded-lg focus:ring-indigo-500 focus:border-indigo-500 block p-2.5 ${Icon ? "pl-10" : ""} transition-all duration-200 ${className}`}
    />
  </div>
);

export default function CreateSpeaker() {
  const [speakerImageUrl, setSpeakerImageUrl] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [otpCooldown, setOtpCooldown] = useState(0);
  const [isVerifying, setIsVerifying] = useState(false);

  const toastOptions = {
    success: { style: { background: "#10B981", color: "white" } }, // Tailwind Green-500
    error: { style: { background: "#EF4444", color: "white" } },   // Tailwind Red-500
    warning: { style: { background: "#F59E0B", color: "white" } }, // Tailwind Amber-500
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
    <div className="min-h-screen bg-gray-50/50 py-10 px-4 sm:px-6 lg:px-8 flex items-center justify-center">
      <div className="max-w-4xl w-full">
        
        {/* Header */}
        <div className="text-center mb-8">
          <h2 className="text-3xl font-extrabold text-gray-900 tracking-tight">Register New Speaker</h2>
          <p className="mt-2 text-sm text-gray-600">Create a profile for a guest speaker or lecturer.</p>
        </div>

        <div className="bg-white shadow-xl shadow-gray-200/50 rounded-2xl overflow-hidden border border-gray-100 p-6 sm:p-10">
          
          {/* Image Uploader Section */}
          <div className="flex flex-col items-center mb-8">
             <div className="w-full max-w-sm">
                <label className="block text-sm font-semibold text-gray-700 mb-2 text-center">Speaker Photo</label>
                <div className="border-2 border-dashed border-gray-300 rounded-xl p-4 bg-gray-50 hover:bg-gray-100 transition-colors flex flex-col items-center justify-center min-h-[160px]">
                   <ImageUploader onUploadSuccess={setSpeakerImageUrl} />
                   {speakerImageUrl ? (
                      <div className="mt-3 flex items-center text-xs text-green-600 font-medium bg-green-50 px-2 py-1 rounded-md">
                        <CheckCircle size={12} className="mr-1" /> Image Uploaded
                      </div>
                    ) : (
                      <span className="text-xs text-gray-400 mt-2">Upload profile picture</span>
                    )}
                </div>
             </div>
          </div>

          <form onSubmit={handleFormSubmit} className="space-y-6">
            
            {/* Hidden Inputs maintained from original logic */}
            <input name="role" type="text" value="Speaker" hidden readOnly />
            <input name="imageUrl" type="text" value={speakerImageUrl} hidden readOnly />

            {/* Grid for Personal Info */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              
              {/* Left Column: Personal Details */}
              <div className="space-y-5">
                <h3 className="text-lg font-semibold text-gray-800 border-b border-gray-100 pb-2">Personal Details</h3>
                
                <div>
                   <label className="block text-sm font-medium text-gray-700 mb-1">Full Name</label>
                   <InputField name="name" placeholder="e.g. Dr. John Doe" icon={User} required />
                </div>
                
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Nickname</label>
                    <InputField name="nickname" placeholder="Alias" />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Gender</label>
                    <div className="relative">
                      <select name="gender" className="w-full bg-gray-50 border border-gray-300 text-gray-900 text-sm rounded-lg focus:ring-indigo-500 focus:border-indigo-500 block p-2.5 appearance-none">
                        <option value="Male">Male</option>
                        <option value="Female">Female</option>
                      </select>
                      <div className="absolute inset-y-0 right-0 flex items-center px-2 pointer-events-none text-gray-500">
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7"></path></svg>
                      </div>
                    </div>
                  </div>
                </div>

                <div>
                   <label className="block text-sm font-medium text-gray-700 mb-1">Organization</label>
                   <InputField name="organization" placeholder="University or Company Name" icon={Building} />
                </div>
              </div>

              {/* Right Column: Account & Security */}
              <div className="space-y-5">
                <h3 className="text-lg font-semibold text-gray-800 border-b border-gray-100 pb-2">Account Security</h3>
                
                {/* Email & OTP Group */}
                <div className="space-y-2">
                   <label className="block text-sm font-medium text-gray-700">Email Verification</label>
                   <div className="flex gap-2">
                      <div className="relative flex-grow">
                        <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-gray-400">
                          <Mail size={18} />
                        </div>
                        <input
                          name="email"
                          type="email"
                          placeholder="email@example.com"
                          className="w-full pl-10 bg-gray-50 border border-gray-300 text-gray-900 text-sm rounded-lg focus:ring-indigo-500 focus:border-indigo-500 block p-2.5"
                        />
                      </div>
                      <button
                        type="button"
                        disabled={otpCooldown > 0 || isVerifying}
                        // Logic preserved: selecting via DOM
                        onClick={() => handleGetOtp(document.querySelector("input[name='email']").value)}
                        className={`px-4 py-2 rounded-lg text-sm font-medium text-white shadow-sm transition-all flex items-center whitespace-nowrap ${
                          otpCooldown > 0 
                            ? "bg-gray-400 cursor-not-allowed" 
                            : "bg-indigo-600 hover:bg-indigo-700 active:scale-95"
                        }`}
                      >
                        {isVerifying ? (
                           <span className="animate-pulse">Sending...</span>
                        ) : otpCooldown > 0 ? (
                           <span className="flex items-center"><span className="w-4 text-center">{otpCooldown}</span>s</span>
                        ) : (
                           <>Send OTP <Send size={14} className="ml-1" /></>
                        )}
                      </button>
                   </div>
                   
                   <InputField name="otp" placeholder="Enter 6-digit OTP" icon={ShieldCheck} />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Password</label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-gray-400">
                      <Lock size={18} />
                    </div>
                    <input
                      type={showPassword ? "text" : "password"}
                      name="password"
                      placeholder="Min 8 characters"
                      className="w-full bg-gray-50 border border-gray-300 text-gray-900 text-sm rounded-lg focus:ring-indigo-500 focus:border-indigo-500 block p-2.5 pl-10 pr-10"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(prev => !prev)}
                      className="absolute inset-y-0 right-0 pr-3 flex items-center text-gray-400 hover:text-gray-600 cursor-pointer"
                    >
                      {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                    </button>
                  </div>
                </div>
              </div>
            </div>

            <hr className="border-gray-100 my-2" />

            {/* Bottom Section: Details */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
               <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">About Speaker</label>
                  <TextAreaField 
                    name="about" 
                    placeholder="Brief bio or description..." 
                    icon={Info} 
                    rows={4} 
                  />
               </div>
               <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Social Links</label>
                  <TextAreaField 
                    name="links" 
                    placeholder="https://linkedin.com/in/xyz,&#10;https://website.com" 
                    icon={LinkIcon} 
                    rows={4} 
                  />
                  <p className="text-xs text-gray-500 mt-1 text-right">Separate multiple links with commas</p>
               </div>
            </div>

            {/* Submit Button */}
            <div className="pt-4">
              <button
                type="submit"
                disabled={loading}
                className="w-full flex justify-center py-3.5 px-4 border border-transparent rounded-xl shadow-sm text-lg font-medium text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:opacity-50 disabled:cursor-not-allowed transition-all transform active:scale-[0.99]"
              >
                {loading ? (
                   <span className="flex items-center">
                     <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                       <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                       <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                     </svg>
                     Registering...
                   </span>
                ) : (
                   "Register Speaker"
                )}
              </button>
            </div>

          </form>
        </div>
      </div>
      <ToastContainer autoClose={2000} hideProgressBar theme="colored" position="bottom-right" />
    </div>
  );
}