'use client'; // This component manages state, so it must be a Client Component

import React, { createContext, useContext, ReactNode } from 'react';
import { DataPoint } from '@/lib/types';
import { useDataStream } from '@/hooks/useDataStream';

// 1. Define the shape of the data our context will provide
interface DataContextState {
  dataPoints: DataPoint[];
  isRunning: boolean;
  startStream: () => void;
  stopStream: () => void;
}

// 2. Create the Context
const DataContext = createContext<DataContextState | undefined>(undefined);

// 3. Define the Provider component
interface DataProviderProps {
  initialData: DataPoint[];
  children: ReactNode;
}

/**
 * Provides the real-time data stream to its children components.
 */
export const DataProvider: React.FC<DataProviderProps> = ({
  initialData,
  children,
}) => {
  // Use the hook we created earlier
  //
  // --- THIS IS THE CHANGE ---
  // We're changing the interval from 100ms to 16ms
  // (1000ms / 60fps ≈ 16ms) to simulate 60fps data updates.
  //
  const dataStream = useDataStream(initialData, 16); // 16ms interval (60fps)

  return (
    <DataContext.Provider value={dataStream}>
      {children}
    </DataContext.Provider>
  );
};

// 4. Create a custom consumer hook for easy access
/**
 * Custom hook to access the data stream context.
 * Throws an error if used outside of a DataProvider.
 */
export const useData = (): DataContextState => {
  const context = useContext(DataContext);
  if (context === undefined) {
    throw new Error('useData must be used within a DataProvider');
  }
  return context;
};