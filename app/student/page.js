// app/teacher/page.jsx
import React from 'react';
import StudentDashboard from '../components/StudentDashboard/StudentDashboard';

// Set up metadata if needed
export const metadata = {
  title: 'Teacher Dashboard',
};

// This is the main page component for the /teacher route
const TeacherPage = () => {
  return (
    // Note: Since TeacherDashboard uses client-side hooks and components 
    // like ToastContainer, it must be marked as 'use client' internally.
    <StudentDashboard />
  );
};

export default TeacherPage;