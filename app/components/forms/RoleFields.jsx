"use client";
import React from "react";

const inputClass =
  "p-2 bg-gray-100 border border-gray-200 rounded-xl focus:ring-2 focus:ring-green-400 shadow-sm text-sm text-gray-700 placeholder-gray-400 w-full transition-all duration-200";

const RoleFields = ({ role, formData, handleChange }) => {
  if (role === "Student") {
    return (
      <>
        <input name="branch" placeholder="Branch" value={formData.branch} onChange={handleChange} className={inputClass} />
        <input name="year" type="number" placeholder="Year" value={formData.year} onChange={handleChange} className={inputClass} />
        <input name="stream" placeholder="Stream" value={formData.stream} onChange={handleChange} className={inputClass} />
        <input name="enrollment_id" placeholder="Enrollment ID" value={formData.enrollment_id} onChange={handleChange} className={inputClass} />
      </>
    );
  }

  if (role === "Teacher") {
    return (
      <select name="title" value={formData.title} onChange={handleChange} className={inputClass}>
        <option value="">Select Title</option>
        <option value="Program Coordinator">Program Coordinator</option>
        <option value="Head Of Department">Head Of Department</option>
        <option value="Dean">Dean</option>
        <option value="Provost">Provost</option>
        <option value="President">President</option>
      </select>
    );
  }

  return null;
};

export default RoleFields;
