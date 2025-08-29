"use client";
import { useState } from "react";
import Link from "next/link";
import { Menu, X } from "lucide-react"; // icons

export default function StudentLayout({ children }) {
  const [open, setOpen] = useState(false);

  return (
    <div className="flex min-h-screen">
      {/* Sidebar (Desktop) */}
      <aside className="hidden md:flex w-64 bg-green-600 text-white p-6 flex-col gap-4">
        <h1 className="text-2xl font-bold mb-6">Student Panel</h1>
        <nav className="flex flex-col gap-3">
          <Link href="/student" className="hover:underline">🏠 Dashboard</Link>
          <Link href="/student/profile" className="hover:underline">👤 Profile</Link>
          <Link href="/student/classroom" className="hover:underline">🏫 Classroom</Link>
          <Link href="/student/events" className="hover:underline">📅 Events</Link>
          <Link href="/student/enrolled" className="hover:underline">✅ Enrolled</Link>
        </nav>
      </aside>

      {/* Mobile Navbar */}
      <div className="md:hidden fixed top-0 left-0 w-full bg-green-600 text-white flex justify-between items-center px-4 py-3 shadow-md z-50">
        <h1 className="text-lg font-bold">Student Panel</h1>
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
              <Link href="/student" onClick={() => setOpen(false)}>🏠 Dashboard</Link>
              <Link href="/student/profile" onClick={() => setOpen(false)}>👤 Profile</Link>
              <Link href="/student/classroom" onClick={() => setOpen(false)}>🏫 Classroom</Link>
              <Link href="/student/events" onClick={() => setOpen(false)}>📅 Events</Link>
              <Link href="/student/enrolled" onClick={() => setOpen(false)}>✅ Enrolled</Link>
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
