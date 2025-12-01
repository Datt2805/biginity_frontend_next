"use client";
import React, { useMemo } from "react";
import { FaUniversity } from "react-icons/fa";
import FormInput from "./FormInput";

const SELECTION_DATA = {
  "school-branch": {
    "School of Technology": ["B.Tech.", "BCA"],
    "School of Science": ["B.Sc."],
    "School of Management Studies and Liberal Arts": ["B.Com.", "BBA"],
  },
  "branch-stream": {
    "B.Tech.": ["Chemical", "Computer Science & Engg", "Fire & EHS"],
    "BCA": ["General"],
    "B.Sc.": ["Biotechnology", "Chemistry", "Data Science", "Micro Biology"],
    "B.Com.": ["B.Com (Hons.)"],
    "BBA": ["Business Analytics", "HR / Marketing /Accounting & Finance / IT Mg"],
  },
};

const baseInputClass =
  "p-3 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-green-400 focus:bg-white outline-none shadow-sm text-sm text-gray-700 placeholder-gray-400 w-full transition-all duration-200";

const RoleFields = ({ role, formData, handleChange }) => {
  const schoolOptions = Object.keys(SELECTION_DATA["school-branch"]);

  const branchOptions = useMemo(() => {
    return formData.school ? SELECTION_DATA["school-branch"][formData.school] || [] : [];
  }, [formData.school]);

  const streamOptions = useMemo(() => {
    return formData.branch ? SELECTION_DATA["branch-stream"][formData.branch] || [] : [];
  }, [formData.branch]);

  const onSchoolChange = (e) => {
    handleChange(e);
  };

  const onBranchChange = (e) => {
    handleChange(e);
  };

  if (role === "Student") {
    return (
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 animate-fade-in-down">
        <div className="sm:col-span-2 relative">
          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-gray-400">
            <FaUniversity />
          </div>
          <select
            name="school"
            value={formData.school}
            onChange={onSchoolChange}
            className={`${baseInputClass} pl-10`}
          >
            <option value="">Select School / Institution</option>
            {schoolOptions.map((school) => (
              <option key={school} value={school}>
                {school}
              </option>
            ))}
          </select>
        </div>

        <select
          name="branch"
          value={formData.branch}
          onChange={onBranchChange}
          className={baseInputClass}
          disabled={!formData.school}
        >
          <option value="">Select Branch</option>
          {branchOptions.map((branch) => (
            <option key={branch} value={branch}>
              {branch}
            </option>
          ))}
        </select>

        <input
          name="year"
          type="number"
          placeholder="Year"
          value={formData.year}
          onChange={handleChange}
          className={baseInputClass}
        />

        <select
          name="stream"
          value={formData.stream}
          onChange={handleChange}
          className={baseInputClass}
          disabled={!formData.branch}
        >
          <option value="">Select Stream</option>
          {streamOptions.map((stream) => (
            <option key={stream} value={stream}>
              {stream}
            </option>
          ))}
        </select>

        <input
          name="enrollment_id"
          placeholder="Enrollment ID"
          value={formData.enrollment_id}
          onChange={handleChange}
          className={baseInputClass}
        />
      </div>
    );
  }

  if (role === "Teacher") {
    return (
      <select
        name="title"
        value={formData.title}
        onChange={handleChange}
        className={`${baseInputClass} animate-fade-in-down`}
      >
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