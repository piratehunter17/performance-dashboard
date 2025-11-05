'use client'; 

import React, { createContext, useContext, ReactNode } from 'react';
import { DataPoint } from '@/lib/types';
// --- FIX: Changed to a named import ---
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
  const dataStream = useDataStream(initialData, 16); // 16ms interval (60fps)

  return (
    <DataContext.Provider value={dataStream}>
      {children}
    </DataContext.Provider>
  );
};

// 4. Create a custom consumer hook for easy access
export const useData = (): DataContextState => {
  const context = useContext(DataContext);
  if (context === undefined) {
    throw new Error('useData must be used within a DataProvider');
  }
  return context;
};