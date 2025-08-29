"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { toast, ToastContainer } from "react-toastify";
import { FaEye, FaEyeSlash } from "react-icons/fa";
import "react-toastify/dist/ReactToastify.css";

export default function CreateSpeaker() {
  const [form, setForm] = useState({
    role: "Speaker",
    name: "",
    nickname: "",
    email: "",
    otp: "",
    password: "",
    gender: "Male",
    about: "",
    organization: "",
  });

  const [showPassword, setShowPassword] = useState(false);
  const [speakerImageUrl, setSpeakerImageUrl] = useState("");
  const [loading, setLoading] = useState(false);
  const [isEmailValid, setIsEmailValid] = useState(false);
  const [isVerifying, setIsVerifying] = useState(false);

  const router = useRouter();

  // ✅ Embedded ImageUploader
  const ImageUploader = ({ onUploadSuccess }) => {
    const [preview, setPreview] = useState(null);

    const handleFileChange = (e) => {
      const file = e.target.files[0];
      if (file) {
        const objectUrl = URL.createObjectURL(file);
        setPreview(objectUrl);

        // Mock uploaded URL
        const fakeUrl = `/uploads/${file.name}`;
        onUploadSuccess(fakeUrl);
        toast.success("Image selected successfully!");
      }
    };

    return (
      <div className="mb-4">
        <label className="block mb-2 font-medium">Upload Speaker Image *</label>
        <input
          type="file"
          accept="image/*"
          onChange={handleFileChange}
          className="block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 
                     file:rounded-full file:border-0 file:text-sm file:font-semibold
                     file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100"
        />
        {preview && (
          <img
            src={preview}
            alt="Preview"
            className="mt-3 w-32 h-32 object-cover rounded-full border shadow"
          />
        )}
      </div>
    );
  };

  // Validate email input
  const validateEmail = (emailValue) => emailValue.trim() !== "";

  const handleChange = (e) => {
    const { name, value } = e.target;
    setForm((prev) => ({
      ...prev,
      [name]: value,
    }));

    if (name === "email") {
      setIsEmailValid(validateEmail(value));
    }
  };

  const handleGenderChange = (e) => {
    setForm((prev) => ({
      ...prev,
      gender: e.target.value,
    }));
  };

  // Fake email verification
  const handleVerifyEmail = (event) => {
    event.preventDefault();
    if (!isEmailValid) return;

    setIsVerifying(true);
    const button = event.target;
    button.disabled = true;

    toast.success("Mock: Verification email sent!");

    let countdown = 5;
    const interval = setInterval(() => {
      button.innerText = `Try again after ${countdown}s`;
      countdown--;
      if (countdown <= 0) {
        button.innerText = "Get OTP";
        button.disabled = false;
        setIsVerifying(false);
        clearInterval(interval);
      }
    }, 1000);
  };

  // Fake form submission
  const handleFormSubmit = (event) => {
    event.preventDefault();
    setLoading(true);

    if (!form.name || form.name.length < 3) {
      toast.error("Name must be at least 3 characters long.");
      setLoading(false);
      return;
    }

    if (!form.nickname || form.nickname.length < 4) {
      toast.error("Nickname must be at least 4 characters long.");
      setLoading(false);
      return;
    }

    if (!form.password || form.password.length < 8) {
      toast.error("Password must be at least 8 characters long.");
      setLoading(false);
      return;
    }

    if (!form.about || !form.organization) {
      toast.error("Please fill out 'About' and 'Organization' fields.");
      setLoading(false);
      return;
    }

    if (!speakerImageUrl) {
      toast.error("Please upload an image before submitting!");
      setLoading(false);
      return;
    }

    // Mock success
    setTimeout(() => {
      toast.success("Mock: Speaker registered successfully!");
      setLoading(false);
      router.push("/teacher"); // demo redirect
    }, 1500);
  };

  return (
    <div className="p-6 bg-white rounded-xl shadow-md max-w-2xl mx-auto">
      <h2 className="text-2xl font-bold mb-4 text-center">Register a Speaker</h2>

      {/* ✅ Inline ImageUploader */}
      <ImageUploader onUploadSuccess={setSpeakerImageUrl} />

      <form onSubmit={handleFormSubmit} className="space-y-4 mt-4">
        <input
          type="text"
          name="name"
          placeholder="Name"
          value={form.name}
          onChange={handleChange}
          required
          className="w-full border p-2 rounded"
        />

        <input
          type="text"
          name="nickname"
          placeholder="Nickname"
          value={form.nickname}
          onChange={handleChange}
          required
          className="w-full border p-2 rounded"
        />

        <div className="flex flex-col sm:flex-row gap-2 items-center">
          <input
            type="email"
            name="email"
            placeholder="Email"
            value={form.email}
            onChange={handleChange}
            required
            className="flex-1 border p-2 rounded w-full"
          />
          <button
            type="button"
            onClick={handleVerifyEmail}
            disabled={!isEmailValid}
            className="px-3 py-2 bg-blue-600 text-white rounded w-full sm:w-auto"
          >
            {isVerifying ? "Verifying..." : "Get OTP"}
          </button>
        </div>

        <input
          type="number"
          name="otp"
          placeholder="OTP"
          value={form.otp}
          onChange={handleChange}
          required
          className="w-full border p-2 rounded"
        />

        <select
          name="gender"
          value={form.gender}
          onChange={handleGenderChange}
          className="w-full border p-2 rounded"
        >
          <option value="Male">Male</option>
          <option value="Female">Female</option>
        </select>

        <div className="relative">
          <input
            type={showPassword ? "text" : "password"}
            name="password"
            placeholder="Password"
            value={form.password}
            onChange={handleChange}
            required
            className="w-full border p-2 rounded"
          />
          <button
            type="button"
            className="absolute top-2 right-3"
            onClick={() => setShowPassword((prev) => !prev)}
          >
            {showPassword ? <FaEye /> : <FaEyeSlash />}
          </button>
        </div>

        <div>
          <label htmlFor="about" className="block font-medium">
            About Speaker *
          </label>
          <textarea
            id="about"
            name="about"
            value={form.about}
            onChange={handleChange}
            required
            className="w-full border p-2 rounded"
          ></textarea>
        </div>

        <div>
          <label htmlFor="organization" className="block font-medium">
            Organization *
          </label>
          <input
            type="text"
            id="organization"
            name="organization"
            value={form.organization}
            onChange={handleChange}
            required
            className="w-full border p-2 rounded"
          />
        </div>

        <button
          type="submit"
          disabled={loading}
          className="w-full bg-green-600 text-white py-2 rounded"
        >
          {loading ? "Submitting..." : "Register"}
        </button>
      </form>

      <ToastContainer />
    </div>
  );
}
