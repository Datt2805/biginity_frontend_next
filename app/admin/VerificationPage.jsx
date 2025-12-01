"use client";
import { useEffect, useState } from "react";
import { verifyTeacher, getPendingTeachers } from "@/lib/api";

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

  // Clean toast replacement (Styling updated for modern look)
  function toastMessage(msg, type) {
    const bg = type === "success" ? "bg-emerald-600" : "bg-rose-600";
    const toast = document.createElement("div");

    // Updated classes for a floating, modern pill look
    toast.className = `${bg} text-white px-6 py-3 rounded-full shadow-xl fixed top-6 right-6 z-50 flex items-center gap-2 font-medium text-sm transition-all duration-300 animate-[slideIn_0.3s_ease-out]`;
    
    // Add simple icon based on type
    const icon = type === "success" 
        ? '<svg width="16" height="16" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" d="M5 13l4 4L19 7"></path></svg>' 
        : '<svg width="16" height="16" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" d="M6 18L18 6M6 6l12 12"></path></svg>';

    toast.innerHTML = `${icon} <span>${msg}</span>`;

    document.body.appendChild(toast);
    
    // Slide out animation before removal
    setTimeout(() => {
        toast.style.opacity = '0';
        toast.style.transform = 'translateY(-20px)';
    }, 2200);

    setTimeout(() => toast.remove(), 2500);
  }

  if (loading)
    return (
      <div className="flex flex-col justify-center items-center h-[60vh] space-y-4">
        <div className="w-10 h-10 border-4 border-indigo-200 border-t-indigo-600 rounded-full animate-spin"></div>
        <div className="text-slate-500 font-medium text-sm animate-pulse">Fetching records...</div>
      </div>
    );

  return (
    <div className="min-h-full bg-transparent">
      
      {/* Header Section */}
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-slate-800 flex items-center gap-2">
            <span className="p-2 bg-amber-100 rounded-lg text-amber-600">
                <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M22 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/></svg>
            </span>
            Pending Verifications
        </h1>
        <p className="text-slate-500 mt-1 ml-12 text-sm">Review and approve teacher account requests.</p>
      </div>

      {/* Main Card */}
      <div className="bg-white shadow-sm border border-slate-200 rounded-2xl overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            
            {/* Table Header */}
            <thead>
              <tr className="bg-slate-50 border-b border-slate-200">
                <th className="px-6 py-4 text-xs font-semibold text-slate-500 uppercase tracking-wider w-1/3">Name</th>
                <th className="px-6 py-4 text-xs font-semibold text-slate-500 uppercase tracking-wider w-1/3">Email</th>
                <th className="px-6 py-4 text-xs font-semibold text-slate-500 uppercase tracking-wider w-1/6">Status</th>
                <th className="px-6 py-4 text-xs font-semibold text-slate-500 uppercase tracking-wider text-right w-1/6">Action</th>
              </tr>
            </thead>

            {/* Table Body */}
            <tbody className="divide-y divide-slate-100">
              {pendingTeachers.map((t) => (
                <tr
                  key={t._id}
                  className="hover:bg-slate-50/80 transition-colors duration-150 group"
                >
                  <td className="px-6 py-4">
                      <div className="font-medium text-slate-900">{t.name}</div>
                  </td>
                  <td className="px-6 py-4 text-slate-600">
                      {t.email}
                  </td>
                  <td className="px-6 py-4">
                    <span
                      className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium border ${
                        t.isVerified
                          ? "bg-emerald-50 text-emerald-700 border-emerald-100"
                          : "bg-amber-50 text-amber-700 border-amber-100"
                      }`}
                    >
                      <span className={`w-1.5 h-1.5 rounded-full mr-1.5 ${t.isVerified ? "bg-emerald-500" : "bg-amber-500"}`}></span>
                      {t.isVerified ? "Verified" : "Pending"}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-right">
                    {!t.isVerified ? (
                      <button
                        onClick={() => handleVerify(t._id)}
                        className="inline-flex items-center gap-1.5 bg-indigo-600 hover:bg-indigo-700 text-white py-1.5 px-4 rounded-lg text-xs font-semibold shadow-sm hover:shadow transition-all duration-200 active:scale-95"
                      >
                        <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12"/></svg>
                        Approve
                      </button>
                    ) : (
                        <span className="text-slate-400 text-xs italic">No actions</span>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>

          {/* Empty State */}
          {pendingTeachers.length === 0 && (
            <div className="flex flex-col items-center justify-center py-16 px-4 text-center">
              <div className="bg-slate-50 p-4 rounded-full mb-4">
                <svg className="w-8 h-8 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"></path></svg>
              </div>
              <h3 className="text-lg font-medium text-slate-900">All caught up!</h3>
              <p className="text-slate-500 max-w-sm mt-1">There are no pending teacher verifications at the moment.</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}