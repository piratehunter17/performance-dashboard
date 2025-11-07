import { generateInitialDataset } from '@/lib/dataGenerator';
import DashboardClient from '@/components/DashboardClient';
import { DataPoint } from '@/lib/types';

export const dynamic = 'force-dynamic';

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