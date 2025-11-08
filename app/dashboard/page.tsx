import { generateInitialDataset } from '@/lib/dataGenerator';
import DashboardClient from '@/components/DashboardClient';
import { DataPoint } from '@/lib/types';

export const dynamic = 'force-dynamic';

/**
 * This is now an async Server Component.
 * It pre-renders the initial state on the server on every request.
 */
export default async function DashboardPage() {
  
  // Simulate a server-side data fetch delay (1.5s) to demonstrate the loading skeleton.
  await new Promise(resolve => setTimeout(resolve, 1500));

  // Generate the initial dataset on the server.
  const initialData: DataPoint[] = generateInitialDataset(1000, 100);
  // Pass the server-generated initial dataset to the client component as a prop.
  return <DashboardClient initialData={initialData} />;
}