"use client";
import React, { useEffect, useMemo, useState } from "react";
import { getAllAttendances, hostSocket } from "../../../lib/api"; // Update path if needed
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend,
  ArcElement,
} from "chart.js";
import { Bar, Pie, Doughnut } from "react-chartjs-2";

// --- Register ChartJS ---
ChartJS.register(CategoryScale, LinearScale, BarElement, Title, Tooltip, Legend, ArcElement);

// --- Helpers ---
const asId = (obj) => (obj && typeof obj === "object" ? obj._id : obj) || "";
const getNested = (obj, path, fallback) => {
  try {
    return path.split(".").reduce((o, k) => (o ? o[k] : undefined), obj) ?? fallback;
  } catch {
    return fallback;
  }
};
const getDistanceInMeters = (lat1, lon1, lat2, lon2) => {
  if (!lat1 || !lon1 || !lat2 || !lon2) return null;
  const toRad = (v) => (v * Math.PI) / 180;
  const R = 6371e3;
  const a = Math.sin(toRad(lat2 - lat1) / 2) ** 2 +
            Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.sin(toRad(lon2 - lon1) / 2) ** 2;
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
};

// --- Main Component ---
const AnalyticsDashboard = () => {
  const [data, setData] = useState([]);
  const [events, setEvents] = useState([]);
  const [loading, setLoading] = useState(true);

  // Filters
  const [filterEvent, setFilterEvent] = useState("");
  const [filterBranch, setFilterBranch] = useState("");
  const [filterYear, setFilterYear] = useState("");

  // Modal State for "Large Size"
  const [selectedChart, setSelectedChart] = useState(null); // 'status', 'branch', 'year', 'distance'

  // 1. Fetch Data
  useEffect(() => {
    const init = async () => {
      try {
        // Fetch Events for Dropdown
        const eRes = await fetch(`${hostSocket}/api/events`);
        const eData = await eRes.json();
        setEvents(eData.events || []);

        // Fetch All Attendance
        await getAllAttendances({}, (res) => {
          const raw = Array.isArray(res?.data) ? res.data : [];
          // Normalize Data
          const clean = raw.map(r => ({
            ...r,
            branch: (r.branch || getNested(r, "user_id.branch", "Unknown")).toUpperCase(),
            year: (r.year || getNested(r, "user_id.year", "Unknown")).toString(),
            eventId: asId(r.event_id),
            dist: getDistanceInMeters(
              r.locations?.[0]?.lat, r.locations?.[0]?.long,
              r.locations?.at(-1)?.lat, r.locations?.at(-1)?.long
            )
          }));
          setData(clean);
          setLoading(false);
        });
      } catch (e) {
        console.error(e);
        setLoading(false);
      }
    };
    init();
  }, []);

  // 2. Filter Data
  const filteredData = useMemo(() => {
    return data.filter(r => {
      const matchEvent = !filterEvent || r.eventId === filterEvent;
      const matchBranch = !filterBranch || r.branch.includes(filterBranch.toUpperCase());
      const matchYear = !filterYear || r.year.includes(filterYear);
      return matchEvent && matchBranch && matchYear;
    });
  }, [data, filterEvent, filterBranch, filterYear]);

  // 3. Generate Chart Data
  const charts = useMemo(() => {
    const count = (accessor) => {
      const map = {};
      filteredData.forEach(d => { const k = accessor(d); map[k] = (map[k] || 0) + 1; });
      return { labels: Object.keys(map), values: Object.values(map) };
    };

    // Status Data
    const status = count(d => d.status || "Unknown");
    
    // Branch Data
    const branch = count(d => d.branch);
    
    // Year Data
    const year = count(d => d.year);
    
    // Distance Data (In Range vs Out)
    const distMap = { "In Range (≤15m)": 0, "Out of Range (>15m)": 0, "Unknown": 0 };
    filteredData.forEach(d => {
      if (d.dist === null) distMap["Unknown"]++;
      else if (d.dist <= 15) distMap["In Range (≤15m)"]++;
      else distMap["Out of Range (>15m)"]++;
    });

    return {
      status: {
        labels: status.labels,
        datasets: [{
          label: "Students",
          data: status.values,
          backgroundColor: ["#10B981", "#EF4444", "#F59E0B", "#3B82F6"],
        }]
      },
      branch: {
        labels: branch.labels,
        datasets: [{
          label: "Count",
          data: branch.values,
          backgroundColor: "#6366F1",
        }]
      },
      year: {
        labels: year.labels,
        datasets: [{
          label: "Count",
          data: year.values,
          backgroundColor: "#8B5CF6",
        }]
      },
      distance: {
        labels: Object.keys(distMap),
        datasets: [{
          data: Object.values(distMap),
          backgroundColor: ["#10B981", "#EF4444", "#9CA3AF"],
        }]
      }
    };
  }, [filteredData]);

  // --- Modal Renderer ---
  const renderLargeChart = () => {
    if (!selectedChart) return null;
    
    const commonOptions = {
      responsive: true,
      maintainAspectRatio: false,
      plugins: {
        legend: { position: 'top', labels: { font: { size: 14 } } },
        title: { display: true, text: selectedChart.toUpperCase() + " ANALYSIS", font: { size: 20 } }
      }
    };

    let ChartComp;
    let chartData;

    switch(selectedChart) {
      case 'status': ChartComp = Pie; chartData = charts.status; break;
      case 'branch': ChartComp = Bar; chartData = charts.branch; break;
      case 'year': ChartComp = Bar; chartData = charts.year; break;
      case 'distance': ChartComp = Doughnut; chartData = charts.distance; break;
      default: return null;
    }

    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-70 backdrop-blur-sm p-4"
           onClick={() => setSelectedChart(null)}>
        <div className="bg-white p-8 rounded-xl shadow-2xl w-full max-w-4xl h-[80vh] relative flex flex-col"
             onClick={e => e.stopPropagation()}>
          
          <button onClick={() => setSelectedChart(null)}
            className="absolute top-4 right-4 text-gray-500 hover:text-red-500 text-2xl font-bold">
            &times;
          </button>

          <div className="flex-grow">
            <ChartComp data={chartData} options={commonOptions} />
          </div>
          
          <div className="mt-4 text-center text-gray-500">
            Total Records: {filteredData.length}
          </div>
        </div>
      </div>
    );
  };

  if (loading) return <div className="p-10 text-center text-lg animate-pulse">Loading Analytics...</div>;

  return (
    <div className="p-6 bg-gray-50 min-h-screen">
      
      {/* 1. Header & Filters */}
      <div className="bg-white p-4 rounded-lg shadow mb-6">
        <h2 className="text-2xl font-bold mb-4 text-gray-800">📊 Attendance Analytics</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          
          {/* Filter by Event */}
          <select className="border p-2 rounded" value={filterEvent} onChange={e => setFilterEvent(e.target.value)}>
            <option value="">All Events</option>
            {events.map(e => <option key={asId(e)} value={asId(e)}>{e.title}</option>)}
          </select>

          {/* Filter by Branch */}
          <input 
            placeholder="Filter by Branch (e.g. CSE)" 
            className="border p-2 rounded"
            value={filterBranch} onChange={e => setFilterBranch(e.target.value)} 
          />

           {/* Filter by Year */}
           <input 
            placeholder="Filter by Year (e.g. 2025)" 
            className="border p-2 rounded"
            value={filterYear} onChange={e => setFilterYear(e.target.value)} 
          />
        </div>
        <p className="mt-2 text-sm text-gray-500 text-right">Showing {filteredData.length} records</p>
      </div>

      {/* 2. Charts Grid (Clickable) */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        
        {/* Status Chart */}
        <div className="bg-white p-5 rounded-xl shadow-md cursor-pointer hover:shadow-xl transition-shadow border border-transparent hover:border-blue-500 group"
             onClick={() => setSelectedChart('status')}>
          <div className="flex justify-between items-center mb-4">
            <h3 className="font-semibold text-gray-700">Attendance Status</h3>
            <span className="text-xs text-blue-500 opacity-0 group-hover:opacity-100">Click to Enlarge 🔍</span>
          </div>
          <div className="h-64 flex justify-center">
            <Pie data={charts.status} options={{ maintainAspectRatio: false }} />
          </div>
        </div>

        {/* Branch Chart */}
        <div className="bg-white p-5 rounded-xl shadow-md cursor-pointer hover:shadow-xl transition-shadow border border-transparent hover:border-blue-500 group"
             onClick={() => setSelectedChart('branch')}>
          <div className="flex justify-between items-center mb-4">
            <h3 className="font-semibold text-gray-700">Branch Distribution</h3>
            <span className="text-xs text-blue-500 opacity-0 group-hover:opacity-100">Click to Enlarge 🔍</span>
          </div>
          <div className="h-64">
            <Bar data={charts.branch} options={{ maintainAspectRatio: false }} />
          </div>
        </div>

        {/* Distance Chart */}
        <div className="bg-white p-5 rounded-xl shadow-md cursor-pointer hover:shadow-xl transition-shadow border border-transparent hover:border-blue-500 group"
             onClick={() => setSelectedChart('distance')}>
           <div className="flex justify-between items-center mb-4">
            <h3 className="font-semibold text-gray-700">Location Accuracy</h3>
            <span className="text-xs text-blue-500 opacity-0 group-hover:opacity-100">Click to Enlarge 🔍</span>
          </div>
          <div className="h-64 flex justify-center">
            <Doughnut data={charts.distance} options={{ maintainAspectRatio: false }} />
          </div>
        </div>

        {/* Year Chart */}
        <div className="bg-white p-5 rounded-xl shadow-md cursor-pointer hover:shadow-xl transition-shadow border border-transparent hover:border-blue-500 group"
             onClick={() => setSelectedChart('year')}>
           <div className="flex justify-between items-center mb-4">
            <h3 className="font-semibold text-gray-700">Year Distribution</h3>
            <span className="text-xs text-blue-500 opacity-0 group-hover:opacity-100">Click to Enlarge 🔍</span>
          </div>
          <div className="h-64">
            <Bar data={charts.year} options={{ maintainAspectRatio: false }} />
          </div>
        </div>

      </div>

      {/* 3. The Large Modal */}
      {renderLargeChart()}

    </div>
  );
};

export default AnalyticsDashboard;