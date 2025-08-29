"use client";
import { useState } from "react";
import Link from "next/link";
import { Menu, X } from "lucide-react";

export default function TeacherLayout({ children }) {
  const [open, setOpen] = useState(false);

  return (
    <div className="flex min-h-screen">
      {/* Sidebar (Desktop) */}
      <aside className="hidden md:flex w-64 bg-green-600 text-white p-6 flex-col gap-4">
        <h1 className="text-2xl font-bold mb-6">Teacher Panel</h1>
        <nav className="flex flex-col gap-3">
          <Link href="/teacher" className="hover:underline">📊 Dashboard</Link>
          <Link href="/teacher/profile" className="hover:underline">👤 Profile</Link>
          <Link href="/teacher/classroom" className="hover:underline">🏫 Classroom</Link>
          <Link href="/teacher/attendance" className="hover:underline">📝 Attendance</Link>
          <Link href="/teacher/create-event" className="hover:underline">➕ Create Event</Link>
          <Link href="/teacher/create-space" className="hover:underline">🏢 Create Space</Link>
          <Link href="/teacher/events" className="hover:underline">📅 Events</Link>
          <Link href="/teacher/enrolled" className="hover:underline">✅ Enrolled</Link>
          <Link href="/teacher/chart" className="hover:underline">📈 Charts</Link>
        </nav>
      </aside>

      {/* Mobile Navbar */}
      <div className="md:hidden fixed top-0 left-0 w-full bg-green-600 text-white flex justify-between items-center px-4 py-3 shadow-md z-50">
        <h1 className="text-lg font-bold">Teacher Panel</h1>
        <button onClick={() => setOpen(!open)} className="p-2">
          {open ? <X size={24} /> : <Menu size={24} />}
        </button>
      </div>

      {/* Mobile Sidebar (Overlay) */}
      {open && (
        <div className="md:hidden fixed inset-0 z-40 flex">
          <div className="w-64 bg-green-600 text-white p-6 flex flex-col gap-4">
            <h1 className="text-2xl font-bold mb-6">Menu</h1>
            <nav className="flex flex-col gap-3">
              <Link href="/teacher" onClick={() => setOpen(false)}>📊 Dashboard</Link>
              <Link href="/teacher/profile" onClick={() => setOpen(false)}>👤 Profile</Link>
              <Link href="/teacher/classroom" onClick={() => setOpen(false)}>🏫 Classroom</Link>
              <Link href="/teacher/attendance" onClick={() => setOpen(false)}>📝 Attendance</Link>
              <Link href="/teacher/create-event" onClick={() => setOpen(false)}>➕ Create Event</Link>
              <Link href="/teacher/create-space" onClick={() => setOpen(false)}>🏢 Create Space</Link>
              <Link href="/teacher/events" onClick={() => setOpen(false)}>📅 Events</Link>
              <Link href="/teacher/enrolled" onClick={() => setOpen(false)}>✅ Enrolled</Link>
              <Link href="/teacher/chart" onClick={() => setOpen(false)}>📈 Charts</Link>
            </nav>
          </div>
          <div
            className="flex-1 bg-black/50"
            onClick={() => setOpen(false)}
          />
        </div>
      )}

      {/* Main Content */}
      <main className="flex-1 p-8 bg-gray-50 mt-14 md:mt-0">{children}</main>
    </div>
  );
}
