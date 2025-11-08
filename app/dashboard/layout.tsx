import React from 'react';

/**
 * Layout for the /dashboard route.
 *
 * This component wraps dashboard pages and can host persistent
 * dashboard-specific UI (for example: sidebars, persistent headers,
 * or navigation) in larger applications.
 */
export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  // Render children directly. The application-level layout manages global structure.
  return <>{children}</>;
}