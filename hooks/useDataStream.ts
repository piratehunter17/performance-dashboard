'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import { DataPoint } from '../lib/types';

// We must export this type so page.tsx can import it.
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
      // 1. Save the 100k array to the ref
      dataRef.current = e.data;
      // 2. Increment the tick to trigger a re-render
      setDataTick(tick => tick + 1); 
    };
    
    // Send the initial data and interval
    worker.postMessage({ 
      type: 'INIT', 
      payload: { initialData, intervalMs: 100 }
    });

    return () => {
      worker.terminate();
    };
  }, [initialData]); // Run once

  // --- Worker Control Functions ---

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