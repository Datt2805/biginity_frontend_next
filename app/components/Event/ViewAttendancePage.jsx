"use client";
import React, { useEffect, useMemo, useState } from "react";
import { getAllAttendances, hostSocket } from "../../../lib/api";

// --- ICONS ---
const Icons = {
  Search: () => <svg className="w-4 h-4 text-gray-500" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" /></svg>,
  Download: () => <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" /></svg>,
  Filter: () => <svg className="w-4 h-4 text-gray-500" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 4a1 1 0 011-1h16a1 1 0 011 1v2.586a1 1 0 01-.293.707l-6.414 6.414a1 1 0 00-.293.707V17l-4 4v-6.586a1 1 0 00-.293-.707L3.293 7.293A1 1 0 013 6.586V4z" /></svg>,
  MapPin: () => <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" /></svg>
};

// --- HELPERS ---
const safeDate = (dt) => {
  try {
    if (!dt) return null;
    const d = new Date(dt);
    return isNaN(d.getTime()) ? null : d;
  } catch { return null; }
};

const asId = (maybeObjOrId) => {
  if (!maybeObjOrId) return "";
  if (typeof maybeObjOrId === "string") return maybeObjOrId;
  return maybeObjOrId._id || "";
};

const getNested = (obj, path, fallback = undefined) => {
  try {
    return path.split(".").reduce((o, k) => (o ? o[k] : undefined), obj) ?? fallback;
  } catch { return fallback; }
};

const getDistanceInMeters = (lat1, lon1, lat2, lon2) => {
  const toRad = (v) => (v * Math.PI) / 180;
  if ([lat1, lon1, lat2, lon2].some((v) => v === null || v === undefined || Number.isNaN(Number(v)))) return null;
  const R = 6371e3;
  const φ1 = toRad(Number(lat1));
  const φ2 = toRad(Number(lat2));
  const dφ = toRad(Number(lat2) - Number(lat1));
  const dλ = toRad(Number(lon2) - Number(lon1));
  const a = Math.sin(dφ / 2) ** 2 + Math.cos(φ1) * Math.cos(φ2) * Math.sin(dλ / 2) ** 2;
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
};

// --- SKELETON LOADER ---
const TableSkeleton = () => (
  <div className="animate-pulse space-y-4">
    {[...Array(10)].map((_, i) => (
      <div key={i} className="flex space-x-4">
        <div className="h-12 bg-gray-100 rounded w-full"></div>
      </div>
    ))}
  </div>
);

const ViewAttendancePage = () => {
  const [attendanceData, setAttendanceData] = useState([]);
  const [eventData, setEventData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const [filterEvent, setFilterEvent] = useState("");
  const [filterStatus, setFilterStatus] = useState("");
  const [filterDistance, setFilterDistance] = useState("");
  
  // Specific filters you requested not to change
  const [filterName, setFilterName] = useState("");
  const [filterBranch, setFilterBranch] = useState("");
  const [filterEnroll, setFilterEnroll] = useState("");
  const [filterYear, setFilterYear] = useState("");

  const [currentPage, setCurrentPage] = useState(1);
  const recordsPerPage = 50;

  useEffect(() => {
    fetchEventData();
    fetchAttendanceData();
  }, []);

  useEffect(() => {
    if(!loading) fetchAttendanceData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [filterEvent]);

  const fetchEventData = async () => {
    try {
      const res = await fetch(`${hostSocket}/api/events`);
      const data = await res.json();
      if (data?.events && Array.isArray(data.events)) {
        setEventData(data.events);
      }
    } catch (err) {
      console.error("Event fetch error:", err);
    }
  };

  const fetchAttendanceData = async () => {
    setLoading(true);
    setError("");

    try {
      await getAllAttendances(
        { event_id: filterEvent || undefined },
        (response) => {
          const array = Array.isArray(response?.data) ? response.data : [];
          
          const normalized = array.map((r) => ({
            ...r,
            _eventId: asId(r.event_id),
            _userId: asId(r.user_id),
          }));

          const sorted = normalized.sort((a, b) => {
            const da = safeDate(a.punch_in_time);
            const db = safeDate(b.punch_in_time);
            if (da && db) return db - da;
            return 0;
          });

          setAttendanceData(sorted);
          setLoading(false);
        },
        (err) => {
          setError(err?.message || "Error fetching attendance");
          setLoading(false);
        }
      );
    } catch (err) {
      setError(err?.message || "Fetch failed");
      setLoading(false);
    }
  };

  const getEventName = (eventRef) => {
    const id = asId(eventRef);
    if (!id) return "N/A";
    const found = eventData.find((e) => asId(e._id) === id);
    return found?.title || getNested(eventRef, "title") || "N/A";
  };

  // --- UPDATED DISTANCE LOGIC (500m) ---
  const computeDistanceBucket = (locations) => {
    if (!Array.isArray(locations) || locations.length === 0) return "no-locations";
    if (locations.length === 1) return "single";
    const start = locations[0];
    const end = locations[locations.length - 1];
    const d = getDistanceInMeters(start?.lat, start?.long, end?.lat, end?.long);
    if (d === null) return "no-locations";
    
    // UPDATED: Now checks for 500 meters
    return d <= 500 ? "in" : "out";
  };

  const statusOptions = useMemo(() => {
    const set = new Set();
    attendanceData.forEach((r) => r.status && set.add(r.status));
    return Array.from(set);
  }, [attendanceData]);

  // --- EXACT ORIGINAL FILTER LOGIC ---
  const filteredData = useMemo(() => {
    const result = attendanceData.filter((record) => {
      // 1. Name Filter
      const userName = (record.name || getNested(record, "user_id.name", "")).toLowerCase();
      
      // 2. Branch Filter
      const branch = (record.branch || getNested(record, "user_id.branch", "") || "").toString().trim().toLowerCase();
      
      // 3. Year Filter
      const year = (record.year || getNested(record, "user_id.year", "") || "").toString().trim().toLowerCase();

      // 4. Enroll Filter
      const enroll = (record.enrollment_id || getNested(record, "user_id.enrollment_id", "")).toString().toLowerCase();

      const matchesEvent = !filterEvent || asId(record.event_id) === filterEvent;
      const matchesStatus = !filterStatus || record.status?.toLowerCase() === filterStatus.toLowerCase();
      
      const bucket = computeDistanceBucket(record.locations);
      const matchesDistance = !filterDistance || bucket === filterDistance;

      const matchesName = !filterName || userName.includes(filterName.toLowerCase());
      const matchesBranch = !filterBranch || branch.includes(filterBranch.trim().toLowerCase());
      const matchesEnroll = !filterEnroll || enroll.includes(filterEnroll.trim().toLowerCase());
      const matchesYear = !filterYear || year.includes(filterYear.trim().toLowerCase());

      return matchesEvent && matchesStatus && matchesDistance && matchesName && matchesBranch && matchesEnroll && matchesYear;
    });

    setCurrentPage(1);
    return result;
  }, [attendanceData, filterEvent, filterStatus, filterDistance, filterName, filterBranch, filterEnroll, filterYear]);

  const indexOfLast = currentPage * recordsPerPage;
  const indexOfFirst = indexOfLast - recordsPerPage;
  const paginatedData = filteredData.slice(indexOfFirst, indexOfLast);
  const totalPages = Math.ceil(filteredData.length / recordsPerPage);
  
  const nextPage = () => currentPage < totalPages && setCurrentPage((p) => p + 1);
  const prevPage = () => currentPage > 1 && setCurrentPage((p) => p - 1);

  const exportToCSV = (data) => {
    if (!data.length) return alert("No data to export");
    const headers = ["Event Name", "User Name", "Nickname", "Enrollment ID", "Branch", "Year", "Status", "Punch In", "Punch Out", "In Lat/Long", "Out Lat/Long", "Distance Check"];
    const csvRows = data.map((rec) => {
      const branch = rec.branch || getNested(rec, "user_id.branch", "N/A");
      const year = rec.year || getNested(rec, "user_id.year", "N/A");
      const eventName = getEventName(rec.event_id);
      const userName = rec.name || getNested(rec, "user_id.name", "N/A");
      const nick = rec.nickname || getNested(rec, "user_id.nickname", "N/A");
      const enr = rec.enrollment_id || getNested(rec, "user_id.enrollment_id", "N/A");
      const inDt = safeDate(rec.punch_in_time);
      const outDt = safeDate(rec.punch_out_time);
      const locs = Array.isArray(rec.locations) ? rec.locations : [];
      const bucket = computeDistanceBucket(locs);
      
      return [
        eventName, userName, nick, enr, branch, year, rec.status,
        inDt ? inDt.toLocaleString() : "N/A",
        outDt ? outDt.toLocaleString() : "N/A",
        locs[0] ? `${locs[0].lat}, ${locs[0].long}` : "N/A",
        locs[locs.length-1] ? `${locs[locs.length-1].lat}, ${locs[locs.length-1].long}` : "N/A",
        bucket.toUpperCase(),
      ];
    });

    const csv = [headers, ...csvRows].map((r) => r.map((cell) => `"${String(cell).replace(/"/g, '""')}"`).join(",")).join("\n");
    const url = URL.createObjectURL(new Blob([csv], { type: "text/csv" }));
    const a = document.createElement("a");
    a.href = url;
    a.download = "attendance_report.csv";
    a.click();
    URL.revokeObjectURL(url);
  };

  if (error) return (
    <div className="flex flex-col items-center justify-center min-h-[50vh] text-red-500">
      <p className="text-xl font-semibold">Error Loading Data</p>
      <p className="text-sm">{error}</p>
      <button onClick={() => window.location.reload()} className="mt-4 px-4 py-2 bg-gray-200 rounded-lg text-gray-800 hover:bg-gray-300">Retry</button>
    </div>
  );

  return (
    <div className="min-h-screen bg-gray-50/50 p-6 md:p-8 font-sans text-gray-800">
      
      {/* HEADER */}
      <div className="flex flex-col md:flex-row md:items-center justify-between mb-8 gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-gray-900">Attendance Overview</h1>
          <p className="text-sm text-gray-500 mt-1">Manage and track student check-ins and locations.</p>
        </div>
        <button
          onClick={() => exportToCSV(filteredData)}
          className="flex items-center gap-2 bg-emerald-600 text-white px-5 py-2.5 rounded-xl font-medium shadow-lg shadow-emerald-200 hover:bg-emerald-700 hover:shadow-xl transition-all active:scale-95"
        >
          <Icons.Download />
          Export CSV
        </button>
      </div>

      {/* FILTERS CONTAINER */}
      <div className="bg-white p-5 rounded-2xl shadow-sm border border-gray-100 mb-8">
        <div className="flex items-center gap-2 mb-4 text-sm font-semibold text-gray-600 uppercase tracking-wider">
           <Icons.Filter /> Filters
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 xl:grid-cols-7 gap-4">
          
          <div className="xl:col-span-2">
            <select value={filterEvent} onChange={(e) => setFilterEvent(e.target.value)} className="w-full bg-gray-50 border border-gray-200 text-gray-700 text-sm rounded-lg focus:ring-blue-500 focus:border-blue-500 block p-2.5">
              <option value="">All Events</option>
              {eventData.map((ev) => <option key={asId(ev._id)} value={asId(ev._id)}>{ev.title}</option>)}
            </select>
          </div>

          <select value={filterStatus} onChange={(e) => setFilterStatus(e.target.value)} className="bg-gray-50 border border-gray-200 text-gray-700 text-sm rounded-lg focus:ring-blue-500 block p-2.5">
            <option value="">All Status</option>
            {statusOptions.map((s) => <option key={s} value={s}>{s}</option>)}
          </select>

          <select value={filterDistance} onChange={(e) => setFilterDistance(e.target.value)} className="bg-gray-50 border border-gray-200 text-gray-700 text-sm rounded-lg focus:ring-blue-500 block p-2.5">
            <option value="">Distance (All)</option>
            <option value="in">✅ Verified (≤500m)</option>
            <option value="out">⚠️ Out of Range</option>
            <option value="single">📍 Single Punch</option>
            <option value="no-locations">❌ No Location</option>
          </select>

          {/* Individual Search Inputs (Restored per your request) */}
          <div className="relative">
            <div className="absolute inset-y-0 left-0 flex items-center pl-3 pointer-events-none"><Icons.Search /></div>
            <input type="text" placeholder="Name" value={filterName} onChange={(e) => setFilterName(e.target.value)} className="bg-gray-50 border border-gray-200 text-gray-900 text-sm rounded-lg focus:ring-blue-500 focus:border-blue-500 block w-full pl-10 p-2.5" />
          </div>

          <input type="text" placeholder="Branch" value={filterBranch} onChange={(e) => setFilterBranch(e.target.value)} className="bg-gray-50 border border-gray-200 text-gray-900 text-sm rounded-lg focus:ring-blue-500 block w-full p-2.5" />
          <input type="text" placeholder="Enrollment" value={filterEnroll} onChange={(e) => setFilterEnroll(e.target.value)} className="bg-gray-50 border border-gray-200 text-gray-900 text-sm rounded-lg focus:ring-blue-500 block w-full p-2.5" />
          <input type="text" placeholder="Year" value={filterYear} onChange={(e) => setFilterYear(e.target.value)} className="bg-gray-50 border border-gray-200 text-gray-900 text-sm rounded-lg focus:ring-blue-500 block w-full p-2.5" />
        </div>
      </div>

      {/* DATA TABLE */}
      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
        {loading ? (
          <div className="p-6">
            <TableSkeleton />
          </div>
        ) : (
          <>
            <div className="overflow-x-auto">
              <table className="w-full text-sm text-left text-gray-500">
                <thead className="text-xs text-gray-700 uppercase bg-gray-50 border-b border-gray-100">
                  <tr>
                    <th className="px-6 py-4 font-semibold">User Details</th>
                    <th className="px-6 py-4 font-semibold">Event Info</th>
                    <th className="px-6 py-4 font-semibold">Punch Times</th>
                    <th className="px-6 py-4 font-semibold">Location Status</th>
                    <th className="px-6 py-4 font-semibold text-center">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-50">
                  {paginatedData.map((record, idx) => {
                    const eventName = getEventName(record.event_id);
                    const userName = record.name || getNested(record, "user_id.name", "N/A");
                    const enrollment = record.enrollment_id || getNested(record, "user_id.enrollment_id", "N/A");
                    const branch = record.branch || getNested(record, "user_id.branch", "N/A");
                    const year = record.year || getNested(record, "user_id.year", "N/A");
                    const inDt = safeDate(record.punch_in_time);
                    const outDt = safeDate(record.punch_out_time);
                    const locs = Array.isArray(record.locations) ? record.locations : [];
                    const bucket = computeDistanceBucket(locs);

                    return (
                      <tr key={record._id || idx} className="bg-white hover:bg-gray-50 transition-colors">
                        <td className="px-6 py-4">
                          <div className="flex flex-col">
                            <span className="font-bold text-gray-900">{userName}</span>
                            <span className="text-xs text-gray-400">{enrollment} • {branch} ({year})</span>
                          </div>
                        </td>
                        <td className="px-6 py-4">
                          <span className="bg-blue-50 text-blue-700 px-2 py-1 rounded-md text-xs font-medium border border-blue-100">
                            {eventName}
                          </span>
                        </td>
                        <td className="px-6 py-4">
                          <div className="flex flex-col gap-1 text-xs">
                            <div className="flex items-center gap-2">
                                <span className="w-10 text-gray-400 font-medium">IN</span>
                                <span className="font-mono text-gray-700">{inDt ? inDt.toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'}) : "-"}</span>
                            </div>
                            <div className="flex items-center gap-2">
                                <span className="w-10 text-gray-400 font-medium">OUT</span>
                                <span className="font-mono text-gray-700">{outDt ? outDt.toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'}) : "-"}</span>
                            </div>
                          </div>
                        </td>
                        <td className="px-6 py-4">
                           <div className="flex items-center gap-2">
                            {bucket === "in" && (
                                <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                                    <Icons.MapPin /> ≤500m
                                </span>
                            )}
                            {bucket === "out" && (
                                <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-medium bg-red-100 text-red-800">
                                    <Icons.MapPin /> &gt;500m
                                </span>
                            )}
                            {bucket === "single" && (
                                <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-medium bg-yellow-100 text-yellow-800">
                                    Pending Out
                                </span>
                            )}
                            {bucket === "no-locations" && (
                                <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-500">
                                    No GPS
                                </span>
                            )}
                           </div>
                           <div className="text-[10px] text-gray-400 mt-1 truncate max-w-[150px]">
                                {locs[0] ? `${Number(locs[0].lat).toFixed(4)}, ${Number(locs[0].long).toFixed(4)}` : ""}
                           </div>
                        </td>
                        <td className="px-6 py-4 text-center">
                            <span className={`px-3 py-1 rounded-full text-xs font-bold border
                                ${record.status === 'Present' 
                                    ? 'bg-emerald-50 text-emerald-600 border-emerald-200' 
                                    : 'bg-rose-50 text-rose-600 border-rose-200'}
                            `}>
                                {record.status || 'Unknown'}
                            </span>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>

            {/* EMPTY STATE */}
            {filteredData.length === 0 && (
              <div className="flex flex-col items-center justify-center py-12 text-gray-400">
                <svg className="w-12 h-12 mb-3 text-gray-300" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M9.172 16.172a4 4 0 015.656 0M9 10h.01M15 10h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
                <p>No attendance records match your filters.</p>
              </div>
            )}

            {/* PAGINATION */}
            <div className="flex items-center justify-between p-4 border-t border-gray-100 bg-gray-50">
              <span className="text-sm text-gray-500">
                Showing <span className="font-semibold text-gray-900">{indexOfFirst + 1}-{Math.min(indexOfLast, filteredData.length)}</span> of <span className="font-semibold text-gray-900">{filteredData.length}</span>
              </span>
              <div className="flex gap-2">
                <button
                  onClick={prevPage}
                  disabled={currentPage === 1}
                  className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                >
                  Previous
                </button>
                <button
                  onClick={nextPage}
                  disabled={currentPage === totalPages}
                  className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                >
                  Next
                </button>
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  );
};

export default ViewAttendancePage;