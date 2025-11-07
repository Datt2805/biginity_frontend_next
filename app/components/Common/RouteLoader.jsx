"use client";

import { useState, useEffect } from "react";
import { usePathname } from "next/navigation";
import Loader from "../Common/Loader";

export default function RouteLoader({ children }) {
  const [loading, setLoading] = useState(false);
  const pathname = usePathname();

  useEffect(() => {
    // Start loading when pathname changes
    setLoading(true);

    const timer = setTimeout(() => {
      setLoading(false);
    }, 800); // adjust delay if needed

    return () => clearTimeout(timer);
  }, [pathname]);

  return (
    <>
      {loading && <Loader />}
      {children}
    </>
  );
}
