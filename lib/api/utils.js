export const toYYYY_MM_DD_T_HH_mm = (date) => {
    const d = new Date(new Date(date) - new Date().getTimezoneOffset() * 60000)
    return d.toISOString().slice(0,16)
}


// attendanceShared.js

// --- 1. CONSTANTS ---
export const COLORS = {
  primary: ["#3B82F6", "#8B5CF6", "#EC4899", "#F59E0B", "#10B981"], 
  status: { present: "#10B981", absent: "#EF4444", late: "#F59E0B", exc: "#3B82F6" },
  geo: ["#10B981", "#EF4444", "#9CA3AF"]
};

export const ACADEMIC_STRUCTURE = {
  "school-branch": {
    "School of Technology": ["B.Tech.", "BCA"],
    "School of Science": ["B.Sc."],
    "School of Management Studies and Liberal Arts": ["B.Com.", "BBA"]
  },
  "branch-stream": {
    "B.Tech.": ["Chemical", "Chemical D2D", "Computer Science & Engg.", "Computer Science & Engg. D2D", "Fire & EHS", "Fire & EHS. D2D"],
    "BCA": ["General"],
    "B.Sc.": ["Biotechnology", "Chemistry", "Data Science", "Micro Biology"],
    "B.Com.": ["/ B.Com (Hons.)"],
    "BBA": ["Business Analytics", "HR / Marketing /Accounting & Finance / IT Mg"]
  }
};

// --- 2. HELPERS ---
export const safeDate = (dt) => {
  try {
    if (!dt) return null;
    const d = new Date(dt);
    return isNaN(d.getTime()) ? null : d;
  } catch { return null; }
};

export const asId = (obj) => (obj && typeof obj === "object" ? obj._id : obj) || "";

export const getNested = (obj, path, fallback) => {
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

// --- 3. MAIN PROCESSOR (The Optimization Engine) ---
// This runs O(n) loop ONCE and prepares data for BOTH Table and Charts
export const processAttendanceData = (rawData) => {
  if (!Array.isArray(rawData)) return [];
  
  return rawData.map(r => {
    const userIdObj = r.user_id || {};
    
    // Academic Info
    const rawBranch = (r.branch || userIdObj.branch || "Unknown");
    const { school, degree, stream } = classifyBranch(rawBranch);
    
    // Math: Distance
    const lat1 = r.locations?.[0]?.lat;
    const lon1 = r.locations?.[0]?.long;
    const lat2 = r.locations?.at(-1)?.lat;
    const lon2 = r.locations?.at(-1)?.long;
    const dist = getDistanceInMeters(lat1, lon1, lat2, lon2);

    // Logic: Distance Bucket
    let distBucket = "no-locations";
    if (!r.locations || r.locations.length === 0) distBucket = "no-locations";
    else if (r.locations.length === 1) distBucket = "single";
    else if (dist !== null && dist <= 500) distBucket = "in";
    else distBucket = "out";

    return {
        ...r, 
        // Identifiers
        _eventId: asId(r.event_id),
        
        // Dates
        _parsedInDate: safeDate(r.punch_in_time),
        _parsedOutDate: safeDate(r.punch_out_time),

        // Academic Info (For Charts)
        _school: school, 
        _degree: degree, 
        _stream: stream,
        _year: (r.year || userIdObj.year || "Unknown").toString(),

        // Search Strings (For Table)
        _searchName: (r.name || userIdObj.name || "").toLowerCase(),
        _searchBranch: (r.branch || userIdObj.branch || "").toString().trim().toLowerCase(),
        _searchYear: (r.year || userIdObj.year || "").toString().trim().toLowerCase(),
        _searchEnroll: (r.enrollment_id || userIdObj.enrollment_id || "").toString().toLowerCase(),

        // Geo (For Charts & Table)
        _dist: dist,
        _distBucket: distBucket,
        _distValid: dist !== null && dist <= 500
    };
  });
};
