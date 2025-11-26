import React from 'react';
import AdminPage from '@/app/admin/AdminDashboard';
// Set up metadata if needed
export const metadata = {
  title: 'Admin Page',
};

// This is the main page component for the /teacher route
const adminPage = () => {
  return (
    <AdminPage />
  );
};

export default adminPage;