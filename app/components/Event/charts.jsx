"use client";
import React, { useEffect, useMemo, useState } from "react";
import { getAllAttendances, hostSocket } from "../../../lib/api"; 
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
import ChartDataLabels from "chartjs-plugin-datalabels";

ChartJS.register(
  CategoryScale, 
  LinearScale, 
  BarElement, 
  Title, 
  Tooltip, 
  Legend, 
  ArcElement, 
  ChartDataLabels
);

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

  const [filterEvent, setFilterEvent] = useState("");
  const [filterBranch, setFilterBranch] = useState("");
  const [filterYear, setFilterYear] = useState("");

  const [selectedChart, setSelectedChart] = useState(null);

  // 1. Fetch Data
  useEffect(() => {
    const init = async () => {
      try {
        const eRes = await fetch(`${hostSocket}/api/events`);
        const eData = await eRes.json();
        setEvents(eData.events || []);

        await getAllAttendances({}, (res) => {
          const raw = Array.isArray(res?.data) ? res.data : [];
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

    const status = count(d => d.status || "Unknown");
    const branch = count(d => d.branch);
    const year = count(d => d.year);
    
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

  // --- 4. Define Chart Options (UPDATED FOR BETTER VISIBILITY) ---
  const getChartOptions = (title, showAxes = false) => ({
    responsive: true,
    maintainAspectRatio: false,
    layout: {
      padding: {
        top: showAxes ? 20 : 0 // Add padding on top for bar charts so labels don't get cut off
      }
    },
    plugins: {
      legend: { position: 'top', labels: { font: { size: 12 } } },
      title: { display: !!title, text: title, font: { size: 16 } },
      datalabels: {
        // --- UPDATED COLOR LOGIC ---
        // If showing axes (Bar chart), use dark color. Otherwise (Pie), use white.
        color: showAxes ? '#555555' : '#ffffff', 
        font: { weight: 'bold', size: 11 },
        // --- UPDATED POSITION LOGIC ---
        // If Bar chart, anchor at the 'end' and align to the 'top' (pushes it outside).
        // If Pie chart, center it.
        anchor: showAxes ? 'end' : 'center',
        align: showAxes ? 'top' : 'center',
        offset: showAxes ? 4 : 0, // Add small space between bar and number
        
        formatter: (value, ctx) => {
          let sum = 0;
          let dataArr = ctx.chart.data.datasets[0].data;
          dataArr.map(data => { sum += data; });
          if (sum === 0) return "";
          let percentage = (value * 100 / sum).toFixed(1) + "%";
          
          // Lowered threshold to 2% so more labels show up on bar charts
          return (value * 100 / sum) > 2 ? percentage : ""; 
        },
      }
    },
    scales: showAxes ? {
      x: { 
        display: true, 
        grid: { display: false }, // Hiding vertical grid lines for cleaner look
        ticks: { autoSkip: false, maxRotation: 90, minRotation: 45 } // Ensure labels don't overlap
      },
      y: { 
        display: true, 
        beginAtZero: true,
        grid: { display: true, color: '#f0f0f0' } 
      }
    } : {
      x: { display: false },
      y: { display: false }
    }
  });

  const renderLargeChart = () => {
    if (!selectedChart) return null;
    
    const isBar = selectedChart === 'branch' || selectedChart === 'year';
    const largeOptions = getChartOptions(selectedChart.toUpperCase() + " ANALYSIS", isBar);
    // Make font slightly larger for modal
    largeOptions.plugins.datalabels.font.size = 13; 

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
        <div className="bg-white p-8 rounded-xl shadow-2xl w-full max-w-5xl h-[85vh] relative flex flex-col"
             onClick={e => e.stopPropagation()}>
          <button onClick={() => setSelectedChart(null)}
            className="absolute top-4 right-4 text-gray-500 hover:text-red-500 text-2xl font-bold">
            &times;
          </button>
          <div className="flex-grow pt-4">
            <ChartComp data={chartData} options={largeOptions} />
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
      
      {/* Header & Filters */}
      <div className="bg-white p-4 rounded-lg shadow mb-6">
        <h2 className="text-2xl font-bold mb-4 text-gray-800">📊 Attendance Analytics</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <select className="border p-2 rounded" value={filterEvent} onChange={e => setFilterEvent(e.target.value)}>
            <option value="">All Events</option>
            {events.map(e => <option key={asId(e)} value={asId(e)}>{e.title}</option>)}
          </select>
          <input 
            placeholder="Filter by Branch (e.g. CSE)" 
            className="border p-2 rounded"
            value={filterBranch} onChange={e => setFilterBranch(e.target.value)} 
          />
           <input 
            placeholder="Filter by Year (e.g. 2025)" 
            className="border p-2 rounded"
            value={filterYear} onChange={e => setFilterYear(e.target.value)} 
          />
        </div>
        <p className="mt-2 text-sm text-gray-500 text-right">Showing {filteredData.length} records</p>
      </div>

      {/* Charts Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        
        {/* Status Chart (Pie - White Text inside) */}
        <div className="bg-white p-5 rounded-xl shadow-md cursor-pointer hover:shadow-xl transition-shadow border border-transparent hover:border-blue-500 group"
             onClick={() => setSelectedChart('status')}>
          <div className="flex justify-between items-center mb-4">
            <h3 className="font-semibold text-gray-700">Attendance Status</h3>
            <span className="text-xs text-blue-500 opacity-0 group-hover:opacity-100">Click to Enlarge 🔍</span>
          </div>
          <div className="h-64 flex justify-center">
            <Pie data={charts.status} options={getChartOptions(null, false)} />
          </div>
        </div>

        {/* Branch Chart (Bar - Dark text outside) */}
        <div className="bg-white p-5 rounded-xl shadow-md cursor-pointer hover:shadow-xl transition-shadow border border-transparent hover:border-blue-500 group"
             onClick={() => setSelectedChart('branch')}>
          <div className="flex justify-between items-center mb-4">
            <h3 className="font-semibold text-gray-700">Branch Distribution</h3>
            <span className="text-xs text-blue-500 opacity-0 group-hover:opacity-100">Click to Enlarge 🔍</span>
          </div>
          <div className="h-64">
            <Bar data={charts.branch} options={getChartOptions(null, true)} />
          </div>
        </div>

        {/* Distance Chart (Doughnut - White text inside) */}
        <div className="bg-white p-5 rounded-xl shadow-md cursor-pointer hover:shadow-xl transition-shadow border border-transparent hover:border-blue-500 group"
             onClick={() => setSelectedChart('distance')}>
           <div className="flex justify-between items-center mb-4">
            <h3 className="font-semibold text-gray-700">Location Accuracy</h3>
            <span className="text-xs text-blue-500 opacity-0 group-hover:opacity-100">Click to Enlarge 🔍</span>
          </div>
          <div className="h-64 flex justify-center">
            <Doughnut data={charts.distance} options={getChartOptions(null, false)} />
          </div>
        </div>

        {/* Year Chart (Bar - Dark text outside) */}
        <div className="bg-white p-5 rounded-xl shadow-md cursor-pointer hover:shadow-xl transition-shadow border border-transparent hover:border-blue-500 group"
             onClick={() => setSelectedChart('year')}>
           <div className="flex justify-between items-center mb-4">
            <h3 className="font-semibold text-gray-700">Year Distribution</h3>
            <span className="text-xs text-blue-500 opacity-0 group-hover:opacity-100">Click to Enlarge 🔍</span>
          </div>
          <div className="h-64">
            <Bar data={charts.year} options={getChartOptions(null, true)} />
          </div>
        </div>

      </div>

      {/* Large Modal */}
      {renderLargeChart()}

    </div>
  );
};

export default AnalyticsDashboard;