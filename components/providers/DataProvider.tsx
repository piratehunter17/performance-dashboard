'use client'; 

import React, { createContext, useContext, ReactNode, useState, useCallback } from 'react';
import { DataPoint } from '@/lib/types';
import { useDataStream, DataStreamControls } from '@/hooks/useDataStream';

interface DataContextState extends DataStreamControls {
  dataRef: React.RefObject<DataPoint[]>;
  dataTick: number;
  isRunning: boolean;
  intervalMs: number;
}

const DataContext = createContext<DataContextState | undefined>(undefined);

interface DataProviderProps {
  initialData: DataPoint[];
  children: ReactNode;
}

export const DataProvider: React.FC<DataProviderProps> = ({
  initialData,
  children,
}) => {
  const [intervalMs, setIntervalMs] = useState(100);
  const dataStream = useDataStream(initialData);

  const setAppInterval = useCallback((newInterval: number) => {
    setIntervalMs(newInterval);
    dataStream.setIntervalMs(newInterval);
  }, [dataStream.setIntervalMs]);

  return (
    <DataContext.Provider 
      value={{ 
        ...dataStream, 
        intervalMs, 
        setIntervalMs: setAppInterval
      }}
    >
      {children}
    </DataContext.Provider>
  );
};

export const useData = (): DataContextState => {
  const context = useContext(DataContext);
  if (context === undefined) {
    // Guard: ensure hook is used within provider context
    throw new Error('useData must be used within a DataProvider');
  }
  return context;
};