"use client";
import React from "react";

const RoleFields = ({ role, formData, handleChange }) => {
  if (role === "Student") {
    return (
      <>
        <input
          name="branch"
          placeholder="Branch"
          value={formData.branch}
          onChange={handleChange}
          className="p-2 bg-gray-200 rounded-lg w-full"
        />
        <input
          name="year"
          type="number"
          placeholder="Year"
          value={formData.year}
          onChange={handleChange}
          className="p-2 bg-gray-200 rounded-lg w-full"
        />
        <input
          name="stream"
          placeholder="Stream"
          value={formData.stream}
          onChange={handleChange}
          className="p-2 bg-gray-200 rounded-lg w-full"
        />
        <input
          name="enrollment_id"
          placeholder="Enrollment ID"
          value={formData.enrollment_id}
          onChange={handleChange}
          className="p-2 bg-gray-200 rounded-lg w-full"
        />
      </>
    );
  }

  if (role === "Teacher") {
    return (
      <select
        name="title"
        value={formData.title}
        onChange={handleChange}
        className="p-2 bg-gray-200 rounded-lg w-full"
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
