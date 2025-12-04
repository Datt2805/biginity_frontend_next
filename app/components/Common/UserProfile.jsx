// components/Event/UserProfile.jsx
import React, { useEffect, useState } from "react";
import { 
  User, 
  Mail, 
  Shield, 
  CheckCircle2, 
  PieChart, 
  Loader2,
  GraduationCap, 
  Building2,     
  Hash,          
  Calendar,      
  BookOpen,
  Clock,         // New Import for Pending Icon
  AlertCircle    // New Import for Info Message
} from "lucide-react";
import { fetchUserDetail, getAllAttendances } from "../../../lib/api"; 

const UserProfile = () => {
  const [userData, setUserData] = useState(null);
  const [attendanceStats, setAttendanceStats] = useState({
    total: 0,
    present: 0,
    pending: 0, // New State
    absent: 0,
    percentage: 0
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const initProfile = async () => {
      try {
        const user = await fetchUserDetail();
        setUserData(user);

        const role = user.role || user.userType || "Student";
        
        if (user && (user._id || user.id) && role.toLowerCase() === 'student') {
           const userId = user._id || user.id; 
           
           await getAllAttendances(
             userId, 
             (response) => {
               const records = response.data || (Array.isArray(response) ? response : []);
               const total = response.totalRecords || records.length;
               
               // --- LOGIC UPDATE START ---
               
               // 1. Pending: Punched IN, but NO Punch OUT
               const pendingCount = records.filter(r => 
                 r.punch_in_time != null && (r.punch_out_time == null || r.punch_out_time === "")
               ).length;

               // 2. Present: Punched IN AND Punched OUT
               // (Or you can count 'Present' as anyone who punched in, regardless of punch out. 
               // Below acts as "Completed Sessions")
               const completedCount = records.filter(r => 
                 r.punch_in_time != null && r.punch_out_time != null
               ).length;

               // Note: For the percentage, usually Pending students are considered "Present" 
               // because they are physically there.
               const effectivePresent = completedCount + pendingCount;
               
               const absentCount = total - effectivePresent;
               const percentage = total > 0 ? ((effectivePresent / total) * 100).toFixed(1) : 0;

               setAttendanceStats({
                 total: total,
                 present: completedCount,
                 pending: pendingCount,
                 absent: absentCount,
                 percentage: percentage
               });
               // --- LOGIC UPDATE END ---
             },
             (err) => console.error("Failed to load attendance", err)
           );
        }
      } catch (error) {
        console.error("Profile load error", error);
      } finally {
        setLoading(false);
      }
    };

    initProfile();
  }, []);

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <Loader2 className="h-8 w-8 animate-spin text-indigo-600" />
      </div>
    );
  }

  if (!userData) {
    return <div className="text-center text-slate-500">No user data found.</div>;
  }

  // Helpers
  const getName = () => userData.name || userData.firstName + ' ' + (userData.lastName || '') || "N/A";
  const getEmail = () => userData.email || "N/A";
  const getRole = () => userData.role || userData.userType || "Student";
  const isStudent = getRole().toLowerCase() === 'student';
  const isTeacher = getRole().toLowerCase() === 'teacher';

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      
      {/* Teacher Only Title */}
      {isTeacher && (
        <h1 className="text-2xl font-bold text-slate-800 mb-4 px-1">
          Teacher Dashboard Overview
        </h1>
      )}

      {/* 1. Profile Header Card */}
      <div className="bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden">
        <div className="h-32 bg-gradient-to-r from-indigo-600 to-purple-600"></div>
        <div className="px-6 pb-6">
          <div className="relative flex items-end -mt-12 mb-6">
            <div className="p-1 bg-white rounded-full">
              <div className="h-24 w-24 bg-slate-100 rounded-full flex items-center justify-center border-4 border-indigo-50">
                <User className="h-12 w-12 text-slate-400" />
              </div>
            </div>
            <div className="ml-4 mb-1">
              <h2 className="text-2xl font-bold text-slate-800">{getName()}</h2>
              <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-indigo-100 text-indigo-800 mt-1 capitalize">
                {getRole()}
              </span>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-4">
              <h3 className="text-sm font-semibold text-slate-500 uppercase tracking-wider">
                Personal Information
              </h3>
              <div className="flex items-center gap-3 p-3 rounded-lg bg-slate-50 border border-slate-100">
                <div className="p-2 bg-indigo-100 rounded-lg">
                  <Mail className="h-4 w-4 text-indigo-600" />
                </div>
                <div>
                  <p className="text-xs text-slate-500">Email Address</p>
                  <p className="text-sm font-medium text-slate-700">{getEmail()}</p>
                </div>
              </div>
            </div>

            <div className="space-y-4">
              <h3 className="text-sm font-semibold text-slate-500 uppercase tracking-wider">
                Account Details
              </h3>
              <div className="flex items-center gap-3 p-3 rounded-lg bg-slate-50 border border-slate-100">
                <div className="p-2 bg-purple-100 rounded-lg">
                  <Shield className="h-4 w-4 text-purple-600" />
                </div>
                <div>
                  <p className="text-xs text-slate-500">User Role</p>
                  <p className="text-sm font-medium text-slate-700 capitalize">{getRole()}</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* 2. ACADEMIC DETAILS */}
      {isStudent && (
        <div className="bg-white rounded-2xl shadow-sm border border-slate-100 p-6">
          <div className="flex items-center gap-2 mb-6">
             <GraduationCap className="h-5 w-5 text-indigo-600" />
             <h3 className="text-lg font-bold text-slate-800">Academic Information</h3>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            <div className="p-3 bg-slate-50 rounded-xl border border-slate-100 flex items-start gap-3">
               <div className="p-2 bg-white rounded-lg shadow-sm">
                 <Hash className="h-4 w-4 text-slate-500" />
               </div>
               <div>
                 <p className="text-xs text-slate-500 mb-0.5">Enrollment ID</p>
                 <p className="text-sm font-semibold text-slate-700">{userData.enrollment_id || "N/A"}</p>
               </div>
            </div>
            <div className="p-3 bg-slate-50 rounded-xl border border-slate-100 flex items-start gap-3">
               <div className="p-2 bg-white rounded-lg shadow-sm">
                 <Building2 className="h-4 w-4 text-indigo-500" />
               </div>
               <div>
                 <p className="text-xs text-slate-500 mb-0.5">School</p>
                 <p className="text-sm font-semibold text-slate-700 line-clamp-1" title={userData.school}>
                    {userData.school || "N/A"}
                 </p>
               </div>
            </div>
             <div className="p-3 bg-slate-50 rounded-xl border border-slate-100 flex items-start gap-3">
               <div className="p-2 bg-white rounded-lg shadow-sm">
                 <BookOpen className="h-4 w-4 text-pink-500" />
               </div>
               <div>
                 <p className="text-xs text-slate-500 mb-0.5">Branch / Stream</p>
                 <p className="text-sm font-semibold text-slate-700">
                    {userData.branch} {userData.stream ? `(${userData.stream})` : ''}
                 </p>
               </div>
            </div>
            <div className="p-3 bg-slate-50 rounded-xl border border-slate-100 flex items-start gap-3">
               <div className="p-2 bg-white rounded-lg shadow-sm">
                 <Calendar className="h-4 w-4 text-orange-500" />
               </div>
               <div>
                 <p className="text-xs text-slate-500 mb-0.5">Batch Year</p>
                 <p className="text-sm font-semibold text-slate-700">{userData.year || "N/A"}</p>
               </div>
            </div>
            <div className="p-3 bg-slate-50 rounded-xl border border-slate-100 flex items-start gap-3">
               <div className="p-2 bg-white rounded-lg shadow-sm">
                 <User className="h-4 w-4 text-blue-500" />
               </div>
               <div>
                 <p className="text-xs text-slate-500 mb-0.5">Gender</p>
                 <p className="text-sm font-semibold text-slate-700 capitalize">{userData.gender || "N/A"}</p>
               </div>
            </div>
          </div>
        </div>
      )}

      {/* 3. ATTENDANCE ANALYTICS */}
      {isStudent && (
        <div className="bg-white rounded-2xl shadow-sm border border-slate-100 p-6">
          <div className="flex items-center gap-2 mb-6">
             <PieChart className="h-5 w-5 text-indigo-600" />
             <h3 className="text-lg font-bold text-slate-800">Attendance Analytics</h3>
          </div>

          {/* Updated Grid for 4 Items */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            
            {/* Total Classes */}
            <div className="p-4 bg-slate-50 rounded-xl border border-slate-100 flex flex-col items-center justify-center">
              <span className="text-slate-500 text-sm font-medium mb-1">Total Classes</span>
              <span className="text-2xl font-bold text-slate-800">{attendanceStats.total}</span>
            </div>

            {/* Present Count (Completed) */}
            <div className="p-4 bg-green-50 rounded-xl border border-green-100 flex flex-col items-center justify-center">
              <div className="flex items-center gap-2 mb-1">
                <CheckCircle2 className="h-4 w-4 text-green-600" />
                <span className="text-green-700 text-sm font-medium">Completed</span>
              </div>
              <span className="text-2xl font-bold text-green-800">{attendanceStats.present}</span>
            </div>

            {/* --- NEW PENDING SECTION --- */}
            <div className="p-4 bg-amber-50 rounded-xl border border-amber-100 flex flex-col items-center justify-center">
              <div className="flex items-center gap-2 mb-1">
                <Clock className="h-4 w-4 text-amber-600" />
                <span className="text-amber-700 text-sm font-medium">Pending</span>
              </div>
              <span className="text-2xl font-bold text-amber-800">{attendanceStats.pending}</span>
            </div>
            {/* --------------------------- */}

            {/* Percentage */}
            <div className="p-4 bg-indigo-50 rounded-xl border border-indigo-100 flex flex-col items-center justify-center relative overflow-hidden">
              <span className="text-indigo-700 text-sm font-medium mb-1">Attendance Rate</span>
              <span className="text-3xl font-bold text-indigo-800">{attendanceStats.percentage}%</span>
              <div className="absolute bottom-0 left-0 h-1 bg-indigo-200 w-full">
                <div 
                  className="h-full bg-indigo-600 transition-all duration-1000" 
                  style={{ width: `${attendanceStats.percentage}%` }}
                ></div>
              </div>
            </div>

          </div>

          {/* --- NEW EXPLANATORY MESSAGE --- */}
          {attendanceStats.pending > 0 && (
            <div className="mt-4 flex items-start gap-2 p-3 bg-amber-50 border border-amber-100 rounded-lg">
              <AlertCircle className="h-5 w-5 text-amber-600 mt-0.5 shrink-0" />
              <div>
                 <p className="text-sm font-medium text-amber-800">What is "Pending"?</p>
                 <p className="text-xs text-amber-700 mt-0.5">
                   Pending status means you have punched in but not punched out yet. 
                   This could mean your class is currently in progress, or you forgot to mark your exit.
                 </p>
              </div>
            </div>
          )}
          {/* ------------------------------- */}

        </div>
      )}
 
    </div>
  );
};

export default UserProfile;