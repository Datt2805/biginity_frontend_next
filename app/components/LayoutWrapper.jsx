"use client";

import { usePathname } from "next/navigation";
import Navbar from "./NavBar";

export default function LayoutWrapper({ children }) {
  const pathname = usePathname();

  const isStudentRoute = pathname.startsWith("/student");
  const isTeacherRoute = pathname.startsWith("/teacher");
  const isAdminRoute = pathname.startsWith("/admin"); 

  return (
    <>
      {!isStudentRoute && !isTeacherRoute && !isAdminRoute && <Navbar />}
      {children}
    </>
  );
}
