import { generateInitialDataset } from '@/lib/dataGenerator';
import DashboardClient from '@/components/DashboardClient';
import { DataPoint } from '@/lib/types';

// --- THIS IS THE FIX ---
// This line tells Next.js to treat this page as a dynamic page,
// running it on the server for every request instead of
// just once at build time.
export const dynamic = 'force-dynamic';
// --- END FIX ---

/**
 * This is now an async Server Component.
 * It pre-renders the initial state on the server on every request.
 */
export default async function DashboardPage() {
  
  // 1. Generate the initial data on the server (now at request time).
  const initialData: DataPoint[] = generateInitialDataset(1000, 100);

  // 2. Pass the server-generated data as a prop to the Client Component.
  return <DashboardClient initialData={initialData} />;
}