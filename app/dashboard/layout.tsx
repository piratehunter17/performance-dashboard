import React from 'react';

/**
 * This is the layout for the /dashboard route.
 * It wraps the dashboard page and any potential sub-pages.
 * * If we were building a larger app, this is where you would put
 * a dashboard-specific sidebar or nested header that
 * persists across all /dashboard/* routes.
 */
export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  // For this assignment, we just render the children directly.
  // The root layout (app/layout.tsx) handles the main page structure.
  return <>{children}</>;
}