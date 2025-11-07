"use client";
import { usePathname } from "next/navigation";
import Navbar from "./NavBar";

export default function ShowNavbar({ children }) {
  const pathname = usePathname();

  // ✅ Routes that START with (prefix match)
  const hidePrefix = ["/teacher", "/student"];

  const shouldHide =
    hidePrefix.some((prefix) => pathname.startsWith(prefix));

  return (
    <>
      {!shouldHide && <Navbar />}
      <div className={shouldHide ? "" : "pt-24"}>{children}</div>
    </>
  );
}
