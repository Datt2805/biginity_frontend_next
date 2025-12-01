"use client";
import React, { useEffect, useMemo, useState, useRef, useCallback } from "react";
// Ensure these are imported correctly from your project structure
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

// --- 1. SETUP ---
ChartJS.register(CategoryScale, LinearScale, BarElement, Title, Tooltip, Legend, ArcElement, ChartDataLabels);

// --- 2. CONFIGURATION ---
const ACADEMIC_STRUCTURE = {
  "school-branch": {
    "School of Technology": ["B.Tech.", "BCA"],
    "School of Science": ["B.Sc."],
    "School of Management Studies and Liberal Arts": ["B.Com.", "BBA"]
  },
  "branch-stream": {
    "B.Tech.": [
        "Chemical", "Chemical D2D", 
        "Computer Science & Engg.", "Computer Science & Engg. D2D", 
        "Fire & EHS", "Fire & EHS. D2D"
    ],
    "BCA": ["General"],
    "B.Sc.": [
        "Biotechnology", "Chemistry", "Data Science", "Micro Biology"
    ],
    "B.Com.": ["/ B.Com (Hons.)"],
    "BBA": [
        "Business Analytics", "HR / Marketing /Accounting & Finance / IT Mg"
    ]
  }
};

const COLORS = {
    primary: ["#3B82F6", "#8B5CF6", "#EC4899", "#F59E0B", "#10B981"], 
    status: { present: "#10B981", absent: "#EF4444", late: "#F59E0B", exc: "#3B82F6" },
    geo: ["#10B981", "#EF4444", "#9CA3AF"]
};

// --- 3. HELPERS ---
const asId = (obj) => (obj && typeof obj === "object" ? obj._id : obj) || "";

const getNested = (obj, path, fallback) => {
  try { return path.split(".").reduce((o, k) => (o ? o[k] : undefined), obj) ?? fallback; } catch { return fallback; }
};

const getDistanceInMeters = (lat1, lon1, lat2, lon2) => {
  if (!lat1 || !lon1 || !lat2 || !lon2) return null;
  const toRad = (v) => (v * Math.PI) / 180;
  const R = 6371e3;
  const a = Math.sin(toRad(lat2 - lat1) / 2) ** 2 + Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.sin(toRad(lon2 - lon1) / 2) ** 2;
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
};

const classifyBranch = (rawBranch) => {
  if (!rawBranch) return { school: "Other", degree: "Other", stream: "Unknown" };
  const normalized = rawBranch.trim();
  
  for (const [school, degrees] of Object.entries(ACADEMIC_STRUCTURE["school-branch"])) {
    for (const degree of degrees) {
      if (normalized.includes(degree)) {
        let stream = normalized.replace(degree, "").replace(/^[\.\/\-\s]+/, "").trim();
        
        // Validate Stream against known list for better grouping
        if (ACADEMIC_STRUCTURE["branch-stream"][degree]) {
             const match = ACADEMIC_STRUCTURE["branch-stream"][degree].find(s => 
                 stream.toLowerCase().includes(s.toLowerCase()) || s.toLowerCase().includes(stream.toLowerCase())
             );
             if (match) stream = match;
        }
        return { school, degree, stream: stream || "General" };
      }
    }
  }
  return { school: "Other", degree: "Other", stream: normalized };
};

// --- 4. UI COMPONENTS ---

// Memoized Stat Card for KPI Section
const StatCard = React.memo(({ title, value, subtext, color = "blue" }) => (
    <div className={`bg-white p-4 rounded-xl shadow-sm border-l-4 border-${color}-500 hover:shadow-md transition-shadow`}>
        <p className="text-gray-500 text-xs uppercase font-bold tracking-wider">{title}</p>
        <div className="flex items-end justify-between mt-1">
            <h3 className="text-2xl font-bold text-gray-800">{value}</h3>
            {subtext && <span className="text-xs text-gray-400 mb-1">{subtext}</span>}
        </div>
    </div>
));

// Memoized Dropdown
const SearchableDropdown = React.memo(({ options, value, onChange, placeholder = "Select Item", disabled = false }) => {
  const [isOpen, setIsOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const wrapperRef = useRef(null);

  useEffect(() => {
    const clickOut = (e) => { if (wrapperRef.current && !wrapperRef.current.contains(e.target)) setIsOpen(false); };
    document.addEventListener("mousedown", clickOut);
    return () => document.removeEventListener("mousedown", clickOut);
  }, []);

  const filtered = useMemo(() => options.filter(o => o.title.toLowerCase().includes(searchTerm.toLowerCase())), [options, searchTerm]);
  const label = options.find(o => asId(o) === value)?.title || placeholder;

  return (
    <div className={`relative w-full ${disabled ? 'opacity-60 pointer-events-none' : ''}`} ref={wrapperRef}>
      <div 
        className="border border-gray-200 p-2.5 rounded-lg bg-white cursor-pointer flex justify-between items-center h-[42px] hover:border-blue-400 transition-colors"
        onClick={() => { setIsOpen(!isOpen); setSearchTerm(""); }}
      >
        <span className={`truncate text-sm ${!value ? "text-gray-400" : "text-gray-700 font-medium"}`}>{label}</span>
        <span className="text-gray-400 text-xs">▼</span>
      </div>
      {isOpen && (
        <div className="absolute top-full left-0 right-0 mt-1 bg-white border border-gray-100 rounded-lg shadow-xl z-50 max-h-60 overflow-hidden flex flex-col animate-in fade-in zoom-in duration-75">
          <input autoFocus type="text" placeholder="Search..." className="p-2 border-b w-full outline-none text-sm bg-gray-50 text-gray-700" value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} />
          <div className="overflow-y-auto">
            <div className="p-2 hover:bg-red-50 cursor-pointer text-red-500 text-xs font-bold border-b" onClick={() => { onChange(""); setIsOpen(false); }}>RESET SELECTION</div>
            {filtered.length > 0 ? (
              filtered.map(opt => (
                <div key={asId(opt)} className={`p-2 text-sm hover:bg-blue-50 cursor-pointer truncate ${asId(opt) === value ? "bg-blue-50 text-blue-700 font-semibold" : "text-gray-600"}`} onClick={() => { onChange(asId(opt)); setIsOpen(false); }}>
                  {opt.title}
                </div>
              ))
            ) : (<div className="p-2 text-gray-400 text-xs text-center">No results</div>)}
          </div>
        </div>
      )}
    </div>
  );
});

// --- 5. MAIN DASHBOARD ---
const AnalyticsDashboard = () => {
  const [rawData, setRawData] = useState([]);
  const [events, setEvents] = useState([]);
  const [loading, setLoading] = useState(true);

  // Filters
  const [filters, setFilters] = useState({ event: "", school: "", degree: "", stream: "", year: "" });
  const [selectedChart, setSelectedChart] = useState(null);

  // Helper to update filters
  const updateFilter = useCallback((key, value) => {
    setFilters(prev => {
        const next = { ...prev, [key]: value };
        // Reset cascading filters
        if (key === 'school') { next.degree = ""; next.stream = ""; }
        if (key === 'degree') { next.stream = ""; }
        return next;
    });
  }, []);

  // --- A. Data Fetching ---
  useEffect(() => {
    const fetchData = async () => {
      try {
        const [eventRes, attendanceRes] = await Promise.all([
             fetch(`${hostSocket}/api/events`),
             new Promise(resolve => getAllAttendances({}, resolve)) // Wrap callback in promise
        ]);
        
        const eventData = await eventRes.json();
        setEvents(eventData.events || []);

        const raw = Array.isArray(attendanceRes?.data) ? attendanceRes.data : [];
        // Pre-process data once
        const processed = raw.map(r => {
            const rawBranch = (r.branch || getNested(r, "user_id.branch", "Unknown"));
            const { school, degree, stream } = classifyBranch(rawBranch);
            return {
                ...r, school, degree, stream,
                year: (r.year || getNested(r, "user_id.year", "Unknown")).toString(),
                eventId: asId(r.event_id),
                dist: getDistanceInMeters(r.locations?.[0]?.lat, r.locations?.[0]?.long, r.locations?.at(-1)?.lat, r.locations?.at(-1)?.long)
            };
        });
        setRawData(processed);
      } catch (e) { console.error("Data Load Error:", e); } 
      finally { setLoading(false); }
    };
    fetchData();
  }, []);

  // --- B. Derived Data (Performance Optimized) ---
  
  // 1. Dynamic Dropdown Options
  const options = useMemo(() => {
    const schools = Object.keys(ACADEMIC_STRUCTURE["school-branch"]);
    
    let degrees = [];
    if (filters.school) degrees = ACADEMIC_STRUCTURE["school-branch"][filters.school] || [];
    else schools.forEach(s => degrees.push(...ACADEMIC_STRUCTURE["school-branch"][s]));

    let streams = [];
    if (filters.degree && ACADEMIC_STRUCTURE["branch-stream"][filters.degree]) {
        streams = ACADEMIC_STRUCTURE["branch-stream"][filters.degree];
    }

    return {
        events: events,
        schools: schools.map(s => ({ _id: s, title: s })),
        degrees: [...new Set(degrees)].map(d => ({ _id: d, title: d })),
        streams: [...new Set(streams)].map(s => ({ _id: s, title: s }))
    };
  }, [filters.school, filters.degree, events]);

  // 2. Filter Logic
  const filteredData = useMemo(() => {
    return rawData.filter(r => {
      return (!filters.event || r.eventId === filters.event) &&
             (!filters.school || r.school === filters.school) &&
             (!filters.degree || r.degree === filters.degree) &&
             (!filters.stream || r.stream === filters.stream) &&
             (!filters.year || r.year.includes(filters.year));
    });
  }, [rawData, filters]);

  // 3. Single-Pass Aggregation (Super Fast)
  const stats = useMemo(() => {
    const initial = {
        status: {}, school: {}, degree: {}, stream: {}, distance: { valid: 0, invalid: 0, unknown: 0 },
        total: 0, present: 0
    };

    const agg = filteredData.reduce((acc, curr) => {
        acc.total++;
        if (curr.status === "Present") acc.present++;

        // Count for Charts
        acc.status[curr.status || "Unknown"] = (acc.status[curr.status || "Unknown"] || 0) + 1;
        acc.school[curr.school] = (acc.school[curr.school] || 0) + 1;
        acc.degree[curr.degree] = (acc.degree[curr.degree] || 0) + 1;
        acc.stream[curr.stream] = (acc.stream[curr.stream] || 0) + 1;

        // Distance Logic Changed to 500m
        if (curr.dist === null) acc.distance.unknown++;
        else if (curr.dist <= 500) acc.distance.valid++; // Changed from 15 to 500
        else acc.distance.invalid++;
        
        return acc;
    }, initial);

    // Helper to format for ChartJS
    const toChartData = (obj, colorArr) => {
        const labels = Object.keys(obj).sort((a,b) => obj[b] - obj[a]); // Sort Descending
        return {
            labels,
            datasets: [{
                data: labels.map(k => obj[k]),
                backgroundColor: typeof colorArr === 'function' ? (ctx) => colorArr(ctx, labels) : colorArr,
                borderRadius: 4,
                barPercentage: 0.6
            }]
        };
    };

    return {
        metrics: {
            total: agg.total,
            present: agg.present,
            percentage: agg.total > 0 ? ((agg.present / agg.total) * 100).toFixed(1) : "0.0"
        },
        charts: {
            status: toChartData(agg.status, [COLORS.status.present, COLORS.status.absent, COLORS.status.late, COLORS.status.exc]),
            school: toChartData(agg.school, COLORS.primary),
            degree: toChartData(agg.degree, COLORS.primary[1]),
            stream: toChartData(agg.stream, (ctx, labels) => {
                 const label = labels[ctx.dataIndex] || "";
                 return label.includes("D2D") ? "#F97316" : "#0EA5E9"; // Orange for D2D, Blue for others
            }),
            distance: {
                // Updated Labels to reflect 500m
                labels: ["In Range (≤500m)", "Out of Range (>500m)", "Unknown"],
                datasets: [{ data: [agg.distance.valid, agg.distance.invalid, agg.distance.unknown], backgroundColor: COLORS.geo, borderWidth: 0 }]
            }
        }
    };
  }, [filteredData]);

  // --- C. Rendering ---
  const getChartConfig = (title, type) => ({
    responsive: true, 
    maintainAspectRatio: false,
    indexAxis: type === 'horizontal' ? 'y' : 'x',
    plugins: {
        legend: { display: type === 'pie' || type === 'doughnut', position: 'right', labels: { boxWidth: 10, usePointStyle: true } },
        title: { display: !!title, text: title, font: { size: 14, weight: 'bold' } },
        datalabels: {
            color: type === 'pie' || type === 'doughnut' ? '#fff' : '#374151',
            font: { weight: 'bold', size: 10 },
            anchor: type === 'horizontal' ? 'end' : 'end',
            align: type === 'horizontal' ? 'end' : 'top',
            formatter: v => v > 0 ? v : ""
        }
    },
    scales: (type === 'pie' || type === 'doughnut') ? { x: { display: false }, y: { display: false } } : 
    { x: { grid: { display: false }, ticks: { display: type !== 'horizontal' } }, y: { grid: { color: '#f3f4f6' }, beginAtZero: true } }
  });

  const renderModal = () => {
    if (!selectedChart) return null;
    const { key, title, type } = selectedChart;
    const ChartComp = type === 'horizontal' || type === 'bar' ? Bar : (type === 'doughnut' ? Doughnut : Pie);
    
    return (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/70 backdrop-blur-sm p-4 animate-in fade-in duration-200" onClick={() => setSelectedChart(null)}>
            <div className="bg-white p-6 rounded-2xl shadow-2xl w-full max-w-6xl h-[80vh] flex flex-col" onClick={e => e.stopPropagation()}>
                <div className="flex justify-between items-center mb-4 border-b pb-4">
                    <h3 className="text-xl font-bold text-gray-800">{title}</h3>
                    <button onClick={() => setSelectedChart(null)} className="p-2 hover:bg-gray-100 rounded-full text-gray-500">✕</button>
                </div>
                <div className="flex-grow relative">
                    <ChartComp data={stats.charts[key]} options={getChartConfig(null, type)} />
                </div>
            </div>
        </div>
    );
  };

  if (loading) return (
    <div className="flex items-center justify-center min-h-screen bg-slate-50">
        <div className="flex flex-col items-center animate-pulse">
            <div className="w-12 h-12 bg-blue-200 rounded-full mb-3"></div>
            <div className="h-4 w-32 bg-gray-200 rounded"></div>
        </div>
    </div>
  );

  return (
    <div className="p-6 bg-slate-50 min-h-screen font-sans">
      
      {/* HEADER */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-8 gap-4">
        <div>
            <h1 className="text-3xl font-bold text-slate-800 tracking-tight">Academic Analytics</h1>
            <p className="text-slate-500 text-sm mt-1">Real-time attendance insights & demographics</p>
        </div>
        <div className="text-right hidden md:block">
            <p className="text-xs font-bold text-slate-400 uppercase">Last Updated</p>
            <p className="text-sm font-medium text-slate-600">{new Date().toLocaleTimeString()}</p>
        </div>
      </div>

      {/* KPI CARDS (Updated Subtext) */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        <StatCard title="Total Records" value={stats.metrics.total} subtext="Filtered students" color="blue" />
        <StatCard title="Presence" value={`${stats.metrics.percentage}%`} subtext={`${stats.metrics.present} Present`} color="emerald" />
        <StatCard title="Location Valid" value={stats.charts.distance.datasets[0].data[0]} subtext="In 500m Range" color="purple" />
        <StatCard title="Departments" value={stats.charts.degree.labels.length} subtext="Active Degrees" color="amber" />
      </div>

      {/* FILTERS */}
      <div className="bg-white p-4 rounded-xl shadow-sm border border-slate-200 mb-6 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-3">
        <SearchableDropdown options={options.events} value={filters.event} onChange={v => updateFilter('event', v)} placeholder="All Events" />
        <SearchableDropdown options={options.schools} value={filters.school} onChange={v => updateFilter('school', v)} placeholder="All Schools" />
        <SearchableDropdown options={options.degrees} value={filters.degree} onChange={v => updateFilter('degree', v)} placeholder="All Degrees" disabled={!filters.school} />
        <SearchableDropdown options={options.streams} value={filters.stream} onChange={v => updateFilter('stream', v)} placeholder="All Streams" disabled={!filters.degree} />
        <input 
            className="border border-gray-200 p-2.5 rounded-lg text-sm w-full outline-none focus:border-blue-400 bg-white"
            placeholder="Year (e.g. 2025)" value={filters.year} onChange={e => updateFilter('year', e.target.value)} 
        />
      </div>

      {/* CHARTS GRID */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {[
            { key: 'status', title: 'Attendance Status', type: 'pie' },
            { key: 'school', title: 'School Distribution', type: 'bar' },
            { key: 'degree', title: 'Degree Distribution', type: 'bar' },
            { key: 'distance', title: 'Location Validity', type: 'doughnut' }
        ].map(c => (
            <div key={c.key} onClick={() => setSelectedChart(c)} className="bg-white p-5 rounded-xl shadow-sm border border-slate-100 hover:shadow-lg transition-all cursor-pointer group flex flex-col h-80">
                <div className="flex justify-between mb-2">
                    <h3 className="font-semibold text-slate-700">{c.title}</h3>
                    <span className="text-xs text-blue-500 bg-blue-50 px-2 py-1 rounded opacity-0 group-hover:opacity-100 transition-opacity">Expand</span>
                </div>
                <div className="flex-grow relative">
                    {c.type === 'pie' && <Pie data={stats.charts[c.key]} options={getChartConfig(null, 'pie')} />}
                    {c.type === 'doughnut' && <Doughnut data={stats.charts[c.key]} options={getChartConfig(null, 'doughnut')} />}
                    {c.type === 'bar' && <Bar data={stats.charts[c.key]} options={getChartConfig(null, 'bar')} />}
                </div>
            </div>
        ))}

        {/* Full Width Stream Chart */}
        <div onClick={() => setSelectedChart({ key: 'stream', title: 'Stream Analysis', type: 'horizontal' })} className="bg-white p-5 rounded-xl shadow-sm border border-slate-100 hover:shadow-lg transition-all cursor-pointer group md:col-span-2 h-80 flex flex-col">
            <div className="flex justify-between mb-2">
                <h3 className="font-semibold text-slate-700">Detailed Stream Breakdown</h3>
                <span className="text-xs text-blue-500 bg-blue-50 px-2 py-1 rounded opacity-0 group-hover:opacity-100 transition-opacity">Expand</span>
            </div>
            <div className="flex-grow relative">
                <Bar data={stats.charts.stream} options={getChartConfig(null, 'horizontal')} />
            </div>
        </div>
      </div>

      {renderModal()}
    </div>
  );
};

export default AnalyticsDashboard;