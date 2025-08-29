"use client";
import React, { useState, useEffect } from "react";
import { getAttendance } from "@/lib/api";

const ITEMS_PER_PAGE = 5;

const AttendancePage = () => {
  const [attendanceData, setAttendanceData] = useState([]);
  const [filterStatus, setFilterStatus] = useState("");
  const [filterBranch, setFilterBranch] = useState("");
  const [filterStream, setFilterStream] = useState("");
  const [filterYear, setFilterYear] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const [loading, setLoading] = useState(true);

  // ✅ Fetch attendance data from backend
  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        const data = await getAttendance(); // calls /api/attendances
        setAttendanceData(data); // expect API to return an array
      } catch (err) {
        console.error("Error fetching attendance:", err);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  // ✅ Apply filters
  const filteredData = attendanceData.filter((record) => (
    (!filterStatus || record.status === filterStatus) &&
    (!filterBranch || record.branch?.toLowerCase().includes(filterBranch.toLowerCase())) &&
    (!filterStream || record.stream?.toLowerCase().includes(filterStream.toLowerCase())) &&
    (!filterYear || record.year?.toString().includes(filterYear))
  ));

  const startIndex = (currentPage - 1) * ITEMS_PER_PAGE;
  const paginatedData = filteredData.slice(startIndex, startIndex + ITEMS_PER_PAGE);

  return (
    <div className="p-6 bg-gray-100 min-h-screen">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-center mb-6 gap-4">
        <h2 className="text-2xl font-bold text-gray-800">📋 Attendance Management</h2>
        <button className="px-4 py-2 bg-blue-600 text-white rounded-md shadow hover:bg-blue-700">
          📥 Download CSV
        </button>
      </div>

      {/* Loading */}
      {loading ? (
        <p className="text-center text-gray-500">Loading attendance records...</p>
      ) : (
        <>
          {/* Filters */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4 bg-white p-4 rounded-lg shadow mb-6">
            <div>
              <label className="block text-sm font-medium text-gray-700">Status</label>
              <select
                value={filterStatus}
                onChange={(e) => setFilterStatus(e.target.value)}
                className="w-full mt-1 p-2 border rounded-md"
              >
                <option value="">All</option>
                <option value="present">Present</option>
                <option value="on leave">On Leave</option>
                <option value="absent">Absent</option>
                <option value="pending evaluation">Pending Evaluation</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700">Branch</label>
              <input
                type="text"
                value={filterBranch}
                onChange={(e) => setFilterBranch(e.target.value)}
                placeholder="Enter Branch"
                className="w-full mt-1 p-2 border rounded-md"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700">Stream</label>
              <input
                type="text"
                value={filterStream}
                onChange={(e) => setFilterStream(e.target.value)}
                placeholder="Enter Stream"
                className="w-full mt-1 p-2 border rounded-md"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700">Year</label>
              <input
                type="text"
                value={filterYear}
                onChange={(e) => setFilterYear(e.target.value)}
                placeholder="Enter Year"
                className="w-full mt-1 p-2 border rounded-md"
              />
            </div>
          </div>

          {/* Table */}
          <div className="overflow-x-auto bg-white shadow rounded-lg">
            <table className="min-w-full divide-y divide-gray-200 text-sm">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-4 py-2 text-left font-medium text-gray-600">Event</th>
                  <th className="px-4 py-2 text-left font-medium text-gray-600">Name</th>
                  <th className="px-4 py-2 text-left font-medium text-gray-600">Branch</th>
                  <th className="px-4 py-2 text-left font-medium text-gray-600">Stream</th>
                  <th className="px-4 py-2 text-left font-medium text-gray-600">Year</th>
                  <th className="px-4 py-2 text-left font-medium text-gray-600">Status</th>
                  <th className="px-4 py-2 text-left font-medium text-gray-600">Punch In</th>
                  <th className="px-4 py-2 text-left font-medium text-gray-600">Punch Out</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {paginatedData.length > 0 ? (
                  paginatedData.map((record) => (
                    <tr key={record._id}>
                      <td className="px-4 py-2">{record.eventName}</td>
                      <td className="px-4 py-2">
                        {record.name} ({record.nickname})
                      </td>
                      <td className="px-4 py-2">{record.branch}</td>
                      <td className="px-4 py-2">{record.stream}</td>
                      <td className="px-4 py-2">{record.year}</td>
                      <td className="px-4 py-2">
                        <span
                          className={`px-2 py-1 rounded text-xs font-medium
                        ${record.status === "present"
                              ? "bg-green-100 text-green-700"
                              : record.status === "absent"
                                ? "bg-red-100 text-red-700"
                                : record.status === "on leave"
                                  ? "bg-yellow-100 text-yellow-700"
                                  : "bg-gray-100 text-gray-700"
                            }`}
                        >
                          {record.status}
                        </span>
                      </td>
                      <td className="px-4 py-2">
                        {record.punch_in_time
                          ? new Date(record.punch_in_time).toLocaleTimeString()
                          : "N/A"}
                      </td>
                      <td className="px-4 py-2">
                        {record.punch_out_time
                          ? new Date(record.punch_out_time).toLocaleTimeString()
                          : "N/A"}
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan="8" className="text-center py-4 text-gray-500">
                      No records found
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>

          {/* Pagination */}
          <div className="flex justify-between items-center mt-6">
            <button
              onClick={() => setCurrentPage((prev) => Math.max(prev - 1, 1))}
              disabled={currentPage === 1}
              className="px-3 py-1 bg-gray-200 rounded disabled:opacity-50"
            >
              Previous
            </button>
            <span className="text-gray-600">Page {currentPage}</span>
            <button
              onClick={() => setCurrentPage((prev) => prev + 1)}
              disabled={startIndex + ITEMS_PER_PAGE >= filteredData.length}
              className="px-3 py-1 bg-gray-200 rounded disabled:opacity-50"
            >
              Next
            </button>
          </div>
        </>
      )}
    </div>
  );
};

export default AttendancePage;
