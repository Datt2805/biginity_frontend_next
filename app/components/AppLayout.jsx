"use client";

import ClientRouteLoader from "./ClientRouteLoader";
import LayoutWrapper from "./LayoutWrapper";

export default function AppLayout({ children }) {
  return (
    <ClientRouteLoader>
      <LayoutWrapper>{children}</LayoutWrapper>
    </ClientRouteLoader>
  );
}
