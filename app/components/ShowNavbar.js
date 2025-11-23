"use client";
import { usePathname } from "next/navigation";
import Navbar from "./NavBar";

export default function ShowNavbar({ children }) {
  const pathname = usePathname() || "";

  // Routes to hide navbar
  const hidePrefix = ["/teacher", "/student", "/admin"]; // ← ADD ADMIN HERE

  const hideEventDetail = pathname.startsWith("/events/detail");

  const shouldHide =
    hidePrefix.some((prefix) => pathname.startsWith(prefix)) ||
    hideEventDetail;

  return (
    <>
      {!shouldHide && <Navbar />}
      <div className={shouldHide ? "" : "pt-24"}>{children}</div>
    </>
  );
}
