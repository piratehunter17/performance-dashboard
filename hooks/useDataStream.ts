'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import { DataPoint } from '../lib/types';
import { generateNewDataPoint } from '../lib/dataGenerator';

// --- NEW STRATEGY ---
const MAX_DATA_POINTS = 100000; // Hit the 100k Stretch Goal
const DOWNSAMPLE_TARGET = 50000; // When we downsample, aim for this

/**
 * High-performance downsampling.
 * Replaces the oldest half of the data with
 * a new array that is 1/2 its size (by averaging pairs).
 */
const downsample = (data: DataPoint[]): DataPoint[] => {
  // Keep the newest 50% of data untouched
  // We'll downsample the older 50%
  const cutoff = Math.floor(data.length * 0.5);
  const recentData = data.slice(cutoff);
  const oldData = data.slice(0, cutoff);
  
  const downsampledOldData: DataPoint[] = [];

  for (let i = 0; i < oldData.length; i += 2) {
    if (i + 1 < oldData.length) {
      const p1 = oldData[i];
      const p2 = oldData[i + 1];
      // Create a new point by averaging the two old ones
      downsampledOldData.push({
        timestamp: p2.timestamp, // Use the newer timestamp
        value: (p1.value + p2.value) / 2, // Average the value
      });
    } else {
      // Keep the last odd point if it exists
      downsampledOldData.push(oldData[i]);
    }
  }
  
  // Return the combined array
  return [...downsampledOldData, ...recentData];
};

export const useDataStream = (
  initialData: DataPoint[],
  intervalMs: number
) => {
  const [dataPoints, setDataPoints] = useState<DataPoint[]>(initialData);
  const [isRunning, setIsRunning] = useState<boolean>(true);
  const intervalRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    if (isRunning) {
      intervalRef.current = setInterval(() => {
        const newDataPoint = generateNewDataPoint();

        setDataPoints((currentData) => {
          // --- THIS IS THE NEW LOGIC ---
          // 1. Check if we're over the max
          if (currentData.length >= MAX_DATA_POINTS) {
            // 2. If so, downsample and add the new point
            const downsampledData = downsample(currentData);
            return [...downsampledData, newDataPoint];
          }
          
          // 3. Otherwise, just add the new point
          return [...currentData, newDataPoint];
        });
      }, intervalMs);
    } else if (intervalRef.current) {
      clearInterval(intervalRef.current);
      intervalRef.current = null;
    }

    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
    };
  }, [isRunning, intervalMs]);

  const startStream = useCallback(() => {
    setIsRunning(true);
  }, []);

  const stopStream = useCallback(() => {
    setIsRunning(false);
  }, []);

  return { dataPoints, isRunning, startStream, stopStream };
};

// --- REMOVED THE DEFAULT EXPORT ---
// This was causing runtime errors