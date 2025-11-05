import { useState, useEffect, useRef, useCallback } from 'react';
import { DataPoint } from '../lib/types';
import { generateNewDataPoint } from '../lib/dataGenerator';

// Define the maximum number of data points to keep in state.
// This prevents memory leaks and performance degradation over time.
const MAX_DATA_POINTS = 10000;
const DEFAULT_INTERVAL_MS = 100; // As per assignment requirements

/**
 * A custom hook to manage a real-time stream of data points.
 *
 * @param {DataPoint[]} initialData - The dataset to start with.
 * @param {number} [intervalMs=100] - The interval in milliseconds to add new data.
 * @returns {{ dataPoints: DataPoint[], isRunning: boolean, startStream: () => void, stopStream: () => void }}
 */
export const useDataStream = (
  initialData: DataPoint[],
  intervalMs: number = DEFAULT_INTERVAL_MS
) => {
  const [dataPoints, setDataPoints] = useState<DataPoint[]>(initialData);
  const [isRunning, setIsRunning] = useState<boolean>(true); // Start running by default
  const intervalRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    if (isRunning) {
      // Set up the interval
      intervalRef.current = setInterval(() => {
        const newDataPoint = generateNewDataPoint();

        setDataPoints((currentData) => {
          // Add new data point
          const updatedData = [...currentData, newDataPoint];

          // Ensure we don't exceed the max data points
          // We slice from the end to keep the array size manageable.
          if (updatedData.length > MAX_DATA_POINTS) {
            // Return a new array containing the latest MAX_DATA_POINTS
            return updatedData.slice(updatedData.length - MAX_DATA_POINTS);
          }
          
          return updatedData;
        });
      }, intervalMs);
    } else if (intervalRef.current) {
      // Clear interval if running is set to false
      clearInterval(intervalRef.current);
      intervalRef.current = null;
    }

    // Cleanup function:
    // This will run when the component unmounts or dependencies change
    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
    };
  }, [isRunning, intervalMs]); // Re-run effect if isRunning or intervalMs changes

  /**
   * Starts the data stream.
   */
  const startStream = useCallback(() => {
    setIsRunning(true);
  }, []);

  /**
   * Stops the data stream.
   */
  const stopStream = useCallback(() => {
    setIsRunning(false);
  }, []);

  return { dataPoints, isRunning, startStream, stopStream };
};

export default useDataStream;