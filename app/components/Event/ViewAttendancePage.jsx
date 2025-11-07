"use client";
import React, { useEffect, useMemo, useState } from "react";
import { getAllAttendances, hostSocket } from "../../../lib/api";

const safeDate = (dt) => {
  try {
    if (!dt) return null;
    const d = new Date(dt);
    return isNaN(d.getTime()) ? null : d;
  } catch {
    return null;
  }
};

const asId = (maybeObjOrId) => {
  if (!maybeObjOrId) return "";
  if (typeof maybeObjOrId === "string") return maybeObjOrId;
  return maybeObjOrId._id || "";
};

const getNested = (obj, path, fallback = undefined) => {
  try {
    return path.split(".").reduce((o, k) => (o ? o[k] : undefined), obj) ?? fallback;
  } catch {
    return fallback;
  }
};

const getDistanceInMeters = (lat1, lon1, lat2, lon2) => {
  const toRad = (v) => (v * Math.PI) / 180;
  if ([lat1, lon1, lat2, lon2].some(
    (v) => v === null || v === undefined || Number.isNaN(Number(v))
  )) return null;

  const R = 6371e3;
  const φ1 = toRad(Number(lat1));
  const φ2 = toRad(Number(lat2));
  const dφ = toRad(Number(lat2) - Number(lat1));
  const dλ = toRad(Number(lon2) - Number(lon1));

  const a =
    Math.sin(dφ / 2) ** 2 +
    Math.cos(φ1) * Math.cos(φ2) * Math.sin(dλ / 2) ** 2;
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
};

const ViewAttendancePage = () => {
  const [attendanceData, setAttendanceData] = useState([]);
  const [eventData, setEventData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const [filterEvent, setFilterEvent] = useState("");
  const [filterStatus, setFilterStatus] = useState("");
  const [filterDistance, setFilterDistance] = useState("");

  const [filterName, setFilterName] = useState("");
  const [filterBranch, setFilterBranch] = useState("");
  const [filterEnroll, setFilterEnroll] = useState("");
  const [filterYear, setFilterYear] = useState("");

  useEffect(() => {
    fetchEventData();
    fetchAttendanceData();
  }, []);

  useEffect(() => {
    fetchAttendanceData();
  }, [filterEvent]);

  const fetchEventData = async () => {
    try {
      const res = await fetch(`${hostSocket}/api/events`);
      const data = await res.json();
      if (!data?.events || !Array.isArray(data.events))
        throw new Error("Invalid events data format");
      setEventData(data.events);
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
            if (da && !db) return -1;
            if (!da && db) return 1;
            return 0;
          });

          setAttendanceData(sorted);
        },
        (err) => setError(err?.message || "Error fetching attendance")
      );
    } catch (err) {
      setError(err?.message || "Fetch failed");
    } finally {
      setLoading(false);
    }
  };

  const getEventName = (eventRef) => {
    const id = asId(eventRef);
    if (!id) return "N/A";
    const found = eventData.find((e) => asId(e._id) === id);
    return found?.title || getNested(eventRef, "title") || "N/A";
  };

  const computeDistanceBucket = (locations) => {
    if (!Array.isArray(locations) || locations.length === 0) return "no-locations";
    if (locations.length === 1) return "single";

    const start = locations[0];
    const end = locations[locations.length - 1];
    const d = getDistanceInMeters(start?.lat, start?.long, end?.lat, end?.long);

    if (d === null) return "no-locations";
    return d <= 15 ? "in" : "out";
  };

  const statusOptions = useMemo(() => {
    const set = new Set();
    attendanceData.forEach((r) => r.status && set.add(r.status));
    return Array.from(set);
  }, [attendanceData]);

  /* ✅ FILTER LOGIC WITH BRANCH + YEAR FALLBACK */
  const filteredData = useMemo(() => {
    return attendanceData.filter((record) => {
      const userName = (record.name || getNested(record, "user_id.name", "")).toLowerCase();

      const branch =
        (record.branch || getNested(record, "user_id.branch", "") || "")
          .toString()
          .trim()
          .toLowerCase();

      const year =
        (record.year || getNested(record, "user_id.year", "") || "")
          .toString()
          .trim()
          .toLowerCase();

      const enroll = (record.enrollment_id || getNested(record, "user_id.enrollment_id", ""))
        .toString()
        .toLowerCase();

      const matchesEvent = !filterEvent || asId(record.event_id) === filterEvent;

      const matchesStatus =
        !filterStatus ||
        record.status?.toLowerCase() === filterStatus.toLowerCase();

      const bucket = computeDistanceBucket(record.locations);
      const matchesDistance = !filterDistance || bucket === filterDistance;

      const matchesName = !filterName || userName.includes(filterName.toLowerCase());

      const matchesBranch =
        !filterBranch ||
        branch.includes(filterBranch.trim().toLowerCase());

      const matchesEnroll =
        !filterEnroll ||
        enroll.includes(filterEnroll.trim().toLowerCase());

      const matchesYear =
        !filterYear ||
        year.includes(filterYear.trim().toLowerCase());

      return (
        matchesEvent &&
        matchesStatus &&
        matchesDistance &&
        matchesName &&
        matchesBranch &&
        matchesEnroll &&
        matchesYear
      );
    });
  }, [
    attendanceData,
    filterEvent,
    filterStatus,
    filterDistance,
    filterName,
    filterBranch,
    filterEnroll,
    filterYear,
  ]);

  /* ✅ CSV Export Updated to include Branch + Year */
  const exportToCSV = (data) => {
    if (!data.length) return alert("No data to export");

    const headers = [
      "Event Name",
      "User Name",
      "Nickname",
      "Enrollment ID",
      "Branch",
      "Year",
      "Status",
      "Punch In",
      "Punch Out",
      "Punch In Location",
      "Punch Out Location",
      "Distance Bucket",
    ];

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
      const start = locs[0];
      const end = locs[locs.length - 1];
      const bucket = computeDistanceBucket(locs);

      return [
        eventName,
        userName,
        nick,
        enr,
        branch,
        year,
        rec.status,
        inDt ? inDt.toLocaleString() : "N/A",
        outDt ? outDt.toLocaleString() : "N/A",
        start ? `${start.lat}, ${start.long}` : "N/A",
        end ? `${end.lat}, ${end.long}` : "N/A",
        bucket.toUpperCase(),
      ];
    });

    const csv =
      [headers, ...csvRows]
        .map((r) => r.map((cell) => `"${String(cell).replace(/"/g, '""')}"`).join(","))  
        .join("\n");

    const url = URL.createObjectURL(new Blob([csv], { type: "text/csv" }));
    const a = document.createElement("a");
    a.href = url;
    a.download = "attendance.csv";
    a.click();
    URL.revokeObjectURL(url);
  };

  if (loading) return <div className="py-10 text-center">Loading...</div>;
  if (error) return <div className="py-10 text-center text-red-600">{error}</div>;

  return (
    <div className="p-6 bg-gray-50 min-h-screen">
      <div className="flex flex-col md:flex-row md:justify-between md:items-center mb-6 gap-4">
        <h2 className="text-2xl font-semibold">Attendance Management</h2>

        <button
          onClick={() => exportToCSV(filteredData)}
          className="bg-green-600 text-white px-4 py-2 rounded-lg shadow hover:bg-green-700"
        >
          📥 Download CSV (All)
        </button>
      </div>

      {/* Filters */}
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-6 gap-4 bg-white p-4 rounded-md shadow mb-8">

        <select value={filterEvent} onChange={(e) => setFilterEvent(e.target.value)} className="border p-2 rounded">
          <option value="">All Events</option>
          {eventData.map((ev) => (
            <option key={asId(ev._id)} value={asId(ev._id)}>
              {ev.title}
            </option>
          ))}
        </select>

        <select value={filterStatus} onChange={(e) => setFilterStatus(e.target.value)} className="border p-2 rounded">
          <option value="">All Status</option>
          {statusOptions.map((s) => (
            <option key={s}>{s}</option>
          ))}
        </select>

        <select value={filterDistance} onChange={(e) => setFilterDistance(e.target.value)} className="border p-2 rounded">
          <option value="">Distance (All)</option>
          <option value="in">IN (≤15m)</option>
          <option value="out">OUT (&gt;15m)</option>
          <option value="single">Single</option>
          <option value="no-locations">No Locations</option>
        </select>

        <input
          type="text"
          placeholder="Search Name"
          value={filterName}
          onChange={(e) => setFilterName(e.target.value)}
          className="border p-2 rounded"
        />

        <input
          type="text"
          placeholder="Search Branch"
          value={filterBranch}
          onChange={(e) => setFilterBranch(e.target.value)}
          className="border p-2 rounded"
        />

        <input
          type="text"
          placeholder="Search Year"
          value={filterYear}
          onChange={(e) => setFilterYear(e.target.value)}
          className="border p-2 rounded"
        />

        <input
          type="text"
          placeholder="Enrollment"
          value={filterEnroll}
          onChange={(e) => setFilterEnroll(e.target.value)}
          className="border p-2 rounded"
        />

      </div>

      {/* TABLE */}
      <div className="overflow-x-auto bg-white shadow rounded-lg">
        <table className="min-w-full table-auto">
          <thead>
            <tr className="bg-gray-200">
              <th className="px-4 py-2 text-left">Event</th>
              <th className="px-4 py-2 text-left">User</th>
              <th className="px-4 py-2 text-left">Nickname</th>
              <th className="px-4 py-2 text-left">Enrollment</th>
              <th className="px-4 py-2 text-left">Branch</th>
              <th className="px-4 py-2 text-left">Year</th>
              <th className="px-4 py-2 text-left">Status</th>
              <th className="px-4 py-2 text-left">Punch In</th>
              <th className="px-4 py-2 text-left">Punch Out</th>
              <th className="px-4 py-2 text-left">In Location</th>
              <th className="px-4 py-2 text-left">Out Location</th>
              <th className="px-4 py-2 text-left">15m</th>
            </tr>
          </thead>

          <tbody>
            {filteredData.map((record, idx) => {
              const eventName = getEventName(record.event_id);

              const userName = record.name || getNested(record, "user_id.name", "N/A");
              const nickname = record.nickname || getNested(record, "user_id.nickname", "N/A");
              const enrollment = record.enrollment_id || getNested(record, "user_id.enrollment_id", "N/A");

              const branch = record.branch || getNested(record, "user_id.branch", "N/A");
              const year = record.year || getNested(record, "user_id.year", "N/A");

              const inDt = safeDate(record.punch_in_time);
              const outDt = safeDate(record.punch_out_time);

              const locs = Array.isArray(record.locations) ? record.locations : [];
              const start = locs[0];
              const end = locs[locs.length - 1];

              const bucket = computeDistanceBucket(locs);

              const within =
                bucket === "in" ? "✔️" :
                bucket === "out" ? "❌" :
                bucket === "single" ? "•" :
                "N/A";

              return (
                <tr key={record._id || idx} className="border-b">
                  <td className="px-4 py-2">{eventName}</td>
                  <td className="px-4 py-2">{userName}</td>
                  <td className="px-4 py-2">{nickname}</td>
                  <td className="px-4 py-2">{enrollment}</td>
                  <td className="px-4 py-2">{branch}</td>
                  <td className="px-4 py-2">{year}</td>
                  <td className="px-4 py-2">{record.status}</td>
                  <td className="px-4 py-2">{inDt ? inDt.toLocaleString() : "N/A"}</td>
                  <td className="px-4 py-2">{outDt ? outDt.toLocaleString() : "N/A"}</td>
                  <td className="px-4 py-2">{start ? `${start.lat}, ${start.long}` : "N/A"}</td>
                  <td className="px-4 py-2">{end ? `${end.lat}, ${end.long}` : "N/A"}</td>
                  <td className="px-4 py-2">{within}</td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {filteredData.length === 0 && (
        <div className="mt-6 text-center text-gray-600">No records found.</div>
      )}
    </div>
  );
};

export default ViewAttendancePage;
