"use client";
import React, { useEffect, useMemo, useState, useCallback } from "react";
import { getAllAttendances, hostSocket } from "../../../lib/api";
import { processAttendanceData, asId } from "../../../lib/api/utils"; 
// 1. IMPORT SDK
import { initSocket } from "../../../lib/api";

const Icons = {
  Search: () => <svg className="w-4 h-4 text-gray-500" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" /></svg>,
  Download: () => <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" /></svg>,
  Filter: () => <svg className="w-4 h-4 text-gray-500" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 4a1 1 0 011-1h16a1 1 0 011 1v2.586a1 1 0 01-.293.707l-6.414 6.414a1 1 0 00-.293.707V17l-4 4v-6.586a1 1 0 00-.293-.707L3.293 7.293A1 1 0 013 6.586V4z" /></svg>,
  MapPin: () => <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" /></svg>
};

const ProgressBar = ({ progress }) => (
  <div className={`fixed top-0 left-0 w-full h-1 z-[9999] transition-opacity duration-500 ${progress === 0 ? 'opacity-0' : 'opacity-100'}`}>
    <div className="h-full bg-emerald-500 transition-all duration-300 ease-out" style={{ width: `${progress}%` }}></div>
  </div>
);

// 2. LIVE INDICATOR COMPONENT
const LiveIndicator = ({ isLive }) => (
    <div className={`flex items-center gap-2 px-3 py-1 rounded-full text-xs font-bold border ${isLive ? 'bg-emerald-50 text-emerald-600 border-emerald-200' : 'bg-gray-50 text-gray-400 border-gray-200'}`}>
        <span className={`relative flex h-2 w-2`}>
          {isLive && <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>}
          <span className={`relative inline-flex rounded-full h-2 w-2 ${isLive ? 'bg-emerald-500' : 'bg-gray-400'}`}></span>
        </span>
        {isLive ? 'LIVE' : 'CONNECTING...'}
    </div>
);

const ViewAttendancePage = () => {
  const [attendanceData, setAttendanceData] = useState([]);
  const [eventData, setEventData] = useState([]);
  
  const [loading, setLoading] = useState(true);
  const [progress, setProgress] = useState(0);
  const [error, setError] = useState("");
  const [isLive, setIsLive] = useState(false); // Socket State

  // Filters
  const [filterEvent, setFilterEvent] = useState("");
  const [filterStatus, setFilterStatus] = useState("");
  const [filterDistance, setFilterDistance] = useState("");
  
  // Text Inputs
  const [filterName, setFilterName] = useState("");
  const [filterBranch, setFilterBranch] = useState("");
  const [filterEnroll, setFilterEnroll] = useState("");
  const [filterYear, setFilterYear] = useState("");
  const [debouncedFilters, setDebouncedFilters] = useState({ name: "", branch: "", enroll: "", year: "" });

  const [currentPage, setCurrentPage] = useState(1);
  const recordsPerPage = 50;

  // Debounce Effect
  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedFilters({ name: filterName, branch: filterBranch, enroll: filterEnroll, year: filterYear });
    }, 300);
    return () => clearTimeout(handler);
  }, [filterName, filterBranch, filterEnroll, filterYear]);

  // --- 3. ZERO LOAD SOCKET UPDATE ---
  const handleSocketUpdate = useCallback((newRecord) => {
    if (!newRecord) return;
    
    // Process only the single new record (Fast)
    const [processed] = processAttendanceData([newRecord]);
    
    setAttendanceData((prev) => {
        const index = prev.findIndex(item => item._id === processed._id);
        
        if (index > -1) {
            // Update existing row (e.g. Punch Out)
            const updated = [...prev];
            updated[index] = processed;
            return updated;
        } else {
            // Add new row to top (e.g. Punch In)
            return [processed, ...prev];
        }
    });
  }, []);

  // --- 4. DATA FETCH & SOCKET INIT ---
  useEffect(() => {
    let interval;
    if (loading) {
      setProgress(10);
      interval = setInterval(() => setProgress(p => p < 90 ? p + Math.random() * 5 : p), 200);
    }

    const initDataAndSocket = async () => {
        try {
            // A. Fetch Initial Data
            const [eventRes, attendanceRes] = await Promise.all([
                fetch(`${hostSocket}/api/events`),
                new Promise(resolve => getAllAttendances({ event_id: filterEvent || undefined }, resolve))
            ]);

            const eventData = await eventRes.json();
            if (eventData?.events) setEventData(eventData.events);

            const raw = Array.isArray(attendanceRes?.data) ? attendanceRes.data : [];

            // B. Connect Socket
            new initSocket({
                connectionCallback: () => setIsLive(true),
                punchInCallback: (data) => handleSocketUpdate(data),
                punchOutCallback: (data) => handleSocketUpdate(data),
                newMessageCallback: () => {}, successCallback: () => {}, errorCallback: (e) => console.error(e), attendanceStartedCallback: () => {}
            });
            if (initSocket.instance) setIsLive(true);

            // C. Process Data
            setTimeout(() => { 
                const processed = processAttendanceData(raw);
                processed.sort((a, b) => (b._parsedInDate || 0) - (a._parsedInDate || 0));
                setAttendanceData(processed);
                setProgress(100);
                setTimeout(() => { setLoading(false); setProgress(0); }, 500);
            }, 10);

        } catch (err) { 
            console.error(err); 
            setError("Failed to load data"); 
            setLoading(false); 
        }
    };

    initDataAndSocket();
    return () => clearInterval(interval);
  }, [filterEvent]); // Re-run if main event filter changes (optional, usually safer to keep socket alive and filter locally)

  // Status Options
  const statusOptions = useMemo(() => {
    return Array.from(new Set(attendanceData.map(r => r.status).filter(Boolean)));
  }, [attendanceData]);

  // --- FILTERING LOGIC ---
  const filteredData = useMemo(() => {
    const { name, branch, enroll, year } = debouncedFilters;
    
    return attendanceData.filter((r) => {
      // 1. Exact Filters
      if (filterEvent && r._eventId !== filterEvent) return false;
      if (filterStatus && r.status?.toLowerCase() !== filterStatus.toLowerCase()) return false;
      if (filterDistance && r._distBucket !== filterDistance) return false;

      // 2. Text Filters
      if (name && !r._searchName.includes(name.toLowerCase())) return false;
      if (branch && !r._searchBranch.includes(branch.trim().toLowerCase())) return false;
      if (enroll && !r._searchEnroll.includes(enroll.trim().toLowerCase())) return false;
      if (year && !r._searchYear.includes(year.trim().toLowerCase())) return false;

      return true;
    });
  }, [attendanceData, filterEvent, filterStatus, filterDistance, debouncedFilters]);

  // Pagination
  const indexOfLast = currentPage * recordsPerPage;
  const indexOfFirst = indexOfLast - recordsPerPage;
  const paginatedData = filteredData.slice(indexOfFirst, indexOfLast);
  const totalPages = Math.ceil(filteredData.length / recordsPerPage);

  const getEventName = (id) => eventData.find(e => asId(e) === id)?.title || "N/A";

  const exportToCSV = () => {
     if (!filteredData.length) return alert("No data");
     alert("Exporting..."); 
  };

  if (error) return <div className="text-center p-10 text-red-500">Error: {error} <button onClick={() => window.location.reload()}>Retry</button></div>;

  return (
    <div className="min-h-screen bg-gray-50/50 p-6 md:p-8 font-sans text-gray-800">
      <ProgressBar progress={progress} />
      
      {/* HEADER */}
      <div className="flex flex-col md:flex-row justify-between mb-8 gap-4 items-start md:items-center">
        <div>
            <h1 className="text-3xl font-bold text-gray-900">Attendance Overview</h1>
            <p className="text-sm text-gray-500 mt-1">Manage and track student check-ins and locations.</p>
        </div>
        
        <div className="flex items-center gap-3">
            {/* LIVE INDICATOR ADDED HERE */}
            <LiveIndicator isLive={isLive} />
            
            <button onClick={exportToCSV} className="flex items-center gap-2 bg-emerald-600 text-white px-5 py-2.5 rounded-xl hover:bg-emerald-700 transition-colors shadow-sm">
                <Icons.Download /> Export CSV
            </button>
        </div>
      </div>

      {/* FILTERS */}
      <div className="bg-white p-5 rounded-2xl shadow-sm border border-gray-100 mb-8">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 xl:grid-cols-7 gap-4">
          <div className="xl:col-span-2">
            <select value={filterEvent} onChange={(e) => setFilterEvent(e.target.value)} className="w-full bg-gray-50 border p-2.5 rounded-lg">
              <option value="">All Events</option>
              {eventData.map((ev) => <option key={asId(ev)} value={asId(ev)}>{ev.title}</option>)}
            </select>
          </div>
          <select value={filterStatus} onChange={(e) => setFilterStatus(e.target.value)} className="bg-gray-50 border p-2.5 rounded-lg">
            <option value="">All Status</option>
            {statusOptions.map((s) => <option key={s} value={s}>{s}</option>)}
          </select>
          <select value={filterDistance} onChange={(e) => setFilterDistance(e.target.value)} className="bg-gray-50 border p-2.5 rounded-lg">
            <option value="">Distance (All)</option>
            <option value="in">✅ Verified (≤500m)</option>
            <option value="out">⚠️ Out of Range</option>
            <option value="single">📍 Single Punch</option>
            <option value="no-locations">❌ No Location</option>
          </select>
          <input type="text" placeholder="Name" value={filterName} onChange={(e) => setFilterName(e.target.value)} className="bg-gray-50 border p-2.5 rounded-lg" />
          <input type="text" placeholder="Branch" value={filterBranch} onChange={(e) => setFilterBranch(e.target.value)} className="bg-gray-50 border p-2.5 rounded-lg" />
          <input type="text" placeholder="Enrollment" value={filterEnroll} onChange={(e) => setFilterEnroll(e.target.value)} className="bg-gray-50 border p-2.5 rounded-lg" />
          <input type="text" placeholder="Year" value={filterYear} onChange={(e) => setFilterYear(e.target.value)} className="bg-gray-50 border p-2.5 rounded-lg" />
        </div>
      </div>

      {/* DATA TABLE */}
      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden min-h-[300px]">
        {loading ? (
            <div className="p-6 space-y-4 animate-pulse">
                {[...Array(5)].map((_, i) => <div key={i} className="h-12 bg-gray-100 rounded w-full"></div>)}
            </div>
        ) : filteredData.length === 0 ? (
            <div className="text-center py-16 text-gray-400">No matching records found.</div>
        ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm text-left text-gray-500">
                <thead className="text-xs text-gray-700 uppercase bg-gray-50 border-b">
                  <tr>
                    <th className="px-6 py-4">User Details</th><th className="px-6 py-4">Event</th><th className="px-6 py-4">Time</th><th className="px-6 py-4">Location</th><th className="px-6 py-4">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-50">
                  {paginatedData.map((r, idx) => (
                    <tr key={r._id || idx} className="bg-white hover:bg-gray-50 transition-colors">
                      <td className="px-6 py-4">
                        <div className="font-bold text-gray-900">{r._searchName}</div>
                        <div className="text-xs text-gray-400">{r._searchEnroll} • {r._searchBranch}</div>
                      </td>
                      <td className="px-6 py-4"><span className="bg-blue-50 text-blue-700 px-2 py-1 rounded text-xs">{getEventName(r._eventId)}</span></td>
                      <td className="px-6 py-4 text-xs">
                         <div className="flex flex-col gap-1">
                             <span className="whitespace-nowrap">IN: {r._parsedInDate ? r._parsedInDate.toLocaleTimeString([], {hour:'2-digit', minute:'2-digit'}) : "-"}</span>
                             {r._parsedOutDate && <span className="whitespace-nowrap text-gray-400">OUT: {r._parsedOutDate.toLocaleTimeString([], {hour:'2-digit', minute:'2-digit'})}</span>}
                         </div>
                      </td>
                      <td className="px-6 py-4">
                         {r._distBucket === 'in' && <span className="text-green-600 bg-green-50 px-2 py-1 rounded-full text-xs font-medium border border-green-100 flex items-center w-fit gap-1"><Icons.MapPin/> ≤500m</span>}
                         {r._distBucket === 'out' && <span className="text-red-600 bg-red-50 px-2 py-1 rounded-full text-xs font-medium border border-red-100 flex items-center w-fit gap-1"><Icons.MapPin/> &gt;500m</span>}
                         {r._distBucket === 'single' && <span className="text-yellow-600 bg-yellow-50 px-2 py-1 rounded-full text-xs font-medium border border-yellow-100 flex items-center w-fit gap-1">Pending</span>}
                         {r._distBucket === 'no-locations' && <span className="text-gray-400 text-xs italic">No GPS Data</span>}
                      </td>
                      <td className="px-6 py-4"><span className={`px-3 py-1 rounded-full text-xs font-bold border ${r.status === 'Present' ? 'bg-emerald-50 text-emerald-600 border-emerald-200' : 'bg-rose-50 text-rose-600 border-rose-200'}`}>{r.status}</span></td>
                    </tr>
                  ))}
                </tbody>
              </table>
              <div className="flex justify-between p-4 bg-gray-50 border-t">
                  <span>Showing {indexOfFirst + 1}-{Math.min(indexOfLast, filteredData.length)} of {filteredData.length}</span>
                  <div className="flex gap-2">
                      <button onClick={() => setCurrentPage(p => Math.max(1, p - 1))} disabled={currentPage === 1} className="px-3 py-1 bg-white border rounded disabled:opacity-50">Prev</button>
                      <button onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))} disabled={currentPage === totalPages} className="px-3 py-1 bg-white border rounded disabled:opacity-50">Next</button>
                  </div>
              </div>
            </div>
        )}
      </div>
    </div>
  );
};
export default ViewAttendancePage;