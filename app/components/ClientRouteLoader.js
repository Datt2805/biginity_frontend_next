// components/ClientRouteLoader.js
"use client";

import React from "react";
import RouteLoader from "./Common/RouteLoader";

export default function ClientRouteLoader({ children }) {
  return <RouteLoader>{children}</RouteLoader>;
}
