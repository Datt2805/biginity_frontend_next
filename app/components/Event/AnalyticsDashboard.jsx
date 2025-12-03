"use client";
import React, { useEffect, useMemo, useState, useCallback } from "react";
import { getAllAttendances, hostSocket } from "../../../lib/api"; 
import { initSocket } from "../../../lib/api"; // Your SDK
import { Chart as ChartJS, CategoryScale, LinearScale, BarElement, Title, Tooltip, Legend, ArcElement } from "chart.js";
import { Bar, Pie, Doughnut } from "react-chartjs-2";
import ChartDataLabels from "chartjs-plugin-datalabels";

// SHARED LOGIC
import { processAttendanceData, ACADEMIC_STRUCTURE, COLORS, asId } from "../../../lib/api/utils";

ChartJS.register(CategoryScale, LinearScale, BarElement, Title, Tooltip, Legend, ArcElement, ChartDataLabels);

// --- UI COMPONENTS ---
const StatCard = React.memo(({ title, value, subtext, color = "blue" }) => (
    <div className={`bg-white p-4 rounded-xl shadow-sm border-l-4 border-${color}-500 transition-all duration-300`}>
        <p className="text-gray-500 text-xs uppercase font-bold">{title}</p>
        <div className="flex items-end justify-between mt-1">
            <h3 className="text-2xl font-bold text-gray-800">{value}</h3>
            {subtext && <span className="text-xs text-gray-400 mb-1">{subtext}</span>}
        </div>
    </div>
));

const LiveIndicator = ({ isLive }) => (
    <div className={`flex items-center gap-2 px-3 py-1 rounded-full text-xs font-bold border ${isLive ? 'bg-emerald-50 text-emerald-600 border-emerald-200' : 'bg-gray-50 text-gray-400 border-gray-200'}`}>
        <span className={`relative flex h-2 w-2`}>
          {isLive && <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>}
          <span className={`relative inline-flex rounded-full h-2 w-2 ${isLive ? 'bg-emerald-500' : 'bg-gray-400'}`}></span>
        </span>
        {isLive ? 'LIVE' : 'OFFLINE'}
    </div>
);

const AnalyticsDashboard = () => {
  const [rawData, setRawData] = useState([]);
  const [events, setEvents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isLive, setIsLive] = useState(false);
  const [filters, setFilters] = useState({ event: "", school: "", degree: "", stream: "", year: "" });

  // --- 1. ZERO LOAD UPDATE FUNCTION ---
  // This logic runs INSTANTLY when socket data comes in.
  // It avoids re-fetching API.
  const handleSocketUpdate = useCallback((newRecord) => {
    if (!newRecord) return;

    // A. Process ONLY the single new record (O(1) operation - Super Fast)
    const [processedRecord] = processAttendanceData([newRecord]);

    setRawData((prevData) => {
        // B. Find if record exists (Is this a Punch OUT update?)
        const index = prevData.findIndex(item => item._id === processedRecord._id);
        
        if (index > -1) {
            // C. UPDATE EXISTING: Replace the old row with new data
            const updatedList = [...prevData];
            updatedList[index] = processedRecord;
            return updatedList;
        } else {
            // D. ADD NEW: Punch IN (Add to top of list)
            return [processedRecord, ...prevData];
        }
    });
  }, []);

  // --- 2. DATA LOAD & SOCKET SETUP ---
  useEffect(() => {
    const initDataAndSocket = async () => {
      try {
        // A. Load Initial Data (Only once on page load)
        const [eventRes, attendanceRes] = await Promise.all([
             fetch(`${hostSocket}/api/events`),
             new Promise(resolve => getAllAttendances({}, resolve))
        ]);
        
        const eventData = await eventRes.json();
        setEvents(eventData.events || []);
        const raw = Array.isArray(attendanceRes?.data) ? attendanceRes.data : [];

        // B. Connect Socket using your SDK
        // We pass 'handleSocketUpdate' so it updates state directly
        new initSocket({
            connectionCallback: () => {
                setIsLive(true);
                console.log("Socket Connected");
            },
            punchInCallback: (data) => {
                console.log("⚡ Punch In (No Load)");
                handleSocketUpdate(data); 
            },
            punchOutCallback: (data) => {
                console.log("⚡ Punch Out (No Load)");
                handleSocketUpdate(data);
            },
            newMessageCallback: () => {},
            successCallback: () => {},
            errorCallback: (e) => console.error(e),
            attendanceStartedCallback: () => {}
        });

        // Force Live status if singleton exists
        if (initSocket.instance) setIsLive(true);

        // C. Process initial bulk data (The only "heavy" part, runs once)
        setTimeout(() => {
            const processed = processAttendanceData(raw);
            setRawData(processed);
            setLoading(false);
        }, 50);

      } catch (e) { 
          console.error("Init Error:", e); 
          setLoading(false); 
      } 
    };

    initDataAndSocket();
  }, [handleSocketUpdate]);

  // --- 3. FILTERING & STATS (Calculated automatically from rawData) ---
  // When 'rawData' updates via socket, these recalculate instantly without API calls
  
  const options = useMemo(() => {
    const schools = Object.keys(ACADEMIC_STRUCTURE["school-branch"]);
    let degrees = filters.school ? ACADEMIC_STRUCTURE["school-branch"][filters.school] : schools.flatMap(s => ACADEMIC_STRUCTURE["school-branch"][s]);
    let streams = (filters.degree && ACADEMIC_STRUCTURE["branch-stream"][filters.degree]) ? ACADEMIC_STRUCTURE["branch-stream"][filters.degree] : [];
    return {
        events: events,
        schools: schools.map(s => ({ _id: s, title: s })),
        degrees: [...new Set(degrees)].map(d => ({ _id: d, title: d })),
        streams: [...new Set(streams)].map(s => ({ _id: s, title: s }))
    };
  }, [filters.school, filters.degree, events]);

  const filteredData = useMemo(() => {
    return rawData.filter(r => {
      return (!filters.event || r._eventId === filters.event) &&
             (!filters.school || r._school === filters.school) &&
             (!filters.degree || r._degree === filters.degree) &&
             (!filters.stream || r._stream === filters.stream) &&
             (!filters.year || r._year.includes(filters.year));
    });
  }, [rawData, filters]);

  const stats = useMemo(() => {
    const initial = {
        status: {}, school: {}, degree: {}, stream: {}, distance: { valid: 0, invalid: 0, unknown: 0 },
        total: 0, present: 0
    };
    const agg = filteredData.reduce((acc, curr) => {
        acc.total++;
        if (curr.status === "Present") acc.present++;
        acc.status[curr.status || "Unknown"] = (acc.status[curr.status || "Unknown"] || 0) + 1;
        acc.school[curr._school] = (acc.school[curr._school] || 0) + 1;
        acc.degree[curr._degree] = (acc.degree[curr._degree] || 0) + 1;
        acc.stream[curr._stream] = (acc.stream[curr._stream] || 0) + 1;
        if (curr._dist === null) acc.distance.unknown++;
        else if (curr._distValid) acc.distance.valid++;
        else acc.distance.invalid++;
        return acc;
    }, initial);

    const toChartData = (obj, colorArr) => {
        const labels = Object.keys(obj).sort((a,b) => obj[b] - obj[a]);
        return {
            labels, datasets: [{ data: labels.map(k => obj[k]), backgroundColor: colorArr, borderRadius: 4, barPercentage: 0.6 }]
        };
    };
    return {
        metrics: { total: agg.total, present: agg.present, percentage: agg.total > 0 ? ((agg.present / agg.total) * 100).toFixed(1) : "0.0" },
        charts: {
            status: toChartData(agg.status, [COLORS.status.present, COLORS.status.absent, COLORS.status.late, COLORS.status.exc]),
            school: toChartData(agg.school, COLORS.primary),
            degree: toChartData(agg.degree, COLORS.primary[1]),
            stream: toChartData(agg.stream, "#0EA5E9"),
            distance: { labels: ["In Range (≤500m)", "Out of Range (>500m)", "Unknown"], datasets: [{ data: [agg.distance.valid, agg.distance.invalid, agg.distance.unknown], backgroundColor: COLORS.geo, borderWidth: 0 }] }
        }
    };
  }, [filteredData]);

  // --- CHART CONFIG ---
  const getChartConfig = (title, type) => ({
    responsive: true, maintainAspectRatio: false, indexAxis: type === 'horizontal' ? 'y' : 'x',
    plugins: {
        legend: { display: type === 'pie' || type === 'doughnut', position: 'right' },
        title: { display: !!title, text: title },
        datalabels: { color: type === 'pie' ? '#fff' : '#374151', font: { weight: 'bold' }, formatter: v => v > 0 ? v : "" }
    },
    scales: (type === 'pie' || type === 'doughnut') ? { x: { display: false }, y: { display: false } } : 
    { x: { grid: { display: false } }, y: { grid: { color: '#f3f4f6' }, beginAtZero: true } }
  });

  return (
    <div className="p-6 bg-slate-50 min-h-screen font-sans">
      {loading ? (
        <div className="flex items-center justify-center h-screen"><div className="w-12 h-12 bg-blue-200 rounded-full animate-pulse"></div></div>
      ) : (
        <div className="animate-in fade-in duration-500">
          <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-8 gap-4">
            <div>
                 <h1 className="text-3xl font-bold text-slate-800">Academic Analytics</h1>
                 <p className="text-sm font-medium text-slate-600">Real-time attendance insights</p>
            </div>
            <div className="flex items-center gap-4">
                 <LiveIndicator isLive={isLive} />
                 <div className="text-right hidden md:block">
                    <p className="text-xs font-bold text-slate-400 uppercase">Last Updated</p>
                    <p className="text-sm font-medium text-slate-600">{new Date().toLocaleTimeString()}</p>
                 </div>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
            <StatCard title="Total Records" value={stats.metrics.total} color="blue" />
            <StatCard title="Presence" value={`${stats.metrics.percentage}%`} color="emerald" />
            <StatCard title="Location Valid" value={stats.charts.distance.datasets[0].data[0]} color="purple" />
            <StatCard title="Departments" value={stats.charts.degree.labels.length} color="amber" />
          </div>

          <div className="bg-white p-4 rounded-xl shadow-sm border mb-6 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-3">
             <select className="border p-2 rounded" value={filters.event} onChange={e=>setFilters(p=>({...p, event: e.target.value}))}><option value="">All Events</option>{options.events.map(e=><option key={asId(e)} value={asId(e)}>{e.title}</option>)}</select>
             <select className="border p-2 rounded" value={filters.school} onChange={e=>setFilters(p=>({...p, school: e.target.value, degree: "", stream: ""}))}><option value="">All Schools</option>{options.schools.map(s=><option key={s._id} value={s._id}>{s.title}</option>)}</select>
             <select className="border p-2 rounded" disabled={!filters.school} value={filters.degree} onChange={e=>setFilters(p=>({...p, degree: e.target.value, stream: ""}))}><option value="">All Degrees</option>{options.degrees.map(d=><option key={d._id} value={d._id}>{d.title}</option>)}</select>
             <input className="border p-2 rounded" placeholder="Year" value={filters.year} onChange={e=>setFilters(p=>({...p, year: e.target.value}))} />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
             <div className="bg-white p-5 rounded-xl shadow h-80"><Pie data={stats.charts.status} options={getChartConfig('Attendance Status', 'pie')} /></div>
             <div className="bg-white p-5 rounded-xl shadow h-80"><Bar data={stats.charts.school} options={getChartConfig('School Distribution', 'bar')} /></div>
             <div className="bg-white p-5 rounded-xl shadow h-80"><Doughnut data={stats.charts.distance} options={getChartConfig('Location Validity', 'doughnut')} /></div>
             <div className="bg-white p-5 rounded-xl shadow h-80 md:col-span-2"><Bar data={stats.charts.stream} options={getChartConfig('Stream Breakdown', 'horizontal')} /></div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AnalyticsDashboard;