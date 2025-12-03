// app/teacher/page.jsx
import React from 'react';
import TeacherDashboard from '../components/TeacherDashboard/TeacherDashboard';

// Set up metadata if needed
export const metadata = {
  title: 'Teacher Dashboard',
};

// This is the main page component for the /teacher route
const TeacherPage = () => {
  return (
    <TeacherDashboard />
  );
};

export default TeacherPage;