"use client";
import { useEffect, useState } from "react";
import { verifyTeacher, getPendingTeachers } from "@/lib/api";
import { logOutUser } from "@/lib/api";

export default function TeacherVerificationPage() {
  const [pendingTeachers, setPendingTeachers] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadTeachers();
  }, []);

  async function loadTeachers() {
    setLoading(true);
    try {
      const res = await getPendingTeachers();
      setPendingTeachers(res);
    } catch (err) {
      console.error(err);
    }
    setLoading(false);
  }

  async function handleVerify(userId) {
    try {
      await verifyTeacher(userId);
      toastMessage("Teacher verified successfully!", "success");
      loadTeachers();
    } catch (err) {
      console.error(err);
      toastMessage("Error verifying teacher", "error");
    }
  }

  // Clean toast replacement (no external library)
  function toastMessage(msg, type) {
    const bg = type === "success" ? "bg-green-600" : "bg-red-600";
    const toast = document.createElement("div");

    toast.className = `${bg} text-white px-4 py-2 rounded shadow fixed top-5 right-5 animate-fade-in-out`;
    toast.innerText = msg;

    document.body.appendChild(toast);
    setTimeout(() => toast.remove(), 2500);
  }

  if (loading)
    return (
      <div className="flex justify-center items-center h-[60vh]">
        <div className="text-lg font-medium animate-pulse">Loading...</div>
      </div>
    );

  return (
    <div className="p-6 min-h-screen bg-gray-50">
      {/* Top Bar */}
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-semibold text-gray-800">
          Pending Teacher Verifications
        </h1>

        <button
          onClick={logOutUser.handler(
            () => {
              window.location.href = "/LoginSignUp";
            },
            (err) => console.error(err)
          )}
          className="bg-red-500 hover:bg-red-600 text-white px-4 py-2 rounded-lg shadow transition-all duration-300"
        >
          Logout
        </button>
      </div>

      {/* Card */}
      <div className="bg-white shadow-md rounded-xl p-6">
        <div className="overflow-x-auto">
          <table className="w-full border-collapse">
            {/* Header */}
            <thead>
              <tr className="bg-gray-100 text-left text-gray-700">
                <th className="p-3 font-medium border-b">Name</th>
                <th className="p-3 font-medium border-b">Email</th>
                <th className="p-3 font-medium border-b">Status</th>
                <th className="p-3 font-medium border-b">Action</th>
              </tr>
            </thead>

            {/* Body */}
            <tbody>
              {pendingTeachers.map((t) => (
                <tr
                  key={t._id}
                  className="hover:bg-gray-50 transition-all cursor-pointer"
                >
                  <td className="p-3 border-b">{t.name}</td>
                  <td className="p-3 border-b">{t.email}</td>
                  <td className="p-3 border-b">
                    <span
                      className={`px-3 py-1 text-sm rounded-full ${
                        t.isVerified
                          ? "bg-green-100 text-green-700"
                          : "bg-yellow-100 text-yellow-700"
                      }`}
                    >
                      {t.isVerified ? "Verified" : "Pending"}
                    </span>
                  </td>
                  <td className="p-3 border-b">
                    {!t.isVerified && (
                      <button
                        onClick={() => handleVerify(t._id)}
                        className="bg-green-600 hover:bg-green-700 text-white py-1.5 px-4 rounded-lg shadow-sm transition-all duration-200"
                      >
                        Verify
                      </button>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>

          {/* Empty State */}
          {pendingTeachers.length === 0 && (
            <p className="text-center text-gray-500 py-4">
              No pending teacher verifications 🎉
            </p>
          )}
        </div>
      </div>
    </div>
  );
}
