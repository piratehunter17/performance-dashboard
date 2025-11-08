'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import { DataPoint } from '../lib/types';

// Export FilterState so external modules (e.g. page.tsx) can import and use it.
export type FilterState = {
  aggregationIntervalMs: number;
  valueRange: { min: number; max: number };
};

export interface DataStreamControls {
  startStream: () => void;
  stopStream: () => void;
  setIntervalMs: (ms: number) => void;
}

export const useDataStream = (
  initialData: DataPoint[]
): {
  dataRef: React.RefObject<DataPoint[]>;
  dataTick: number;
  isRunning: boolean;
} & DataStreamControls => {
  
  const [dataTick, setDataTick] = useState(0); 
  const dataRef = useRef<DataPoint[]>(initialData); 
  
  const [isRunning, setIsRunning] = useState(true);
  const workerRef = useRef<Worker | null>(null);

  useEffect(() => {
    const worker = new Worker(new URL('../lib/data.worker.ts', import.meta.url));
    workerRef.current = worker;

    worker.onmessage = (e: MessageEvent<DataPoint[]>) => {
      // Update the shared data buffer with the worker-provided array
      dataRef.current = e.data;
      // Bump the render tick to notify consumers of new data
      setDataTick(tick => tick + 1);
    };

    // Initialize the worker with the initial dataset and default interval
    worker.postMessage({
      type: 'INIT',
      payload: { initialData, intervalMs: 100 },
    });

    return () => {
      worker.terminate();
    };
  }, [initialData]); // Effect runs once to initialize worker

  // Worker control functions

  const startStream = useCallback(() => {
    workerRef.current?.postMessage({ type: 'START' });
    setIsRunning(true);
  }, []);

  const stopStream = useCallback(() => {
    workerRef.current?.postMessage({ type: 'STOP' });
    setIsRunning(false);
  }, []);

  const setIntervalMs = useCallback((ms: number) => {
    workerRef.current?.postMessage({ type: 'SET_INTERVAL', payload: ms });
  }, []);

  return { dataRef, dataTick, isRunning, startStream, stopStream, setIntervalMs };
};